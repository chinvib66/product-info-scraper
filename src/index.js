var inquirer = require("inquirer");
const ui = require("clui");
// const stdin = process.stdin;
// stdin.setEncoding("UTF-8");
// stdin.on("data", key => {
// 	if (key.indexOf("stop") == 0) {
// 		process.abort();
// 	}
// });
const config = require("./config");
const connectDb = require("./mongodb/connection");

const spinner = new ui.Spinner("Executing commands...");

console.log("Launching Scraper...");
connectDb().then(() => {
	console.log("MongoDb connected");
	cli();
});
const cli = () => {
	console.log("\n");
	// inquirer
	// 	.prompt({
	// 		type: "input",
	// 		name: "action",
	// 		message: "Type 'start' to proceed towards scraping \n  Type 'exit' to close the cli and exit \n "
	// 	})
	// 	.then(ans => (ans.action === "start" ? scraping() : ans.action.trim() === "exit" ? process.exit() : cli()));
	scraping();
	process.on("SIGINT", function() {
		console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
		console.log("Stopping Processes");
		spinner.stop();
		process.exit();
	});
};

var scraper, keyword;
const scraping = () => {
	inquirer
		.prompt({
			type: "list",
			name: "website",
			message: "Select a website to scrape from the following choices:",
			choices: ["FirstCry.com", "Walmart.com", "Amazon.com"]
		})
		.then(ans => {
			// console.log("You selected", ans.website);
			scraper = require(config.websites[ans.website].scraper);
		})
		.then(() =>
			inquirer
				.prompt({
					type: "list",
					name: "keyword",
					message: "Enter search keyword:",
					choices: config.keywords
				})
				.then(ans => (keyword = ans.keyword))
				.then(() => {
					spinner.start();
					// stdin.resume();
					scraper
						.getList(keyword)
						.then(res => {
							spinner.stop();
							console.log("\n Completed!");
							cli();
						})
						.catch(err => {
							spinner.stop();
							console.log("Some Error occured", err);
							cli();
						});
				})
		)
		.catch(err => {
			spinner.stop();
			cli();
		});
};

module.exports = { spinner };
