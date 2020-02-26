const mongoose = require("mongoose");
const product = require("./models");
const connection = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/product-info-scraper";
const connectDb = () => {
	return mongoose.connect(connection, { useNewUrlParser: true, useUnifiedTopology: true });
};
module.exports = connectDb;
