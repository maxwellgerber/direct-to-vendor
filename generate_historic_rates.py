import requests
from bs4 import BeautifulSoup
from dateutil.parser import parse
from datetime import datetime

from jinja2 import Template

def get_historic_rates(currency):
	url = "https://coinmarketcap.com/currencies/{}/historical-data/?start=20171201&end=30170101".format(currency)
	result = requests.get(url)

	soup = BeautifulSoup(result.content, "lxml")

	data = {}
	for row in  soup.find_all('tr', "text-right"):
		cols = row.find_all('td')
		cols = [ele.text.strip() for ele in cols]
		avg = (float(cols[1]) + float(cols[2]) + float(cols[3]) + float(cols[4]))/4
		day = parse(cols[0]).strftime('%m/%d/%y')
		data[day] = avg
	#  Chart doesn't include today, so we need to get that seperately. 

	url = "https://api.coinmarketcap.com/v1/ticker/{}/".format(currency)
	today_json = requests.get(url).json()
	today = datetime.now().strftime('%m/%d/%y')
	data[today] = float(today_json[0]["price_usd"])
	return data

sbd_rates = get_historic_rates("steem-dollars")
steem_rates = get_historic_rates("steem")

with open('index.template.html') as f:
	data = f.read()

t = Template(data)
out = t.render(sbd = sbd_rates, steem = steem_rates)

print out