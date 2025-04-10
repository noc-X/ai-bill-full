const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const { generateNetworkReport } = require('../services/network.service');

// Get revenue data for reports
router.get('/revenue', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let startDate, endDate;
    const currentDate = new Date();
    
    // Determine date range based on timeframe
    switch (timeframe) {
      case 'weekly':
        // Last 12 weeks
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 84); // 12 weeks * 7 days
        endDate = currentDate;
        break;
      case 'monthly':
        // Last 12 months
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);
        endDate = currentDate;
        break;
      case 'yearly':
        // Last 5 years
        startDate = new Date(currentDate);
        startDate.setFullYear(currentDate.getFullYear() - 5);
        endDate = currentDate;
        break;
      default:
        // Default to monthly
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);
        endDate = currentDate;
    }
    
    // Format dates for query
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all payments in the date range
    const payments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: ['paymentDate', 'amount'],
      order: [['paymentDate', 'ASC']]
    });
    
    // Group payments by period based on timeframe
    const revenueByPeriod = {};
    const labels = [];
    
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      let periodKey;
      
      if (timeframe === 'weekly') {
        // Format as 'Week X of YYYY'
        const weekNumber = getWeekNumber(date);
        periodKey = `Week ${weekNumber} of ${date.getFullYear()}`;
      } else if (timeframe === 'monthly') {
        // Format as 'MMM YYYY'
        periodKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      } else {
        // Format as 'YYYY'
        periodKey = `${date.getFullYear()}`;
      }
      
      if (!revenueByPeriod[periodKey]) {
        revenueByPeriod[periodKey] = 0;
        labels.push(periodKey);
      }
      
      revenueByPeriod[periodKey] += payment.amount;
    });
    
    // Sort labels chronologically
    labels.sort((a, b) => {
      if (timeframe === 'weekly') {
        // Extract year and week number for comparison
        const [weekA, yearA] = a.match(/Week (\d+) of (\d+)/).slice(1).map(Number);
        const [weekB, yearB] = b.match(/Week (\d+) of (\d+)/).slice(1).map(Number);
        
        if (yearA !== yearB) return yearA - yearB;
        return weekA - weekB;
      } else if (timeframe === 'monthly') {
        // Convert 'MMM YYYY' to Date for comparison
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      } else {
        // Compare years directly
        return parseInt(a) - parseInt(b);
      }
    });
    
    // Create data array in the same order as labels
    const data = labels.map(label => revenueByPeriod[label]);
    
    res.json({ labels, data });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ message: 'Error generating revenue report', error: error.message });
  }
});

// Get customer statistics for reports
router.get('/customers', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let startDate, endDate;
    const currentDate = new Date();
    
    // Determine date range based on timeframe
    switch (timeframe) {
      case 'weekly':
        // Last 12 weeks
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 84); // 12 weeks * 7 days
        endDate = currentDate;
        break;
      case 'monthly':
        // Last 12 months
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);
        endDate = currentDate;
        break;
      case 'yearly':
        // Last 5 years
        startDate = new Date(currentDate);
        startDate.setFullYear(currentDate.getFullYear() - 5);
        endDate = currentDate;
        break;
      default:
        // Default to monthly
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);
        endDate = currentDate;
    }
    
    // Format dates for query
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all customers with their creation and deletion dates
    const customers = await Customer.findAll({
      attributes: ['id', 'createdAt', 'status'],
      order: [['createdAt', 'ASC']]
    });
    
    // Group customers by period based on timeframe
    const newCustomersByPeriod = {};
    const churnedCustomersByPeriod = {};
    const labels = [];
    
    // Process new customers
    customers.forEach(customer => {
      const createdDate = new Date(customer.createdAt);
      
      // Skip if created before the start date
      if (createdDate < startDate) return;
      
      let periodKey;
      
      if (timeframe === 'weekly') {
        // Format as 'Week X of YYYY'
        const weekNumber = getWeekNumber(createdDate);
        periodKey = `Week ${weekNumber} of ${createdDate.getFullYear()}`;
      } else if (timeframe === 'monthly') {
        // Format as 'MMM YYYY'
        periodKey = `${createdDate.toLocaleString('default', { month: 'short' })} ${createdDate.getFullYear()}`;
      } else {
        // Format as 'YYYY'
        periodKey = `${createdDate.getFullYear()}`;
      }
      
      if (!newCustomersByPeriod[periodKey]) {
        newCustomersByPeriod[periodKey] = 0;
        if (!labels.includes(periodKey)) {
          labels.push(periodKey);
        }
      }
      
      newCustomersByPeriod[periodKey]++;
      
      // Process churned customers (those with inactive or suspended status)
      if (customer.status === 'inactive') {
        // Assume churn date is 30 days after creation for this example
        // In a real system, you would track when the status changed
        const churnDate = new Date(createdDate);
        churnDate.setDate(createdDate.getDate() + 30);
        
        // Skip if churned after the end date or before the start date
        if (churnDate > endDate || churnDate < startDate) return;
        
        let churnPeriodKey;
        
        if (timeframe === 'weekly') {
          const weekNumber = getWeekNumber(churnDate);
          churnPeriodKey = `Week ${weekNumber} of ${churnDate.getFullYear()}`;
        } else if (timeframe === 'monthly') {
          churnPeriodKey = `${churnDate.toLocaleString('default', { month: 'short' })} ${churnDate.getFullYear()}`;
        } else {
          churnPeriodKey = `${churnDate.getFullYear()}`;
        }
        
        if (!churnedCustomersByPeriod[churnPeriodKey]) {
          churnedCustomersByPeriod[churnPeriodKey] = 0;
          if (!labels.includes(churnPeriodKey)) {
            labels.push(churnPeriodKey);
          }
        }
        
        churnedCustomersByPeriod[churnPeriodKey]++;
      }
    });
    
    // Sort labels chronologically
    labels.sort((a, b) => {
      if (timeframe === 'weekly') {
        // Extract year and week number for comparison
        const [weekA, yearA] = a.match(/Week (\d+) of (\d+)/).slice(1).map(Number);
        const [weekB, yearB] = b.match(/Week (\d+) of (\d+)/).slice(1).map(Number);
        
        if (yearA !== yearB) return yearA - yearB;
        return weekA - weekB;
      } else if (timeframe === 'monthly') {
        // Convert 'MMM YYYY' to Date for comparison
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      } else {
        // Compare years directly
        return parseInt(a) - parseInt(b);
      }
    });
    
    // Create data arrays in the same order as labels
    const newCustomers = labels.map(label => newCustomersByPeriod[label] || 0);
    const churnedCustomers = labels.map(label => churnedCustomersByPeriod[label] || 0);
    
    res.json({ labels, newCustomers, churnedCustomers });
  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({ message: 'Error generating customer report', error: error.message });
  }
});

// Get service quality metrics for reports
router.get('/service-quality', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let startDate, endDate;
    const currentDate = new Date();
    
    // Determine date range based on timeframe
    switch (timeframe) {
      case 'weekly':
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        endDate = currentDate;
        break;
      case 'monthly':
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1);
        endDate = currentDate;
        break;
      case 'yearly':
        startDate = new Date(currentDate);
        startDate.setFullYear(currentDate.getFullYear() - 1);
        endDate = currentDate;
        break;
      default:
        // Default to monthly
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1);
        endDate = currentDate;
    }
    
    // Format dates for query
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get network metrics from network service
    const networkReport = await generateNetworkReport(startDate, endDate);
    
    // Get ticket resolution metrics
    const tickets = await Ticket.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: 'closed'
      },
      attributes: ['createdAt', 'closedAt']
    });
    
    // Calculate average resolution time in hours
    let totalResolutionTime = 0;
    tickets.forEach(ticket => {
      const createdDate = new Date(ticket.createdAt);
      const closedDate = new Date(ticket.closedAt);
      const resolutionTime = (closedDate - createdDate) / (1000 * 60 * 60); // Convert to hours
      totalResolutionTime += resolutionTime;
    });
    
    const avgResolutionTime = tickets.length > 0 ? totalResolutionTime / tickets.length : 0;
    
    // Convert resolution time to a 0-100 scale (lower is better)
    // Assuming 24 hours (1 day) is the target resolution time, scale accordingly
    const ticketResolutionScore = Math.max(0, 100 - (avgResolutionTime / 24 * 100));
    
    // For this example, we'll use simulated data for some metrics
    // In a real system, these would come from actual measurements
    const networkUptime = networkReport.uptime || 99.5; // Percentage
    const avgLatency = networkReport.avgLatency || 25; // ms, lower is better
    
    // Convert latency to a 0-100 scale (lower is better)
    // Assuming 100ms is the worst acceptable latency
    const latencyScore = Math.max(0, 100 - (avgLatency / 100 * 100));
    
    // Simulated customer satisfaction score (0-100)
    const customerSatisfaction = 85;
    
    // Simulated bandwidth delivery score (percentage of promised bandwidth actually delivered)
    const bandwidthDelivery = 92;
    
    res.json({
      networkUptime,
      avgLatency: latencyScore,
      ticketResolutionTime: ticketResolutionScore,
      customerSatisfaction,
      bandwidthDelivery
    });
  } catch (error) {
    console.error('Error generating service quality report:', error);
    res.status(500).json({ message: 'Error generating service quality report', error: error.message });
  }
});

/**
 * Helper function to get the week number of a date
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

module.exports = router;