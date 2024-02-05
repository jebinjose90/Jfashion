const express = require('express')
const router = express.Router()
const controller = require('../controller/paymentController')
const token = require('../middleware/jwtMiddleware');

router.post('/create/orderId',controller.orderPayment)
router.post('/create/paypalOrderId',controller.paypalOrderPayment)
router.get('/success', controller.successPage);
router.get('/cancel', controller.cancelPage);

module.exports = router;