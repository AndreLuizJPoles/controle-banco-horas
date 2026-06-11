const fs = require('fs');
const path = require('path');

const rootEnv = path.join(__dirname, '../.env');
const serverEnv = path.join(__dirname, '../server/.env');

if (!fs.existsSync(rootEnv)) {
  console.error('Missing .env at project root. Copy .env.example to .env first.');
  process.exit(1);
}

fs.copyFileSync(rootEnv, serverEnv);
