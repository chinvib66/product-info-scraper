const mongoose = require("mongoose");
const product = require("./models");
const connection = "mongodb://0.0.0.0:27017/scraper-cli";
const connectDb = () => {
	return mongoose.connect(connection);
};
module.exports = connectDb;
