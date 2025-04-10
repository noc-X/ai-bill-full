const fs = require('fs');
const csv = require('csv-parse');
const pdf = require('pdf-parse');
const winston = require('winston');

class FileProcessorService {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/file-processor.log' }),
        new winston.transports.Console()
      ]
    });
  }

  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          info: data.info
        }
      };
    } catch (error) {
      this.logger.error(`Error processing PDF file: ${filePath}`, error);
      throw error;
    }
  }

  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.logger.info(`Successfully processed CSV file: ${filePath}`);
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error(`Error processing CSV file: ${filePath}`, error);
          reject(error);
        });
    });
  }

  async processTXT(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      this.logger.info(`Successfully processed TXT file: ${filePath}`);
      return content;
    } catch (error) {
      this.logger.error(`Error processing TXT file: ${filePath}`, error);
      throw error;
    }
  }

  async processFile(filePath) {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    let content;

    switch (fileExtension) {
      case 'pdf':
        content = await this.processPDF(filePath);
        break;
      case 'csv':
        content = await this.processCSV(filePath);
        break;
      case 'txt':
        content = await this.processTXT(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    return content;
  }
}

module.exports = new FileProcessorService();