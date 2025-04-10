const aiTemplates = require('../config/ai-templates');
const Customer = require('../models/customer.model');

class AIChatHandler {
    constructor() {
        this.verificationStates = new Map(); // Store verification states for customers
        this.conversationContexts = new Map(); // Store conversation contexts
    }

    /**
     * Handle incoming WhatsApp messages
     */
    async handleMessage(message) {
        const sender = message.from;
        const messageText = message.body;

        // Check if user is in verification process
        if (this.verificationStates.has(sender)) {
            return await this.handleVerification(sender, messageText);
        }

        // Check if sender is verified customer
        const customer = await this.findCustomerByPhone(sender);
        if (!customer) {
            return await this.startVerification(sender);
        }

        // Handle verified customer message
        return await this.processCustomerMessage(customer, messageText);
    }

    /**
     * Start customer verification process
     */
    async startVerification(sender) {
        this.verificationStates.set(sender, {
            step: 'initial',
            attempts: 0
        });

        const template = aiTemplates.general.verification;
        return template.template;
    }

    /**
     * Handle verification process
     */
    async handleVerification(sender, message) {
        const state = this.verificationStates.get(sender);
        
        // Parse verification information
        const info = message.split('\n').map(line => line.trim());
        
        try {
            const customer = await Customer.findOne({
                where: {
                    phone: sender,
                    name: info[0], // Name should match
                    email: info[1] // Email should match
                }
            });

            if (customer) {
                this.verificationStates.delete(sender);
                const greeting = aiTemplates.general.greeting.template
                    .replace('{{customerName}}', customer.name);
                return greeting;
            }

            // Increment attempts and handle failure
            state.attempts++;
            if (state.attempts >= 3) {
                this.verificationStates.delete(sender);
                return 'Verification failed. Please contact our customer service for assistance.';
            }

            return 'Verification failed. Please try again with correct information.';
        } catch (error) {
            console.error('Verification error:', error);
            return 'An error occurred during verification. Please try again later.';
        }
    }

    /**
     * Process message from verified customer
     */
    async processCustomerMessage(customer, message) {
        try {
            // Get or initialize conversation context
            let context = this.conversationContexts.get(customer.phone) || {
                lastInteraction: null,
                currentIssue: null
            };

            // Analyze message content
            const messageType = this.analyzeMessageType(message);
            let response;

            switch (messageType) {
                case 'network_issue':
                    response = await this.handleNetworkIssue(customer);
                    break;
                case 'payment_issue':
                    response = await this.handlePaymentIssue(customer);
                    break;
                default:
                    response = aiTemplates.general.greeting.template
                        .replace('{{customerName}}', customer.name);
            }

            // Update conversation context
            context.lastInteraction = new Date();
            context.currentIssue = messageType;
            this.conversationContexts.set(customer.phone, context);

            return response;
        } catch (error) {
            console.error('Error processing message:', error);
            return 'I apologize, but I encountered an error. Please try again later.';
        }
    }

    /**
     * Analyze message type
     */
    analyzeMessageType(message) {
        const networkKeywords = ['internet', 'connection', 'slow', 'offline', 'speed'];
        const paymentKeywords = ['bill', 'payment', 'invoice', 'pay', 'tagihan'];

        message = message.toLowerCase();

        if (networkKeywords.some(keyword => message.includes(keyword))) {
            return 'network_issue';
        }

        if (paymentKeywords.some(keyword => message.includes(keyword))) {
            return 'payment_issue';
        }

        return 'general';
    }

    /**
     * Handle network-related issues
     */
    async handleNetworkIssue(customer) {
        // Generate ticket number
        const ticketNumber = `NET${Date.now()}`;

        // Get appropriate template
        const template = aiTemplates.network.offline;
        return template.template
            .replace('{{diagnosis}}', 'Our system will investigate the issue.')
            .replace('{{ticketNumber}}', ticketNumber);
    }

    /**
     * Handle payment-related issues
     */
    async handlePaymentIssue(customer) {
        try {
            // Get latest unpaid invoice
            const invoice = await customer.getLatestUnpaidInvoice();
            
            if (invoice) {
                const template = aiTemplates.payment.overdue;
                return template.template
                    .replace('{{invoiceNumber}}', invoice.number)
                    .replace('{{amount}}', invoice.amount.toLocaleString())
                    .replace('{{dueDate}}', invoice.dueDate.toLocaleDateString());
            }

            return 'Our records show no outstanding payments for your account.';
        } catch (error) {
            console.error('Error checking payment status:', error);
            return 'I apologize, but I cannot check your payment status at the moment.';
        }
    }

    /**
     * Find customer by phone number
     */
    async findCustomerByPhone(phone) {
        try {
            return await Customer.findOne({ where: { phone } });
        } catch (error) {
            console.error('Error finding customer:', error);
            return null;
        }
    }
}

module.exports = AIChatHandler;