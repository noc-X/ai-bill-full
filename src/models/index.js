const Customer = require('./customer.model');
const Invoice = require('./invoice.model');
const Package = require('./package.model');
const Payment = require('./payment.model');
const Ticket = require('./ticket.model');
const User = require('./user.model');

// Define model relationships

// Customer - Package (Many-to-One)
Customer.belongsTo(Package, { foreignKey: 'packageId' });
Package.hasMany(Customer, { foreignKey: 'packageId' });

// Customer - Invoice (One-to-Many)
Customer.hasMany(Invoice, { foreignKey: 'customerId' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId' });

// Package - Invoice (One-to-Many)
Package.hasMany(Invoice, { foreignKey: 'packageId' });
Invoice.belongsTo(Package, { foreignKey: 'packageId' });

// Customer - Payment (One-to-Many)
Customer.hasMany(Payment, { foreignKey: 'customerId' });
Payment.belongsTo(Customer, { foreignKey: 'customerId' });

// Invoice - Payment (One-to-Many)
Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// Customer - Ticket (One-to-Many)
Customer.hasMany(Ticket, { foreignKey: 'customerId' });
Ticket.belongsTo(Customer, { foreignKey: 'customerId' });

// User - Ticket (One-to-Many, for assigned tickets)
User.hasMany(Ticket, { foreignKey: 'assignedToId', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// User - Payment (One-to-Many, for processed payments)
User.hasMany(Payment, { foreignKey: 'processedById', as: 'processedPayments' });
Payment.belongsTo(User, { foreignKey: 'processedById', as: 'processedBy' });

module.exports = {
  Customer,
  Invoice,
  Package,
  Payment,
  Ticket,
  User
};