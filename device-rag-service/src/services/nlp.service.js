const { pipeline } = require('@xenova/transformers');
const winston = require('winston');

class NLPService {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/nlp.log' }),
        new winston.transports.Console()
      ]
    });

    // Initialize NLP pipelines
    this.initializePipelines();
  }

  async initializePipelines() {
    try {
      // Load sentiment analysis pipeline
      this.sentimentPipeline = await pipeline('sentiment-analysis', 'nlptown/bert-base-multilingual-uncased-sentiment');
      
      // Load text classification pipeline
      this.classificationPipeline = await pipeline('text-classification', 'indolem/indobert-base-uncased');
      
      // Load named entity recognition pipeline
      this.nerPipeline = await pipeline('ner', 'cahya/bert-base-indonesian-NER');

      this.logger.info('NLP pipelines initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize NLP pipelines:', error);
      throw error;
    }
  }

  async analyzeSentiment(text) {
    try {
      const result = await this.sentimentPipeline(text);
      return {
        sentiment: result[0].label,
        score: result[0].score
      };
    } catch (error) {
      this.logger.error('Error in sentiment analysis:', error);
      throw error;
    }
  }

  async classifyText(text) {
    try {
      const result = await this.classificationPipeline(text);
      return {
        category: result[0].label,
        confidence: result[0].score
      };
    } catch (error) {
      this.logger.error('Error in text classification:', error);
      throw error;
    }
  }

  async extractEntities(text) {
    try {
      const entities = await this.nerPipeline(text);
      return this.processEntities(entities);
    } catch (error) {
      this.logger.error('Error in entity extraction:', error);
      throw error;
    }
  }

  processEntities(entities) {
    const processedEntities = {};
    entities.forEach(entity => {
      if (!processedEntities[entity.entity_group]) {
        processedEntities[entity.entity_group] = [];
      }
      processedEntities[entity.entity_group].push({
        text: entity.word,
        score: entity.score
      });
    });
    return processedEntities;
  }

  async enhanceRAGContext(text, context) {
    try {
      // Analyze sentiment of user query
      const sentiment = await this.analyzeSentiment(text);
      
      // Classify the type of query
      const classification = await this.classifyText(text);
      
      // Extract named entities
      const entities = await this.extractEntities(text);

      // Enhance context with NLP insights
      return {
        ...context,
        nlp_analysis: {
          sentiment,
          classification,
          entities
        }
      };
    } catch (error) {
      this.logger.error('Error enhancing RAG context:', error);
      throw error;
    }
  }

  async processResponse(response, context) {
    try {
      // Analyze response sentiment
      const sentiment = await this.analyzeSentiment(response);
      
      // Ensure response sentiment aligns with context
      if (context.nlp_analysis && 
          context.nlp_analysis.sentiment && 
          Math.abs(sentiment.score - context.nlp_analysis.sentiment.score) > 0.5) {
        this.logger.warn('Response sentiment significantly differs from context');
      }

      // Extract and validate entities in response
      const responseEntities = await this.extractEntities(response);
      
      // Ensure critical entities from context are present in response
      if (context.nlp_analysis && context.nlp_analysis.entities) {
        this.validateEntities(context.nlp_analysis.entities, responseEntities);
      }

      return response;
    } catch (error) {
      this.logger.error('Error processing response:', error);
      throw error;
    }
  }

  validateEntities(contextEntities, responseEntities) {
    for (const entityType in contextEntities) {
      if (contextEntities[entityType].length > 0 && 
          (!responseEntities[entityType] || responseEntities[entityType].length === 0)) {
        this.logger.warn(`Missing ${entityType} entities in response`);
      }
    }
  }
}

module.exports = new NLPService();