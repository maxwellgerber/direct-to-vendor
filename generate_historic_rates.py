import requests
from bs4 import BeautifulSoup
from dateutil.parser import parse
from datetime import datetime

from steem.steemd import Steemd
from steem.instance import set_shared_steemd_instance
from steem.account import Account

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

def get_inbound_steem_transfers(account_name):
	nodes=['https://api.steemit.com', 'https://gtg.steem.house:8090']
	set_shared_steemd_instance(Steemd(nodes=nodes))
	acc = Account('greenman')

	def filter(t):
		return t['to'] == account_name and float(t['amount'].split(' ')[0]) > .1

	return [t for t in acc.history(filter_by=['transfer']) if filter(t)]

def get_inbound_btc_transfers(wallet):
	inbound = []
	wall_data = requests.get(f"https://blockexplorer.com/api/addr/{wallet}").json()
	for t in wall_data['transactions']:
		trans_data = requests.get(f"https://blockexplorer.com/api/tx/{t}").json()
		for recipient in trans_data['vout']:
			if wallet in recipient['scriptPubKey']['addresses']:
				timestamp = datetime.fromtimestamp(float(trans_data['time']))
				from_addrs = [a['addr'] for a in  trans_data['vin']]
				inbound.append({
					"from": from_addrs,
					"id": t,
					"value": recipient['value'],
					"date": timestamp.strftime('%m/%d/%y'),
					"timestamp": timestamp.strftime('%m/%d/%y, %-H:%-M:%-S')
					})

	return inbound

if __name__ == '__main__':
	btc_tx_data = get_inbound_btc_transfers('1MEQxcjgvUugYnJPNB7WSRHurFBoQdcAav')
	sbd_rates = get_historic_rates("steem-dollars")
	steem_rates = get_historic_rates("steem")
	btc_rates = get_historic_rates('bitcoin')
	steem_tx_data = get_inbound_steem_transfers('greenman')

	with open('index.template.html') as f:
		data = f.read()

	t = Template(data)
	out = t.render(
		sbd_rates = sbd_rates,
		steem_rates = steem_rates,
		btc_rates = btc_rates,
		steem_tx_data = steem_tx_data,
		btc_tx_data = btc_tx_data
		)

	print(out)