const express = require('express')
const router = express.Router()
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const path = require('path');
const controller = require('../controller/adminController')




const storageImg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../assets/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const uploadImg = multer({ storage: storageImg }).array('img', 4);


const storage_img = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'assets/uploads'); 
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname); 
  }
});

const upload_img = multer({ storage: storage_img }).array('img',4)


const checkSession = async (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    // No userId in session, redirect to the default page
    res.redirect("/admin/admin_login");
  }
};


router.get('/admin_login', controller.getAdminLogin);
router.get('/dashboard', checkSession, controller.getDashboard);
router.get('/generate-pdf',checkSession,controller.getGeneratePdf)
router.get('/salesreport',checkSession,controller.getExcelReport)
router.get('/all_customers', checkSession, controller.getAllCustomers);
router.get('/edit_customer/:id', checkSession, controller.getEditCustomer);
router.get('/product_list', checkSession, controller.getAllProducts);
router.get('/add_product',checkSession, controller.getAddProduct);
router.get('/edit_product/:id',checkSession, controller.getEditProduct);
router.get('/delete_product/:id',checkSession, controller.getDeleteProduct);
router.get('/category_list', checkSession, controller.getAllCategoryLists);
router.get('/add_category', checkSession, controller.getAddCategory);
router.get('/coupon_list', checkSession, controller.getAllCoupons);
router.get('/add_coupon', checkSession, controller.getAddCoupon);
router.get('/edit_coupon/:id', checkSession, controller.getEditCoupon);
router.get('/edit_product_offer/:id', checkSession, controller.getEditProductOffer);
router.get('/edit_category_offer/:id', checkSession, controller.getEditCategoryOffer);
router.get('/delete_coupon/:id',checkSession, controller.getDeleteCoupon);
router.get('/offer_list', checkSession, controller.getAllOffers);
router.get('/delete_offer/:id',checkSession, controller.getDeleteOffer);
router.get('/add_product_offer', checkSession, controller.getAddProductOffer);
router.get('/add_category_offer', checkSession, controller.getAddCategoryOffer);
router.get('/order_list', checkSession, controller.getAllOrderLists);
router.get('/change_status', checkSession, controller.getChangeStatus);
router.get('/admin_Logout', controller.getAdminLogout);
router.post('/admin_login', controller.postAdminLogin);
router.post('/edit_customer', controller.postEditCustomer);
router.post('/add_category', controller.postAddCategory);
router.post('/add_coupon', controller.postAddCoupon);
router.post('/edit_coupon', controller.postEditCoupon);
router.post('/add_offer', controller.postAddOffer);
router.post('/edit_offer', controller.postEditOffer);
router.post('/add_product', upload_img, controller.postAddProduct);
router.post('/removeProduct',checkSession, controller.postRemoveProduct)
router.post('/changeDeliveryStatus', controller.postChangeDeliveryStatus)
router.post('/edit_product', upload_img, controller.postEditProduct);


module.exports = router;