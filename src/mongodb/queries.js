const Product = require("./models").Product;
const axios = require("axios-https-proxy-fix");
const proxy = {
	host: "172.16.2.30",
	port: 8080
};
const axiosConfig = { proxy, responseType: "arraybuffer" };

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
		Product.findOne({ pid: p.pid }).countDocuments((err, count) => {
			if (err) {
				console.log({ error: true, detail: err });
				reject({ err: "Some error occured", detail: err });
			}
			if (count > 0) {
				let { pid, images, reviews, ...rest } = { ...p };
				if (images && images.length !== 0) {
					images.forEach(i => {
						axios
							.get(i, axiosConfig)
							.then(res => {
								// let img = new image();
								const img = {
									img: { data: res.data, contentType: "image/jpeg" },
									url: i
								};

								// img.save();
								Product.updateOne({ pid: p.pid }, { $push: { images: img } });
							})
							.catch(err => {
								img = { url: i };
								Product.updateOne({ pid: p.pid }, { $push: { images: img } }, er => {
									if (er) console.log({ err: "Unable to update db", detail: er });
									else console.log({ err: "Unable to download image due to network issues", detail: err });
								});
							});
					});
				}
				if (reviews && reviews.length !== 0)
					Product.updateOne({ pid: p.pid }, { $push: { reviews: { $each: reviews } } }, er => {
						if (er) console.log({ err: "Unable to update db for pid " + p.pid, detail: er });
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

module.exports = { create, addDetail };
