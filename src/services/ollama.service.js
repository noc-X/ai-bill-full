/**
 * Ollama Service
 * Provides integration with Ollama for local AI processing
 */

const axios = require('axios');

// Initialize Ollama client configuration
const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama2';

// Check if Ollama service is available
const checkOllamaStatus = async () => {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    return {
      status: 'available',
      models: response.data.models || [],
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error connecting to Ollama service:', error.message);
    return {
      status: 'unavailable',
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Generate text completion using Ollama
const generateCompletion = async (prompt, model = DEFAULT_MODEL, options = {}) => {
  try {
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
      top_k: 40
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
      model,
      prompt,
      options: mergedOptions,
      stream: false
    });
    
    return {
      status: 'success',
      text: response.data.response,
      model,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error generating completion with Ollama:', error.message);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Generate chat completion using Ollama
const generateChatCompletion = async (messages, model = DEFAULT_MODEL, options = {}) => {
  try {
    const defaultOptions = {
      temperature: 0.7,
      num_predict: 500
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    const response = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model,
      messages,
      options: mergedOptions,
      stream: false
    });
    
    return {
      status: 'success',
      message: response.data.message,
      model,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error generating chat completion with Ollama:', error.message);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Generate embeddings using Ollama
const generateEmbeddings = async (text, model = DEFAULT_MODEL) => {
  try {
    const response = await axios.post(`${OLLAMA_API_URL}/api/embeddings`, {
      model,
      prompt: text
    });
    
    return {
      status: 'success',
      embedding: response.data.embedding,
      model,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error generating embeddings with Ollama:', error.message);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    };
  }
};

module.exports = {
  checkOllamaStatus,
  generateCompletion,
  generateChatCompletion,
  generateEmbeddings,
  OLLAMA_API_URL,
  DEFAULT_MODEL
};