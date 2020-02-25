module.exports = {
	author: "Chinmay Vibhute",
	username: "chinvib66",
	websites: {
		["Walmart.com"]: {
			baseUrl: "https://www.walmart.com",
			scraper: "./scrapers/walmartScraper"
		},
		["Amazon.com"]: {
			baseUrl: "https://www.amazon.com",
			scraper: "./scrapers/amazonScraper"
		},
		["FirstCry.com"]: {
			baseUrl: "https://www.firstcry.com",
			searchEndpoint: "/svcs/search.svc/GetSearchPagingProducts_new?PageSize=20&Q=",
			scraper: "./scrapers/firstcryScraper"
		}
	},
	keywords: ["baby food", "infant nutrition", "baby foods"]
};
