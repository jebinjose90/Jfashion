const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { stringify } = require('querystring');

const userCollectionName = "userDb";
const adminCollectionName = "adminDb";
const categoryCollectionName = "categoryDb";
const productCollectionName = "productDb";
const addressCollectionName = "addressDb";
const cartCollectionName = "cartDb";
const orderCollectionName = "orderDb";
const wishlistCollectionName = "wishlistDb";
const walletCollectionName = "walletDb";
const couponCollectionName = "couponDb";
const offerCollectionName = "offerDb";


var userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  phoneNumber: {
    type: Number
  },
  totalOrders: {
    type: Number
  },
  totalSpent: {
    type: Number
  },
  gender: {
    type: String
  },
  status: {
    type: Boolean
  },
  otp: {
    type: String
  },
  referralCode: {
    type: String
  }
}, {
  usercollection: userCollectionName
});

var addressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: false
  },
  street: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  state: {
    type: String,
    required: false
  },
  pin: {
    type: Number,
    required: false
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  }
},
  {
    addressCollection: addressCollectionName
  });

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  }
}, {
  adminCollection: adminCollectionName
});

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  category_id: {
    type: String,
    required: true,
    unique: true
  },
  sub_category: {
    type: String,
    required: true
  },
  sub_category_id: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  }
}, {
  categoryCollection: categoryCollectionName
});

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
  },
  product_id: {
    type: String,
    required: true,
  },
  stock_flag: {
    type: Boolean,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stocks: {
    type: Number,
    required: true
  },
  soft_delete_flag: {
    type: Boolean,
    required: true
  },
  image: {
    type: [String],
    required: false
  },
  sub_category: {
    type: String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: categoryCollectionName,
    required: true
  }
}, {
  productCollection: productCollectionName
});

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  },
  product_name: {
    type: String,
    required: true,
  },
  product_id: {
    type: String,
    required: true,
  },
  wishlist_product_id: {
    type: String,
    required: true,
  },
  stock_flag: {
    type: Boolean,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stocks: {
    type: Number,
    required: true
  },
  soft_delete_flag: {
    type: Boolean,
    required: true
  },
  image: {
    type: [String],
    required: false
  },
  sub_category: {
    type: String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: categoryCollectionName,
    required: true
  }
}, {
  wishlistCollection: wishlistCollectionName
});

const cartSchema = new mongoose.Schema({
  userid: {
    type: ObjectId
  },
  username: {
    type: String
  },
  productid: {
    type: ObjectId
  },
  product: {
    type: String
  },
  discount_percentage: {
    type: Number
  },
  discounted_price: {
    type: Number
  },
  discount: {
    type: Number
  },
  price: {
    type: Number
  },
  quantity: {
    type: Number
  },
  image: [String]

}, {
  cartCollection: cartCollectionName
});


const orderSchema = new mongoose.Schema({
  userId: {
    type: ObjectId
  },
  username: {
    type: String
  },
  full_name: {
    type: String
  },
  productcollection: [
    {
      productId: {
        type: ObjectId
      },
      product_name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      image: {
        type: [String],
        required: false
      },
      status: {
        type: String
      }, 
      status_color: {
        type: String
      },
      product_total_price: {
        type: Number
      }
    }
  ],
  order_date: {
    type: Date
  },
  delivery_date: {
    type: Date
  },
  address: {
    type: Object
  },
  payment_mode: {
    type: String
  },
  phoneNumber: {
    type: Number
  }

}, {
  orderCollection: orderCollectionName
});

const walletSchema = new mongoose.Schema({
  userid: {
    type: ObjectId
  },
  price: {
    type: Number
  },
  date: {
    type: Date
  },
  status: {
    type: String
  }

}, {
  walletCollection: walletCollectionName
});

const couponSchema = new mongoose.Schema({
  coupon_code: {
    type: String
  },
  discount: {
    type: Number
  },
  expire_date: {
    type: Date
  },
  minimum_amount: {
    type: Number
  }
}, {
  couponCollection: couponCollectionName
});

const offerSchema = new mongoose.Schema({
  applicable_product: {
    type: String
  },
  product_id: {
    type: ObjectId
  },
  applicable_category: {
    type: String
  },
  category_id: {
    type: ObjectId
  },
  discount: {
    type: Number
  },
  expire_date: {
    type: Date
  }

}, {
  offerCollection: offerCollectionName
});


const user_collection = new mongoose.model(userCollectionName, userSchema)
const admin_Collection = new mongoose.model(adminCollectionName, adminSchema)
const category_Collection = new mongoose.model(categoryCollectionName, categorySchema)
const product_Collection = new mongoose.model(productCollectionName, productSchema)
const address_Collection = new mongoose.model(addressCollectionName, addressSchema)
const cart_Collection = new mongoose.model(cartCollectionName, cartSchema)
const order_Collection = new mongoose.model(orderCollectionName, orderSchema)
const wishlist_Collection = new mongoose.model(wishlistCollectionName, wishlistSchema)
const wallet_Collection = new mongoose.model(walletCollectionName, walletSchema)
const coupon_Collection = new mongoose.model(couponCollectionName, couponSchema)
const offer_Collection = new mongoose.model(offerCollectionName, offerSchema)

module.exports = {
  userCollection: user_collection,
  adminCollection: admin_Collection,
  categoryCollection: category_Collection,
  productCollection: product_Collection,
  addressCollection: address_Collection,
  cartCollection: cart_Collection,
  orderCollection: order_Collection,
  wishlistCollection: wishlist_Collection,
  walletCollection: wallet_Collection,
  couponCollection: coupon_Collection,
  offerCollection: offer_Collection
};