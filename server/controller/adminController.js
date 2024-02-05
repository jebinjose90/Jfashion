const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const db = require('../model/model');
const path = require('path');
const { log } = require('console');
const { countryDetails, deliveryStatuses } = require('../../assets/js/data.js');
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");

const adminCollection = db.adminCollection;
const categoryCollection = db.categoryCollection;
const productCollection = db.productCollection;
const userCollection = db.userCollection;
const orderCollection = db.orderCollection;
const couponCollection = db.couponCollection;
const offerCollection = db.offerCollection;

const { currencySymbol, country, std } = countryDetails.India;


module.exports = {
  getAdminLogin: (req, res) => {
    try {
      res.render('admin/admin_login', { title: 'LOGIN' });
    } catch (error) {
      console.error('Error rendering admin login page:', error);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  },

  getDashboard: async (req, res) => {
    try {
      // for daily orderss

      const dailyOrders = await orderCollection.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_date" } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const { dates, orderCounts, totalOrderCount } = dailyOrders.reduce(
        (result, order) => {
          result.dates.push(order._id);
          result.orderCounts.push(order.orderCount);
          result.totalOrderCount += order.orderCount;
          return result;
        },
        { dates: [], orderCounts: [], totalOrderCount: 0 }
      );

      // for monthly orderss

      const monthlyOrders = await orderCollection.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$order_date" },
              month: { $month: "$order_date" },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Extract only the order counts
      const orderCount = monthlyOrders.map((order) => order.orderCount);

      const monthlyData = monthlyOrders.reduce((result, order) => {
        const monthYearString = `${order._id.year}-${String(
          order._id.month
        ).padStart(2, "0")}`;
        result.push({
          month: monthYearString,
          orderCount: order.orderCount,
        });
        return result;
      }, []);
      let monthdata = orderCount;

      // for yearly orders

      const yearlyOrders = await orderCollection.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$order_date" } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const { years, orderCounts3, totalOrderCount3 } = yearlyOrders.reduce(
        (result, order) => {
          result.years.push(order._id);
          result.orderCounts3.push(order.orderCount);
          result.totalOrderCount3 += order.orderCount;
          return result;
        },
        { years: [], orderCounts3: [], totalOrderCount3: 0 }
      );
      res.render('admin/dashboard', { title: 'DASHBOARD', dailyOrders, dates, orderCounts, monthdata, totalOrderCount3 });
    } catch (error) {
      console.error('Error rendering dashboard page:', error);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  },

  getGeneratePdf: async (req, res) => {
    try {
      console.log("entereed the generate pdf");
      const startingDate = new Date(req.query.startingdate);
      const endingDate = new Date(req.query.endingdate);


      console.log("START_DATE", startingDate);
      console.log("END_DATE", startingDate);

      // Fetch orders within the specified date range
      const orders = await orderCollection.find({
        order_date: {
          $gte: startingDate,
          $lte: new Date(endingDate.getTime() + 86400000),
        },
        "productcollection.status": "Delivered",
      });
      console.log('order', orders);


      // Create a PDF document
      const doc = new PDFDocument();
      const filename = "sales_report.pdf";

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);
      // Add content to the PDF document
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Sales Report", { align: "center", margin: 10 });

      console.log("ORDERS", orders);
      // Define the table data
      const tableData = {
        headers: [
          "Username",
          "Product Name",
          "Price",
          "Quantity",
          "Address",
          "City",
          "Pincode",
          "Phone",
        ],

        rows: orders.map((order) => [
          order.username.toUpperCase(),
          order.productcollection
            .filter((productcoll) => productcoll.status === "Delivered")
            .map((productcoll) => productcoll.product_name)
            .join(", "),
          order.productcollection
            .filter((productcoll) => productcoll.status === "Delivered")
            .map((productcoll) => productcoll.price)
            .join(", "),
          order.productcollection
            .filter((productcoll) => productcoll.status === "Delivered")
            .map((productcoll) => productcoll.quantity)
            .join(", "),
          order.address.address,
          order.address.city,
          order.address.pin,
          order.phoneNumber,
        ]),
      };

      // Draw the table
      await doc.table(tableData, {
        prepareHeader: () => doc.font("Helvetica-Bold"),
        prepareRow: () => doc.font("Helvetica"),
      });

      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  getExcelReport: async (req, res) => {
    try {
      const startdate = new Date(req.query.startingdate);
      const Endingdate = new Date(req.query.endingdate);
      Endingdate.setDate(Endingdate.getDate() + 1);

      const orderCursor = await orderCollection.aggregate([
        {
          $match: {
            order_date: { $gte: startdate, $lte: Endingdate },
          },
        },
      ]);

      if (orderCursor.length === 0) {
        return res.redirect("/salesreport");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sheet 1");

      // Add data to the worksheet
      worksheet.columns = [
        { header: "Username", key: "username", width: 15 },
        { header: "Product Name", key: "product_name", width: 20 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Price", key: "price", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "order_date", width: 18 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 20 }, // Add City column
        { header: "Pincode", key: "pin", width: 15 }, // Add Pincode column
        { header: "Phone", key: "phoneNumber", width: 15 }, // Add Phone column
      ];

      for (const orderItem of orderCursor) {
        for (const product of orderItem.productcollection) {
          if (product.status === "Delivered") {
            worksheet.addRow({
              username: orderItem.username,
              product_name: product.product_name,
              quantity: product.quantity,
              price: product.price,
              status: product.status,
              order_date: orderItem.order_date,
              address: orderItem.address.address,
              city: orderItem.address.city,
              pin: orderItem.address.pin,
              phoneNumber: orderItem.phoneNumber
            });
          }
        }
      }

      // Generate the Excel file and send it as a response
      workbook.xlsx.writeBuffer().then((buffer) => {
        const excelBuffer = Buffer.from(buffer);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");
        res.send(excelBuffer);
      });
    } catch (error) {
      console.error("Error creating or sending Excel file:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  getAllCustomers: async (req, res) => {
    try {
      console.log("customer_list")
      const usrCollection = await userCollection.find();
      console.log("USR-DATA" + usrCollection);
      res.render('admin/all_customers', { title: 'ALL CUSTOMERS', userDetails: usrCollection, currency: currencySymbol });
    } catch (error) {
      console.error('Error rendering all_customers view page:', error);
      res.render('error');
    }
  },

  getEditCustomer: async (req, res) => {
    try {
      const id = req.params.id
      console.log("product_ID", id)
      const custCollection = await userCollection.findById(id);
      console.log("CUST-DATA" + custCollection);
      res.render('admin/edit_Customer', { title: 'EDIT CUSTOMER', customerDetails: custCollection });
    } catch (error) {
      console.error('Error rendering edit_customer view page:', error);
      res.render('error');
    }
  },

  getAllProducts: async (req, res) => {
    try {
      console.log("product_list")
      const proCollection = await productCollection.find({ soft_delete_flag: false }).populate("category_id");
      // console.log("PRO-DATA" + proCollection);
      const catCollection = await categoryCollection.find();
      console.log("CAT-DATA" + catCollection);
      res.render('admin/product_list', { title: 'PRODUCT LIST', productDetails: proCollection, categoryDetails: catCollection, currency: currencySymbol });
    } catch (error) {
      console.error('Error rendering product_list view page:', error);
      res.render('error');
    }
  },

  getAddProduct: async (req, res) => {
    try {
      const catCollection = await categoryCollection.find();
      console.log("CAT-DATA" + catCollection);
      let serlNumber = await productCollection.estimatedDocumentCount();
      serlNumber += 1
      console.log("SERIAL NUMBER", serlNumber);
      res.render('admin/add_product', { title: 'ADD PRODUCT', categoryDetails: catCollection, currency: currencySymbol, serialNumber: serlNumber });
    } catch (error) {
      console.error('Error rendering product_list view page:', error);
      res.render('error');
    }
  },

  getEditProduct: async (req, res) => {
    try {
      const id = req.params.id
      console.log("product_ID", id)
      const proCollection = await productCollection.findById(id).populate("category_id");
      // console.log("PRO-DATA" + proCollection);
      const catCollection = await categoryCollection.find();
      console.log("CAT-DATA" + catCollection);
      res.render('admin/edit_product', { title: 'EDIT PRODUCT', productDetails: proCollection, categoryDetails: catCollection, currency: currencySymbol });
    } catch (error) {
      console.error('Error rendering edit_product view page:', error);
      res.render('error');
    }
  },

  getDeleteProduct: async (req, res) => {
    try {
      const _id = req.params.id
      await productCollection.findByIdAndUpdate(_id, {
        soft_delete_flag: true
      })
        .then(async () => {
          console.log("product_list")
          const proCollection = await productCollection.find({ soft_delete_flag: false }).populate("category_id");
          // console.log("PRO-DATA" + proCollection);
          const catCollection = await categoryCollection.find();
          console.log("CAT-DATA" + catCollection);
          res.render('admin/product_list', { title: 'PRODUCT LIST', productDetails: proCollection, categoryDetails: catCollection, currency: currencySymbol });
        })
    } catch (error) {
      console.error('Error rendering delete product:', error);
      res.render('error');
    }

  },

  getChangeStatus: async (req, res) => {
    try {
      console.log("PARAMZZZZ______", req.query);
      const { productId } = req.query;
      console.log("DEL STATUS", deliveryStatuses);
      res.render('admin/change_delivery_status', { title: 'CHANGE DELIVERY STATUS', product_Id: productId, deliveryStatuses: deliveryStatuses });
    } catch (error) {
      console.error('Error rendering view:', error);
      res.render('error');
    }
  },

  getAllCategoryLists: async (req, res) => {
    try {
      console.log("category_list")
      const catCollection = await categoryCollection.find();
      console.log("CAT-DATA" + catCollection);
      res.render('admin/category_list', { title: 'CATEGORY LIST', categoryDetails: catCollection });
    } catch (error) {
      console.error('Error rendering category_list view page:', error);
      res.render('error');
    }
  },

  getAllOffers: async (req, res) => {
    try {
      console.log("offer_list")
      const offCollection = await offerCollection.find();
      console.log("OFFER-DATA" + offCollection);
      res.render('admin/offer_list', { title: 'OFFER LIST', currency: currencySymbol, offerCollections: offCollection });
    } catch (error) {
      console.error('Error rendering offer_list view page:', error);
      res.render('error');
    }
  },

  getAllCoupons: async (req, res) => {
    try {
      console.log("category_list")
      const coupCollection = await couponCollection.find();
      console.log("COUPON-DATA" + coupCollection);
      res.render('admin/coupon_list', { title: 'COUPON LIST', currency: currencySymbol, couponCollections: coupCollection });
    } catch (error) {
      console.error('Error rendering coupon_list view page:', error);
      res.render('error');
    }
  },

  getAddCategory: async (req, res) => {
    try {
      let serlNumber = await categoryCollection.estimatedDocumentCount();
      serlNumber += 1
      console.log("SERIAL NUMBER", serlNumber);
      res.render('admin/add_category', { title: 'ADD CATEGORY', serialNumber: serlNumber });
    } catch (error) {
      console.error('Error rendering add_category view page:', error);
      res.render('error');
    }
  },

  getAddCoupon: async (req, res) => {
    try {
      res.render('admin/add_coupon', { title: 'ADD COUPON' });
    } catch (error) {
      console.error('Error rendering add_coupon view page:', error);
      res.render('error');
    }
  },

  getEditCoupon: async (req, res) => {
    try {
      const _id = req.params.id
      const coupCollection = await couponCollection.findOne({ _id: _id });
      res.render('admin/edit_coupon', { title: 'EDIT COUPON', couponDetail: coupCollection });
    } catch (error) {
      console.error('Error rendering add_category view page:', error);
      res.render('error');
    }
  },

  getAddProductOffer: async (req, res) => {
    try {
      const proCollection = await productCollection.find({ soft_delete_flag: false })
      res.render('admin/add_product_offer', { title: 'ADD PRODUCT OFFER', productDetails: proCollection });
    } catch (error) {
      console.error('Error rendering add_product_offer view page:', error);
      res.render('error');
    }
  },

  getAddCategoryOffer: async (req, res) => {
    try {
      const catCollection = await categoryCollection.find();
      res.render('admin/add_category_offer', { title: 'ADD CATEGORY OFFER', categoryDetails: catCollection });
    } catch (error) {
      console.error('Error rendering add_category_offer view page:', error);
      res.render('error');
    }
  },

  getAllOrderLists: async (req, res) => {
    try {
      const userCartOrderItems = await orderCollection.find().sort({ order_date: -1 });
      console.log("userCartOrderItems___________", userCartOrderItems);
      res.render('admin/order_list', { title: 'ORDER LIST', userOrders: userCartOrderItems, currency: currencySymbol });
    } catch (error) {
      console.error('Error rendering order_list view page:', error);
      res.render('error');
    }
  },

  postChangeDeliveryStatus: async (req, res) => {
    try {
      const { order_id, deliveryStatus } = req.body
      console.log("order_id", order_id);
      console.log("deliveryStatus", deliveryStatus);

      let statuss = ""
      let status_color = ""

      for (const status in deliveryStatuses) {
        if (deliveryStatuses[status].status == deliveryStatus) {
          statuss = deliveryStatuses[status].status
          status_color = deliveryStatuses[status].color
        }
      }
      console.log("STATUS--->", statuss);
      console.log("COLOR--->", status_color);
      // Update the specific product within the productcollection array
      await orderCollection.findOneAndUpdate(
        {
          "productcollection._id": new ObjectId(order_id)
        },
        {
          $set: {
            "productcollection.$.status": statuss,
            "productcollection.$.status_color": status_color
          }
        }
      );

      const userCartOrderItems = await orderCollection.find();
      console.log("userCartOrderItems___________", userCartOrderItems);
      res.redirect('order_list');
    } catch (error) {
      console.error('Error rendering order_list view page:', error);
      res.render('error');
    }
  },

  /**
   * ADMIN LOGIN
   * POST
   */
  postAdminLogin: async (req, res) => {
    try {
      const username = req.body.username
      const password = req.body.password
      if (!username || !password) {
        // Display a custom alert-like message
        res.render('/admin/admin_login', {
          title: 'LOGIN',
          message: 'All fields are required. Please fill in all the fields.'
        });
      } else {
        console.log(req.body.username, req.body.password);
        const existingUser = await adminCollection.findOne({ username: req.body.username });
        if (existingUser) {
          if (req.body.username === existingUser.username && req.body.password === existingUser.password) {
            req.session.admin = req.body.username
            res.redirect('/admin/dashboard');
          } else {
            res.render('admin/admin_login', {
              title: 'LOGIN',
              message: 'Login failed. Incorrect username or password!!'
            });
          }
        } else {
          res.render('admin/admin_login', {
            title: 'LOGIN',
            message: 'Login failed. Username not found.'
          });
        }
      }
    } catch (error) {
      console.log('Error while handling POST request:', error);
      return res.send('Internal Server Error');
    }
  },

  /**
   * EDIT USER
   * POST
   */
  postEditCustomer: async (req, res) => {
    try {
      console.log("REQ", req.body, req.body.status, req.body.user_id)
      const user_id = req.body.user_id
      let user_status = false;
      switch (req.body.status) {
        case 'on':
          user_status = true
          break;

        default:
          user_status = false
          break;
      }

      console.log("STATUS", user_status);
      if (user_id == null || user_id === undefined || user_id == '') {
        const id = user_id
        console.log("product_ID", id)
        const custCollection = await userCollection.findById(id);
        console.log("CUST-DATA" + custCollection);
        res.render('admin/edit_customer',
          {
            title: 'EDIT CUSTOMER',
            customerDetails: custCollection,
            message: 'Not a valid User ID.'
          });
      } else {
        const existingUser = await userCollection.findOne({ _id: req.body.user_id })
        console.log("existingUser?._id", existingUser?._id, "req?.body?.user_id", req?.body?.user_id);
        if (existingUser?._id == req?.body?.user_id) {
          await userCollection.findByIdAndUpdate({ _id: req.body.user_id }, {
            status: user_status
          })
          console.log("UPDATING");
          res.redirect('all_customers');
        } else {
          const id = user_id
          console.log("product_ID", id)
          const custCollection = await userCollection.findById(id);
          console.log("CUST-DATA" + custCollection);
          res.render('admin/edit_customer',
            {
              title: 'EDIT CUSTOMER',
              customerDetails: custCollection,
              message: 'No User ID Found.'
            });
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const id = user_id
      console.log("product_ID", id)
      const custCollection = await userCollection.findById(id);
      console.log("CUST-DATA" + custCollection);
      res.render('admin/edit_customer',
        {
          title: 'EDIT CUSTOMER',
          customerDetails: custCollection,
          message: 'Add product failed. An error occurred while inserting data.'
        });
    }
  },

  /**
   * ADD CATEGORY
   * POST
   */
  postAddCategory: async (req, res) => {
    try {
      console.log("REQ", req.body.category_name, req.body.category_id, req.body.subcategory_id, req.body.brand_name);
      const category_name = req.body.category_name
      const category_id = req.body.category_id
      const subcategory_id = req.body.subcategory_id
      const brand_name = req.body.brand_name
      let subcategory = ''
      switch (subcategory_id) {
        case 'S1':
          subcategory = 'Men'
          break;
        case 'S2':
          subcategory = 'Women'
          break;
        case 'S3':
          subcategory = 'Kids'
          break;

        default:
          subcategory = 'Beauty'
          break;
      }
      if (!category_name || !category_id || !subcategory_id || !brand_name) {
        let serlNumber = await categoryCollection.estimatedDocumentCount();
        serlNumber += 1
        console.log("SERIAL NUMBER", serlNumber);
        res.render('admin/add_category',
          {
            title: 'ADD CATEGORY',
            serialNumber: serlNumber,
            message: 'All fields are required. Please fill in all the fields.'
          });
      } else {
        const query = {
          category: req.body.category_name,
          sub_category: subcategory,
          brand: req.body.brand_name,
        };
        const existingCategory = await categoryCollection.findOne(query)
        if (existingCategory?.category == req.body.category_name && existingCategory?.sub_category == subcategory && existingCategory?.brand == req.body.brand_name) {
          let serlNumber = await categoryCollection.estimatedDocumentCount();
          serlNumber += 1
          console.log("SERIAL NUMBER", serlNumber);
          res.render('admin/add_category',
            {
              title: 'ADD CATEGORY',
              serialNumber: serlNumber,
              message: 'This Category already exists.'
            });
        } else {
          const data = {
            category: req.body.category_name,
            category_id: req.body.category_id,
            sub_category: subcategory,
            sub_category_id: subcategory_id,
            brand: req.body.brand_name
          }
          console.log("ADDING");
          await categoryCollection.insertMany([data]);
          res.redirect('category_list');
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      let serlNumber = await categoryCollection.estimatedDocumentCount();
      serlNumber += 1
      console.log("SERIAL NUMBER", serlNumber);
      res.render('admin/add_category',
        {
          title: 'ADD CATEGORY',
          serialNumber: serlNumber,
          message: 'Add category failed. An error occurred while inserting data.'
        });
    }
  },

  postAddCoupon: async (req, res) => {
    try {
      console.log("REQ", req.body.coupon_code, req.body.discount, req.body.expire_date, req.body.minimum_amount);
      const { coupon_code, discount, expire_date, minimum_amount } = req.body
      let current_date = new Date()
      if (!coupon_code || !discount || !expire_date || !minimum_amount) {
        res.render('admin/add_coupon',
          {
            title: 'ADD COUPON',
            message: 'All fields are required. Please fill in all the fields.'
          });
      } else {
        let expire_date_obj = new Date(expire_date);
        if (expire_date_obj.getTime() < current_date.getTime()) {
          res.render('admin/add_coupon',
            {
              title: 'ADD COUPON',
              message: 'Expire date should be greater than current date!!'
            });
        } else {
          const query = {
            coupon_code: coupon_code
          };
          const existingCoupon = await couponCollection.findOne(query)
          console.log("existingCoupon", existingCoupon);
          if (existingCoupon) {
            console.log("existingCoupon", existingCoupon);
            if (existingCoupon?.coupon_code === coupon_code) {
              let serlNumber = await categoryCollection.estimatedDocumentCount();
              serlNumber += 1
              console.log("SERIAL NUMBER", serlNumber);
              res.render('admin/add_coupon',
                {
                  title: 'ADD COUPON',
                  message: 'This Coupon already exists.'
                });
            } else {
              const data = {
                coupon_code: coupon_code,
                discount: discount,
                expire_date: expire_date,
                minimum_amount: minimum_amount
              }
              console.log("ADDING");
              await couponCollection.insertMany([data]);
              res.redirect('coupon_list');
            }
          } else {
            const data = {
              coupon_code: coupon_code,
              discount: discount,
              expire_date: expire_date,
              minimum_amount: minimum_amount
            }
            console.log("ADDING");
            await couponCollection.insertMany([data]);
            res.redirect('coupon_list');
          }
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      res.render('admin/add_coupon',
        {
          title: 'ADD COUPON',
          message: 'Add category failed. An error occurred while inserting data.'
        });
    }
  },

  postEditCoupon: async (req, res) => {
    try {
      console.log("REQ", req.body._id, req.body.coupon_code, req.body.discount, req.body.expire_date, req.body.minimum_amount);
      const { _id, coupon_code, discount, expire_date, minimum_amount } = req.body
      const coupCollection = await couponCollection.findOne({ _id: _id });
      let current_date = new Date()
      if (!coupon_code || !discount || !expire_date || !minimum_amount) {
        res.render('admin/edit_coupon',
          {
            title: 'EDIT COUPON',
            couponDetail: coupCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
      } else {
        let expire_date_obj = new Date(expire_date);
        if (expire_date_obj.getTime() < current_date.getTime()) {
          res.render('admin/edit_coupon',
            {
              title: 'EDIT COUPON',
              couponDetail: coupCollection,
              message: 'Expire date should be greater than current date!!'
            });
        } else {

          const existingCouponCount = await couponCollection.countDocuments({
            coupon_code: coupon_code,
            _id: { $ne: _id } // Exclude the current coupon being edited
          });

          if (existingCouponCount === 0) {
            const filter = { _id: _id };
            const update = {
              $set: {
                coupon_code: coupon_code,
                discount: discount,
                expire_date: expire_date,
                minimum_amount: minimum_amount
              }
            };
            await couponCollection.updateOne(filter, update);
            res.redirect('coupon_list');
          } else {
            res.render('admin/edit_coupon',
              {
                title: 'EDIT COUPON',
                couponDetail: coupCollection,
                message: 'This Coupon already exists.'
              });
          }
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      res.render('admin/add_coupon',
        {
          title: 'ADD COUPON',
          message: 'Add Coupon failed. An error occurred while inserting data.'
        });
    }
  },

  getDeleteCoupon: async (req, res) => {
    try {
      const _id = req.params.id
      await couponCollection.findByIdAndDelete(_id)
        .then(async () => {
          console.log("category_list")
          const coupCollection = await couponCollection.find();
          console.log("COUPON-DATA" + coupCollection);
          res.render('admin/coupon_list', { title: 'COUPON LIST', currency: currencySymbol, couponCollections: coupCollection });
        })
    } catch (error) {
      console.error('Error rendering delete product:', error);
      res.render('error');
    }
  },

  getEditProductOffer: async (req, res) => {
    try {
      const _id = req.params.id
      const offCollection = await offerCollection.findOne({ _id: _id });
      const proCollection = await productCollection.find({ soft_delete_flag: false })
      res.render('admin/edit_product_offer', { title: 'EDIT PRODUCT OFFER', productDetails: proCollection, offerCollection: offCollection });
    } catch (error) {
      console.error('Error rendering add_product_offer view page:', error);
      res.render('error');
    }
  },

  getEditCategoryOffer: async (req, res) => {
    try {
      const _id = req.params.id
      const offCollection = await offerCollection.findOne({ _id: _id });
      const catCollection = await categoryCollection.find();
      res.render('admin/edit_category_offer', { title: 'EDIT CATEGORY OFFER', categoryDetails: catCollection, offerCollection: offCollection });
    } catch (error) {
      console.error('Error rendering add_category_offer view page:', error);
      res.render('error');
    }
  },

  getDeleteOffer: async (req, res) => {
    try {
      const _id = req.params.id
      await offerCollection.findByIdAndDelete(_id)
        .then(async () => {
          console.log("offer_list")
          const offCollection = await offerCollection.find();
          console.log("OFFER-DATA" + offCollection);
          res.render('admin/offer_list', { title: 'OFFER LIST', currency: currencySymbol, offerCollections: offCollection });
        })
    } catch (error) {
      console.error('Error rendering delete product:', error);
      res.render('error');
    }
  },

  postAddOffer: async (req, res) => {
    try {
      console.log("REQ", req.body);
      let data = {};
      const dic_amount = req.body.discount
      const exp_date = req.body.expire_date
      let current_date = new Date()
      if (req.body.product_id) {
        const existingProduct = await productCollection.findOne({ _id: req.body.product_id });
        console.log("discount", dic_amount);
        console.log("expire_date", exp_date);
        if (!req.body.expire_date || !req.body.discount) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          return res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
        }
        let expire_date_obj = new Date(exp_date);
        if (expire_date_obj.getTime() < current_date.getTime()) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          return res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'Please enter a valid date.'
          });
        }
        data = {
          applicable_product: `${existingProduct.product_name}-${existingProduct.sub_category}`,
          product_id: existingProduct._id,
          discount: dic_amount,
          expire_date: exp_date
        };
        const query = {
          applicable_product: `${existingProduct.product_name}-${existingProduct.sub_category}`
        };
        const existingOffer = await offerCollection.findOne(query)
        console.log("existingOffer", existingOffer);
        if (existingOffer?.applicable_product == `${existingProduct.product_name}-${existingProduct.sub_category}`) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'This Offer already exists.'
          });
        } else {
          console.log("ADDING");
          await offerCollection.insertMany([data]);
          res.redirect('offer_list');
        }
      } else if (req.body.category_id) {
        const existingCategory = await categoryCollection.findOne({ _id: req.body.category_id });
        console.log("discount", dic_amount);
        console.log("expire_date", exp_date);
        if (!req.body.expire_date || !req.body.discount) {
          const catCollection = await categoryCollection.find();
          return res.render('admin/add_category_offer', {
            title: 'ADD CATEGORY OFFER',
            categoryDetails: catCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
        } let expire_date_obj = new Date(exp_date);
        if (expire_date_obj.getTime() < current_date.getTime()) {
          const catCollection = await categoryCollection.find();
          return res.render('admin/add_category_offer', {
            title: 'ADD CATEGORY OFFER',
            categoryDetails: catCollection,
            message: 'Please enter a valid date.'
          });
        }
        data = {
          applicable_category: `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`,
          category_id: existingCategory._id,
          discount: dic_amount,
          expire_date: exp_date
        };
        const query = {
          applicable_category: `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`
        };
        const existingOffer = await offerCollection.findOne(query)
        if (existingOffer?.applicable_category == `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`) {
          const catCollection = await categoryCollection.find();
          res.render('admin/add_category_offer', {
            title: 'ADD CATEGORY OFFER',
            categoryDetails: catCollection,
            message: 'This Offer already exists.'
          });
        } else {
          console.log("ADDING");
          await offerCollection.insertMany([data]);
          res.redirect('offer_list');
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      res.render('admin/add_category_offer', {
        title: 'ADD CATEGORY OFFER',
        message: 'Add category failed. An error occurred while inserting data.'
      });
    }
  },

  postEditOffer: async (req, res) => {
    try {
      console.log("REQ", req.body);
      let data = {};
      let current_date = new Date()
      const id = req.body._id
      const pro_id = req.body.product_id
      const cat_id = req.body.category_id
      const dic_amount = req.body.discount
      const exp_date = req.body.expire_date

      if (req.body.product_id) {
        const existingProduct = await productCollection.findOne({ _id: req.body.product_id });
        console.log("discount", dic_amount);
        console.log("expire_date", exp_date);
        if (!req.body.expire_date || !req.body.discount) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          return res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
        }
        let expire_date_obj = new Date(exp_date);
        if (expire_date_obj.getTime() < current_date.getTime()) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          return res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'Please enter a valid date.'
          });
        }

        data = {
          applicable_product: `${existingProduct.product_name}-${existingProduct.sub_category}`,
          product_id: existingProduct._id,
          discount: dic_amount,
          expire_date: exp_date
        };
        const query = {
          applicable_product: `${existingProduct.product_name}-${existingProduct.sub_category}`,
          _id: { $ne: id }
        };
        const existingOffer = await offerCollection.findOne(query)
        console.log("existingOffer", existingOffer);
        if (existingOffer?.applicable_product == `${existingProduct.product_name}-${existingProduct.sub_category}`) {
          const proCollection = await productCollection.find({ soft_delete_flag: false })
          res.render('admin/add_product_offer', {
            title: 'ADD PRODUCT OFFER',
            productDetails: proCollection,
            message: 'This Offer already exists.'
          });
        } else {
          console.log("ADDING");
          const filter = { _id: id };
          const update = {
            $set: data
          };
          await offerCollection.updateOne(filter, update);
          res.redirect('offer_list');
        }
      } else if (req.body.category_id) {
        const existingCategory = await categoryCollection.findOne({ _id: req.body.category_id });
        console.log("discount", dic_amount);
        console.log("expire_date", exp_date);
        if (!req.body.expire_date || !req.body.discount) {
          const catCollection = await categoryCollection.find();
          return res.render('admin/add_category_offer', {
            title: 'ADD CATEGORY OFFER',
            categoryDetails: catCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
        }

        data = {
          applicable_category: `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`,
          category_id: existingCategory._id,
          discount: dic_amount,
          expire_date: exp_date
        };
        const query = {
          applicable_category: `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`,
          _id: { $ne: id }
        };
        const existingOffer = await offerCollection.findOne(query)
        if (existingOffer?.applicable_category == `${existingCategory.brand} ${existingCategory.category}-${existingCategory.sub_category}`) {
          const catCollection = await categoryCollection.find();
          res.render('admin/add_category_offer', {
            title: 'ADD CATEGORY OFFER',
            categoryDetails: catCollection,
            message: 'This Offer already exists.'
          });
        } else {
          console.log("ADDING");
          const filter = { _id: id };
          const update = {
            $set: data
          };
          await offerCollection.updateOne(filter, update);
          res.redirect('offer_list');
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      res.render('admin/add_coupon', {
        title: 'ADD COUPON',
        message: 'Add category failed. An error occurred while inserting data.'
      });
    }
  },


  /**
   * ADD PRODUCT
   * *POST
   */
  postAddProduct: async (req, res) => {
    try {
      console.log("REQ", req.body, req.body.product_name, req.body.product_id, req.body.sku, req.body.price, req.body.quantity, req.body.category_id, req.body.stock_flag, req.body.croppedImages)
      console.log("FILE", req.files);

      const product_name = req.body.product_name;
      const product_id = req.body.product_id;
      const sku = req.body.sku;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const category_id = req.body.category_id;
      const images = req.body.croppedImages;
      let stock_flag = false;
      switch (req.body.stock_flag) {
        case 'on':
          stock_flag = true
          break;

        default:
          stock_flag = false
          break;
      }



      if (!product_name || !product_id || !sku || !price || !quantity || !category_id) {
        const catCollection = await categoryCollection.find();
        console.log("CAT-DATA" + catCollection);
        res.render('admin/add_product',
          {
            title: 'ADD PRODUCT',
            categoryDetails: catCollection,
            message: 'All fields are required. Please fill in all the fields.'
          });
      } else {
        if (!req.body.croppedImages || req.body.croppedImages.length === 0) {
          const catCollection = await categoryCollection.find();
          let serlNumber = await productCollection.estimatedDocumentCount();
          serlNumber += 1
          console.log("SERIAL NUMBER", serlNumber);
          console.log("CAT-DATA" + catCollection);
          res.render('admin/add_product',
            {
              title: 'ADD PRODUCT',
              categoryDetails: catCollection,
              serialNumber: serlNumber,
              message: 'No image uploaded. Please upload at least one image.'
            });
          return;
        }
        const existingProduct = await productCollection.findOne({ product_id: req.body.product_id })
        const existingCategory = await categoryCollection.findOne({ _id: req.body.category_id })
        if (existingProduct?.product_id === req?.body?.product_id) {
          const catCollection = await categoryCollection.find();
          let serlNumber = await productCollection.estimatedDocumentCount();
          serlNumber += 1
          console.log("SERIAL NUMBER", serlNumber);
          console.log("CAT-DATA" + catCollection);
          res.render('admin/add_product',
            {
              title: 'ADD PRODUCT',
              categoryDetails: catCollection,
              serialNumber: serlNumber,
              message: 'This Product already exists.'
            });
        } else {
          console.log("existingCategory?._id", existingCategory?._id, "req?.body?.category_id", req?.body?.category_id);
          if (existingCategory?._id == req?.body?.category_id) {

            const query = {
              product_name: req.body.product_name,
              product_id: req.body.product_id,
              sku: req.body.sku,
              price: req.body.price,
              sub_category: existingCategory?.sub_category,
              category_id: existingCategory?._id,
            };
            const existingproduct = await productCollection.findOne(query)
            if (existingproduct?.product_name == product_name && existingproduct?.sku == req.body.sku && existingproduct?.sub_category == req.body.sub_category && existingproduct?.category_id == req.body.category_id) {
              const catCollection = await categoryCollection.find();
              let serlNumber = await productCollection.estimatedDocumentCount();
              serlNumber += 1
              console.log("SERIAL NUMBER", serlNumber);
              console.log("CAT-DATA" + catCollection);
              res.render('admin/add_product',
                {
                  title: 'ADD PRODUCT',
                  categoryDetails: catCollection,
                  serialNumber: serlNumber,
                  message: 'This Product already exists.'
                });
            } else {
              // Common data for both branches
              const data = {
                product_name: req.body.product_name,
                product_id: req.body.product_id,
                stock_flag: stock_flag,
                sku: req.body.sku,
                price: req.body.price,
                stocks: Math.max(quantity, 0), // Ensure stocks is non-negative
                soft_delete_flag: false,
                image: images || [],
                sub_category: existingCategory?.sub_category,
                category_id: existingCategory?._id,
              };
              // Insert or update based on the condition
              console.log("ADDING");
              await productCollection.insertMany([data]);
              res.redirect('product_list');
            }
          } else {
            const catCollection = await categoryCollection.find();
            let serlNumber = await productCollection.estimatedDocumentCount();
            serlNumber += 1
            console.log("SERIAL NUMBER", serlNumber);
            console.log("CAT-DATA" + catCollection);
            res.render('admin/add_product',
              {
                title: 'ADD PRODUCT',
                categoryDetails: catCollection,
                serialNumber: serlNumber,
                message: 'No Category ID Found.'
              });
          }
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const catCollection = await categoryCollection.find();
      let serlNumber = await productCollection.estimatedDocumentCount();
      serlNumber += 1
      console.log("SERIAL NUMBER", serlNumber);
      console.log("CAT-DATA" + catCollection);
      res.render('admin/add_product',
        {
          title: 'ADD PRODUCT',
          categoryDetails: catCollection,
          serialNumber: serlNumber,
          message: 'Add product failed. An error occurred while inserting data.'
        });
    }
  },

  postRemoveProduct: async (req, res) => {
    try {
      const productId = req.body.productId;
      const imageIndex = req.body.imageIndex;
      console.log(productId);
      const product1 = await productCollection.findById(productId);
      if (!product1) {
        return res.status(404).send("Product not found");
      }
      if (imageIndex < 0 || imageIndex >= product1.image.length) {
        return res.status(400).send("Invalid image index");
      }
      product1.image.splice(imageIndex, 1);
      await product1.save();
      res.status(200).send({
        message: "Image removed successfully",
        imgData: product1.image // Replace 'yourData' with the actual data you want to send
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  },

  /**
   * EDIT PRODUCT
   * *POST
   */
  postEditProduct: async (req, res) => {
    try {
      console.log("FILE", req.files);
      console.log("REQ", req.body, req.body.product_name, req.body.product_id, req.body.sku, req.body.price, req.body.quantity, req.body.category_id, req.body.stock_flag)

      const product_name = req.body.product_name;
      const product_id = req.body.product_id;
      const _id = req.body._id;
      const sku = req.body.sku;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const category_id = req.body.category_id;
      let stock_flag = false;
      switch (req.body.stock_flag) {
        case 'on':
          stock_flag = true
          break;

        default:
          stock_flag = false
          break;
      }

      if (!product_name || !product_id || !sku || !price || !quantity || !category_id) {
        const id = _id
        const proCollection = await productCollection.findById(id).populate("category_id");
        const catCollection = await categoryCollection.find();
        res.render('admin/edit_product',
          {
            title: 'EDIT PRODUCT',
            productDetails: proCollection,
            categoryDetails: catCollection,
            currency: currencySymbol,
            message: 'All fields are required. Please fill in all the fields.'
          });
      } else {
        const existingCategory = await categoryCollection.findOne({ _id: req.body.category_id })
        console.log("existingCategory?._id", existingCategory?._id, "req?.body?.category_id", req?.body?.category_id);
        if (existingCategory?._id == req?.body?.category_id) {
          // Common data for the update

          const updateData = {
            username: req.body.username,
            product_name: req.body.product_name,
            product_id: req.body.product_id,
            stock_flag: stock_flag,
            sku: req.body.sku,
            price: req.body.price,
            stocks: Math.max(quantity, 0), // Ensure stocks is non-negative
            soft_delete_flag: false,
            sub_category: existingCategory?.sub_category,
            category_id: existingCategory?._id,
          };
          if (req.files && req.files.length > 0) {
            const imageData = {
              image: req.files.map((file) => file.path.substring(file.path.indexOf('/uploads/')))
            }
            const filter = { product_id: req.body.product_id };
            const update = {
              $set: updateData,
              $push: imageData
            };
            console.log("filter", filter);
            console.log("imageData", imageData);
            // Update the product based on the condition
            await productCollection.updateOne(filter, update);
            console.log("UPDATING");
            res.redirect('product_list');
          } else {
            const filter = { product_id: req.body.product_id };
            // Update the product based on the condition
            await productCollection.findOneAndUpdate(filter, updateData);
            console.log("UPDATING");
            res.redirect('product_list');
          }

        } else {
          const id = _id
          const proCollection = await productCollection.findById(id).populate("category_id");
          const catCollection = await categoryCollection.find();
          res.render('admin/edit_product',
            {
              title: 'EDIT PRODUCT',
              productDetails: proCollection,
              categoryDetails: catCollection,
              currency: currencySymbol,
              message: 'No Category ID Found.'
            });
        }
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      const id = _id
      const proCollection = await productCollection.findById(id).populate("category_id");
      const catCollection = await categoryCollection.find();
      res.render('admin/edit_product',
        {
          title: 'EDIT PRODUCT',
          productDetails: proCollection,
          categoryDetails: catCollection,
          currency: currencySymbol,
          message: 'Add product failed. An error occurred while inserting data.'
        });
    }
  },

  getAdminLogout: (req, res) => {
    try {
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
          res.render('error');
        } else {
          res.redirect('admin_login');
        }
      })
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
}