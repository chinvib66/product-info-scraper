# Product Info Scraper

Topcoder Challenge: [Infant Nutrition - Product info scraper](https://www.topcoder.com/challenges/30116579)

## About

Product Info Scraper is simple scraper cli tool which scrapes data from Amazon.(any domain), Walmart.com, and Firstcry.com. It's aim at scraping baby products. This is my package for Topcoder challenge [Infant Nutrition - Product info scraper](https://www.topcoder.com/challenges/30116579)

It can also be used for scraping any other type of listing on the above sites by editing the keywords config file.

## Deployment

### Docker

To start cli with docker

    > docker-compose up --build -d
    > docker exec -it 'product-info-scraper' /bin/bash
    > npm start or product-info-scraper

<small>_Note_: npm link takes some time to execute after the docker-compose up command, so in that timeframe, 3rd command won't work.</small>

To close

    > docker-compose down

## Usage

### Scraping

- Launch the cli
- Select Scraping
- Select website(s) to scrape
- Specify keyword to scrape

The results will be stored in mongo db the docker container.
\*\* To use custom mongo db, set MONGODB_URI environment variable to the target mongodb uri

### Editing Config File

Launch the cli <br>
Select the Edit Config File option

- Editing Keywords:

  - Add Keyword(s): Select 'Add Keywords' option, type single keyword or multiple keywords separated by comma. <br>Example: baby food,infant nutrition,foods for babies,kid food
  - Delete Keyword(s): Select 'Delete Keywords' option, type single keyword or multiple keywords separated by comma. <br>Example: baby food,infant nutrition

- Editing other keys:
  - Add new key value or change value of existing key: Select 'Set' option and type in following format: "key:value". <br>
    For nested keys, use "key1.key2.key3:value" (resulting in {key1:{key2:{key3:value}}}; here nested keys will be created if they thon't exist)<br>
    <small>_Note: value must be a string. It cannot be a json object (currently unsupported)_</small>
  - Delete key: Select "Delete" optio and type single key to delete.

## Configuration File Format

    - websites
        - name
            - baseUrl
            - scraper (path to scraper file)

    - keywords
        [Array]

## Product Data format

    - pid
    - name
    - keyword
    - description
    - rating
    - price
    - url
    - images []
    - reviews []

#### Note:

- Firstcry loads data using ajax and infinite scroll, thus I've used their service endpoint which returns search product. This endpoint can be edited in config.
- Amazon's any of the domains can be scraped using this cli tool. Just change the domain to required one in the config file
- Walmart first loads html page displaying 0 listings; but has search results embedded in a script tag. In case id of that script tag changes, the walmart script won't work
