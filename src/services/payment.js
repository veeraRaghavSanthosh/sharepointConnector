// Payment Service - Async/Await implementation
const https = require('https');
const querystring = require('querystring');

/**
 * Make HTTPS request and return a promise
 * @param {Object} options - HTTPS request options
 * @param {string} postData - Data to send with POST requests
 * @returns {Promise<Object>} - Promise that resolves with response data
 */
function makeHttpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error('Invalid response from payment processor'));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

/**
 * Process payment using async/await pattern
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - Promise that resolves with payment result
 */
async function processPayment(paymentData) {
    // Validate payment data
    if (!paymentData || !paymentData.amount || !paymentData.cardNumber) {
        throw new Error('Invalid payment data');
    }

    // Prepare API call to payment processor
    const postData = querystring.stringify({
        amount: paymentData.amount,
        cardNumber: paymentData.cardNumber,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv
    });

    const options = {
        hostname: 'api.paymentprocessor.com',
        port: 443,
        path: '/v1/payments',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        const result = await makeHttpsRequest(options, postData);
        
        if (result.success) {
            return {
                transactionId: result.transactionId,
                status: 'completed',
                amount: paymentData.amount
            };
        } else {
            throw new Error(`Payment failed: ${result.error}`);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Refund payment using async/await pattern
 * @param {string} transactionId - Transaction ID to refund
 * @param {number} amount - Amount to refund
 * @returns {Promise<Object>} - Promise that resolves with refund result
 */
async function refundPayment(transactionId, amount) {
    if (!transactionId || !amount) {
        throw new Error('Transaction ID and amount are required');
    }

    const postData = querystring.stringify({
        transactionId: transactionId,
        amount: amount
    });

    const options = {
        hostname: 'api.paymentprocessor.com',
        port: 443,
        path: '/v1/refunds',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        const result = await makeHttpsRequest(options, postData);
        
        if (result.success) {
            return {
                refundId: result.refundId,
                status: 'refunded',
                amount: amount
            };
        } else {
            throw new Error(`Refund failed: ${result.error}`);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Get payment status using async/await pattern
 * @param {string} transactionId - Transaction ID to check
 * @returns {Promise<Object>} - Promise that resolves with payment status
 */
async function getPaymentStatus(transactionId) {
    if (!transactionId) {
        throw new Error('Transaction ID is required');
    }

    const options = {
        hostname: 'api.paymentprocessor.com',
        port: 443,
        path: \`/v1/payments/\${transactionId}\`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const result = await makeHttpsRequest(options);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    processPayment,
    refundPayment,
    getPaymentStatus
};
