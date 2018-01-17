# Direct To Vendor

This is a website dedicatied to show data related to [@Greenman's](https://steemit.com/@greenman) "Direct To Vendor" charity initiative. Here, we tally up all of the donations sent to him and compare it to the amount of money he has distributed in his blog posts. Think of it as a public audit of sorts. 

## Templating and Web Scraping (important!)
This website is templated on the server side for a few reasons. First, there is currently no available free 
public API for historical Steem/SBD/Bitcoin prices. When the website is built, we scrape CoinMarketCap and insert
the data found. Second, querying against the Blockchain to get transaction data going back a few months isn't very fast.
It's much more efficient to collect all the data on the server instead of making the user wait.

However, I'm using Github Pages for hosting, meaning there is no server. So once a week or so I'll rebuild the site and push,
which works out pretty well since I need to add the Disbursements info by hand each week.


#### Requirements
- Python 3.6
- [Steem Python](https://github.com/steemit/steem-python)
- Requests 
- BeautifulSoup4
- Jinja2


To build the website:
```
git clone git@github.com:maxwellgerber/direct-to-vendor.git
cd direct-to-vendor
bash build.sh
open docs/index.html
```