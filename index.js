const low_time_cutoff = new Date("2017-12-24T13:09:45").getTime();
const amnt_cutoff = .1;

const distributions = [
{
	location: "Mexico",
	base: 4000,
	baseText: '$4,000.00 Pesos',
	rate: .054,
	rateText: ".054 Peso/USD",
	link: "https://steemit.com/bitcoin/@greenman/more-stunning-pictures-from-my-travels-and-i-ran-out-of-money-again-giving-4-000-peso-it-away-direct-to-vendors-and-why-bitcoin"
},
{
	location: "Mexico",
	base: 5000,
	baseText: '$5,000.00 Pesos',
	rate: .052,
	rateText: ".052 Peso/USD",
	link: "https://steemit.com/travel/@greenman/giving-money-away-in-mexico-direct-to-vendor-usd5-000-pesos-bitcoin-gains-being-shared-as-well"
},
{
	location: "Mexico",
	base: 1900,
	baseText: '$1,900.00 Pesos',
	rate: .052,
	rateText: ".052 Peso/USD",
	link: "https://steemit.com/photography/@greenman/2000-followers-ripple-is-not-going-up-because-the-masses-are-moving-in-ripple-is-going-up-because-banks-are-buying-it-update-on"
}
].map(d=> {
	d.usd = d.base * d.rate;
	d.link = `<a href="${d.link}">Link</a>`;
	return d;
})

function parseTxAmount(amnt) {
	var tokens = amnt.split(' ');
	return {
		val: parseFloat(tokens[0]),
		type: tokens[1]
	}
}

$(document).ready(function() {
	$.fn.dataTable.moment( 'MM/DD/YYYY, h:m:s' );
	var transfers = Array.from(raw_steem_tx_data)
		.filter(d=> {return new Date(d.timestamp).getTime() >= low_time_cutoff})
		// .filter(d=> {return d.to == 'greenman'})
		// .filter(d => {return parseTxAmount(d.amount).val > amnt_cutoff})
		.map(d=>{
			var amount = parseTxAmount(d.amount);
			var time_obj = moment(d.timestamp)
			var time_ord = time_obj.format('MM/DD/YY');
			while (sbd_prices[time_ord] === undefined) {
				time_obj = time_obj.subtract(1, "days");
				time_ord = time_obj.format('MM/DD/YY');
			};
			var rate = amount.type == "SBD" ? sbd_prices[time_ord] : steem_prices[time_ord];

			var disp = $.fn.dataTable.render.number( ',', '.', 2, '' ).display;

			console.log(time_ord, rate);
			return {
				from:d.from, 
				fromLink: `<a href="https://steemit.com/@${d.from}">@${d.from}</a>`,
				value: amount.val,
				type: amount.type,
				valText: disp(amount.val) + ' ' + amount.type,
				timestamp: moment(d.timestamp).format('MM/DD/YYYY, h:m:s'),
				usd: amount.val * rate,
				link: `<a href="https://steemd.com/tx/${d.trx_id}">${d.trx_id.substring(0, 6)}...</a>`
			};
		});

	// {'id': '7d5b5bf7d501a1a97d89c39038edf31050efc161c637bc9e47a9d885ca9c1c1d', 'value': '0.14867928', 'date': '01/08/18', 'timestamp': '...'}
	var btc_transfers = Array.from(raw_btc_tx_data)
		.map(d=>{
			var amount = parseFloat(d.value);
			var rate = btc_prices[d.date];

			var disp = $.fn.dataTable.render.number( ',', '.', 2, '' ).display;

			return {
				value: amount,
				from: d.from[0],
				timestamp: d.timestamp,
				usd: amount * rate,
				fromLink: `<a href="https://blockexplorer.com/address/${d.from[0]}">${d.from[0]}</a>`,
				link: `<a href="https://blockexplorer.com/tx/${d.id}">${d.id.substring(0, 6)}...</a>`
			};
		})

	var most_donors = Object.entries(transfers.reduce((acc, current) => {
		if (acc[current.from] == undefined) {
			acc[current.from] = 0;
		}
		acc[current.from] += current.usd;
		return acc;
	},{})).map(o => [`<a href="https://steemit.com/@${o[0]}">@${o[0]}</a>`, o[1]])

	var freq_donors = Object.entries(transfers.reduce((acc, current) => {
		if (acc[current.from] == undefined) {
			acc[current.from] = 0;
		}
		acc[current.from] += 1;
		return acc;
	},{})).map(o => [`<a href="https://steemit.com/@${o[0]}">@${o[0]}</a>`, o[1]])

	console.log(most_donors);

	$('#all_transactions').DataTable({
		data: transfers,
	    columns: [
	        { "data":"fromLink", "title":"From" },
	        { "data":"timestamp", "title":"Timestamp"},
	        { "data":"valText", "title":"Amount"  },
	        { "data":"usd", "title":"USD Value<sup>*</sup>",
	    	  "render": $.fn.dataTable.render.number( ',', '.', 2, '$' )},
	        { "data":"link", "title":"Link"  }
	    ],
	    lengthChange: false,
        info:     false,
	    order: [[1, 'desc']]
	});

	$('#btc_transactions').DataTable({
		data: btc_transfers,
	    columns: [
	        { "data":"fromLink", "title":"From" },
	        { "data":"timestamp", "title":"Timestamp"},
	        { "data":"value", "title":"Amount"  },
	        { "data":"usd", "title":"USD Value<sup>*</sup>",
	    	  "render": $.fn.dataTable.render.number( ',', '.', 2, '$' )},
	        { "data":"link", "title":"Link"  }
	    ],
	    lengthChange: false,
        info:     false,
	    order: [[1, 'desc']]
	});
	$('#largest_transactions').DataTable({
		data: transfers,
	    columns: [
	        { "data":"fromLink", "title":"From" },
	        { "data":"timestamp", "title":"Timestamp"},
	        { "data":"value", "title":"Amount"  },
	        { "data":"usd", "title":"USD Value<sup>*</sup>",
	    	  "render": $.fn.dataTable.render.number( ',', '.', 2, '$' )},
	        { "data":"link", "title":"Link"  }
	    ],
	    lengthChange: false,
        info:     false,
        searching: false,
        pageLength: 5,
	    order: [[3, 'desc']]
	});

	$('#total_transactions').DataTable({
		data: most_donors,
	    columns: [
	        { "title":"From" },
	        { "title":"Total USD Value<sup>*</sup>",
	    	  "render": $.fn.dataTable.render.number( ',', '.', 2, '$' )}
	    ],
	    lengthChange: false,
        info:     false,
        pageLength: 5,
        searching: false,
	    order: [[1, 'desc']]
	});

	$('#frequent_transactions').DataTable({
		data: freq_donors,
	    columns: [
	        { "title":"From" },
	        { "title":"# Of Donations"}
	    ],
	    lengthChange: false,
        info:     false,
        searching: false,
        pageLength: 5,
	    order: [[1, 'desc']]
	});

	$('#distributions').DataTable({
		data: distributions,
	    columns: [
	        { "data":"location", "title":"Location"  },
	        { "data":"baseText", "title":"How Much?"  },
	        { "data":"rateText", "title":"Exchange Rate<sup>*</sup>"},
	        { "data":"usd", "title":"USD Value",
	    	  "render": $.fn.dataTable.render.number( ',', '.', 2, '$' )},
	        { "data":"link", "title":"Link"  }
	    ],
	    lengthChange: false,
        info:     false,
        searching: false,
        pagination: false,
        pageLength: 5
	});

	tot_dist = distributions.reduce((acc, val)=> {return acc + val.usd}, 0);
	tot_acc = transfers.reduce((acc, val)=> {return acc + val.usd}, 0) + 
			  btc_transfers.reduce((acc, val)=>{return acc + val.usd}, 0);
	donors = Array.from(new Set(transfers.map(d => d.fromLink))).join(', ');

	$('#raised').text(tot_acc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
	$('#dist').text(tot_dist.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
	$('#donors').html(donors);

	console.log(transfers);
	$("#table-holder").show();
	$("#loader-holder").hide();
});
