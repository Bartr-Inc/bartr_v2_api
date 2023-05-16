const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const hpp = require('hpp');
const cors = require('cors');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

const app = express();

// Connect to database
connectDB();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const wallet = require('./routes/wallet');
const payments = require('./routes/payments');
const subscription = require('./routes/subscriptions');

// Sanitize data
app.use(mongoSanitize());

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/v2/auth', auth);
app.use('/api/v2/users', users);
app.use('/api/v2/wallet', wallet);
app.use('/api/v2/payments', payments);
app.use('/api/v2/subscription', subscription);

app.use(errorHandler);

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
