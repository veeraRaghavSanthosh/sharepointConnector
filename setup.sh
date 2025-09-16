#!/bin/bash

echo "Setting up Orders API..."

# Install dependencies
echo "Installing dependencies..."
npm install express joi sqlite3

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully!"
    
    echo "Starting the server..."
    node server.js
else
    echo "Failed to install dependencies. Please run 'npm install express joi sqlite3' manually."
fi