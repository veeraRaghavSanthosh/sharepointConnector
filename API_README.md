# Orders API

This document describes the new Orders API endpoint that has been added to the SharePoint Connector project.

## Overview

A new HTTP server has been added to provide REST API functionality alongside the existing SharePoint connector library. The server includes a POST endpoint for creating orders with payload validation and database persistence.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3000 by default (or the port specified in the PORT environment variable).

## API Endpoints

### POST /v1/orders

Creates a new order in the database.

#### Request

**URL:** `POST /v1/orders`

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com", 
  "product_name": "Widget Pro",
  "quantity": 2,
  "price": 29.99
}
```

#### Request Body Validation

All fields are required and must meet the following criteria:

- `customer_name`: Non-empty string
- `customer_email`: Valid email address (must contain @)
- `product_name`: Non-empty string  
- `quantity`: Positive integer
- `price`: Positive number

#### Response

**Success (201 Created):**
```json
{
  "message": "Order created successfully",
  "order_id": 1,
  "total_amount": 59.98
}
```

**Validation Error (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "customer_name is required and must be a non-empty string",
    "customer_email is required and must be a valid email address"
  ]
}
```

**Server Error (500 Internal Server Error):**
```json
{
  "error": "Failed to create order",
  "message": "Internal server error"
}
```

### GET /health

Health check endpoint to verify the server is running.

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-09-16T10:30:00.000Z"
}
```

## Database

The server uses SQLite to store orders in a local `orders.db` file. The orders table has the following schema:

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  total_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

You can test the endpoint using curl:

```bash
# Test valid order
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "product_name": "Widget Pro", 
    "quantity": 2,
    "price": 29.99
  }'

# Test validation errors
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "",
    "customer_email": "invalid-email",
    "quantity": -1,
    "price": 0
  }'

# Health check
curl http://localhost:3000/health
```

## Architecture

The implementation adds minimal changes to the existing SharePoint connector:

1. **Dependencies**: Added `express` and `sqlite3` to package.json
2. **Server**: Created `server.js` as the main HTTP server entry point
3. **Database**: SQLite database for simple, file-based persistence
4. **Validation**: Comprehensive payload validation middleware
5. **Error Handling**: Proper HTTP status codes and error messages

The existing SharePoint connector functionality remains unchanged and can still be used as a library via `require('sharepointconnector')`.