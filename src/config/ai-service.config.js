module.exports = {
  // Konfigurasi endpoint untuk layanan AI terpisah
  aiServiceEndpoint: process.env.AI_SERVICE_ENDPOINT || 'http://localhost:5000',
  apiKey: process.env.AI_SERVICE_API_KEY,
  
  // Timeout untuk request API (dalam milidetik)
  requestTimeout: 30000,
  
  // Endpoint paths
  endpoints: {
    deviceAnalysis: '/api/device/analyze',
    deviceResponse: '/api/device/response'
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000
  }
}