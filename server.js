const express = require('express');
const joi = require('joi');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const sharepoint = require('./sharepointconnector');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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
    total_amount REAL NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )`);
});

// Validation schema for orders
const orderSchema = joi.object({
  customer_name: joi.string().min(2).max(100).required(),
  customer_email: joi.string().email().required(),
  items: joi.array().items(joi.object({
    name: joi.string().required(),
    quantity: joi.number().integer().min(1).required(),
    price: joi.number().positive().required()
  })).min(1).required(),
  total_amount: joi.number().positive().required()
});

// POST /v1/orders endpoint
app.post('/v1/orders', async (req, res) => {
  try {
    // Validate payload
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { customer_name, customer_email, items, total_amount } = value;

    // Calculate total to verify it matches the provided total
    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (Math.abs(calculatedTotal - total_amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total amount does not match calculated total'
      });
    }

    // Insert order into database
    const insertOrder = new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO orders (customer_name, customer_email, items, total_amount) 
                               VALUES (?, ?, ?, ?)`);
      
      stmt.run([customer_name, customer_email, JSON.stringify(items), total_amount], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });

    const orderId = await insertOrder;

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        customer_name,
        customer_email,
        items,
        total_amount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;