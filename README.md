# ISP Management System

A comprehensive ISP Management System with AI capabilities for payment processing, customer service, and network monitoring.

## Components

### 1. Payment Management
- Customer data management integrated with Mikrotik PPPoE
- Automated monthly billing generation
- Transaction records and payment tracking
- Payment arrears monitoring

### 2. AI Customer Service
- WhatsApp integration for customer complaint handling
- Customer data verification
- Payment status checking
- Ticket creation and routing to technicians or monitoring AI
- Status updates to customers

### 3. AI Network Monitoring
- Network device monitoring
- Automated troubleshooting
- Notification system for network issues
- Two-way communication interface with technicians
- Device control capabilities

## Architecture

### AI CS Architecture
- Natural language processing capabilities
- Database-driven responses
- Conversation management for directed interactions

### AI Monitoring Architecture
- RAG-based knowledge enhancement (PDF and CSV ingestion)
- Network-specific operational boundaries
- Technician communication for issue confirmation

## Setup

1. Install dependencies
```
npm install
```

2. Configure environment variables
```
cp .env.example .env
```

3. Start the development server
```
npm run dev
```

## Technologies Used

- Node.js and Express for backend services
- React for frontend interfaces
- postgresql for database storage
- WhatsApp Business API for customer communication
- Mikrotik API for router integration
- ollama API for AI capabilities
- Socket.io for real-time communication