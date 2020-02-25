const cheerio = require("cheerio");
const $$$ = cheerio;

const config = require("../config"),
	helper = require("../helper"),
	queries = require("../mongodb/queries");

const baseUrl = config.websites["Walmart.com"].baseUrl,
	searchUrl = baseUrl + "/search?query=",
	descriptionUrl = baseUrl + "/ip/";

const getList = async (keyword, page) =>
	new Promise((resolve, reject) => {
		let listUrl = searchUrl + keyword;
		listUrl = page !== undefined ? listUrl + "&page=" + page : listUrl;
		// console.log(listUrl);
		helper
			.fetchData(listUrl)
			.then(async resp => {
				const $ = cheerio.load(resp);

				let a = JSON.parse($("#searchContent").html()),
					products = a.searchContent.preso.items;

				helper
					.asyncForEach(
						products,
						async ele =>
							new Promise((res, rej) => {
								let pid = ele.usItemId,
									url = baseUrl + ele.productPageUrl;
								queries
									.create({
										pid,
										name: $$$(ele.title).text(),
										url,
										keyword,
										// shortDescription: $$$(ele.description).text(),
										// images: [ele.imageUrl],
										rating: ele.customerRating || 0,
										price: ele.primaryOffer.offerPrice + " " + ele.primaryOffer.currencyCode
									})
									.then(stat => {
										getDetail(url, pid)
											.then(stat => res(stat))
											.catch(err => rej(err));
									})
									.catch(err => rej(err));
							})
					)
					.then(stat => {
						let nextPage = $("ul.paginator-list li.active")
							.next()
							.children("a")
							.text();
						if (nextPage === "") resolve(true);
						else {
							getList(keyword, nextPage)
								.then(stat => resolve(true))
								.catch(err => reject(err));
						}
					})
					.catch(err => console.log(err));
			})
			.catch(err => reject(err));
	});

const getDetail = async (url, pid) =>
	new Promise((resolve, reject) => {
		helper
			.fetchData(url)
			.then(res => {
				const $ = cheerio.load(res);
				const images = new Set(),
					reviews = new Set(),
					a = JSON.parse($("#item").html());
				if (!a || !a.hasOwnProperty("item")) reject({ error: "Unable to detail load url properly" });
				else {
					const name = a.item.product.midasContext.query,
						mod = a.item.product.idmlMap[a.item.product.midasContext.productId].modules;
					const creviews = a.item.product.reviews[a.item.product.midasContext.productId];
					try {
						const rev = creviews.customerReviews;
						rev.forEach(ele => {
							reviews.add({
								rid: ele.reviewId,
								rating: Number(ele.rating),
								title: ele.reviewTitle,
								content: ele.reviewText,
								datetime: ele.reviewSubmissionTime
							});
						});
					} catch (e) {
						// if (e instanceof TypeError)
						// process.exit();
					}
					[...a.item.product.buyBox.products[0].images].forEach(ele => images.add(ele.url));
					queries
						.addDetail({
							pid,
							name,
							descripton: $$$(mod.LongDescription.product_long_description.displayValue).text(),
							// specifications: mod.Specifications.specifications.values[0],
							// nutritionFacts: mod.NutritionFacts,
							// creviews: creviews,
							reviews: [...reviews] || [],
							images: [...images] || []
						})
						.then(stat => resolve(stat))
						.catch(err => {
							console.log({ error: true, details: err });
							reject(err);
						});
				}
			})
			.catch(err => reject(err));
	});

module.exports = { getDetail, getList };
