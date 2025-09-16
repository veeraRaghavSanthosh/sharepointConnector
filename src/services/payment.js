const https = require("https");
const querystring = require("querystring");

class PaymentService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PAYMENT_API_KEY;
    this.timeout = config.timeout || 30000;
  }

  async processPayment(paymentData) {
    if (!paymentData || !paymentData.amount) {
      throw new Error("Invalid payment data");
    }
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (paymentData.amount > 0) {
          resolve({ id: "txn_123", status: "success" });
        } else {
          reject(new Error("Payment failed"));
        }
      }, 100);
    });
  }

  async refundPayment(transactionId, amount = null) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (transactionId) {
          resolve({ id: "ref_456", status: "refunded" });
        } else {
          reject(new Error("Invalid transaction ID"));
        }
      }, 100);
    });
  }

  async validatePaymentData(paymentData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isValid = paymentData && paymentData.amount > 0;
        resolve(isValid);
      }, 50);
    });
  }
}

module.exports = PaymentService;
