
const express = require("express");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs")
const User = require("../models/user");
const path = require('node:path')
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

var nodemailer = require("nodemailer");
app.post("/signup", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Mail exists"
        });
      } else {
        bcryptjs.hash(req.body.password, 10, (err, hash) => {
          console.log(req.body.password)
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              fullname : req.body.fullname,
              email: req.body.email,
              password: hash
            });
            user
              .save()
              .then(result => {
                console.log(result);
                res.status(201).json({
                  message: "User sucessfully created"
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        });

      }}

    );
});

app.get("/get-username/:email", (req, res, next) => {
  const email = req.params.email;
  User.find({ email: email })  
    .exec()
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      } else {
        
        res.status(200).json({
          fullname: user.fullname
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});



app.delete("/:userId", (req, res, next) => {
    User.deleteOne({ _id: req.params.userId })
      .exec()
      .then(result => {
        res.status(200).json({
          message: "User deleted"
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });
  app.post("/login", (req, res, next) => {
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length < 1) {
          return res.status(401).json({
            message: "Authentication failed"
          });
        }
       const {password } = req.body
        bcryptjs.compare(password, user[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Authentication failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                email: user[0].email,
                userId: user[0]._id
              },
              process.env.JWT_KEY,
              {
                  expiresIn: "1h"
              }
            );
            return res.status(200).json({
              message: "Authentication successful",
              token: token,
              username : user[0].fullname
            });
          }
          res.status(401).json({
            message: "Authentication failed"
          });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });

  app.post("/forgot-password", async (req, res) => {
    const { email,password,id } = req.body;
    console.log("this is my email" + email+ "and" + password + "andd" + id)
    console.log(req.body)
    try {
      const oldUser = await User.findOne({ email });
      console.log(email)
      if (!oldUser) {
        return res.status(404).json({
          message: "user does not exist"
        });
      }
      const secret = process.env.JWT_KEY + oldUser.password;
      console.log(secret)
      const token = jwt.sign({ email: oldUser.email, id:oldUser._id }, secret, {
        expiresIn: "5m",
      });
      console.log("the" + oldUser._id)
      res.json("Your password has been sent to your mail")
      const link = `https://api-ecommerce-app-a3hc.onrender.com/user/reset-password/${oldUser._id}/${token}`;

     const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, 
  secure: true, 
  auth: {
    user:  process.env.USER, 
    pass:  process.env.USER_PWD,   
  },
});

    await new Promise((resolve, reject) => {
      // verify connection configuration
      transporter.verify(function (error, success) {
          if (error) {
              console.log(error);
              reject(error);
          } else {
              console.log("Server is ready to take our messages");
              resolve(success);
          }
      });
  });


  
  var mailOptions = {
    from: "ogunsolatoluwalase@gmail.com",
    to: email,
    subject: "your password Reset link",
    text:link
  };


  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error(err);
            reject(err);
        } else {
            console.log(info);
            resolve(info);
        }
    });36
  });
      console.log(link);
      console.log(User)
    } catch (error) { }
  });
  app.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const {email,password} = req.body
    console.log("this is the body" + JSON.stringify(req.body))
console.log("the changing password" + password)
    const oldUser = await User.findOne({ _id: id });
    console.log("the old password" + oldUser.password)
    console.log()
    if (!oldUser) {
      return res.json({ status: "User Does Not Exists!!" });
    }
    const secret =  process.env.JWT_KEY + oldUser.password;
    try {
      const verify = jwt.verify(token, secret);
      res.render('index.ejs',{email: verify.email,status: "Not Verified" });
    } catch (error) {
      console.log(error);
      console.log(error)
      res.send("Not Verified, error");
    }
  });
  app.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User Does Not Exists!!" });
    }
    const secret =  process.env.JWT_KEY + oldUser.password;
    try {
      const verify = jwt.verify(token, secret);
      const encryptedPassword = await bcryptjs.hash(req.body.password, 10);
      await User.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: encryptedPassword,
          },
        }
      );
      res.render("index", { email: verify.email, status: "verified" });
      console.log("this is the new" + encryptedPassword)

    } catch (error) {
      console.log(error);
      res.json({ status: "Something Went Wrong" });
    }
  });


module.exports = app;