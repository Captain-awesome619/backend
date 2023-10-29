const express = require("express");
const serverless = require("serverless-http")
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoutes = require('./routes/user');
mongoose.connect("mongodb+srv://captain-awesome:"+ process.env.MONGO_ATLAS_PW + "@cluster0.7i85gm6.mongodb.net/?retryWrites=true&w=majority",
{
  useNewUrlParser: true,
}
)
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.use("/user", userRoutes);
app.use((req, res, next) => {
  const error = new Error("error");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});
app.use((req, res, next) => {
res.status(200).json({
    message : "hmmmmpf"
})
console.log("oh")
  });

  module.exports.handler =  serverless(app);