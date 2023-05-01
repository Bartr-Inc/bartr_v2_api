const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const colors = require('colors');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

const app = express();

// Connect to database
connectDB();

// Sanitize data
app.use(mongoSanitize());

const PORT = process.env.PORT || 6000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
