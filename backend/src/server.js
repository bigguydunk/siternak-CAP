require('dotenv').config();
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;

// Test DB connection before starting
db.raw('SELECT 1')
  .then(() => {
    console.log('✅  PostgreSQL connected.');
    app.listen(PORT, () => {
      console.log(`🚀  TernakKu API running on http://localhost:${PORT}`);
      console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('❌  Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });
