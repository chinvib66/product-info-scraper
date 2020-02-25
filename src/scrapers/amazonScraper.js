const cheerio = require("cheerio");

const helper = require("../helper");
const config = require("../config");
const queries = require("../mongodb/queries");

const baseUrl = config.websites["Amazon.com"].baseUrl;
const searchUrl = baseUrl + "/s?k=";
const descriptionUrl = baseUrl + "/gp/product/";
const reviewUrl = baseUrl + "/product-reviews/";

const getList = async (keyword, page) =>
	new Promise((resolve, reject) => {
		let listUrl = searchUrl + keyword;
		listUrl = page !== undefined ? listUrl + "&page=" + page : listUrl;
		helper
			.fetchData(listUrl)
			.then(resp => {
				const $ = cheerio.load(resp);

				helper
					.cheerioAsyncEach(
						$(".s-search-results .s-result-item"),
						async (key, ele) =>
							new Promise((res, rej) => {
								const $_ = cheerio.load(ele);
								var pid = $(ele).attr("data-asin");
								var name = $_(".s-image").attr("alt");
								// var imageURL = $_(".s-image").attr("src");
								var rating = Number(
									$_(".a-icon-alt")
										.text()
										.split(" ")[0]
								);

								var url = descriptionUrl + pid;
								// var userReviewUrl = baseUrl + "/product-reviews/" + $(ele).attr("data-asin");
								// var averageUserReviewUrl = JSON.parse($_('[data-action="a-popover"]').attr("data-a-popover")).url;

								if (name.search("These are ads for products you'll find on Amazon.com") === -1 && name) {
									queries
										.create({
											pid,
											name,
											// price,
											keyword,
											url,
											// imageURL,
											rating
											// userReviewUrl,
											// averageUserReviewUrl
										})
										.then(stat => {
											getDetail(pid)
												.then(stat =>
													getReviews(pid)
														.then(stat => res(stat))
														.catch(err => rej(err))
												)
												.catch(err => rej(err));
										})
										.catch(err => rej(err));
								} else res(true);
							})
					)
					.then(stat => {
						let nextPage =
							null ||
							$(".a-pagination .a-selected")
								.next('[class!="a-last"]')
								.children("a")
								.text();
						if (nextPage === null || nextPage === "") resolve(true);
						else {
							getList(keyword, nextPage)
								.then(stat => resolve(true))
								.catch(err => reject(err));
						}
					});
			})
			.catch(err => reject(err));
	});

const getDetail = async pid =>
	new Promise((resolve, reject) => {
		helper
			.fetchData(descriptionUrl + pid)
			.then(res => {
				const $ = cheerio.load(res);
				const images = new Set();
				$(".aplus-module-wrapper img").each((key, ele) => {
					images.add($(ele).attr("src"));
				});
				let price = $("#priceblock_ourprice")
						.text()
						.trim(),
					name = $("#productTitle")
						.text()
						.trim(),
					description = $("#aplus")
						.text()
						.trim()
						.replace(/\n+|\t+/g, "")
						.replace(/\s\s+/g, " ")
						.replace(/Read more+/g, ""),
					features = $("#feature-bullets")
						.text()
						.trim()
						.replace(/\n|\t+/g, "")
						.split(" • ")
						.join(". ");

				queries
					.addDetail({
						pid,
						name,
						price,
						description,
						images: [...images]
					})
					.then(stat => resolve(stat))
					.catch(err => {
						console.log({ error: true, details: err });
						reject(err);
					});
			})
			.catch(err => reject(err));
	});

const getReviews = async pid =>
	new Promise((resolve, reject) => {
		helper
			.fetchData(reviewUrl + pid)
			.then(res => {
				const $ = cheerio.load(res);

				const reviews = new Set();
				$("[id*=R].review").each((key, ele) => {
					const $_ = cheerio.load(ele);
					let rid = $(ele).attr("id");
					let rating = Number(
						$_('[data-hook="review-star-rating"]')
							.text()
							.split(" ")[0]
					);
					// let verified = $_('[data-hook="avp-badge"]').text();
					let title = $_('[data-hook="review-title"]').text();
					let datetime = $_('[data-hook="review-date"]').text();
					let content = $_('[data-hook="review-body"]')
						.text()
						.replace(/\s+|\n|\t+/g, " ");
					reviews.add({ rid, title, content, rating, datetime });
				});
				queries
					.addDetail({
						pid: pid,
						reviews: [...reviews]
					})
					.then(stat => resolve(stat))
					.catch(err => reject(err));
			})
			.catch(err => reject(err));
	});
module.exports = { getList, getDetail, getReviews };
