const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Cohere API configuration
  cohereApiKey: process.env.COHERE_API_KEY,
  
  // CORS configuration
  corsOrigins: {
    development: 'http://localhost:3000',
    production: ['https://aiatsscorer1.netlify.app']
  },
  
  // Upload configuration
  uploadLimits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf']
  }
};

module.exports = config;
