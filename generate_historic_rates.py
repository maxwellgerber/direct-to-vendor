import requests
from bs4 import BeautifulSoup
from dateutil.parser import parse

from jinja2 import Template

def get_historic_rates(url):
	result = requests.get(url)

	soup = BeautifulSoup(result.content, "lxml")

	data = {}
	for row in  soup.find_all('tr', "text-right"):
		cols = row.find_all('td')
		cols = [ele.text.strip() for ele in cols]
		avg = (float(cols[1]) + float(cols[2]) + float(cols[3]) + float(cols[4]))/4
		day = parse(cols[0]).strftime('%m/%d/%y')
		data[day] = avg
	return data

sbd_rates = get_historic_rates("https://coinmarketcap.com/currencies/steem-dollars/historical-data/?start=20171201&end=30170101")
steem_rates = get_historic_rates("https://coinmarketcap.com/currencies/steem/historical-data/?start=20171201&end=30170101")

with open('index.template.html') as f:
	data = f.read()

t = Template(data)
out = t.render(sbd = sbd_rates, steem = steem_rates)

print out