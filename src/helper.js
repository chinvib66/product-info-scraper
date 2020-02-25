// const cheerio = require("cheerio");
// const axios = require("axios");
// const proxy = {}
const axios = require("axios-https-proxy-fix");
const proxy = {
	host: "172.16.2.30",
	port: 8080
};
const spinner = require("./index").spinner;

const cleanUrl = (url, baseUrl) => {
	if (url[0] == "/")
		if (url[1] == "/") return url.substring(2);
		else return baseUrl + url;
	else return url;
};

const fetchData = async url =>
	new Promise((resolve, reject) => {
		process.stdout.clearLine();
		spinner.message("Fetching " + url.slice(12, 108));
		axios
			.get(url, { proxy })
			.then(resp => {
				resolve(resp.data);
				process.stdout.clearLine();
				spinner.message("Fetched " + url.slice(12, 108) + " | " + resp.status);
			})
			.catch(err => {
				if (err.code == "ECONNRESET") reject({ error: true, detail: "Unable to load url due to network issues" });
				else reject({ error: true, detail: err });
			});
	});

const printProgress = count => {
	process.stdout.clearLine();
	process.stdout.cursorTo(6);
	process.stdout.write(`${count} links found. Finding more...`);
};

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		try {
			await callback(array[index], index, array);
		} catch (e) {
			continue;
		}
	}
}

const cheerioAsyncEach = async (cheerioElement, fn) => {
	var i = 0,
		len = cheerioElement.length;
	let b = true;
	try {
		b = await fn.call(cheerioElement[i], i, cheerioElement[i]);
	} catch (e) {}

	while (i < len && b !== false) ++i;
	return cheerioElement;
};

module.exports = { cleanUrl, fetchData, printProgress, asyncForEach, cheerioAsyncEach };
