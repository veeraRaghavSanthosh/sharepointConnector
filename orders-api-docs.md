# Orders API Documentation

## Overview
This API provides endpoints for managing orders with payload validation and database storage.

## Setup

### Prerequisites
- Node.js (v12 or higher)
- npm

### Installation
```bash
npm install
```

### Starting the Server
```bash
npm start
# or
node server.js
```

The server will start on port 3000 by default, or the port specified in the `PORT` environment variable.

## Endpoints

### POST /v1/orders

Creates a new order with validation and stores it in the database.

#### Request Body
```json
{
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "items": [
    {
      "name": "Product A",
      "quantity": 2,
      "price": 25.99
    },
    {
      "name": "Product B", 
      "quantity": 1,
      "price": 15.50
    }
  ],
  "total_amount": 67.48
}
```

#### Validation Rules
- `customer_name`: String, 2-100 characters, required
- `customer_email`: Valid email format, required
- `items`: Array of objects, minimum 1 item, required
  - `name`: String, required
  - `quantity`: Integer, minimum 1, required
  - `price`: Positive number, required
- `total_amount`: Positive number, required (must match calculated total)

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "items": [
      {
        "name": "Product A",
        "quantity": 2,
        "price": 25.99
      },
      {
        "name": "Product B",
        "quantity": 1,
        "price": 15.50
      }
    ],
    "total_amount": 67.48,
    "status": "pending"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "details": [
    "\"customer_email\" must be a valid email"
  ]
}
```

#### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

### GET /health

Health check endpoint to verify the server is running.

#### Success Response (200 OK)
```json
{
  "status": "OK",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

## Database Schema

The orders are stored in an SQLite database with the following schema:

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  items TEXT NOT NULL,  -- JSON string of items array
  total_amount REAL NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending'
);
```

## Testing

Run the test script to verify the endpoint functionality:

```bash
# Start the server first
npm start

# In another terminal, run the test
node test-orders-endpoint.js
```

## Example cURL Commands

### Create a valid order:
```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "items": [
      {"name": "Product A", "quantity": 2, "price": 25.99},
      {"name": "Product B", "quantity": 1, "price": 15.50}
    ],
    "total_amount": 67.48
  }'
```

### Health check:
```bash
curl http://localhost:3000/health
```

## Error Handling

The API includes comprehensive error handling:
- Input validation using Joi schema
- Database error handling
- Total amount verification
- 404 handling for unknown endpoints
- Global error handling middleware