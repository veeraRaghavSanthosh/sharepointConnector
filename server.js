const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'orders.db');
const db = new sqlite3.Database(dbPath);

// Initialize database table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )`);
});

// Validation rules for orders
const orderValidation = [
  body('customer_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customer_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),
  
  body('items.*.name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name is required and must be less than 200 characters'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be a positive integer'),
  
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number')
];

// POST /v1/orders endpoint
app.post('/v1/orders', orderValidation, (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { customer_name, customer_email, items, total_amount } = req.body;
  
  // Validate that total_amount matches sum of items
  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  if (Math.abs(calculatedTotal - total_amount) > 0.01) {
    return res.status(400).json({
      success: false,
      message: 'Total amount does not match sum of item prices',
      calculated_total: calculatedTotal,
      provided_total: total_amount
    });
  }

  // Insert order into database
  const itemsJson = JSON.stringify(items);
  const query = `INSERT INTO orders (customer_name, customer_email, items, total_amount) 
                 VALUES (?, ?, ?, ?)`;
  
  db.run(query, [customer_name, customer_email, itemsJson, total_amount], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to save order to database',
        error: err.message
      });
    }

    // Return success response with order ID
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: this.lastID,
        customer_name,
        customer_email,
        items,
        total_amount,
        status: 'pending'
      }
    });
  });
});

// GET /v1/orders endpoint for testing/viewing orders
app.get('/v1/orders', (req, res) => {
  const query = `SELECT * FROM orders ORDER BY order_date DESC`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: err.message
      });
    }

    // Parse items JSON for each order
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));

    res.json({
      success: true,
      orders
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Orders endpoint: POST http://localhost:${PORT}/v1/orders`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = app;