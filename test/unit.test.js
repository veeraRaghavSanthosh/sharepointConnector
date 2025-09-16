const request = require('supertest');
const { app, handleSharePointConnection, validateInput } = require('../src/server');

describe('SharePoint Connector - Null Input Bug Fix', () => {
    
    // Test the core function that was throwing TypeError
    describe('handleSharePointConnection', () => {
        
        it('should throw error for null input (bug fix)', () => {
            expect(() => handleSharePointConnection(null))
                .toThrow('Input cannot be null or undefined');
        });
        
        it('should throw error for undefined input', () => {
            expect(() => handleSharePointConnection(undefined))
                .toThrow('Input cannot be null or undefined');
        });
        
        it('should validate input type', () => {
            expect(() => handleSharePointConnection('string'))
                .toThrow('Input must be an object');
        });
        
        it('should process valid input', () => {
            const input = { test: 'data' };
            const result = handleSharePointConnection(input);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });
        
        // Backward compatibility tests
        it('should handle empty objects (backward compatibility)', () => {
            const result = handleSharePointConnection({});
            expect(result.success).toBe(true);
        });
        
        it('should handle arrays (backward compatibility)', () => {
            const input = [1, 2, 3];
            const result = handleSharePointConnection(input);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });
    });
    
    // Test API endpoints
    describe('POST /connect endpoint', () => {
        
        it('should return 400 for null body', async () => {
            const res = await request(app)
                .post('/connect')
                .send(null);
            
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid input');
        });
        
        it('should return 400 for undefined body', async () => {
            const res = await request(app)
                .post('/connect')
                .send();
            
            expect(res.status).toBe(400);
        });
        
        it('should process valid input', async () => {
            const input = { siteUrl: 'test.sharepoint.com' };
            const res = await request(app)
                .post('/connect')
                .send(input);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(input);
        });
        
        // Backward compatibility
        it('should handle legacy array inputs', async () => {
            const input = [{ id: 1 }, { id: 2 }];
            const res = await request(app)
                .post('/connect')
                .send(input);
            
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(input);
        });
    });
    
    // Test middleware
    describe('validateInput middleware', () => {
        let req, res, next;
        
        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };
            next = jest.fn();
        });
        
        it('should reject null input', () => {
            req.body = null;
            validateInput(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });
        
        it('should accept valid input', () => {
            req.body = { valid: true };
            validateInput(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
    
    // Health check
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('OK');
        });
    });
});