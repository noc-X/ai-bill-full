const Customer = require('../models/customer.model');
const Invoice = require('../models/invoice.model');
const Package = require('../models/package.model');
const { sendMessageToCustomer } = require('./whatsapp.service');
const { Op } = require('sequelize');

// Generate monthly billing for all active customers
const generateMonthlyBilling = async () => {
  try {
    console.log('Starting monthly billing generation process...');
    
    // Get all active customers
    const activeCustomers = await Customer.findAll({
      where: { status: 'active' },
      include: [{ model: Package }]
    });
    
    console.log(`Found ${activeCustomers.length} active customers`);
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Process each customer
    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const customer of activeCustomers) {
      try {
        // Check if today is the customer's billing day
        if (currentDate.getDate() === customer.billingDay) {
          // Check if invoice already exists for this billing period
          const startDate = new Date(currentYear, currentMonth, customer.billingDay);
          const endDate = new Date(currentYear, currentMonth + 1, customer.billingDay - 1);
          
          const existingInvoice = await Invoice.findOne({
            where: {
              customerId: customer.id,
              'billingPeriod.startDate': { $gte: startDate },
              'billingPeriod.endDate': { $lte: endDate }
            }
          });
          
          if (existingInvoice) {
            console.log(`Invoice already exists for customer ${customer.name} for the current billing period`);
            results.skipped++;
            continue;
          }
          
          // Generate new invoice
          const invoiceNumber = `INV-${currentYear}${(currentMonth + 1).toString().padStart(2, '0')}-${customer.id.toString().slice(-5)}`;
          
          // Calculate due date (7 days from billing date)
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + 7);
          
          // Calculate tax (10%)
          const amount = customer.Package.price;
          const tax = amount * 0.1;
          const totalAmount = amount + tax;
          
          // Create invoice
          const newInvoice = await Invoice.create({
            customerId: customer.id,
            packageId: customer.Package.id,
            invoiceNumber,
            amount,
            tax,
            totalAmount,
            billingPeriodStart: startDate,
            billingPeriodEnd: endDate,
            dueDate,
            status: 'pending'
          });
          
          console.log(`Created invoice ${invoiceNumber} for customer ${customer.name}`);
          
          // Send notification to customer via WhatsApp
          const message = `Yth. ${customer.name},\n\nTagihan internet Anda untuk periode ${startDate.toLocaleDateString('id-ID')} s/d ${endDate.toLocaleDateString('id-ID')} telah dibuat.\n\nNomor Invoice: ${invoiceNumber}\nTotal Tagihan: Rp ${totalAmount.toLocaleString('id-ID')}\nJatuh Tempo: ${dueDate.toLocaleDateString('id-ID')}\n\nMohon segera lakukan pembayaran untuk menghindari pemutusan layanan.\n\nTerima kasih.`;
          
          await sendMessageToCustomer(customer.phone, message);
          
          results.success++;
        }
      } catch (error) {
        console.error(`Error generating invoice for customer ${customer.name}:`, error);
        results.failed++;
      }
    }
    
    console.log('Monthly billing generation completed:', results);
    return results;
    
  } catch (error) {
    console.error('Error in monthly billing generation:', error);
    throw error;
  }
};

// Schedule billing generation for specific customers (e.g., on their billing day)
const scheduleBillingGeneration = async () => {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    
    // Find customers whose billing day is today
    const customersToday = await Customer.findAll({
      where: {
        status: 'active',
        billingDay: currentDay
      }
    });
    
    console.log(`Found ${customersToday.length} customers with billing day ${currentDay}`);
    
    if (customersToday.length > 0) {
      await generateMonthlyBilling();
    }
    
  } catch (error) {
    console.error('Error scheduling billing generation:', error);
  }
};

// Check for overdue invoices and send reminders
const checkOverdueInvoices = async () => {
  try {
    const currentDate = new Date();
    
    // Find invoices that are due today
    const dueTodayInvoices = await Invoice.findAll({
      where: {
        status: 'pending',
        dueDate: {
          [Op.gte]: new Date(currentDate.setHours(0, 0, 0, 0)),
          [Op.lte]: new Date(currentDate.setHours(23, 59, 59, 999))
        }
      },
      include: [{ model: Customer }]
    });
    
    // Send payment reminders for invoices due today
    for (const invoice of dueTodayInvoices) {
      const message = `Yth. ${invoice.Customer.name},\n\nIni adalah pengingat bahwa tagihan internet Anda dengan nomor ${invoice.invoiceNumber} jatuh tempo hari ini.\n\nTotal Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n\nMohon segera lakukan pembayaran untuk menghindari pemutusan layanan.\n\nTerima kasih.`;
      
      await sendMessageToCustomer(invoice.Customer.phone, message);
    }
    
    // Find overdue invoices (past due date and still pending)
    const overdueInvoices = await Invoice.findAll({
      where: {
        status: 'pending',
        dueDate: { [Op.lt]: new Date() }
      },
      include: [{ model: Customer }]
    });
    
    // Update status to overdue
    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue';
      await invoice.save();
      
      // Send overdue notification
      const daysOverdue = Math.floor((currentDate - invoice.dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue === 3 || daysOverdue === 7 || daysOverdue === 14) {
        const message = `Yth. ${invoice.Customer.name},\n\nTagihan internet Anda dengan nomor ${invoice.invoiceNumber} telah melewati jatuh tempo selama ${daysOverdue} hari.\n\nTotal Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n\nMohon segera lakukan pembayaran untuk menghindari pemutusan layanan.\n\nTerima kasih.`;
        
        await sendMessageToCustomer(invoice.Customer.phone, message);
      }
      
      // If overdue for more than 14 days, suspend the service
      if (daysOverdue > 14) {
        // Update customer status to suspended
        const customer = invoice.Customer;
        customer.status = 'suspended';
        await customer.save();
        
        // Send suspension notification
        const message = `Yth. ${customer.name},\n\nDengan berat hati kami informasikan bahwa layanan internet Anda telah kami hentikan sementara karena tagihan yang belum dibayar selama lebih dari 14 hari.\n\nUntuk mengaktifkan kembali layanan, mohon segera lunasi tagihan Anda.\n\nTotal Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n\nTerima kasih.`;
        
        await sendMessageToCustomer(customer.phone, message);
      }
    }
    
    return {
      dueTodayCount: dueTodayInvoices.length,
      overdueCount: overdueInvoices.length
    };
    
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
    throw error;
  }
};

// Send payment notification to customer
const sendPaymentNotification = async (invoiceId, notificationType) => {
  try {
    // Get invoice details with customer information
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Customer }, { model: Package }]
    });
    
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }
    
    const customer = invoice.Customer;
    let message = '';
    
    // Generate appropriate message based on notification type
    switch (notificationType) {
      case 'payment_reminder':
        // Calculate days until due date
        const dueDate = new Date(invoice.dueDate);
        const currentDate = new Date();
        const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
        
        message = `Yth. ${customer.name},\n\n`;
        message += `Ini adalah pengingat untuk tagihan internet Anda dengan nomor ${invoice.invoiceNumber}.\n\n`;
        message += `Paket: ${invoice.Package.name}\n`;
        message += `Total Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n`;
        
        if (daysUntilDue > 0) {
          message += `Jatuh Tempo: ${dueDate.toLocaleDateString('id-ID')} (${daysUntilDue} hari lagi)\n\n`;
        } else {
          message += `Jatuh Tempo: ${dueDate.toLocaleDateString('id-ID')} (sudah lewat)\n\n`;
        }
        
        message += `Mohon segera lakukan pembayaran untuk menghindari pemutusan layanan.\n\n`;
        message += `Terima kasih.`;
        break;
        
      case 'payment_confirmation':
        message = `Yth. ${customer.name},\n\n`;
        message += `Terima kasih. Pembayaran Anda untuk tagihan internet dengan nomor ${invoice.invoiceNumber} telah kami terima.\n\n`;
        message += `Paket: ${invoice.Package.name}\n`;
        message += `Total Pembayaran: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n`;
        message += `Tanggal Pembayaran: ${new Date(invoice.paymentDate).toLocaleDateString('id-ID')}\n\n`;
        message += `Layanan internet Anda akan terus aktif hingga periode penagihan berikutnya.\n\n`;
        message += `Terima kasih atas kepercayaan Anda.`;
        break;
        
      case 'payment_overdue':
        // Calculate days overdue
        const overdueDate = new Date(invoice.dueDate);
        const today = new Date();
        const daysOverdue = Math.ceil((today - overdueDate) / (1000 * 60 * 60 * 24));
        
        message = `Yth. ${customer.name},\n\n`;
        message += `Tagihan internet Anda dengan nomor ${invoice.invoiceNumber} telah melewati jatuh tempo selama ${daysOverdue} hari.\n\n`;
        message += `Paket: ${invoice.Package.name}\n`;
        message += `Total Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n`;
        message += `Jatuh Tempo: ${overdueDate.toLocaleDateString('id-ID')}\n\n`;
        
        if (daysOverdue > 14) {
          message += `PERHATIAN: Layanan internet Anda berisiko dinonaktifkan jika pembayaran tidak dilakukan segera.\n\n`;
        } else {
          message += `Mohon segera lakukan pembayaran untuk menghindari pemutusan layanan.\n\n`;
        }
        
        message += `Jika Anda telah melakukan pembayaran, mohon abaikan pesan ini.\n\n`;
        message += `Terima kasih.`;
        break;
        
      case 'service_suspension':
        message = `Yth. ${customer.name},\n\n`;
        message += `Dengan berat hati kami informasikan bahwa layanan internet Anda telah kami hentikan sementara karena tagihan yang belum dibayar.\n\n`;
        message += `Nomor Invoice: ${invoice.invoiceNumber}\n`;
        message += `Total Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n`;
        message += `Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}\n\n`;
        message += `Untuk mengaktifkan kembali layanan, mohon segera lunasi tagihan Anda.\n\n`;
        message += `Terima kasih.`;
        break;
        
      default:
        message = `Yth. ${customer.name},\n\n`;
        message += `Ini adalah informasi mengenai tagihan internet Anda dengan nomor ${invoice.invoiceNumber}.\n\n`;
        message += `Total Tagihan: Rp ${invoice.totalAmount.toLocaleString('id-ID')}\n`;
        message += `Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}\n\n`;
        message += `Terima kasih.`;
    }
    
    // Send message via WhatsApp
    const result = await sendMessageToCustomer(customer.phone, message);
    
    return {
      success: result,
      invoiceId: invoice.id,
      customerId: customer.id,
      notificationType,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return {
      success: false,
      error: error.message,
      notificationType,
      timestamp: new Date()
    };
  }
};

module.exports = {
  generateMonthlyBilling,
  scheduleBillingGeneration,
  checkOverdueInvoices,
  sendPaymentNotification
};