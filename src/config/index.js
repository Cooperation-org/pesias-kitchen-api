require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  goodDollarApi: process.env.GOODDOLLAR_API_URL,
  goodCollectiveApi: process.env.GOODCOLLECTIVE_API_URL
};
