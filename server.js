const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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
    price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )`);
});

// Validation middleware for orders
const validateOrderPayload = (req, res, next) => {
  const { customer_name, customer_email, product_name, quantity, price } = req.body;
  
  const errors = [];
  
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
    errors.push('customer_name is required and must be a non-empty string');
  }
  
  if (!customer_email || typeof customer_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
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
  
  // Calculate total amount
  req.body.total_amount = quantity * price;
  
  next();
};

// POST /v1/orders endpoint
app.post('/v1/orders', validateOrderPayload, (req, res) => {
  const { customer_name, customer_email, product_name, quantity, price, total_amount } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO orders (customer_name, customer_email, product_name, quantity, price, total_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([customer_name, customer_email, product_name, quantity, price, total_amount], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create order'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: this.lastID,
        customer_name,
        customer_email,
        product_name,
        quantity,
        price,
        total_amount,
        status: 'pending'
      }
    });
  });
  
  stmt.finalize();
});

// GET /v1/orders endpoint (for testing purposes)
app.get('/v1/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY order_date DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch orders'
      });
    }
    
    res.json({
      success: true,
      orders: rows
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Orders API available at http://localhost:${PORT}/v1/orders`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
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