const { body, validationResult } = require('express-validator');

// Order validation rules
const orderValidationRules = () => {
  return [
    // Order ID validation
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Order ID must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Order ID can only contain alphanumeric characters, hyphens, and underscores'),

    // Customer validation
    body('customerId')
      .notEmpty()
      .withMessage('Customer ID is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Customer ID must be between 1 and 50 characters'),

    body('customerName')
      .notEmpty()
      .withMessage('Customer name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Customer name must be between 2 and 100 characters')
      .trim(),

    body('customerEmail')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    // Items validation
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),

    body('items.*.productId')
      .notEmpty()
      .withMessage('Product ID is required for each item'),

    body('items.*.productName')
      .notEmpty()
      .withMessage('Product name is required for each item')
      .isLength({ min: 1, max: 200 })
      .withMessage('Product name must be between 1 and 200 characters'),

    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),

    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),

    // Currency validation
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
      .withMessage('Currency must be one of: USD, EUR, GBP, CAD, AUD'),

    // Status validation
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'),

    // Shipping address validation
    body('shippingAddress.street')
      .notEmpty()
      .withMessage('Street address is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Street address must be between 5 and 200 characters'),

    body('shippingAddress.city')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),

    body('shippingAddress.state')
      .notEmpty()
      .withMessage('State is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),

    body('shippingAddress.zipCode')
      .notEmpty()
      .withMessage('Zip code is required')
      .matches(/^[0-9A-Za-z\s-]{3,10}$/)
      .withMessage('Please provide a valid zip code'),

    body('shippingAddress.country')
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),

    // Optional fields validation
    body('deliveryDate')
      .optional()
      .isISO8601()
      .withMessage('Delivery date must be a valid date'),

    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ];
};

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  orderValidationRules,
  handleValidationErrors
};