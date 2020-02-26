const inquirer = require("inquirer");
const editJsonFile = require("edit-json-file");

const config = require("./config");
var file = editJsonFile(`${__dirname}/config.json`, { autosave: true });
const helper = require("./helper");
const console = require("./console");

const connectDb = require("./mongodb/connection");

const spinner = require("./helper").spinner;

const edit = () => {
	console.log("\n Editing Config File\n");
	console.log(file.toObject(), "\n");
	inquirer
		.prompt({
			type: "list",
			name: "task",
			message: "Select Action",
			choices: ["Set", "Add Keyword(s)", "Delete Keyword(s)", "Delete", "Go Back"]
		})
		.then(ans => {
			ans.task === "Set"
				? inquirer
						.prompt({
							type: "input",
							name: "set",
							message: "Type changes in format specified. (Refer Readme) \n"
						})
						.then(ans => {
							let key = ans.set.split(":")[0],
								val = ans.set.split(":")[1];
							try {
								let v = JSON.parse(val);
								val = v;
							} catch (error) {}
							file.set(key, val);
						})
						.then(() => edit())
						.catch(err => {
							console.log(err);
							edit();
						})
				: ans.task === "Add Keyword(s)"
				? inquirer
						.prompt({
							type: "input",
							name: "add",
							message: "Type keywords in format specified. (Refer Readme) \n"
						})
						.then(ans => {
							file.set("keywords", [...file.get("keywords"), ...ans.add.split(",")]);
						})
						.then(() => edit())
						.catch(err => {
							console.log(err);
							edit();
						})
				: ans.task === "Delete Keyword(s)"
				? inquirer
						.prompt({
							type: "input",
							name: "del",
							message: "Type keywords in format specified. (Refer Readme) \n"
						})
						.then(ans => {
							let toDelete = ans.del.split(",");
							file.set(
								"keywords",
								[...file.get("keywords")].filter(ele => {
									return toDelete.indexOf(ele) === -1;
								})
							);
						})
						.then(() => edit())
						.catch(err => {
							console.log(err);
							edit();
						})
				: ans.task === "Delete"
				? inquirer
						.prompt({
							type: "input",
							name: "delete",
							message: "Type changes in format specified. (Refer Readme) \n"
						})
						.then(ans => {
							file.unset(ans.delete);
						})
						.then(() => edit())
						.catch(err => {
							console.log(err);
							edit();
						})
				: tasks();
		});
};

const tasks = () => {
	console.log("\n");
	const taskChoices = ["Start Scraping", "View & Edit Config", "Quit"];
	inquirer
		.prompt({
			type: "list",
			name: "action",
			message: "Select the task: ",
			choices: taskChoices
		})
		.then(ans =>
			ans.action === taskChoices[0]
				? scraping()
				: ans.action === taskChoices[1]
				? edit()
				: ans.action === taskChoices[2]
				? process.exit()
				: tasks()
		)
		.catch(() => tasks());
};

var scraper, keyword;
const scraping = () => {
	console.log("\n");
	inquirer
		.prompt({
			type: "list",
			name: "website",
			message: "Select a website to scrape from the following choices:",
			choices: [...Object.keys(config.websites), "All", "Go Back", "Exit the tool"]
		})
		.then(ans => {
			// console.log("You selected", ans.website);
			if (ans.website == "Go Back") {
				tasks();
				return;
			} else if (ans.website == "Exit the tool") {
				process.exit();
			} else if (ans.website == "All") {
				scrapeAll();
				return;
			} else scraper = require(config.websites[ans.website].scraper);
			inquirer
				.prompt({
					type: "list",
					name: "keyword",
					message: "Enter search keyword:",
					choices: [...config.keywords, "Custom Keyword", "Go Back", "Exit the tool"]
				})
				.then(ans => {
					if (ans.keyword == "Custom Keyword") {
						inquirer
							.prompt({ type: "input", key: "custom", message: "Enter Keyword" })
							.then(answ => {
								keyword = answ.custom;
							})
							.catch(err => {
								console.log("Some Error occured", err);
								tasks();
							});
					} else if (ans.keyword == "Go Back") {
						scraping();
						return;
					} else if (ans.keyword == "Exit the tool") process.exit();
					else keyword = ans.keyword;
					spinner.start();
					// process.stdout.write("\033c");
					scraper
						.getList(keyword)
						.then(res => {
							spinner.stop();
							console.log("\nCompleted!");
							tasks();
						})
						.catch(err => {
							spinner.stop();
							console.log("Some Error occured", err);
							tasks();
						});
				})
				.catch(err => {
					console.log(err);
					spinner.stop();
					tasks();
				});
		})
		.catch(err => {
			console.log(err);
			spinner.stop();
			tasks();
		});
};

const scrapeAll = () => {
	spinner.start();
	helper
		.asyncForEach(
			[...Object.keys(config.websites)],
			async site =>
				new Promise((resolve, reject) => {
					scraper = require(config.websites[site].scraper);
					helper
						.asyncForEach(
							[...config.keywords],
							async kword =>
								new Promise((res, rej) => {
									scraper
										.getList(kword)
										.then(stat => {
											res(true);
										})
										.catch(err => {
											rej(err);
										});
								})
						)
						.then(res => resolve(true))
						.catch(err => reject(err));
				})
		)
		.then(stat => {
			spinner.stop();
			console.log("\nCompleted!");
			tasks();
		})
		.catch(err => {
			console.log(err);
			spinner.stop();
			tasks();
		});
};
// process.stdout.write('\033c');

console.log("Launching Scraper...");
connectDb()
	.then(() => {
		console.log("MongoDb connected");
		tasks();
	})
	.catch(err => {
		console.log(err);
		process.exit();
	});
