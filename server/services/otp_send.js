const nodemailer = require('nodemailer');
const mongoose = require('mongoose')
const speakeasy = require('speakeasy');
const db = require('../model/model.js');

const userCollection = db.userCollection;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jebinjose.sics@gmail.com',
    pass: 'vfoixvqusiturvsg',
  },
});

const sendOTP = async (email, req) => {

  const filter = {
    $and: [
      { otp: { $exists: true } },
      { $expr: { $eq: [{ $size: { $objectToArray: "$$ROOT" } }, 3] } }
    ]
  };
  const result = await userCollection.deleteMany(filter);
  console.log(`${result.deletedCount} documents deleted.`);

  const secret = speakeasy.generateSecret({ length: 10 });
  const otp = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    digits: 4,
  });

  // Create a new User instance
  const newUser = new userCollection({ otp: otp });

  // Save the instance to the database
  try {
    await newUser.save();
    // Rest of your code to send email...
  } catch (error) {
    // Handle error if the saving process fails
    console.error("Error while saving OTP to the database:", error);
    throw error; // Propagate the error up the chain or handle it accordingly
  }

  const mailOptions = {
    from: 'jebinjose.sics@gmail.com',
    to: email,
    subject: 'OTP Verification for JFashion',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });

  return { secret: secret.base32, otp };
};

module.exports = { sendOTP };
