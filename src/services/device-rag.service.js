const NetworkDevice = require('../models/network-device.model');
const Ticket = require('../models/ticket.model');
const { generateCompletion, generateChatCompletion } = require('./ollama.service');

// Fungsi untuk mengambil data perangkat dan riwayat masalah
async function getDeviceContext(deviceId) {
  try {
    const device = await NetworkDevice.findByPk(deviceId, {
      include: [{
        model: Ticket,
        where: { category: 'device_issue' },
        required: false,
        limit: 5,
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!device) {
      throw new Error('Device not found');
    }

    return {
      deviceInfo: {
        name: device.name,
        type: device.type,
        status: device.status,
        lastSeen: device.lastSeen,
        location: device.location,
        cpuLoad: device.cpuLoad,
        memoryUsage: device.memoryUsage,
        temperature: device.temperature,
        uptime: device.uptime
      },
      recentIssues: device.Tickets.map(ticket => ({
        date: ticket.createdAt,
        issue: ticket.description,
        resolution: ticket.resolution
      }))
    };
  } catch (error) {
    console.error('Error getting device context:', error);
    throw error;
  }
}

// Fungsi untuk menganalisis masalah perangkat dengan RAG
async function analyzeDeviceIssue(deviceId, currentIssue) {
  try {
    const deviceContext = await getDeviceContext(deviceId);
    
    const systemPrompt = {
      role: 'system',
      content: `Anda adalah AI assistant yang ahli dalam mendiagnosis masalah perangkat jaringan.
      Analisis data perangkat dan riwayat masalah berikut untuk memberikan diagnosis dan rekomendasi yang akurat.
      
      Data Perangkat:
      ${JSON.stringify(deviceContext.deviceInfo, null, 2)}
      
      Riwayat Masalah:
      ${JSON.stringify(deviceContext.recentIssues, null, 2)}
      
      Berdasarkan data di atas, berikan:
      1. Analisis penyebab masalah
      2. Rekomendasi penanganan
      3. Tingkat urgensi (critical/high/medium/low)
      4. Apakah perlu kunjungan teknisi
      
      Format respons dalam JSON dengan struktur:
      {
        "analysis": "Analisis masalah",
        "recommendations": ["Daftar rekomendasi"],
        "urgency": "Tingkat urgensi",
        "requiresTechnician": true/false
      }`
    };

    const userMessage = {
      role: 'user',
      content: `Masalah saat ini: ${currentIssue}`
    };

    const response = await generateChatCompletion([systemPrompt, userMessage]);
    return JSON.parse(response.content);

  } catch (error) {
    console.error('Error analyzing device issue:', error);
    throw error;
  }
}

// Fungsi untuk menghasilkan respons yang dipersonalisasi
async function generateDeviceResponse(deviceId, analysis) {
  try {
    const device = await NetworkDevice.findByPk(deviceId);
    
    let response = `Status Perangkat: ${device.name}\n\n`;
    response += `Analisis: ${analysis.analysis}\n\n`;
    response += 'Rekomendasi:\n';
    analysis.recommendations.forEach((rec, index) => {
      response += `${index + 1}. ${rec}\n`;
    });
    
    if (analysis.requiresTechnician) {
      response += '\nTim teknisi kami akan segera menghubungi Anda untuk penanganan lebih lanjut.';
    }

    return response;
  } catch (error) {
    console.error('Error generating device response:', error);
    throw error;
  }
}

module.exports = {
  getDeviceContext,
  analyzeDeviceIssue,
  generateDeviceResponse
};