const path = require('path');

module.exports = {
  // Konfigurasi Ollama untuk RAG
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    options: {
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
      top_k: 40
    }
  },

  // Konfigurasi ChromaDB untuk RAG
  chromadb: {
    path: process.env.CHROMADB_PATH || path.join(__dirname, '../../data/chromadb'),
    collections: {
      deviceKnowledge: 'device_knowledge'
    }
  },

  // Konfigurasi untuk layanan AI CS
  customerService: {
    // Prioritas layanan AI yang akan digunakan
    providers: [
      {
        name: 'ollama',
        enabled: true,
        config: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: process.env.CS_OLLAMA_MODEL || 'llama2'
        }
      },
      {
        name: 'openai',
        enabled: process.env.OPENAI_API_KEY ? true : false,
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
        }
      },
      {
        name: 'anthropic',
        enabled: process.env.ANTHROPIC_API_KEY ? true : false,
        config: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-2'
        }
      }
    ],

    // Pengaturan template
    templatePath: path.join(__dirname, '../config/ai-templates.js'),
    useTemplates: true,
    fallbackToRawResponse: true
  }
};