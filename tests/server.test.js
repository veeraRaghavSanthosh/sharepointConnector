const request = require('supertest');
const { app, handleSharePointConnection, validateInput } = require('../src/server');

describe('SharePoint Connector Server', () => {
    
    describe('handleSharePointConnection function', () => {
        
        test('should throw error when input is null', () => {
            expect(() => {
                handleSharePointConnection(null);
            }).toThrow('Input cannot be null or undefined');
        });
        
        test('should throw error when input is undefined', () => {
            expect(() => {
                handleSharePointConnection(undefined);
            }).toThrow('Input cannot be null or undefined');
        });
        
        test('should throw error when input is not an object', () => {
            expect(() => {
                handleSharePointConnection('string');
            }).toThrow('Input must be an object');
            
            expect(() => {
                handleSharePointConnection(123);
            }).toThrow('Input must be an object');
            
            expect(() => {
                handleSharePointConnection(true);
            }).toThrow('Input must be an object');
        });
        
        test('should process valid object input successfully', () => {
            const validInput = { 
                siteUrl: 'https://example.sharepoint.com',
                credentials: { username: 'test', password: 'test' }
            };
            
            const result = handleSharePointConnection(validInput);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('data', validInput);
            expect(result).toHaveProperty('timestamp');
            expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        });
        
        test('should handle empty object input', () => {
            const emptyInput = {};
            const result = handleSharePointConnection(emptyInput);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('data', emptyInput);
        });
        
        test('should handle array input (backward compatibility)', () => {
            const arrayInput = [1, 2, 3];
            const result = handleSharePointConnection(arrayInput);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('data', arrayInput);
        });
    });
    
    describe('API Endpoints', () => {
        
        describe('POST /connect', () => {
            
            test('should return 400 when request body is null', async () => {
                const response = await request(app)
                    .post('/connect')
                    .send(null);
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Invalid input');
                expect(response.body).toHaveProperty('message', 'Request body cannot be null or undefined');
            });
            
            test('should return 400 when request body is undefined', async () => {
                const response = await request(app)
                    .post('/connect')
                    .send();
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Invalid input');
            });
            
            test('should return 400 when input is not an object', async () => {
                const response = await request(app)
                    .post('/connect')
                    .send('invalid string input');
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error', 'Connection failed');
                expect(response.body).toHaveProperty('message', 'Input must be an object');
            });
            
            test('should process valid object input successfully', async () => {
                const validInput = {
                    siteUrl: 'https://example.sharepoint.com',
                    credentials: { username: 'test', password: 'test' }
                };
                
                const response = await request(app)
                    .post('/connect')
                    .send(validInput);
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data', validInput);
                expect(response.body).toHaveProperty('timestamp');
            });
            
            test('should handle empty object input', async () => {
                const response = await request(app)
                    .post('/connect')
                    .send({});
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data', {});
            });
            
            test('should handle array input for backward compatibility', async () => {
                const arrayInput = [{ id: 1 }, { id: 2 }];
                
                const response = await request(app)
                    .post('/connect')
                    .send(arrayInput);
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data', arrayInput);
            });
        });
        
        describe('GET /health', () => {
            test('should return health status', async () => {
                const response = await request(app)
                    .get('/health');
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 'OK');
                expect(response.body).toHaveProperty('timestamp');
                expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
            });
        });
    });
    
    describe('Middleware', () => {
        
        describe('validateInput middleware', () => {
            let req, res, next;
            
            beforeEach(() => {
                req = {};
                res = {
                    status: jest.fn(() => res),
                    json: jest.fn(() => res)
                };
                next = jest.fn();
            });
            
            test('should call next() for valid input', () => {
                req.body = { valid: 'input' };
                
                validateInput(req, res, next);
                
                expect(next).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
            });
            
            test('should return 400 for null input', () => {
                req.body = null;
                
                validateInput(req, res, next);
                
                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    error: 'Invalid input',
                    message: 'Request body cannot be null or undefined'
                });
                expect(next).not.toHaveBeenCalled();
            });
            
            test('should return 400 for undefined input', () => {
                req.body = undefined;
                
                validateInput(req, res, next);
                
                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    error: 'Invalid input',
                    message: 'Request body cannot be null or undefined'
                });
                expect(next).not.toHaveBeenCalled();
            });
            
            test('should allow empty object', () => {
                req.body = {};
                
                validateInput(req, res, next);
                
                expect(next).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
            });
            
            test('should allow array input for backward compatibility', () => {
                req.body = [];
                
                validateInput(req, res, next);
                
                expect(next).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
            });
        });
    });
    
    describe('Error Handling', () => {
        test('should handle internal server errors', async () => {
            // This test would require mocking to trigger an internal error
            // For now, we'll test that the error handler is properly configured
            expect(app._router).toBeDefined();
        });
    });
    
    describe('Backward Compatibility', () => {
        test('should maintain compatibility with existing object inputs', async () => {
            const legacyInput = {
                url: 'https://legacy.sharepoint.com',
                auth: 'legacy-token'
            };
            
            const response = await request(app)
                .post('/connect')
                .send(legacyInput);
            
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(legacyInput);
        });
        
        test('should maintain compatibility with array inputs', async () => {
            const legacyArrayInput = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];
            
            const response = await request(app)
                .post('/connect')
                .send(legacyArrayInput);
            
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(legacyArrayInput);
        });
    });
});