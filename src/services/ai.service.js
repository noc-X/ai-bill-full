const axios = require('axios');
const Customer = require('../models/customer.model');
const Invoice = require('../models/invoice.model');
const Ticket = require('../models/ticket.model');
const { Op } = require('sequelize');
const { checkNetworkStatus, troubleshootConnection } = require('./network.service');
const { generateChatCompletion, generateCompletion, checkOllamaStatus } = require('./ollama.service');
const responseTemplates = require('../config/ai-templates');
const Settings = require('../models/settings.model');

// Initialize Ollama client configuration
const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

// Network diagnostic thresholds
const NETWORK_THRESHOLDS = {
  latency: 100, // ms
  packetLoss: 5, // percentage
  bandwidth: 80, // percentage utilization
  signalStrength: -70 // dBm
};

// Sentiment analysis thresholds
const SENTIMENT_THRESHOLDS = {
  negative: -0.5,
  neutral: 0.1,
  positive: 0.5
};

// Analyze network issues and provide automated diagnostics
const analyzeNetworkIssue = async (pppoeUsername) => {
  try {
    // Get network status and troubleshooting data
    const troubleshootData = await troubleshootConnection(pppoeUsername);
    
    // Prepare context for AI analysis
    const networkContext = {
      isOnline: troubleshootData.status.isOnline,
      connectionDetails: troubleshootData.status.connectionDetails || {},
      diagnostics: troubleshootData.diagnostics || {},
      recommendations: troubleshootData.recommendations || []
    };
    
    // Create system message for network analysis
    const systemMessage = {
      role: 'system',
      content: `You are an AI network diagnostic assistant for an Internet Service Provider (ISP).
      Analyze the following network data and provide a detailed technical assessment and recommendations.
      
      Network data:
      ${JSON.stringify(networkContext, null, 2)}
      
      Your task is to:
      1. Identify the most likely cause of the network issue
      2. Provide technical recommendations for resolution
      3. Suggest customer-friendly explanations
      4. Determine if a technician visit is required
      
      Return your response in JSON format with the following structure:
      {
        "issue": "Brief description of the identified issue",
        "technicalAnalysis": "Detailed technical analysis for support staff",
        "customerExplanation": "Simplified explanation for the customer in Bahasa Indonesia",
        "recommendations": ["List of recommended actions"],
        "requiresTechnician": true/false,
        "severity": "critical | high | medium | low"
      }`
    };
    
    // Call Ollama API for network analysis
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [systemMessage],
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more factual responses
        num_predict: 1000
      }
    });
    
    return JSON.parse(response.data.message.content);
  } catch (error) {
    console.error('Error analyzing network issue:', error);
    return {
      issue: 'Error in network analysis',
      technicalAnalysis: error.message,
      customerExplanation: 'Mohon maaf, terjadi kesalahan dalam menganalisis jaringan Anda.',
      recommendations: ['Contact support team'],
      requiresTechnician: true,
      severity: 'high'
    };
  }
};

// Get customized response template
const getCustomTemplate = async (templateKey, templateData) => {
  try {
    // Check for custom template in settings
    const customTemplates = await Settings.findOne({ 
      where: { key: 'ai_response_templates' },
      raw: true
    });

    // Validate template data
    if (!templateKey || !templateData) {
      throw new Error('Template key and data are required');
    }

    // Get template from settings or fallback to default
    const template = customTemplates?.value?.[templateKey] || responseTemplates[templateKey];
    if (!template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    // Replace template variables
    let message = template;
    Object.entries(templateData).forEach(([key, value]) => {
      const regex = new RegExp(`\{\{${key}\}\}`, 'g');
      message = message.replace(regex, value);
    });

    return message;
  } catch (error) {
    console.error('Error getting custom template:', error);
    return '';
  }
};

// Process customer message and generate AI response
const processAIResponse = async (message, customer) => {
  try {
    // Prepare context for the AI
    const customerContext = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      packageId: customer.packageId,
      status: customer.status
    };

    // Get customer's billing information
    const pendingInvoices = await Invoice.findAll({
      where: {
        customerId: customer.id,
        status: {
          [Op.in]: ['pending', 'overdue']
        }
      },
      order: [['dueDate', 'ASC']]
    });

    const billingContext = pendingInvoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      dueDate: invoice.dueDate,
      status: invoice.status
    }));

    // Create system message with instructions for the AI
    const systemMessage = {
      role: 'system',
      content: `You are an AI customer service assistant for an Internet Service Provider (ISP).
      You should respond in Bahasa Indonesia. Be polite, helpful, and concise.
      
      Customer information:
      ${JSON.stringify(customerContext, null, 2)}
      
      Billing information:
      ${JSON.stringify(billingContext, null, 2)}
      
      Network Status:
      ${JSON.stringify(await checkNetworkStatus(customer.id), null, 2)}
      
      Your task is to:
      1. Identify the customer's intent and analyze their sentiment
      2. Provide relevant information based on their query
      3. For connection issues:
         - Check if they have pending payments first
         - Analyze network status and provide specific troubleshooting steps
         - Suggest self-service solutions when applicable
      4. For billing inquiries:
         - Provide detailed payment information and options
         - Explain any late fees or penalties
         - Offer payment arrangements if needed
      5. Create a support ticket if:
         - The issue requires technical intervention
         - The customer has made multiple similar inquiries
         - The network status indicates persistent problems
      6. Provide proactive suggestions:
         - Recommend package upgrades when appropriate
         - Alert about upcoming maintenance
         - Share tips for better internet usage
      
      Return your response in JSON format with the following structure:
      {
        "intent": "connection_issue | billing_inquiry | technical_support | service_request | other",
        "message": "Your response message in Bahasa Indonesia",
        "createTicket": true/false,
        "ticketSubject": "Subject if ticket is created",
        "ticketCategory": "Category if ticket is created"
      }`
    };

    // Add customer message
    const userMessage = {
      role: 'user',
      content: message
    };

    // Call Ollama API
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [systemMessage, userMessage],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500
      }
    });

    // Parse the response and analyze sentiment
    const responseContent = response.data.message.content;
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseContent);
      
      // Analyze sentiment using Ollama
      const sentimentAnalysis = await generateCompletion(
        `Analyze the sentiment of this customer message: "${message}"
Return only a number between -1 (very negative) and 1 (very positive).`,
        OLLAMA_MODEL,
        { temperature: 0.3 }
      );
      
      // Add sentiment score to response
      parsedResponse.sentiment = parseFloat(sentimentAnalysis.text) || 0;
      
      // Check if network analysis is needed
      if (parsedResponse.intent === 'connection_issue') {
        const networkAnalysis = await analyzeNetworkIssue(customer.pppoeUsername);
        parsedResponse.networkDiagnostics = networkAnalysis;
        
        // Auto-create ticket for severe network issues
        if (networkAnalysis.severity === 'critical' || networkAnalysis.severity === 'high') {
          parsedResponse.createTicket = true;
          parsedResponse.ticketSubject = `Network Issue: ${networkAnalysis.issue}`;
          parsedResponse.ticketCategory = 'network_issue';
        }
      }
      
      // Create ticket based on sentiment and issue persistence
      if (parsedResponse.sentiment <= SENTIMENT_THRESHOLDS.negative) {
        const recentTickets = await Ticket.findAll({
          where: {
            customerId: customer.id,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });
        
        if (recentTickets.length > 0) {
          parsedResponse.createTicket = true;
          parsedResponse.ticketSubject = 'Customer Satisfaction Issue';
          parsedResponse.ticketCategory = 'customer_satisfaction';
        }
      }
      
    } catch (error) {
      console.error('Error processing AI response:', error);
      // Fallback response if parsing fails
      parsedResponse = {
        intent: 'other',
        message: 'Mohon maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan hubungi tim layanan pelanggan kami.',
        createTicket: true,
        ticketSubject: 'Error in AI Processing',
        ticketCategory: 'technical_support',
        sentiment: 0
      };
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error processing AI response:', error);
    return {
      intent: 'other',
      message: 'Mohon maaf, layanan AI kami sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi tim layanan pelanggan kami.',
      createTicket: true,
      ticketSubject: 'AI Service Error',
      ticketCategory: 'technical_support'
    };
  }
};



// Generate personalized customer notifications
const generateCustomerNotification = async (customer, notificationType, additionalData = {}) => {
  try {
    // Prepare customer context
    const customerContext = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status
    };
    
    // Define notification templates based on type
    const notificationTemplates = {
      payment_reminder: `Anda memiliki tagihan yang belum dibayar. Silakan lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari pemutusan layanan.`,
      service_interruption: `Kami mendeteksi adanya gangguan layanan di area Anda. Tim teknisi kami sedang bekerja untuk memperbaiki masalah tersebut.`,
      maintenance_notice: `Akan ada pemeliharaan jaringan terjadwal yang mungkin memengaruhi layanan internet Anda.`,
      payment_confirmation: `Terima kasih, pembayaran Anda telah kami terima.`,
      service_upgrade: `Anda memiliki kesempatan untuk meningkatkan paket layanan internet Anda.`
    };
    
    // Create system message for notification generation
    const systemMessage = {
      role: 'system',
      content: `You are an AI notification generator for an Internet Service Provider (ISP).
      Generate a personalized notification message in Bahasa Indonesia for the customer.
      
      Customer information:
      ${JSON.stringify(customerContext, null, 2)}
      
      Notification type: ${notificationType}
      Additional data: ${JSON.stringify(additionalData, null, 2)}
      
      Base template: ${notificationTemplates[notificationType] || 'No template available'}
      
      Your task is to:
      1. Create a personalized notification based on the template and customer data
      2. Keep the message concise but informative
      3. Include relevant details from the additional data
      4. Add a friendly closing
      
      Return your response as a plain text message in Bahasa Indonesia.`
    };
    
    // Call Ollama API for notification generation
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [systemMessage],
      stream: false,
      options: {
        temperature: 0.5,
        num_predict: 300
      }
    });
    
    return {
      message: response.data.message.content,
      type: notificationType,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error generating customer notification:', error);
    // Fallback to basic template if AI generation fails
    const basicTemplates = {
      payment_reminder: `Yth. ${customer.name}, Anda memiliki tagihan yang belum dibayar. Mohon segera lakukan pembayaran.`,
      service_interruption: `Yth. ${customer.name}, kami mendeteksi gangguan layanan di area Anda. Tim teknisi kami sedang bekerja untuk memperbaiki masalah tersebut.`,
      maintenance_notice: `Yth. ${customer.name}, akan ada pemeliharaan jaringan terjadwal pada tanggal ${additionalData.date || 'yang akan diinformasikan kemudian'}.`,
      payment_confirmation: `Yth. ${customer.name}, pembayaran Anda sebesar ${additionalData.amount || 'sejumlah tertentu'} telah kami terima. Terima kasih.`,
      service_upgrade: `Yth. ${customer.name}, Anda memiliki kesempatan untuk meningkatkan paket layanan internet Anda. Silakan hubungi kami untuk informasi lebih lanjut.`
    };
    
    return {
      message: basicTemplates[notificationType] || `Yth. ${customer.name}, mohon hubungi layanan pelanggan kami untuk informasi penting.`,
      type: notificationType,
      timestamp: new Date(),
      error: error.message
    };
  }
};

// Analyze customer billing data and provide insights
const analyzeBillingData = async (customerId) => {
  try {
    // Get customer information
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    // Get customer's billing history
    const invoices = await Invoice.findAll({
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']],
      limit: 12 // Last 12 invoices (approximately 1 year)
    });
    
    // Get pending/overdue invoices
    const pendingInvoices = invoices.filter(inv => ['pending', 'overdue'].includes(inv.status));
    
    // Calculate payment statistics
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 100;
    
    // Calculate average payment time (days between billing and payment)
    const paymentTimes = invoices
      .filter(inv => inv.status === 'paid' && inv.paymentDate)
      .map(inv => {
        const billingDate = new Date(inv.billingPeriodStart);
        const paymentDate = new Date(inv.paymentDate);
        return Math.floor((paymentDate - billingDate) / (1000 * 60 * 60 * 24));
      });
    
    const avgPaymentTime = paymentTimes.length > 0 ?
      paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length :
      0;
    
    // Calculate total amount paid and average monthly bill
    const totalPaid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    
    const avgMonthlyBill = paidInvoices > 0 ? totalPaid / paidInvoices : 0;
    
    // Generate payment behavior score (0-100)
    // Higher score = better payment behavior
    let paymentBehaviorScore = 100;
    
    // Deduct points for late payments
    const latePayments = paymentTimes.filter(days => days > 7).length;
    paymentBehaviorScore -= latePayments * 5;
    
    // Deduct points for current overdue invoices
    const overdueInvoices = pendingInvoices.filter(inv => inv.status === 'overdue').length;
    paymentBehaviorScore -= overdueInvoices * 10;
    
    // Ensure score is within 0-100 range
    paymentBehaviorScore = Math.max(0, Math.min(100, paymentBehaviorScore));
    
    // Generate recommendations based on payment behavior
    const recommendations = [];
    
    if (paymentBehaviorScore < 60) {
      recommendations.push('Customer has poor payment history. Consider requiring advance payments or deposits.');
    } else if (paymentBehaviorScore < 80) {
      recommendations.push('Customer occasionally pays late. Consider sending earlier payment reminders.');
    } else {
      recommendations.push('Customer has good payment history. Consider offering loyalty discounts or upgrades.');
    }
    
    if (avgPaymentTime > 10) {
      recommendations.push(`Customer takes an average of ${Math.round(avgPaymentTime)} days to pay. Consider offering auto-payment options.`);
    }
    
    if (pendingInvoices.length > 1) {
      recommendations.push(`Customer has ${pendingInvoices.length} pending invoices. Consider offering a payment plan.`);
    }
    
    return {
      customerId: customer.id,
      customerName: customer.name,
      billingAnalysis: {
        totalInvoices,
        paidInvoices,
        pendingInvoices: pendingInvoices.length,
        paymentRate: paymentRate.toFixed(2) + '%',
        avgPaymentTime: Math.round(avgPaymentTime) + ' days',
        totalPaid: totalPaid.toFixed(2),
        avgMonthlyBill: avgMonthlyBill.toFixed(2),
        paymentBehaviorScore
      },
      paymentBehaviorRating: 
        paymentBehaviorScore >= 90 ? 'excellent' :
        paymentBehaviorScore >= 80 ? 'good' :
        paymentBehaviorScore >= 60 ? 'fair' :
        paymentBehaviorScore >= 40 ? 'poor' : 'critical',
      recommendations,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error analyzing billing data:', error);
    return {
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Analyze network monitoring data and provide insights
const analyzeNetworkMonitoringData = async (monitoringData) => {
  try {
    // Prepare context for AI analysis
    const networkContext = {
      healthMetrics: monitoringData.healthMetrics || {},
      activeConnections: monitoringData.activeConnections || [],
      deviceStatus: monitoringData.deviceStatus || {},
      bandwidthUsage: monitoringData.bandwidthUsage || {}
    };
    
    // Create system message for network analysis
    const systemMessage = {
      role: 'system',
      content: `You are an AI network analyst for an Internet Service Provider (ISP).
      Analyze the following network monitoring data and provide insights and recommendations.
      
      Network data:
      ${JSON.stringify(networkContext, null, 2)}
      
      Your task is to:
      1. Identify any potential issues or anomalies in the network
      2. Analyze bandwidth usage patterns and trends
      3. Suggest optimizations for network performance
      4. Prioritize actions based on severity and impact
      
      Return your response in JSON format with the following structure:
      {
        "summary": "Brief summary of network status",
        "issues": [{
          "description": "Description of the issue",
          "severity": "critical | high | medium | low",
          "recommendation": "Recommended action"
        }],
        "optimizations": ["List of optimization suggestions"],
        "insights": ["List of insights from the data"]
      }`
    };
    
    // Call Ollama API for network analysis
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [systemMessage],
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more factual responses
        num_predict: 1000
      }
    });
    
    // Parse the response
    const responseContent = response.data.message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing AI network analysis:', error);
      // Fallback response if parsing fails
      parsedResponse = {
        summary: 'Unable to analyze network data',
        issues: [{
          description: 'AI parsing error',
          severity: 'medium',
          recommendation: 'Check system logs and retry analysis'
        }],
        optimizations: ['Ensure monitoring data is complete and well-formatted'],
        insights: ['No insights available due to processing error']
      };
    }
    
    return {
      ...parsedResponse,
      timestamp: new Date(),
      rawData: monitoringData
    };
    
  } catch (error) {
    console.error('Error analyzing network monitoring data:', error);
    return {
      summary: 'Error in network analysis',
      issues: [{
        description: `System error: ${error.message}`,
        severity: 'high',
        recommendation: 'Check Ollama service connectivity and configuration'
      }],
      optimizations: [],
      insights: [],
      timestamp: new Date(),
      error: error.message
    };
  }
};

module.exports = {
  processAIResponse,
  analyzeNetworkIssue,
  generateCustomerNotification,
  analyzeBillingData,
  analyzeNetworkMonitoringData
};