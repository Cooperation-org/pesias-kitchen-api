const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Check if app was properly imported
if (!app || typeof app.listen !== 'function') {
  console.error('Error: Express app not properly exported from src/app.js');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
