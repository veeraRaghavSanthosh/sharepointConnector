// SharePoint Connector Server
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware for JSON parsing
app.use(express.json());

// Input validation middleware
function validateInput(req, res, next) {
    // Check if request body exists and is not null
    if (req.body === null || req.body === undefined) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Request body cannot be null or undefined'
        });
    }
    
    // Additional validation can be added here
    next();
}

// SharePoint connection handler with null input protection
function handleSharePointConnection(input) {
    // Validate input to prevent TypeError
    if (input === null || input === undefined) {
        throw new Error('Input cannot be null or undefined');
    }
    
    // Ensure input is an object
    if (typeof input !== 'object') {
        throw new Error('Input must be an object');
    }
    
    // Add your SharePoint connection logic here
    // This is a placeholder implementation
    return {
        success: true,
        data: input,
        timestamp: new Date().toISOString()
    };
}

// API endpoints
app.post('/connect', validateInput, (req, res) => {
    try {
        const result = handleSharePointConnection(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Connection failed',
            message: error.message
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
        error: 'Internal server error',
        message: 'Something went wrong!'
    });
});

// Start server
app.listen(port, () => {
    console.log(`SharePoint Connector Server running on port ${port}`);
});

module.exports = { app, handleSharePointConnection, validateInput };