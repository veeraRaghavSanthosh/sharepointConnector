const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'orders.db');
const db = new sqlite3.Database(dbPath);

// Create orders table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Validation middleware for orders
const validateOrderPayload = (req, res, next) => {
  const { customer_name, customer_email, product_name, quantity, price } = req.body;
  
  const errors = [];
  
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
    errors.push('customer_name is required and must be a non-empty string');
  }
  
  if (!customer_email || typeof customer_email !== 'string' || !customer_email.includes('@')) {
    errors.push('customer_email is required and must be a valid email address');
  }
  
  if (!product_name || typeof product_name !== 'string' || product_name.trim().length === 0) {
    errors.push('product_name is required and must be a non-empty string');
  }
  
  if (!quantity || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
    errors.push('quantity is required and must be a positive integer');
  }
  
  if (!price || typeof price !== 'number' || price <= 0) {
    errors.push('price is required and must be a positive number');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// POST /v1/orders endpoint
app.post('/v1/orders', validateOrderPayload, (req, res) => {
  const { customer_name, customer_email, product_name, quantity, price } = req.body;
  const total_amount = quantity * price;
  
  const stmt = db.prepare(`INSERT INTO orders 
    (customer_name, customer_email, product_name, quantity, price, total_amount) 
    VALUES (?, ?, ?, ?, ?, ?)`);
  
  stmt.run([customer_name, customer_email, product_name, quantity, price, total_amount], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        error: 'Failed to create order',
        message: 'Internal server error'
      });
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order_id: this.lastID,
      total_amount: total_amount
    });
  });
  
  stmt.finalize();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Orders endpoint: POST http://localhost:${PORT}/v1/orders`);
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