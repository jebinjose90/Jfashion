const express = require('express')
const router = express.Router()
const controller = require('../controller/userController')
const token = require('../middleware/jwtMiddleware');

router.get('/', controller.getjfashion);
router.get('/login', controller.getLogin);
router.get('/signup', controller.getSignup);
router.get('/home', token.verifyToken, controller.getHome);
router.get('/products', token.verifyToken, controller.getProducts);
router.get('/productsByCondition', token.verifyToken, controller.getProductsByCondition)
router.get('/wishlist', token.verifyToken, controller.getWishlist);
router.get('/wishlistByCondition', token.verifyToken, controller.getWishlistByCondition)
router.get('/account', token.verifyToken, controller.getAccount);
router.get('/changePassword', token.verifyToken, controller.getChangePassword);
router.get('/userAddress', token.verifyToken, controller.getUserAddress);
router.get('/userWallet', token.verifyToken, controller.getUserWallet);
router.get('/addAddress', token.verifyToken, controller.getAddAddress);
router.get('/deleteAddress/:id', token.verifyToken, controller.getDeleteAddress);
router.get('/editAddress/:id', token.verifyToken, controller.getEditAddress);
router.get('/userOrders', token.verifyToken, controller.getUserOrders);
router.get('/userProfile', token.verifyToken, controller.getUserProfile);
router.get('/editProfile', token.verifyToken, controller.getEditProfile);
router.get('/item/:product_id/:product_id_id/:category_id', token.verifyToken, controller.getItem);
router.get('/cart', token.verifyToken, controller.getCart);
router.get('/addToCart/:_id/:username/:product_id/:product_name/:price', token.verifyToken, controller.getAddToCart);
router.get('/removeItem/:id', token.verifyToken,controller.getRemoveItem);
router.get('/orderSummary', token.verifyToken ,controller.getOrderSummary);
router.get('/orderConfirmed', token.verifyToken ,controller.getOrderConfirmed);
router.get('/cancelOrder', token.verifyToken ,controller.getCancelOrder);
router.get('/logout', controller.getLogout);
router.get('/resendOTP',token.verifyPreloginToken, controller.getResendOTP);
router.post('/deleteFromWishlist', controller.postDeleteFromWishlist)
router.post('/changePassword', controller.postChangePassword)
router.post('/orderConfirmed', controller.postOrderConfirmed)
router.post('/increaseCart/:id', controller.postIncreaseQuantity)
router.post('/decreaseCart/:id', controller.postDecreaseQuantity)
router.post('/addToWishlist', token.verifyToken, controller.postAddToWishlist);
router.post('/login', controller.postLogin);
router.post('/signup', controller.postSignup);
router.post('/otp_validation',token.verifyPreloginToken, controller.postOtpValidation);
router.post('/editProfile', controller.postEditProfile);
router.post('/applyCoupon', token.verifyToken, controller.postApplyCoupon);
router.post('/removeCoupon', token.verifyToken, controller.postRemoveCoupon);
router.post('/addAddress', controller.postAddAddress);
router.post('/editAddress', controller.postEditAddress);

module.exports = router;