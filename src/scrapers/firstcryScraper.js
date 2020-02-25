const cheerio = require("cheerio");

const config = require("../config");
const helper = require("../helper");
const queries = require("../mongodb/queries");

const baseUrl = config.websites["FirstCry.com"].baseUrl;
// const searchUrl = baseUrl + "/search.aspx?q=";
const searchUrl = baseUrl + config.websites["FirstCry.com"].searchEndpoint;
const detailUrl = (pid, pname, pmaker) => `${baseUrl}/${pmaker.toLowerCase()}/${pname.toLowerCase()}/product-detail`;

const getList = async (keyword, page) =>
	new Promise((resolve, reject) => {
		let listUrl = searchUrl + keyword;
		listUrl = page !== undefined ? listUrl + "&PageNo=" + page : listUrl;
		// console.log(listUrl);
		helper
			.fetchData(listUrl)
			.then(resp => {
				// const $ = cheerio.load(resp);

				const data = JSON.parse(resp.ProductResponse).hits,
					count = data.found,
					totalPages = count / 20 + 1;
				// console.log(data.hit);
				helper
					.asyncForEach(
						data.hit,
						async ele =>
							new Promise((res, rej) => {
								let pid = ele.id.substring(3),
									name = ele.fields.productname,
									url = detailUrl(pid, name, ele.fields.bname),
									rating = Number(ele.fields.rating),
									price = ele.fields.mrp + " INR";

								queries
									.create({ pid, name, url, keyword, rating, price })
									.then(stat => {
										getDetail(url, pid)
											.then(stat => res(stat))
											.catch(err => rej(err));
									})
									.catch(err => rej(err));
							})
					)
					.then(stat => {
						var nextPage = page ? (page < totalPages ? page + 1 : null) : 2;
						if (nextPage !== null)
							getList(keyword, nextPage)
								.then(stat => resolve(true))
								.catch(err => reject(err));
						else resolve(true);
					})
					.catch(err => reject(err));
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
					reviews = new Set();
				$(".brandimgs2 img").each((key, ele) => {
					images.add($(ele).attr("src"));
				});
				$(".thumb-img-slider .swiper-slide img").each((key, ele) => {
					images.add(
						$(ele)
							.attr("src")
							.replace("56x69", "438x531")
					);
				});
				let description = $("[id*=div_prod_desc]")
					.text()
					.trim()
					.replace(/\n+|\t+/g, "")
					.replace(/\s\s+/g, " ");
				let name = $("#prod_name")
					.text()
					.trim()
					.replace(/\n+|\t+/g, "")
					.replace(/\s\s+/g, " ");
				$(".review-wrap .review-block").each((key, ele) => {
					let $_ = cheerio.load(ele);
					let name = $_(".rev-name")
							.text()
							.trim(),
						datetime = $_("p.rev-time")
							.text()
							.trim(),
						title = $_(".p1")
							.text()
							.trim(),
						rating = Number(
							$_(".yellow-star")
								.css("width")
								.replace("px", "")
						),
						content = $_(".p2")
							.text()
							.trim(),
						rid = name + datetime;
					rating = rating <= 100 ? (rating * 5) / 100 : 5;
					// let verified = $_(".vb-tag")
					// 	.text()
					// 	.trim();
					reviews.add({ rid, rating, title, content, datetime });
				});
				queries
					.addDetail({
						pid,
						name,
						description,
						images: [...images],
						reviews: [...reviews]
					})
					.then(stat => resolve(stat))
					.catch(err => {
						console.log({ error: true, details: err });
						reject(err);
					});
			})
			.catch(err => reject(err));
	});

module.exports = { getList, getDetail };

// $("#maindiv .list_block.lft").each(
// 	async (key, ele) =>
// 		new Promise((res, rej) => {
// 			const $_ = cheerio.load(ele);
// 			var pid = $_(".adc.shortlst").attr("data-pid"),
// 				name = $_(".li_txt1.lft a").text(),
// 				imageURL = $_(".list_img a img").attr("src"),
// 				rating = Number($_("span.small_st1").attr("data-rate")),
// 				url = helper.cleanUrl($_(".li_txt1.lft a").attr("href"), baseUrl),
// 				price = $_(".rupee")
// 					.text()
// 					.trim();
// 			console.log(url);
// 			queries
// 				.create({
// 					pid,
// 					name,
// 					keyword,
// 					price,
// 					url,
// 					images: [imageURL],
// 					rating
// 				})
// 				.then(stat => {
// 					// getDetail(url, pid)
// 					// 	.then(stat => res(stat))
// 					// 	.catch(err => rej(err));
// 				})
// 				.catch(err => rej(err));
// 		})
// );
