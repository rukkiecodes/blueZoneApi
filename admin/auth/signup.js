const router = require("express").Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

const Admin = require("../../models/admin")

const userOTPVerification = require("../../models/userOTPVerification")

const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRETE, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = process.env

const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRETE, GOOGLE_REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body

  try {
    let user = await Admin.findOne({ email })

    if (user) {
      res.status(401).json({
        message: "Auth failed",
      })
    } else {
      bcrypt.hash(password, 12, async (err, hash) => {
        if (err) {
          res.status(401).json({
            message: "Auth failed",
          })
        } else {
          let newUser = {
            _id: new mongoose.Types.ObjectId(),
            name,
            email,
            admin: true,
            password: hash,
            verified: false
          }
          user = await Admin.create(newUser)
          // sendOTPVerificationEmail(user, res)

          res.status(201).json({
            message: "Auth successful",
            user
          })
        }
      })
    }
  } catch (error) {
    console.error(error)
    res.status(401).json({
      message: "Auth failed",
    })
  }
})

// send otp verification email
const sendOTPVerificationEmail = async ({ _id, email, name }, res) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken()

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.email,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRETE,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken
      }
    })

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`

    const mailOptions = {
      from: process.env.email,
      to: email,
      subject: 'Verify Your Email',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name} feedback</title>
      </head>

      <body
        style="background-color: white; display: flex; justify-content: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif">
        <div style="width: 600px; max-width: 100%; background-color: white;">
          <h1>Hello ${name}, Please verify your email</h1>
          <p style="font-size: 2rem"><b>${otp}</b></p>
          <p>This code <b>expires in 1 hour</b></p>
        </div>
      </body>

      </html>
      `
    }

    const hashOTP = await bcrypt.hash(otp, 12)

    const newOTPVerification = await new userOTPVerification({
      userId: _id,
      otp: hashOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    })

    await newOTPVerification.save()
    await transporter.sendMail(mailOptions)
  } catch (error) {
    res.json({
      status: 'FAILED',
      message: error.message
    })
  }
}

module.exports = router