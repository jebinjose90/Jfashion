const jwt = require('jsonwebtoken');
const process = require('process');
const db = require('../model/model.js');
const userCollection = db.userCollection;

async function  verifyToken(req, res, next) {
const token = req.cookies.token
console.log("TOKEN",token);
if (!token) return res.redirect('/')
try {
 const decoded = jwt.verify(token, process.env.UUID);
 req.userId = decoded.userId;
 console.log("Decoded TOKEN VALUES",decoded);
 const userDetails = await userCollection.findById(decoded.userId);
 if (userDetails.status === false) {
   throw new Error('This user is been blocked.');
 }else{
   next();
 }
 } catch (error) {
  console.error('Error verifying token:', error.message);
 res.clearCookie("token");
 return res.redirect('/')
 }
 };

 function verifyPreloginToken(req, res, next) {
  const preLoginToken = req.cookies.preLoginToken
  console.log("preLoginToken",preLoginToken);
  if (!preLoginToken) return res.redirect('/')
  try {
   const decoded = jwt.verify(preLoginToken, process.env.UUID);
   req.additionalInfo = decoded.additionalInfo;
   console.log("Decoded additionalInfo VALUES",decoded.additionalInfo);
   next();
   } catch (error) {
    console.error('Error verifying token:', error.message);
   res.clearCookie("preLoginToken");
   return res.redirect('/')
   }
   };

module.exports = {verifyToken, verifyPreloginToken};