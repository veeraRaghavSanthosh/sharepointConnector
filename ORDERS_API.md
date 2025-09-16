# Orders API

This document describes the new Orders API endpoint added to the SharePoint Connector project.

## Overview

The Orders API provides a REST endpoint for creating and managing order records with payload validation and database persistence.

## Endpoints

### POST /v1/orders

Creates a new order with validation and saves it to the database.

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com", 
  "items": [
    {
      "name": "Widget A",
      "quantity": 2,
      "price": 25.50
    },
    {
      "name": "Widget B",
      "quantity": 1, 
      "price": 15.00
    }
  ],
  "total_amount": 66.00
}
```

**Validation Rules:**
- `customer_name`: Required, 2-100 characters
- `customer_email`: Required, valid email format
- `items`: Required array with at least 1 item
  - `name`: Required, 1-200 characters
  - `quantity`: Required, positive integer
  - `price`: Required, positive number
- `total_amount`: Required, positive number, must match sum of (quantity × price)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "items": [...],
    "total_amount": 66.00,
    "status": "pending"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Customer name must be between 2 and 100 characters",
      "path": "customer_name",
      "location": "body"
    }
  ]
}
```

### GET /v1/orders

Retrieves all orders from the database (for testing purposes).

**Success Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_email": "john.doe@example.com",
      "items": [...],
      "total_amount": 66.00,
      "order_date": "2025-09-16 10:30:45",
      "status": "pending"
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-09-16T10:30:45.123Z"
}
```

## Database Schema

Orders are stored in SQLite database (`orders.db`) with the following schema:

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  items TEXT NOT NULL,  -- JSON string
  total_amount DECIMAL(10,2) NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending'
);
```

## Running the Server

1. Install dependencies:
```bash
npm install express cors body-parser express-validator sqlite3
```

2. Start the server:
```bash
node server.js
```

3. Test the endpoint:
```bash
node test_orders.js
```

## Example Usage

### Using curl:

```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Smith",
    "customer_email": "jane@example.com",
    "items": [
      {"name": "Product A", "quantity": 1, "price": 29.99}
    ],
    "total_amount": 29.99
  }'
```

### Using JavaScript:

```javascript
const response = await fetch('http://localhost:3000/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer_name: "Jane Smith",
    customer_email: "jane@example.com", 
    items: [
      {name: "Product A", quantity: 1, price: 29.99}
    ],
    total_amount: 29.99
  })
});

const result = await response.json();
console.log(result);
```

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Validation errors, malformed JSON, total amount mismatch
- **500 Internal Server Error**: Database errors, server issues
- **404 Not Found**: Invalid endpoints

All errors return a consistent JSON format with `success: false` and descriptive error messages.