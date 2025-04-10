/**
 * Payment Controller
 * Handles payment-related API endpoints
 */

const Payment = require('../models/payment.model');
const Invoice = require('../models/invoice.model');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get payment statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentStats = async (req, res) => {
  try {
    // Get total revenue (sum of all completed payments)
    const totalRevenueResult = await Payment.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: {
        status: 'completed'
      }
    });
    
    const totalRevenue = totalRevenueResult.getDataValue('total') || 0;
    
    // Get pending payments count
    const pendingPayments = await Payment.count({
      where: {
        status: {
          [Op.in]: ['pending', 'pending_approval']
        }
      }
    });
    
    // Get completed payments count
    const completedPayments = await Payment.count({
      where: {
        status: 'completed'
      }
    });
    
    // Get monthly revenue (current month)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyRevenueResult = await Payment.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: {
        status: 'completed',
        paymentDate: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth]
        }
      }
    });
    
    const monthlyRevenue = monthlyRevenueResult.getDataValue('total') || 0;
    
    // Get payment status data for chart
    const paymentStatusData = {
      completed: completedPayments,
      pending: pendingPayments,
      failed: await Payment.count({ where: { status: 'failed' } })
    };
    
    res.json({
      totalRevenue,
      pendingPayments,
      completedPayments,
      monthlyRevenue,
      paymentStatusData
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Error fetching payment stats', error: error.message });
  }
};

/**
 * Get revenue data for chart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRevenueData = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Generate time labels and data based on period
    let labels = [];
    let revenueData = [];
    
    // Generate dummy data based on period
    const dataPoints = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    
    for (let i = 0; i < dataPoints; i++) {
      // Generate labels
      if (period === 'day') {
        labels.push(`${i}:00`);
      } else if (period === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.push(days[i % 7]);
      } else {
        labels.push(`Day ${i+1}`);
      }
      
      // Generate random revenue data
      revenueData.push(Math.floor(Math.random() * 5000000) + 1000000); // Random revenue between 1M and 6M
    }
    
    res.json({
      labels,
      revenue: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Error fetching revenue data', error: error.message });
  }
};

module.exports = {
  getPaymentStats,
  getRevenueData
};