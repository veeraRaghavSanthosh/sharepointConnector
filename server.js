const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./lib/database');
const Order = require('./lib/models/Order');
const { orderValidationRules, handleValidationErrors } = require('./lib/validation');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware (basic implementation)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Create a new order - POST /v1/orders
const createOrder = async (req, res) => {
  try {
    // Check if order with the same orderId already exists
    const existingOrder = await Order.findOne({ orderId: req.body.orderId });
    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: 'Order with this ID already exists',
        orderId: req.body.orderId
      });
    }

    // Create new order
    const orderData = {
      ...req.body,
      orderDate: new Date()
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: savedOrder.orderId,
        customerId: savedOrder.customerId,
        customerName: savedOrder.customerName,
        customerEmail: savedOrder.customerEmail,
        totalAmount: savedOrder.totalAmount,
        currency: savedOrder.currency,
        status: savedOrder.status,
        orderDate: savedOrder.orderDate,
        items: savedOrder.items,
        shippingAddress: savedOrder.shippingAddress,
        notes: savedOrder.notes,
        deliveryDate: savedOrder.deliveryDate
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Order with this ID already exists',
        orderId: req.body.orderId
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get order by ID - GET /v1/orders/:orderId
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        orderId
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// API Routes
app.post('/v1/orders', orderValidationRules(), handleValidationErrors, createOrder);
app.get('/v1/orders/:orderId', getOrderById);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Orders endpoint: http://localhost:${PORT}/v1/orders`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;