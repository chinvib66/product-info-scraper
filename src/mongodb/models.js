const mongoose = require("mongoose");
const schemaTypes = mongoose.Schema.Types;

const review = new mongoose.Schema({
	rid: { type: schemaTypes.String, default: null },
	title: { type: schemaTypes.String, default: "" },
	content: { type: schemaTypes.String, default: "" },
	rating: { type: schemaTypes.Number, default: 0 },
	datetime: { type: schemaTypes.String, default: "" }
});

const image = new mongoose.Schema({
	img: { data: schemaTypes.Buffer, contentType: String },
	url: { type: schemaTypes.String }
});

const productSchema = mongoose.Schema({
	pid: { type: schemaTypes.String, unique: true },
	name: { type: schemaTypes.String, default: "" },
	keyword: { type: schemaTypes.String, default: "" },
	description: { type: schemaTypes.String, default: "" },
	url: { type: schemaTypes.String, default: "" },
	rating: { type: schemaTypes.Number, default: 0 },
	price: { type: schemaTypes.String, default: "" },
	reviews: { type: [review], default: [] },
	images: { type: [image], default: [] }
});

const Product = mongoose.model("product", productSchema);
module.exports = { Product };
