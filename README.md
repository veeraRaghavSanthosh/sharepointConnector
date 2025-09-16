# SharePoint Connector

A connector for integrating with Microsoft SharePoint services.

## Installation

### Prerequisites
- Python 3.7 or higher
- pip package manager
- Access to a SharePoint environment

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Alternative: Install in Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

1. Copy the configuration template:
```bash
cp config/config.example.json config/config.json
```

2. Update the configuration file with your SharePoint details:
   - SharePoint site URL
   - Authentication credentials
   - API endpoints

## Running the Application

### Basic Usage
```bash
python main.py
```

### With Configuration File
```bash
python main.py --config config/config.json
```

### Development Mode
```bash
python main.py --debug
```

## Testing

### Run All Tests
```bash
python -m pytest
```

### Run Tests with Coverage
```bash
python -m pytest --cov=. --cov-report=html
```

### Run Specific Test Module
```bash
python -m pytest tests/test_connector.py
```

### Run Tests in Verbose Mode
```bash
python -m pytest -v
```

## Project Structure

```
sharepointConnector/
├── src/                    # Source code
├── tests/                  # Test files
├── config/                 # Configuration files
├── requirements.txt        # Python dependencies
├── main.py                 # Entry point
└── README.md              # This file
```

## Environment Variables

Set the following environment variables for configuration:

```bash
export SHAREPOINT_URL="your-sharepoint-url"
export SHAREPOINT_USERNAME="your-username"
export SHAREPOINT_PASSWORD="your-password"
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Verify your SharePoint credentials and permissions
2. **Connection Timeout**: Check network connectivity and SharePoint URL
3. **Import Errors**: Ensure all dependencies are installed correctly

### Debug Mode
Run with debug flag for detailed logging:
```bash
python main.py --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything works
5. Submit a pull request

## License

See LICENSE file for details.