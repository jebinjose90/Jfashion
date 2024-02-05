const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const bodyparser = require('body-parser')
const path = require('path')
const session = require('express-session');
const handleErrors = require('./server/middleware/middlewareError.js');
const userRouter = require('./server/router/user.js');
const adminRouter = require('./server/router/admin.js');
const paymentRouter = require('./server/router/payment.js');
const connectDB = require('./server/database/dbHandling.js')
const { v4: uuidv4 } = require('uuid');
const secretKey = uuidv4();
const cookieParser = require('cookie-parser');

process.env.UUID = secretKey;
const app = express()

// Use express-session middleware
app.use(cookieParser());
app.use(session({
  secret: process.env.UUID,
  resave: false,
  saveUninitialized: true,
}));

// Load environment variables from the specified path
dotenv.config({ path: path.join(__dirname, 'env', 'config.env') });
const PORT = process.env.PORT||8000


//log requests
app.use(morgan('tiny'))

// //mongoDB connection
connectDB();


//parse requset to body-parser
app.use(bodyparser.urlencoded({extended:true}))

//set view engin
app.set("view engine","ejs")
// app.set("views",path.resolve(__dirname,"views/ejs"))

//loads assets
app.use('/css',express.static(path.resolve(__dirname,"assets/css")))
app.use('/img',express.static(path.resolve(__dirname,"assets/img")))
app.use('/js',express.static(path.resolve(__dirname,"assets/js")))
app.use('/uploads',express.static(path.resolve(__dirname,"assets/uploads")))

// load routers
// app.use('/', require('./server/router/router'))
app.use('/',userRouter);
app.use('/admin',adminRouter);
app.use('/',paymentRouter);

// Error handling middleware
app.use(handleErrors);

app.listen(PORT,()=>{
  process.env.BASE_URL = `http://localhost:${PORT}`
  console.log(`Server started @ http://localhost:${PORT}`);
})

