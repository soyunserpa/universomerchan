const postgres = require('postgres');
require('dotenv').config();
const { getStartingPrice } = require('./src/lib/price-calculator.ts'); // Wait, can't run TS directly in node
