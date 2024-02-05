const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const db = require('../model/model.js');
const otpUtils = require('../services/otp_send');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const process = require('process');
const { countryDetails, deliveryStatuses } = require('../../assets/js/data.js');
const { error } = require('console');


const userCollection = db.userCollection;
const addressCollection = db.addressCollection;
const productCollection = db.productCollection;
const categoryCollection = db.categoryCollection;
const cartCollection = db.cartCollection;
const orderCollection = db.orderCollection;
const wishlistCollection = db.wishlistCollection;
const walletCollection = db.walletCollection;
const offerCollection = db.offerCollection;
const couponCollection = db.couponCollection;

const currencySymbol = countryDetails.India.currencySymbol;

const expireTime = '1h'

let referralData = {
  flag: 0,
  userId: ""
}

let coupon_Code = ""
let newEmail = ""

//checking email regex
function isEmailValid(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}


function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

// Function to calculate overall total price
const calculateOverallTotalPrice = async (id) => {
  const userCartTotalPrice = await cartCollection.aggregate([
    { $match: { userid: new ObjectId(id) } },
    { $group: { _id: null, totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } } } }
  ]);
  // Extract totalQuantity from the result (it will be an array with one element)
  const totalPrice = userCartTotalPrice.length > 0 ? userCartTotalPrice[0].totalPrice : 0;

  return totalPrice;
};

module.exports = {

  getLogin: (req, res) => {
    try {
      if (req.cookies.token) {
        res.redirect('/home')
      } else {
        res.render('user/login', { title: 'LOGIN' });
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }

  },

  getSignup: (req, res) => {
    try {
      if (req.cookies.token) {
        res.redirect('/home')
      } else {
        res.render('user/signup', { title: 'SIGNUP' });
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }

  },

  getOtp: (req, res) => {
    try {
      if (req.cookies.token) {
        res.redirect('/home')
      } else {
        res.render('user/otp_validation', { title: 'OTP VALIDATION' });
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }

  },

  getjfashion: async (req, res) => {
    try {
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/jfashion', { title: 'JFASHION', userDetails: userDetails, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getHome: async (req, res) => {
    try {
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/home', { title: 'HOME', userDetails: userDetails, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getProducts: async (req, res) => {
    try {
      const proCollection = await productCollection.find({ soft_delete_flag: false, stock_flag: true }).populate("category_id");
      // console.log("PRO-DATA" + proCollection);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/products', {
        title: 'PRODUCTS',
        productDetails: proCollection,
        currency: currencySymbol,
        userDetails: userDetails,
        cartQuantity: totalQuantity
      });

    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getProductsByCondition: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 4
      const search = req.query.search || ""
      let sort = req.query.sort || 'price'
      let subCategory = req.query.subCategory || "All"

      const subCategoryOptions = await categoryCollection.distinct("sub_category");
      console.log(subCategoryOptions);

      const token = req.cookies.token
      const decoded = jwt.verify(token, process.env.UUID);
      const userId = decoded.userId

      subCategory == "All"
        ? (subCategory = [...subCategoryOptions])
        : (subCategory = req.query.subCategory.split(","))
      req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort])


      let sortBy = {}
      if (sort[1]) {
        sortBy[sort[0]] = sort[1]
      } else {
        sortBy[sort[0]] = "asc"
      }

      console.log('search:', search);
      console.log('subCategory:', subCategory);
      console.log('sortBy:', sortBy);

      const products = await productCollection
        .find({
          product_name: {
            $regex: search,
            $options: "i"
          },
          soft_delete_flag: false,
          stock_flag: true
        })
        .where("sub_category")
        .in(subCategory)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category_id')

      const total = await productCollection.countDocuments({
        product_name: {
          $regex: search,
          $options: "i"
        },
        soft_delete_flag: false,
        stock_flag: true
      })

      const totalPages = Math.ceil(total / limit);
      const currentPage = Math.min(page, totalPages);

      const userCartItems = await cartCollection.find({ userid: userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(userId);
      const renderData = {
        title: 'PRODUCTS',
        totalPages: totalPages,
        currentPage: currentPage,
        limit: limit,
        productDetails: products,
        currency: currencySymbol,
        userDetails: userDetails,
        cartQuantity: totalQuantity
      };

      console.log("TOTAL", total);
      if (total === 0) {
        console.log("TOTAL", total);
        renderData.message = "No Items available";
      }
      res.render('user/products', renderData);
    } catch (error) {
      console.error('Error rendering view:', error);
      res.status(500).json({ error: true, message: "Internal Server Error" })
    }
  },

  getWishlist: async (req, res) => {

    try {
      console.log("USERRRRR_IDDDDDDD", req.query.userId);
      const id = req.query.userId
      const wishCollection = await wishlistCollection.find({ user_id: id, soft_delete_flag: false, stock_flag: true }).populate("category_id");
      console.log("WISHLIST-DATA" + wishCollection);
      const userCartItems = await cartCollection.find({ userid: id });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(id);
      res.render('user/wishlist', {
        title: 'WISHLIST',
        productDetails: wishCollection,
        currency: currencySymbol,
        userDetails: userDetails,
        cartQuantity: totalQuantity
      });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getWishlistByCondition: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 4
      const search = req.query.search || ""
      let sort = req.query.sort || 'price'
      let subCategory = req.query.subCategory || "All"

      const subCategoryOptions = await categoryCollection.distinct("sub_category");
      console.log(subCategoryOptions);

      const token = req.cookies.token
      const decoded = jwt.verify(token, process.env.UUID);
      const userId = decoded.userId

      subCategory == "All"
        ? (subCategory = [...subCategoryOptions])
        : (subCategory = req.query.subCategory.split(","))
      req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort])


      let sortBy = {}
      if (sort[1]) {
        sortBy[sort[0]] = sort[1]
      } else {
        sortBy[sort[0]] = "asc"
      }

      console.log('search:', search);
      console.log('subCategory:', subCategory);
      console.log('sortBy:', sortBy);

      const products = await wishlistCollection
        .find({
          product_name: {
            $regex: search,
            $options: "i"
          },
          soft_delete_flag: false,
          stock_flag: true
        })
        .where("sub_category")
        .in(subCategory)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category_id')

      const total = await wishlistCollection.countDocuments({
        product_name: {
          $regex: search,
          $options: "i"
        },
        soft_delete_flag: false,
        stock_flag: true
      })

      const totalPages = Math.ceil(total / limit);
      const currentPage = Math.min(page, totalPages);

      const userCartItems = await cartCollection.find({ userid: userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(userId);

      const renderData = {
        title: 'WISHLIST',
        totalPages: totalPages,
        currentPage: currentPage,
        limit: limit,
        productDetails: products,
        currency: currencySymbol,
        userDetails: userDetails,
        cartQuantity: totalQuantity
      };

      console.log("renderData", renderData);

      console.log("TOTAL", total);
      if (total === 0) {
        console.log("TOTAL", total);
        renderData.message = "No Items available";
      }

      res.render('user/wishlist', renderData);


    } catch (error) {
      console.error('Error rendering view:', error);
      res.status(500).json({ error: true, message: "Internal Server Error" })
    }
  },

  postAddToWishlist: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.query.userId);
      console.log("PRODUCT_IDDDDDDD", req.query.productId);
      const id = req.query.userId
      const productId = req.query.productId
      const wishCollection = await wishlistCollection.findOne({ user_id: id, wishlist_product_id: productId })

      if (wishCollection == null) {
        const proCollection = await productCollection.findOne({ _id: productId }).populate("category_id");
        console.log("PROCOLLECTION", proCollection);
        const data = {
          user_id: id,
          wishlist_product_id: productId,
          product_name: proCollection.product_name,
          product_id: proCollection.product_id,
          stock_flag: proCollection.stock_flag,
          sku: proCollection.sku,
          price: proCollection.price,
          stocks: proCollection.stocks,
          soft_delete_flag: proCollection.soft_delete_flag,
          image: proCollection.image,
          sub_category: proCollection.sub_category,
          category_id: proCollection.category_id,
        };
        // Insert or update based on the condition
        console.log("ADDING");
        await wishlistCollection.insertMany([data]);
        // Replace this with the actual data processing logic
        const responseData = {
          addToWishlistMessage: 'Item added to the Wishlist'
        };

        res.json(responseData);

      }

    } catch (error) {
      console.error('Error rendering view:', error);
      const responseData = {
        message: error.message
      };
      res.json(responseData);
    }
  },

  postDeleteFromWishlist: async (req, res) => {
    try {
      console.log("PRODUCT_IDDDDDDD", req.query.productId);
      const productId = req.query.productId
      await wishlistCollection.findByIdAndDelete(productId)
        .then(async () => {
          const userDetails = await wishlistCollection.find();
          res.json(userDetails);
        })

    } catch (error) {
      console.error('Error rendering view:', error);
      const responseData = {
        message: error.message
      };
      res.json(responseData);
    }
  },

  getItem: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      console.log("IDDDDD", req.params.product_id);
      // product_id
      // category_id
      const product_id = req.params.product_id
      const proSingleCollection = await productCollection.findOne({ product_id: product_id }).populate("category_id")
      const itemProOffer = await offerCollection.findOne({ product_id: proSingleCollection._id })
      const itemCatOffer = await offerCollection.findOne({ category_id: proSingleCollection.category_id._id })
      if (itemProOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemProOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100);

        // Calculate the discounted price

        const discountedPrice = (originalPrice - discountAmount);
        itemProOffer.ProductDiscountedPrice = discountedPrice,
          itemProOffer.ProductDiscount = discountAmount
        console.log("discountAmount", discountAmount);
      }
      if (itemCatOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemCatOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100);

        // Calculate the discounted price

        const discountedPrice = (originalPrice - discountAmount);
        itemCatOffer.CategoryDiscountedPrice = discountedPrice,
          itemCatOffer.CategoryDiscount = discountAmount
        console.log("discountAmount", discountAmount);
      }
      console.log("itemProOffer", itemProOffer)
      console.log("itemCatOffer", itemCatOffer)
      // console.log("SINGLE_COLLECTION", proSingleCollection)
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/item', {
        title: 'ITEM',
        productDetail: proSingleCollection,
        currency: currencySymbol,
        itemProductOffer: itemProOffer,
        itemCategoryOffer: itemCatOffer,
        userDetails: userDetails,
        cartQuantity: totalQuantity
      });
    } catch (error) {
      res.render('error', error.message);
    }
  },

  getAccount: async (req, res) => {
    try {
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/account', { title: 'ACCOUNT', userDetails: userDetails, cartQuantity: 0 });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getOrderConfirmed: async (req, res) => {
    try {
      const userOrderedItems = await orderCollection.findOne({ userId: new ObjectId(req.userId) });
      console.log("USER DETAILS", userOrderedItems);
      res.render('user/orderConfirmed', { title: 'ORDER CONFIRMED', userOrder: userOrderedItems });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getCancelOrder: async (req, res) => {
    try {
      console.log("PARAMZZZZ______", req.query);
      const { productId, orderId } = req.query;
      const changeStatus = {
        status: deliveryStatuses.Canceled.status,
        color: deliveryStatuses.Canceled.color
      }
      // Update the specific product within the productcollection array
      await orderCollection.findOneAndUpdate(
        {
          "productcollection._id": new ObjectId(productId)
        },
        {
          $set: {
            "productcollection.$.status": changeStatus.status,
            "productcollection.$.status_color": changeStatus.color
          }
        }
      );

      const aggregationResult = await orderCollection.aggregate([
        { $match: { _id: new ObjectId(orderId) } },
        { $unwind: "$productcollection" },
        { $match: { "productcollection._id": new ObjectId(productId) } },
        {
          $project: {
            product_total_price: "$productcollection.product_total_price",
            payment_mode: 1,  // Include payment_mode field
            _id: 0
          }
        }
      ]);

      // Check if aggregationResult is an array or not empty before calling toArray
      const resultArray = Array.isArray(aggregationResult) ? aggregationResult : await aggregationResult.toArray();

      let total_amount = 0
      let payment_mode = ""
      resultArray.forEach(result => {
        total_amount = result.product_total_price
        payment_mode = result.payment_mode
      });

      if (payment_mode == 'net-banking') {
        console.log("AMOUNT_paid back to wallet", total_amount);
        const data = {
          userid: req.userId,
          price: total_amount,
          date: new Date(),
          status: "credited"
        }
        await walletCollection.insertMany([data]);
      }


      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userCartOrderItems = await orderCollection.find();
      const userDetails = await userCollection.findById(req.userId);
      // console.log("userCartOrderItems___________", userCartOrderItems);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/userOrders', { title: 'ORDERS', userDetails: userDetails, cartQuantity: totalQuantity, userOrders: userCartOrderItems });

    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getChangePassword: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/changePassword', { title: 'CHANGE PASSWORD', userDetails: userDetails, cartQuantity: 0 });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getUserAddress: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const addrCollections = await addressCollection.find({ user_id: req.userId }).populate("user_id");
      // console.log("ADDR-DATA" + addrCollections);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/userAddress', { title: 'ADDRESS', userDetails: userDetails, addressCollections: addrCollections, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getUserWallet: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const walletCollections = await walletCollection.find({ userid: req.userId })
      // console.log("ADDR-DATA" + addrCollections);
      const walletBalance = await walletCollection.aggregate([
        {
          $match: {
            userid: new ObjectId(req.userId)
          }
        },
        {
          $group: {
            _id: "$userid",
            totalBalance: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", "debited"] },
                  then: { $multiply: ["$price", -1] },
                  else: "$price"
                }
              }
            }
          }
        }
      ])

      let totalBalance = 0;
      await walletBalance.forEach(result => {
        totalBalance = result.totalBalance;
      });
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/userWallet', { title: 'WALLET', userDetails: userDetails, currency: currencySymbol, walletCollections: walletCollections, totalWalletBalance: totalBalance, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getAddAddress: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/addAddress', { title: 'ADD ADDRESS', userDetails: userDetails, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getUserProfile: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/userProfile', { title: 'PROFILE', userDetails: userDetails, userDetail: userDetails, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getEditProfile: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/editProfile', { title: 'EDIT PROFILE', userDetails: userDetails, userDetail: userDetails, cartQuantity: totalQuantity });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getUserOrders: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userCartOrderItems = await orderCollection.find({ userId: req.userId }).sort({ order_date: -1 });
      const userDetails = await userCollection.findById(req.userId);
      // console.log("userCartOrderItems___________", userCartOrderItems);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/userOrders', { title: 'ORDERS', userDetails: userDetails, cartQuantity: totalQuantity, userOrders: userCartOrderItems });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getDeleteAddress: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const id = req.params.id
      await addressCollection.findByIdAndDelete(id)
        .then(async () => {
          const addrCollections = await addressCollection.find({ user_id: req.userId }).populate("user_id");
          //console.log("ADDR-DATA" + addrCollections);
          const userCartItems = await cartCollection.find({ userid: req.userId });
          // Return all quantities from the user's cart
          const userCartQuantities = userCartItems.map(item => item.quantity);
          const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
          const userDetails = await userCollection.findById(req.userId);
          console.log('User Cart Quantities:', totalQuantity);
          res.render('user/userAddress', { title: 'ADDRESS', userDetails: userDetails, addressCollections: addrCollections, cartQuantity: totalQuantity });
        })
    } catch (error) {
      console.error('Error rendering delete product:', error);
      res.render('error', error.message);
    }
  },

  getEditAddress: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      console.log("PARAMS_IDDDDDDD", req.params.id);
      const addCollection = await addressCollection.findById(req.params.id)
      console.log("addressCollection", addressCollection);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/editAddress', { title: 'EDIT ADDRESS', userDetails: userDetails, cartQuantity: totalQuantity, addressDetail: addCollection });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getRemoveItem: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const id = req.params.id
      await cartCollection.findByIdAndDelete(id)
        .then(async () => {
          const userCartItems = await cartCollection.find({ userid: req.userId });
          // Return all quantities from the user's cart
          const userCartQuantities = userCartItems.map(item => item.quantity);
          const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
          const userCartTotalPrice = await cartCollection.aggregate([
            { $match: { userid: new ObjectId(req.userId) } },
            { $group: { _id: null, totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } } } }
          ]);
          // Extract totalQuantity from the result (it will be an array with one element)
          const totalPrice = userCartTotalPrice.length > 0 ? userCartTotalPrice[0].totalPrice : 0;
          const userDetails = await userCollection.findById(req.userId);
          console.log('User Cart Quantities:', totalPrice);
          console.log('User Cart Quantities:', totalQuantity);
          res.render('user/cart', { title: 'CART', userDetails: userDetails, cartItems: userCartItems, cartQuantity: totalQuantity, currency: currencySymbol, cartTotalAmount: totalPrice });
        })
    } catch (error) {
      console.error('Error rendering delete product:', error);
      res.render('error', error.message);
    }

  },

  getOrderSummary: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const addrCollections = await addressCollection.find({ user_id: req.userId }).populate("user_id");
      console.log("ADDR-DATA" + addrCollections);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      const couponDetails = await couponCollection.find()
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userCartTotalPrice = await cartCollection.aggregate([
        { $match: { userid: new ObjectId(req.userId) } },
        { $group: { _id: null, totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } } } }
      ]);
      const userDetails = await userCollection.findById(req.userId);
      const walletBalance = await walletCollection.aggregate([
        { $match: { userid: new ObjectId(req.userId) } },
        {
          $group: {
            _id: "$userid",
            totalBalance: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", "debited"] },
                  then: { $multiply: ["$price", -1] },
                  else: "$price"
                }
              }
            }
          }
        }
      ])

      let wallet_Balance = 0;
      await walletBalance.forEach(result => {
        wallet_Balance = result.totalBalance;
      });
      res.render('user/orderSummary', {
        title: 'ORDER SUMMERY',
        userDetails: userDetails,
        useraddress: addrCollections,
        currency: currencySymbol,
        usercart: userCartItems,
        totalQuantity: totalQuantity,
        totalPrice: userCartTotalPrice,
        couponDetails: couponDetails,
        walletAmount: wallet_Balance
      });
    } catch (error) {
      res.render('error', error.message);
    }
  },



  getCart: async (req, res) => {
    try {
      console.log("USERRRRR_IDDDDDDD", req.userId);
      const userCartItems = await cartCollection.find({ userid: req.userId });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);

      const userCartTotalPrice = await cartCollection.aggregate([
        { $match: { userid: new ObjectId(req.userId) } },
        { $group: { _id: null, totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } }, discount: { $sum: { $multiply: ["$quantity", "$discount"] } }, totalDiscountPrice: { $sum: { $multiply: ["$quantity", "$discounted_price"] } } } }
      ]);


      // Extract totalQuantity from the result (it will be an array with one element)
      const totalPrice = userCartTotalPrice.length > 0 ? userCartTotalPrice[0].totalPrice : 0;
      const discount = userCartTotalPrice.length > 0 ? userCartTotalPrice[0].discount : 0;
      const totalDiscountedPrice = userCartTotalPrice.length > 0 ? userCartTotalPrice[0].totalDiscountPrice : 0;
      const userDetails = await userCollection.findById(req.userId);
      console.log('User Cart Quantities:', totalPrice);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/cart', {
        title: 'CART',
        userDetails: userDetails,
        cartItems: userCartItems,
        cartQuantity: totalQuantity,
        currency: currencySymbol,
        cartTotalAmount: totalPrice,
        cartDiscount: discount,
        cartTotalDiscountedAmount: totalDiscountedPrice
      });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error', error.message);
    }
  },

  getAddToCart: async (req, res) => {
    console.log("USERRRRR_IDDDDDDD", req.userId);
    console.log("PARAMS & QUERY", req.params, req.query);
    const { _id, username, product_id, product_name, price } = req.params;
    const { quantity, discount_percentage, discount, discounted_price } = req.query;
    try {
      // Check product stock
      const product = await productCollection.findOne({ _id: product_id });
      console.log("STOCK", product.stocks);
      if (!product || product.stocks < quantity) {
        throw new Error('Product is out of stock');
      }

      const filter = {
        userid: _id,
        productid: product_id
      };
      const update = {
        $set: {
          username: username,
          product: product_name,
          price: price,
          discount_percentage: discount_percentage,
          discounted_price: discounted_price,
          discount: discount,
          image: product.image[0],
        },
      };
      const options = {
        upsert: true, // Create a new document if no match is found
        new: true, // Return the updated document
      };

      // Check if the item is already in the cart
      const cartItem = await cartCollection.findOne(filter);

      if (!cartItem) {
        // If cartItem is null, check productCollection stocks against requested quantity
        if (product.stocks < quantity) {
          throw new Error('Adding to cart exceeds product stock');
        }
        // Set quantity for the new item
        update.$set.quantity = parseInt(quantity);
      } else {
        // If cartItem is not null, check if adding the quantity exceeds the product stock
        if ((cartItem.quantity + parseInt(quantity)) > product.stocks) {
          throw new Error('Adding to cart exceeds product stock');
        }
        // Increment quantity for the existing item
        update.$inc = { quantity: parseInt(quantity) };
      }

      // Perform findOneAndUpdate process in cartCollection
      await cartCollection.findOneAndUpdate(filter, update, options);

      // Find all documents in cartCollection for the given userid
      const userCartTotalQuantity = await cartCollection.aggregate([
        { $match: { userid: new ObjectId(_id) } },
        { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
      ]);
      // Extract totalQuantity from the result (it will be an array with one element)
      const totalQuantity = userCartTotalQuantity.length > 0 ? userCartTotalQuantity[0].totalQuantity : 0;
      // console.log('Cart Item:', cartItemResult);
      console.log('User Cart Quantities:', totalQuantity);
      const proSingleCollection = await productCollection.findById(product_id).populate("category_id")
      const userDetails = await userCollection.findById(req.userId);
      const itemProOffer = await offerCollection.findOne({ product_id: proSingleCollection._id })
      const itemCatOffer = await offerCollection.findOne({ category_id: proSingleCollection.category_id._id })
      if (itemProOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemProOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100);

        // Calculate the discounted price
        const discounted_Price = (originalPrice - discountAmount);
        itemProOffer.ProductDiscountedPrice = discounted_Price
        itemProOffer.ProductDiscount = discountAmount
      }
      if (itemCatOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemCatOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100);

        // Calculate the discounted price
        const discounted_Price = (originalPrice - discountAmount);
        itemCatOffer.CategoryDiscountedPrice = discounted_Price
        itemCatOffer.CategoryDiscount = discountAmount
      }
      console.log("itemProOffer", itemProOffer)
      console.log("itemCatOffer", itemCatOffer)
      // console.log(proSingleCollection)
      res.render('user/item', {
        title: 'ITEM',
        productDetail: proSingleCollection,
        currency: currencySymbol,
        itemProductOffer: itemProOffer,
        itemCategoryOffer: itemCatOffer,
        userDetails: userDetails,
        cartQuantity: totalQuantity,
        addToCartMessage: "Item Added"
      });
    } catch (error) {
      console.error('Error adding to cart:', error.message);

      // Render the error message in the EJS template
      const proSingleCollection = await productCollection.findById(product_id).populate("category_id");
      const itemProOffer = await offerCollection.findOne({ product_id: proSingleCollection._id })
      const itemCatOffer = await offerCollection.findOne({ category_id: proSingleCollection.category_id._id })
      if (itemProOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemProOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100).toFixed(2);

        // Calculate the discounted price
        const discounted_Price = (originalPrice - discountAmount).toFixed(2);
        itemProOffer.ProductDiscountedPrice = discounted_Price
      }
      if (itemCatOffer) {
        // Calculate the discount amount
        const originalPrice = parseFloat(proSingleCollection.price);
        const discountPercentage = parseFloat(itemCatOffer.discount);
        const discountAmount = isNaN(originalPrice) || isNaN(discountPercentage)
          ? 0
          : (originalPrice * discountPercentage / 100).toFixed(2);

        // Calculate the discounted price
        const discounted_Price = (originalPrice - discountAmount).toFixed(2);
        itemCatOffer.CategoryDiscountedPrice = discounted_Price
      }
      console.log("itemProOffer", itemProOffer)
      console.log("itemCatOffer", itemCatOffer)
      const totalQuantity = await cartCollection.aggregate([
        { $match: { userid: new ObjectId(_id) } },
        { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
      ]);
      const userDetails = await userCollection.findById(req.userId);
      res.render('user/item', {
        title: 'ITEM',
        productDetail: proSingleCollection,
        currency: currencySymbol,
        itemProductOffer: itemProOffer,
        itemCategoryOffer: itemCatOffer,
        userDetails: userDetails || null,
        cartQuantity: totalQuantity.length > 0 ? totalQuantity[0].totalQuantity : 0,
        errorMessage: error.message // Pass the error message to the template
      });
      return; // Make sure to return to prevent the code below from executing
    }
  },


  postLogin: async (req, res) => {
    try {
      console.log(req.body);
      const { username, password } = req.body;
      if (!username || !password) {
        // Display a custom alert-like message
        res.render('user/login', {
          title: 'LOGIN',
          message: 'All fields are required. Please fill in all the fields.'
        });
      } else {
        console.log(username, password);
        const existingUser = await userCollection.findOne({ username: username });
        console.log(existingUser);
        if (existingUser) {
          const passwordMatch = await bcrypt.compare(password, existingUser.password);
          if (username === existingUser.username && passwordMatch) {
            if (existingUser.status === false) {
              res.render('user/login', {
                title: 'LOGIN',
                message: "Access denied! Administrator permission required."
              });
            } else {
              const token = jwt.sign({ userId: existingUser._id }, process.env.UUID, {
                expiresIn: expireTime,
              });
              res.cookie("token", token, {
                httpOnly: true
              })
              res.redirect('/home');

            }
          } else {
            res.render('user/login', {
              title: 'LOGIN',
              message: 'Login failed. Incorrect username or password!!'
            });
          }
        } else {
          res.render('user/login', {
            title: 'LOGIN',
            message: 'Login failed. Email not found.'
          });
        }
      }
    } catch (error) {
      console.log('error while post:', error);
    }
  },

  postSignup: async (req, res) => {
    try {
      console.log(req.body);
      const filter = {
        $and: [
          { otp: { $exists: true } },
          { $expr: { $eq: [{ $size: { $objectToArray: "$$ROOT" } }, 3] } }
        ]
      };
      const result = await userCollection.deleteMany(filter);
      console.log(`${result.deletedCount} documents deleted.`);
      const { username, password, email, phoneNumber, referralcode } = req.body;
      if (!username || !email || !password || !phoneNumber) {
        // Display a custom alert-like message
        res.render('user/signup', { title: 'SIGNUP', message: 'All fields are required. Please fill in all the fields.' });
      } else {
        if (!isEmailValid(email)) {
          res.render('user/signup',
            {
              title: 'SIGNUP',
              message: 'Signup failed. Invalid username!!'
            });
        } else {
          console.log(username, password);
          const existingUser = await userCollection.findOne({ email: email });
          if (existingUser?.email === email) {
            console.log("FROM DB" + existingUser?.email, existingUser?.user);
            res.render('user/signup',
              {
                title: 'SIGNUP',
                message: 'Signup failed. This Email Or Username already exists.'
              });
          } else {
            if (!isEmailValid(email)) {
              res.render('user/signup',
                {
                  title: 'SIGNUP',
                  message: 'Signup failed. Invalid username or password format!!'
                });
            } else {
              const existingreferralUser = await userCollection.findOne({ referralCode: referralcode });
              console.log("existingreferralUser", existingreferralUser ?? "");
              if (existingreferralUser) {
                referralData.flag = 1
                referralData.userId = existingreferralUser._id
              }
              try {
                // referralcodeFlag
                const hashedPassword = await bcrypt.hash(password, 10);
                const data = {
                  username: username,
                  email: email,
                  password: hashedPassword,
                  phoneNumber: phoneNumber,
                  totalOrders: 0,
                  totalSpent: 0,
                  status: true
                }

                // Pass the req object to sendOTP function
                const result = await otpUtils.sendOTP(email, req);
                newEmail = email;

                const preLoginData = {
                  additionalInfo: data
                };

                // Create the pre-login token
                const preLoginToken = jwt.sign(preLoginData, process.env.UUID, {
                  expiresIn: expireTime,
                });

                res.cookie("preLoginToken", preLoginToken, {
                  httpOnly: true
                })

                res.render('user/otp_validation', { title: 'OTP VALIDATION' });
                console.log('OTP sent successfully', result.otp);
                console.log("DATA" + data);
              } catch (error) {
                console.log('error while post:', error);
                res.render('user/signup',
                  {
                    title: 'SIGNUP',
                    message: 'Signup failed. Error occured while sending otp'
                  });
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('error while post:', error);
    }
  },

  getResendOTP: async (req, res) => {
    try {
      const enteredmail = newEmail;

      if (!enteredmail) {
        console.error("Error: No recipients defined");
        return res
          .status(500)
          .json({ message: "Error: No recipients defined" });
      }

      // Pass the req object to sendOTP function
      const result = await otpUtils.sendOTP(enteredmail, req);
      console.log('OTP sent successfully', result.otp);

      return res
        .status(200)
        .render("otppage", { message: "OTP resent successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error resending OTP" });
    }
  },


  postOtpValidation: async (req, res) => {
    try {
      console.log("BODY", req.body);
      const enteredOTP = req.body.otp;
      console.log('ENTERED OTP', enteredOTP);
      if (!enteredOTP) {
        res.render('user/otp_validation', {
          title: 'OTP VALIDATION',
          message: 'Signup failed. Please enter a valid OTP.'
        });
        return; // Exit the function if OTPs are missing
      } else {
        const newUser = await userCollection.findOne({ otp: enteredOTP });
        if (newUser?.otp !== enteredOTP) {
          res.render('user/otp_validation', {
            title: 'OTP VALIDATION',
            message: 'Signup failed. Incorrect OTP.'
          });
        } else {
          console.log("referralData.flag", referralData.flag);
          if (referralData.flag == 1) {
            const newUserData = {
              userid: newUser._id,
              price: 50,
              date: new Date(),
              status: "credited"
            }
            const existingUserData = {
              userid: referralData.userId,
              price: 100,
              date: new Date(),
              status: "credited"
            }
            await walletCollection.insertMany([newUserData, existingUserData]);

          }


          let userData = req.additionalInfo;
          const randomString = generateRandomString(10);
          userData.referralCode = randomString
          // Access the inserted ID

          const token = jwt.sign({ userId: newUser._id }, process.env.UUID, {
            expiresIn: expireTime,
          });
          res.cookie("token", token, {
            httpOnly: true
          })

          console.log("USER DATA", userData);
          await userCollection.updateOne(
            { _id: newUser._id }, // Filter based on the user found with OTP
            { $set: userData } // Set the new data into a field (objectIdField in this example)
          );
          console.log('Insert successful');
          res.redirect('/home');
        }
      }
    } catch (error) {
      console.log('Error comparing OTPs:', error);
      res.render('user/otp_validation', {
        title: 'OTP VALIDATION',
        message: 'Signup failed. Error comparing OTPs.'
      });
    }
  },

  postEditProfile: async (req, res) => {
    try {
      console.log("REQ", req.body, req.body.username, req.body.email, req.body.firstName, req.body.lastName, req.body.phoneNumber, req.body.gender)
      const { username, email, _id, firstName, lastName, phoneNumber, gender } = req.body
      if (!username || !email || !firstName || !lastName || !phoneNumber || !gender) {
        const userDetails = await userCollection.findById(_id);
        const userCartItems = await cartCollection.find({ userid: _id });
        // Return all quantities from the user's cart
        const userCartQuantities = userCartItems.map(item => item.quantity);
        const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
        console.log('User Cart Quantities:', totalQuantity);
        res.render('user/editProfile', {
          title: 'EDIT PROFILE',
          userDetails: userDetails,
          userDetail: userDetails,
          cartQuantity: totalQuantity,
          message: 'All fields are required. Please fill in all the fields.'
        });

      } else {
        const updateData = {
          username: username,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          gender: gender
        };
        // Update the product based on the condition
        await userCollection.findOneAndUpdate({ _id: _id }, updateData);
        console.log("UPDATING");
        res.redirect('userProfile');
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const userDetails = await userCollection.findById(_id);
      const userCartItems = await cartCollection.find({ userid: _id });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/editProfile', {
        title: 'EDIT PROFILE',
        userDetails: userDetails,
        userDetail: userDetails,
        cartQuantity: totalQuantity,
        message: 'Add product failed. An error occurred while inserting data.'
      });
    }
  },

  postChangePassword: async (req, res) => {
    try {
      console.log(req.body);
      const user_id = req.body.user_id;
      const old_password = req.body.old_password;
      const new_password = req.body.new_password;
      const reenter_password = req.body.reenter_password;
      if (!user_id || !old_password || !new_password || !reenter_password) {
        throw new Error('All fields are required. Please fill in all the fields.');
      } else if (new_password !== reenter_password) {
        throw new Error('Re-Entered Password does not match.');
      } else {
        console.log("user_id",);
        const existingUser = await userCollection.findById(user_id);
        console.log(existingUser);
        if (existingUser) {
          const passwordMatch = await bcrypt.compare(old_password, existingUser.password);
          if (passwordMatch) {
            const oldAndNewPasswordMatch = await bcrypt.compare(new_password, existingUser.password);
            if (!oldAndNewPasswordMatch) {
              const hashedPassword = await bcrypt.hash(new_password, 10);
              const filter = { _id: new ObjectId(user_id) };
              const update = { $set: { password: hashedPassword } }
              await userCollection.updateOne(filter, update);

              const userCartItems = await cartCollection.find({ userid: user_id });
              // Return all quantities from the user's cart
              const userCartQuantities = userCartItems.map(item => item.quantity);
              const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
              const userDetails = await userCollection.findById(user_id);
              console.log('User Cart Quantities:', totalQuantity);
              res.render('user/changePassword',
                {
                  title: 'CHANGE PASSWORD',
                  userDetails: userDetails,
                  cartQuantity: 0,
                  message: "PASSWORD CHANGED"
                });

            } else {
              throw new Error('Old and New Paswords are same.');
            }
          } else {
            throw new Error('Incorrect Password');
          }
        } else {
          throw new Error('No userid found');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      const userCartItems = await cartCollection.find({ userid: user_id });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(user_id);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/changePassword',
        {
          title: 'CHANGE PASSWORD',
          userDetails: userDetails,
          cartQuantity: 0,
          errorMessage: error.message
        });
    }
  },

  postAddAddress: async (req, res) => {
    try {
      console.log("REQ", req.body, req.body.firstName, req.body.lastName, req.body._id, req.body.address, req.body.street, req.body.city, req.body.state, req.body.pincode)
      const { _id, firstName, lastName, address, street, city, state, pincode } = req.body
      if (!_id || !firstName || !lastName ||!address || !street || !city || !state || !pincode) {
        console.log("in ELSE");
        const userCartItems = await cartCollection.find({ userid: _id });
        // Return all quantities from the user's cart
        const userCartQuantities = userCartItems.map(item => item.quantity);
        const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
        const userDetails = await userCollection.findById(_id);
        console.log('User Cart Quantities:', totalQuantity);

        res.render('user/addAddress', {
          title: 'ADD ADDRESS',
          userDetails: userDetails,
          cartQuantity: totalQuantity,
          message: 'All fields are required. Please fill in all the fields.'
        });
      } else {
        const addData = {
          address: address,
          street: street,
          city: city,
          state: state,
          pin: pincode,
          user_id: _id
        };
        const userData = {
          firstName: firstName,
          lastName: lastName
          
        };

        try {
          await userCollection.findOneAndUpdate({ _id: _id }, userData);
          await addressCollection.insertMany([addData]);
          console.log("ADDING ADDRESS");
          res.redirect('userAddress');
        } catch (error) {
          console.log('Error while inserting data:', error);
          const userCartItems = await cartCollection.find({ userid: _id });
          // Return all quantities from the user's cart
          const userCartQuantities = userCartItems.map(item => item.quantity);
          const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
          const userDetails = await userCollection.findById(_id);
          console.log('User Cart Quantities:', totalQuantity);

          res.render('user/addAddress', {
            title: 'ADD ADDRESS',
            userDetails: userDetails,
            cartQuantity: totalQuantity,
            message: 'Add Address failed. Error while inserting data.'
          });
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const userCartItems = await cartCollection.find({ userid: _id });
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(_id);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/addAddress', {
        title: 'ADD ADDRESS',
        userDetails: userDetails,
        cartQuantity: totalQuantity,
        message: 'Add address failed. An error occurred while inserting data.'
      })
    }
  },

  postEditAddress: async (req, res) => {
    try {
      console.log("REQ", req.body, req.body._id, req.body.address, req.body.street, req.body.city, req.body.state, req.body.pincode)
      const { user_id, _id, address, street, city, state, pincode } = req.body
      if (!user_id || !_id || !address || !street || !city || !state || !pincode) {
        console.log("in ELSE");
        const addCollection = await addressCollection.findById(_id)
        console.log("addressCollection", addressCollection);
        const userCartItems = await cartCollection.find({ userid: user_id });
        // Return all quantities from the user's cart
        const userCartQuantities = userCartItems.map(item => item.quantity);
        const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
        const userDetails = await userCollection.findById(user_id);
        console.log('User Cart Quantities:', totalQuantity);

        res.render('user/addAddress', {
          title: 'EDIT ADDRESS',
          userDetails: userDetails,
          cartQuantity: totalQuantity,
          addressDetail: addCollection,
          message: 'All fields are required. Please fill in all the fields.'
        });
      } else {
        const addData = {
          address: address,
          street: street,
          city: city,
          state: state,
          pin: pincode
        };
        try {
          await addressCollection.findOneAndUpdate({ _id: _id }, addData);
          console.log("ADDING ADDRESS");
          res.redirect('userAddress');
        } catch (error) {
          console.log('Error while inserting data:', error);
          const addCollection = await addressCollection.findById(_id)
          const userCartItems = await cartCollection.find({ userid: user_id });
          // Return all quantities from the user's cart
          const userCartQuantities = userCartItems.map(item => item.quantity);
          const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
          const userDetails = await userCollection.findById(user_id);
          console.log('User Cart Quantities:', totalQuantity);

          res.render('user/addAddress', {
            title: 'EDIT ADDRESS',
            userDetails: userDetails,
            cartQuantity: totalQuantity,
            addressDetail: addCollection,
            message: 'Signup failed. Error while inserting data.'
          });
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const userCartItems = await cartCollection.find({ userid: user_id });
      const addCollection = await addressCollection.findById(_id)
      // Return all quantities from the user's cart
      const userCartQuantities = userCartItems.map(item => item.quantity);
      const totalQuantity = userCartQuantities.reduce((acc, value) => acc + value, 0);
      const userDetails = await userCollection.findById(user_id);
      console.log('User Cart Quantities:', totalQuantity);
      res.render('user/addAddress', {
        title: 'EDIT ADDRESS',
        userDetails: userDetails,
        cartQuantity: totalQuantity,
        addressDetail: addCollection,
        message: 'Add address failed. An error occurred while inserting data.'
      })
    }
  },

  postIncreaseQuantity: async (req, res) => {
    try {
      const pid = req.params.id;
      console.log("id is", pid);

      // Find the cart item
      const item = await cartCollection.findOne({ _id: pid });
      console.log("CART", item);
      // Check if the item exists
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Get product information
      const productId = item.productid;
      const customerId = item.customerid;
      const productStock = (await productCollection.findById((productId))).stocks;
      console.log("productStock", productStock);
      // Check if the new quantity exceeds the available stock
      const newQuantity = item.quantity + 1;
      if (newQuantity > productStock) {
        return res.status(400).json({
          success: false,
          message: 'Quantity exceeds stock.'
        });
      } else {
        // Calculate new price
        const newPrice = item.price * newQuantity;
        const newDiscountPrice = item.discount_amount * newQuantity;

        // Update the quantity in the database
        const updateResult = await cartCollection.updateOne(
          { _id: pid },
          { $set: { quantity: newQuantity } }
        );

        if (updateResult.modifiedCount === 1) {
          // The update was successful
          // Calculate the overall total price
          const overallTotalPrice = await calculateOverallTotalPrice(customerId);

          // Send the response including the newOverallTotalPrice
          return res.status(200).json({
            success: true,
            newQuantity,
            newPrice,
            newDiscountPrice,
            newOverallTotalPrice: overallTotalPrice,
            message: 'Quantity increased successfully'
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to update quantity in the database'
          });
        }
      }
    } catch (error) {
      console.error('Error in inccart:', error);

      // Handle specific errors
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item ID'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message
      });
    }
  },

  postDecreaseQuantity: async (req, res) => {
    try {
      const pid = req.params.id;
      const item = await cartCollection.findOne({ _id: pid });
      const customerId = item.customerid;
      const newQuantity = Math.max(item.quantity - 1, 1);
      const newPrice = item.price * newQuantity;
      const newDiscountPrice = item.discount_amount * newQuantity;

      // Update the quantity in the database
      await cartCollection.updateOne(
        { _id: pid },
        { $set: { quantity: newQuantity } }
      );

      // Calculate the overall total price (sum of prices for all items in the cart)
      const overallTotalPrice = await calculateOverallTotalPrice(customerId);

      // Send the response including the newOverallTotalPrice
      res.status(200).json({
        success: true,
        newQuantity,
        newPrice,
        newDiscountPrice,
        newOverallTotalPrice: overallTotalPrice,
        message: 'Quantity decreased successfully'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error decreasing quantity',
        error: error.message
      });
    }
  },

  postOrderConfirmed: async (req, res) => {
    try {
      console.log("ORDER_CONFIRMED__________________", req.body);
      const user_id = req.body.user_id;
      const coupon_id = req.body.coupon_id;
      console.log("user_id", user_id);
      const usercart = await cartCollection.find({ userid: user_id });
      const totalCount = await cartCollection.countDocuments({ userid: user_id });
      console.log("usercart", usercart);
      const userAddress = await addressCollection.findOne({ _id: new ObjectId(req.body.selectedAddress) });
      console.log("userAddress", userAddress);
      const userDetails = await userCollection.findOne({ _id: new ObjectId(user_id) });
      console.log("CART DETAILS____", usercart);
      const couponDetails = await couponCollection.findOne({ _id: new ObjectId(coupon_id) })

      if (!userDetails.firstName && !userDetails.lastName) {
        throw new Error('Enter First Name and Last Name');
      } else {
        console.log("ADDRESS", userAddress.street);
        const selectedaddress = {
          address: userAddress.address,
          street: userAddress.street,
          city: userAddress.city,
          state: userAddress.state,
          pin: userAddress.pin
        }
        console.log("ADDRESS", selectedaddress);
        const today = new Date();
        const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const todaydate = today.toLocaleString('en-US', options);
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + 4);
        const deliveryDateString = deliveryDate.toLocaleString('en-US', options);
        console.log('req dara', req.body);

        // Create an array to store cart items
        const productCollectionArray = [];
        let totalAmount = userDetails.totalSpent;
        let orderTotalAmount = 0;
        for (const item of usercart) {
          const productData = {
            productid: item.productid,
            product_name: item.product,
            price: (item.discounted_price === 0 ? item.price : item.discounted_price),
            quantity: item.quantity,
            image: item.image,
            status: deliveryStatuses.Pending.status,
            status_color: deliveryStatuses.Pending.color,
            product_total_price: (item.discounted_price === 0 ? item.price * item.quantity : item.discounted_price * item.quantity)
          };
          let productAmount = (item.discounted_price === 0 ? item.price * item.quantity : item.discounted_price * item.quantity)
          totalAmount += productAmount
          orderTotalAmount += productAmount
          console.log("productData_____________", productData);
          productCollectionArray.push(productData);

          // Update product stock
          await productCollection.updateOne(
            { _id: item.productid },
            { $inc: { stocks: -item.quantity } }
          );
        }

        if (couponDetails) {
          let discount_each = (couponDetails.discount / 100) * orderTotalAmount / totalCount;
          productCollectionArray.forEach((element, index, array) => {
            let individual_discount = element.product_total_price - discount_each;
            let discounted_amount = Math.round(individual_discount);
            array[index].product_total_price = discounted_amount;
          });

          let discount = (couponDetails.discount * orderTotalAmount) / 100;
          orderTotalAmount -= discount;
        }

        console.log("TOTAL_This User Spent PRICE", totalAmount);
        console.log("ORDER_TOTAL_PRICE", orderTotalAmount);


        const orderData = {
          userId: user_id,
          username: userDetails.username, // Assuming username is the same for all cart items
          full_name: userDetails.firstName + ' ' + userDetails.lastName,
          phoneNumber: userDetails.phoneNumber,
          productcollection: productCollectionArray,
          order_date: todaydate,
          delivery_date: deliveryDateString,
          address: selectedaddress,
          payment_mode: req.body.paymentMode
        };

        if (req.body.paymentMode === "Wallet") {
          const walletData = {
            userid: user_id,
            price: orderTotalAmount,
            date: new Date(),
            status: "debited"
          }
          await walletCollection.insertMany([walletData]);
        }

        console.log('ORDERED values are', orderData);
        // Create a single order document with an array of cart items
        await orderCollection.create(orderData);

        let orders = userDetails.totalOrders;
        orders += 1;
        const filter = { _id: new ObjectId(user_id) };
        const update = { $set: { totalOrders: orders, totalSpent: totalAmount } }
        await userCollection.updateOne(filter, update);

        // Delete user's cart
        await cartCollection.deleteMany({ userid: user_id });

        res.redirect('/orderConfirmed')
        // Update product stock
        await productCollection.updateMany(
          { stocks: { $lte: 0 } },
          { $set: { stock_flag: false } }
        );
      }
    } catch (error) {
      console.log(error);
    }
  },

  postApplyCoupon: async (req, res) => {
    try {
      console.log("APPLYCOUPON", req.query);
      let currentDate = new Date();
      const couponcode = req.query.couponCode;
      const totalPrice = req.query.totalPrice;

      if (coupon_Code && couponcode == coupon_Code) {
        return res.status(400).json({
          success: false,
          message: "Already applied Cant apply again !!",
        });
      }

      const coupondetails = await couponCollection.findOne({ coupon_code: { $regex: new RegExp(couponcode, "i") }, });

      console.log("coupondetails.coupon_code", coupondetails.coupon_code);
      console.log("couponcode", couponcode);
      if (coupondetails && coupondetails.coupon_code == couponcode && coupondetails.minimum_amount <= totalPrice) {
        if (
          coupondetails && coupondetails.expire_date > currentDate && couponcode == coupondetails.coupon_code) {
          const discountAmount = coupondetails.discount;
          const amountLimit = coupondetails.minimum_amount;
          const coup_id = coupondetails._id;
          coupon_Code = coupondetails.coupon_code;

          return res.json({
            success: true,
            discount: discountAmount,
            couponId: coup_id,
            amount: amountLimit,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Coupon is expired",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Entered Coupon is Invalid",
        });
      }
    } catch (error) {
      console.error("Error in couponcheck:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during coupon validation.",
      });
    }
  },

  postRemoveCoupon: (req, res) => {
    try {
      console.log("entered remove coupon");
      console.log("couponCode", coupon_Code);
      if (coupon_Code) {
        console.log("Coupon before removal:", coupon_Code);
        coupon_Code = null; // Assuming you're using Express session
        console.log("Couponafter removal:", coupon_Code);
        return res.json({
          success: true,
          message: "Coupon removed successfully",
        });
      } else {
        console.log("No coupon applied");
        return res.status(400).json({
          success: false,
          message: "No coupon applied",
        });
      }
    } catch (error) {
      console.error("Error removing coupon:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during coupon removal.",
      });
    }
  },

  getLogout: (req, res) => {
    try {
      // Clear all cookies
      const cookies = req.cookies;
      for (const cookieName in cookies) {
        res.clearCookie(cookieName);
      }
      res.redirect('/');
    } catch (error) {
      console.error("Error while logouting:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during coupon removal.",
      });
    }
  }
}