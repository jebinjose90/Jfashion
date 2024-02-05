const { ObjectId } = require('mongodb');
const express = require('express');
const Razorpay = require('razorpay');
const process = require('process');
const { countryDetails, deliveryStatuses } = require('../../assets/js/data.js');
const paypal = require('paypal-rest-sdk');
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const db = require('../model/model.js');

const userCollection = db.userCollection;
const addressCollection = db.addressCollection;
const productCollection = db.productCollection;
const cartCollection = db.cartCollection;
const orderCollection = db.orderCollection;


paypal.configure({
  'mode': "sandbox", //sandbox or live
  'client_id': "AWcF3tEJFAhXVx8B76DODKANr2kWdEdou1nmeS6BFbHgqb_ItBZf0BoaiPzXEilmL3qsg5diAP7mQWc4",
  'client_secret': "EKTQ-D17I96xg6CPYNOSWXYaGuFmcW4fBJCU_EU6m2vomaD2nDNV_gZejIql8WNq9liGLeLp6b1Dw9X0"
});

// 'client_id': "sb-yetzi29207587@personal.example.com",
//   'client_secret': "fvy[?3CL"

const currency = countryDetails.India.currency;

module.exports = {

  orderPayment: async (req, res) => {
    try {
      const { amount } = req.body;
      var instance = new Razorpay({ key_id: process.env.RAZORPAY_ID_KEY, key_secret: process.env.RAZORPAY_SCRECT_KEY });
      var options = {
        amount: amount * 100, // Convert amount to the smallest currency unit (e.g., paise in INR)
        currency: currency,
        receipt: "order_rcptid_11",
      };

      // Creating the order
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error(err);
          res.status(500).send("Error creating order");
          return;
        }
        // console.log("order is",order);``
        // Add orderprice to the response object
        res.send({ orderId: order.id });
        // Replace razorpayOrderId and razorpayPaymentId with actual values
        // Redirect to /orderdata on successful payment
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  paypalOrderPayment: async (req, res) => {
    try {
      const usercart = await cartCollection.find({ userid: req.body.user__id });

      // Extract items from user's cart and format them for the PayPal API
      const paypalItems = usercart.map(cartItem => ({
        name: cartItem.product, // Use the actual field from your cart item
        sku: cartItem.productid,    // Use the actual field from your cart item
        price: ((cartItem.discounted_price === 0 ? cartItem.price : cartItem.discounted_price) / 82.97).toFixed(2),
        currency: "USD",
        quantity: cartItem.quantity
      }));
      
      
      // Calculate the total amount of the cart
      const cartTotalAmount = calculateTotalAmount(paypalItems);
      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": `${BASE_URL}/success?user_id=${req.body.user__id}&selectedAddress=${req.body.paypal_selected_address}&paymentMode=${req.body.paypal_selected_paymentMode}`,
          "cancel_url": `${BASE_URL}/cancel`
        },
        "transactions": [{
          "item_list": {
            "items": paypalItems
          },
          "amount": {
            "currency": "USD",
            "total": cartTotalAmount
          },
          "description": "Hat for the best team ever"
        }]
      };

      // Function to calculate the total amount from items
      function calculateTotalAmount(items) {
        return items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0).toFixed(2);
      }


      console.log("DETAILS", paypalItems);
      console.log("CART_TOTAL", cartTotalAmount);


      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              res.redirect(payment.links[i].href);
            }
          }
        }
      });

    } catch (error) {
      console.log(error.message);
    }

  },

  successPage: async (req, res) => {

    try {
      console.log("REQQQQQQQQQ", req.query);
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;

      const user_cart = await cartCollection.find({ userid: req.query.user_id });

      // Extract items from user's cart and format them for the PayPal API
      const paypalItems = user_cart.map(cartItem => ({
        // Use the actual field from your cart item
        price: ((cartItem.discounted_price === 0 ? cartItem.price : cartItem.discounted_price) / 82.97).toFixed(2),
        quantity: cartItem.quantity
      }));

      // Calculate the total amount of the cart
      const cartTotalAmount = calculateTotalAmount(paypalItems);
      // Function to calculate the total amount from items
      function calculateTotalAmount(items) {
        return items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0).toFixed(2);
      }

      const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
          "amount": {
            "currency": "USD",
            "total": cartTotalAmount
          }
        }]
      };

      paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {

          const user_id = req.query.user_id
          console.log("user_id", user_id);
          const usercart = await cartCollection.find({ userid: user_id });
          console.log("usercart", usercart);
          const userAddress = await addressCollection.findOne({ _id: new ObjectId(req.query.selectedAddress) });
          console.log("userAddress", userAddress);
          const userDetails = await userCollection.findOne({ _id: new ObjectId(user_id) });
          console.log("CART DETAILS____", usercart);

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
          console.log('req dara', req.query);

          // Create an array to store cart items
          const productCollectionArray = [];
          let totalAmount = userDetails.totalSpent;
          for (const item of usercart) {
            const productData = {
              productid: item.productid,
              product_name: item.product,
              price: (item.discounted_price === 0 ? item.price : item.discounted_price),
              quantity: item.quantity,
              image: item.image,
              status: deliveryStatuses.Pending.status,
              status_color: deliveryStatuses.Pending.color
            };
            let productAmount = (item.discounted_price === 0 ? item.price * item.quantity : item.discounted_price * item.quantity)
            totalAmount += productAmount
            console.log("productData_____________", productData);
            productCollectionArray.push(productData);

            // Update product stock
            await productCollection.updateOne(
              { _id: item.productid },
              { $inc: { stocks: -item.quantity } }
            );
          }

          console.log("TOTAL_PRICE", totalAmount);

          const orderData = {
            userId: user_id,
            username: userDetails.username, // Assuming username is the same for all cart items
            full_name: userDetails.firstName + ' ' + userDetails.lastName,
            phoneNumber: userDetails.phoneNumber,
            productcollection: productCollectionArray,
            order_date: todaydate,
            delivery_date: deliveryDateString,
            address: selectedaddress,
            payment_mode: req.query.paymentMode
          };

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
      });

    } catch (error) {
      console.log(error.message);
    }

  },

  cancelPage: async (req, res) => {

    try {

      res.render('user/cancel');

    } catch (error) {
      console.log(error.message);
    }

  }

}