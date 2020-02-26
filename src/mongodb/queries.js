const axios = require("axios");
const rax = require("retry-axios");
const interceptorId = rax.attach();

const console = require("../console");
const helper = require("../helper");
const Product = require("./models").Product;

const create = async p =>
	new Promise((resolve, reject) => {
		resolve(true);
		Product.findOne({ pid: p.pid }).countDocuments((err, count) => {
			if (err) {
				console.log({ error: true, detail: err });
				reject({ err: "Some error occured", detail: err });
			}
			if (count < 1) {
				let { images, ...rest } = { ...p };
				const pr = new Product({ ...rest });
				pr.save()
					.then(() => {
						resolve(true);
					})
					.catch(err => {
						reject({ err: "Unable to update db for pid " + p.pid, detail: err });
					});
			} else {
				addDetail({ ...p })
					.then(stat => resolve(true))
					.catch(err => {
						reject(err);
					});
			}
		});
	});

const addDetail = async p =>
	new Promise((resolve, reject) => {
		Product.findOne({ pid: p.pid }).countDocuments(async (err, count) => {
			if (err) {
				console.errror({ error: true, detail: err });
				reject({ err: "Some error occured", detail: err });
			}
			if (count > 0) {
				let { pid, images, reviews, ...rest } = p;
				// console.log({ ...p }, { ...rest }, "\n");
				if (images && images.length !== 0) {
					await helper.asyncForEach(images, i => {
						axios
							.get(i, { responseType: "arraybuffer" })
							.then(res => {
								// let img = new image();
								const img = {
									img: { data: res.data, contentType: "image/jpeg" },
									url: i
								};

								// img.save();
								Product.updateOne({ pid: p.pid }, { $push: { images: img } }, er => {
									if (er) {
										if (er.code == 10334) console.warn({ warning: "Size of image > 16 MB; Skipped downloading" });
										else console.error({ error: "Unable to update db", detail: er });
									}
								});
							})
							.catch(error => {
								img = { url: i };
								Product.updateOne({ pid: p.pid }, { $push: { images: img } }, er => {
									if (er) console.error({ error: "Unable to update db", detail: er });
									else console.warn({ error: "Unable to download image due to network issues", detail: error });
								});
							});
					});
				}
				if (reviews && reviews.length !== 0)
					Product.updateOne({ pid: p.pid }, { $push: { reviews: { $each: reviews } } }, er => {
						if (er) console.error({ err: "Unable to update db for pid " + p.pid, detail: er });
					});

				Product.updateOne({ pid: p.pid }, { ...rest })
					.then(() => resolve(true))
					.catch(err => {
						reject({ err: "Unable to update db for pid " + p.pid, detail: err });
					});
			} else {
				create({ ...p })
					.then(stat => resolve(true))
					.catch(err => {
						reject(err);
					});
			}
		});
	});

const deleteProduct = async pid =>
	new Promise((resolve, reject) => {
		Product.deleteOne({ pid })
			.then(res => resolve(true))
			.catch(err => reject(err));
	});

module.exports = { create, addDetail, deleteProduct };
