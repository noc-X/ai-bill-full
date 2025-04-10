const { Ollama } = require('ollama');
const { ChromaClient } = require('chromadb');
const winston = require('winston');
const nlpService = require('./nlp.service');

class RAGService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_BASE_URL
    });
    
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH
    });
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/rag.log' }),
        new winston.transports.Console()
      ]
    });
  }

  async initializeCollections() {
    try {
      this.deviceCollection = await this.chroma.getOrCreateCollection({
        name: 'device_knowledge',
        metadata: { description: 'Network device knowledge base' }
      });
      
      this.logger.info('Collections initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize collections:', error);
      throw error;
    }
  }

  async addDeviceKnowledge(deviceId, knowledge) {
    try {
      await this.deviceCollection.add({
        ids: [deviceId],
        documents: [JSON.stringify(knowledge)],
        metadatas: [{ type: 'device_info', timestamp: new Date().toISOString() }]
      });
      
      this.logger.info(`Added knowledge for device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to add device knowledge for ${deviceId}:`, error);
      throw error;
    }
  }

  async analyzeDeviceIssue(deviceId, issue) {
    try {
      // Retrieve relevant knowledge from ChromaDB
      const results = await this.deviceCollection.query({
        queryTexts: [issue],
        nResults: 5
      });

      // Prepare initial context
      const initialContext = {
        deviceId,
        knowledge: results.documents[0].map(doc => JSON.parse(doc))
      };

      // Enhance context with NLP analysis
      const enhancedContext = await nlpService.enhanceRAGContext(issue, initialContext);
      
      // Generate analysis using Ollama with enhanced context
      const response = await this.ollama.chat({
        model: process.env.OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a network device analysis assistant. Analyze the issue using the provided context, relevant knowledge, and NLP insights.'
          },
          {
            role: 'user',
            content: `Please analyze this device issue:\n\nDevice ID: ${deviceId}\nIssue: ${issue}\n\nContext: ${JSON.stringify(enhancedContext, null, 2)}`
          }
        ],
        temperature: 0.7,
        top_p: 0.9
      });

      // Process the response through NLP
      const processedResponse = await nlpService.processResponse(response.response, enhancedContext);
      
      const analysis = this.parseAnalysis(processedResponse);
      this.logger.info(`Generated enhanced analysis for device ${deviceId}`);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Failed to analyze device issue for ${deviceId}:`, error);
      throw error;
    }
  }

  async generateDeviceResponse(deviceId, analysis) {
    try {
      const prompt = `Berdasarkan analisis berikut, buatkan respons yang informatif dan mudah dipahami:\n\n${JSON.stringify(analysis)}`;
      
      const response = await this.ollama.generate({
        model: process.env.OLLAMA_MODEL,
        prompt,
        options: {
          temperature: 0.7
        }
      });

      this.logger.info(`Generated response for device ${deviceId}`);
      return response.response;
    } catch (error) {
      this.logger.error(`Failed to generate device response for ${deviceId}:`, error);
      throw error;
    }
  }

  parseAnalysis(text) {
    // Parse the AI response into structured analysis
    const lines = text.split('\n');
    const analysis = {
      analysis: '',
      recommendations: [],
      requiresTechnician: false
    };

    let section = 'analysis';
    for (const line of lines) {
      if (line.toLowerCase().includes('rekomendasi:')) {
        section = 'recommendations';
        continue;
      }
      
      if (section === 'analysis') {
        analysis.analysis += line + '\n';
      } else if (section === 'recommendations' && line.trim()) {
        analysis.recommendations.push(line.trim());
      }

      if (line.toLowerCase().includes('teknisi') || 
          line.toLowerCase().includes('kunjungan') ||
          line.toLowerCase().includes('perbaikan fisik')) {
        analysis.requiresTechnician = true;
      }
    }

    analysis.analysis = analysis.analysis.trim();
    return analysis;
  }
}

module.exports = new RAGService();