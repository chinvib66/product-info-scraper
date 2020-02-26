const axios = require("axios");
const rax = require("retry-axios");
const console = require("./console");

const ui = require("clui");

const interceptorId = rax.attach();
const spinner = new ui.Spinner("Executing commands...");

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
			.get(url, {
				raxConfig: {
					retry: 3,
					noResponseRetries: 2,
					retryDelay: 100,
					statusCodesToRetry: [
						[100, 199],
						[429, 429],
						[500, 599]
					],
					backoffType: "exponential",
					onRetryAttempt: err => {
						const cfg = rax.getConfig(err);
						console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
					}
				}
			})
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
	var len = cheerioElement.length;
	for (let i = 0; i < len; i++) {
		await fn(cheerioElement[i], i);
	}
	return cheerioElement;
};

module.exports = { cleanUrl, fetchData, printProgress, asyncForEach, cheerioAsyncEach, spinner };
