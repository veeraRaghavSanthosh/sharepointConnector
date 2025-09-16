const PaymentService = require("../../src/services/payment");

describe("PaymentService", () => {
  let paymentService;

  beforeEach(() => {
    paymentService = new PaymentService({ apiKey: "test-key" });
  });

  describe("processPayment", () => {
    it("should process valid payment", (done) => {
      const paymentData = { amount: 100, cardNumber: "1234567890123456" };
      
      paymentService.processPayment(paymentData, (err, result) => {
        expect(err).toBe(null);
        expect(result).toEqual({ id: "txn_123", status: "success" });
        done();
      });
    });

    it("should reject invalid payment data", (done) => {
      paymentService.processPayment(null, (err, result) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid payment data");
        done();
      });
    });

    it("should reject zero amount", (done) => {
      const paymentData = { amount: 0 };
      
      paymentService.processPayment(paymentData, (err, result) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Payment failed");
        done();
      });
    });
  });

  describe("refundPayment", () => {
    it("should process refund with transaction ID", (done) => {
      paymentService.refundPayment("txn_123", (err, result) => {
        expect(err).toBe(null);
        expect(result).toEqual({ id: "ref_456", status: "refunded" });
        done();
      });
    });

    it("should process refund with amount", (done) => {
      paymentService.refundPayment("txn_123", 50, (err, result) => {
        expect(err).toBe(null);
        expect(result).toEqual({ id: "ref_456", status: "refunded" });
        done();
      });
    });

    it("should reject empty transaction ID", (done) => {
      paymentService.refundPayment("", (err, result) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Invalid transaction ID");
        done();
      });
    });
  });

  describe("validatePaymentData", () => {
    it("should validate correct payment data", (done) => {
      const paymentData = { amount: 100 };
      
      paymentService.validatePaymentData(paymentData, (err, isValid) => {
        expect(err).toBe(null);
        expect(isValid).toBe(true);
        done();
      });
    });

    it("should reject invalid payment data", (done) => {
      const paymentData = { amount: -100 };
      
      paymentService.validatePaymentData(paymentData, (err, isValid) => {
        expect(err).toBe(null);
        expect(isValid).toBe(false);
        done();
      });
    });
  });
});
