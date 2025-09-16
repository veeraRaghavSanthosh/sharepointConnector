# Orders API Implementation

## Overview

This implementation adds a REST API endpoint `POST /v1/orders` to the SharePoint Connector project. The endpoint validates incoming order payloads and stores them in a SQLite database.

## Changes Made

### 1. Dependencies Added
- `express`: ^4.18.2 - Web framework for the API server
- `sqlite3`: ^5.1.6 - Database for storing orders

### 2. Files Created
- `server.js` - Main API server implementation
- `ORDERS_API.md` - This documentation file

### 3. Package.json Updates
- Added new dependencies
- Added `start` script: `node server.js`

## API Endpoint

### POST /v1/orders

Creates a new order with validation and database storage.

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "product_name": "Widget Pro",
  "quantity": 2,
  "price": 29.99
}
```

**Validation Rules:**
- `customer_name`: Required, non-empty string
- `customer_email`: Required, valid email format
- `product_name`: Required, non-empty string
- `quantity`: Required, positive integer
- `price`: Required, positive number

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "product_name": "Widget Pro",
    "quantity": 2,
    "price": 29.99,
    "total_amount": 59.98,
    "status": "pending"
  }
}
```

**Validation Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    "customer_name is required and must be a non-empty string",
    "customer_email is required and must be a valid email address"
  ]
}
```

### Additional Endpoints

#### GET /v1/orders
Returns all orders (for testing purposes)

#### GET /health
Health check endpoint

## Database Schema

The implementation uses SQLite with the following schema:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending'
);
```

## Usage

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on port 3000 (or PORT environment variable).

### 3. Test the Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "product_name": "Widget Pro",
    "quantity": 2,
    "price": 29.99
  }'
```

**Using a REST client or Postman:**
- URL: `http://localhost:3000/v1/orders`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: JSON payload as shown above

## Features

✅ **Payload Validation**: Comprehensive validation with detailed error messages
✅ **Database Storage**: SQLite database with proper schema
✅ **Error Handling**: Proper HTTP status codes and error responses
✅ **Data Integrity**: Prepared statements to prevent SQL injection
✅ **Calculated Fields**: Automatic total_amount calculation
✅ **Graceful Shutdown**: Proper database connection cleanup
✅ **Health Check**: Monitoring endpoint
✅ **Minimal Changes**: Added as separate server, preserves existing SharePoint connector functionality

## Architecture

The implementation follows RESTful principles and includes:

- **Validation Middleware**: Validates request payload before processing
- **Database Layer**: SQLite for persistent storage
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Separation of Concerns**: Server logic separate from existing SharePoint connector
- **Security**: Prepared statements prevent SQL injection

## Testing

The endpoint can be tested by:

1. Starting the server with `npm start`
2. Sending POST requests to `/v1/orders` with valid/invalid payloads
3. Checking the database by querying `/v1/orders`
4. Monitoring server health with `/health`

## Follow-up Testing

If tests fail, check:

1. Dependencies are installed (`npm install`)
2. Server is running on correct port
3. Request payload matches expected format
4. Database file permissions (orders.db will be created automatically)
5. Server logs for detailed error information