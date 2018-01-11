const low_time_cutoff = new Date("2017-12-24T13:09:45").getTime();
const hi_time_cutoff = new Date("2018-01-11").getTime();
const amnt_cutoff = .1;

const distributions = [
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
    steem.api.setOptions({ url: 'https://api.steemit.com' });
	steem.api.getAccountHistory('greenman', 1000000000000000, 10000, function(err, result) {
		console.log('AAAA')
  		var transfers = Array.from(result)
  			.map(d => {return d[1]})
  			.filter(d=> {return d.op[0] == 'transfer'})
  			.filter(d=> {return new Date(d.timestamp).getTime() >= low_time_cutoff})
  			.filter(d=> {return new Date(d.timestamp).getTime() < hi_time_cutoff})
  			// .map(d => {return d[1]})
  			.filter(d => {return d.op[1].to == 'greenman'})
  			.filter(d => {return parseTxAmount(d.op[1].amount).val > amnt_cutoff})
  			.map(d=>{
  				var amount = parseTxAmount(d.op[1].amount);
  				var time_ord = moment(d.timestamp).format('MM/DD/YY');
  				var rate = amount.type == "SBD" ? sbd_prices[time_ord] : steem_prices[time_ord];

  				var disp = $.fn.dataTable.render.number( ',', '.', 2, '$' ).display;

  				console.log(time_ord, rate);
  				return {
  					from:d.op[1].from, 
  					fromLink: `<a href="https://steemit.com/@${d.op[1].from}">@${d.op[1].from}</a>`,
  					value: amount.val,
  					type: amount.type,
  					valText: disp(amount.val) + ' ' + amount.type,
  					timestamp: moment(d.timestamp).format('MM/DD/YYYY, h:m:s'),
  					usd: amount.val * rate,
  					link: `<a href="https://steemd.com/tx/${d.trx_id}">${d.trx_id.substring(0, 6)}...</a>`
  				};
  			})
  		console.log(transfers);

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
		        // { "data":"type", "title":"STEEM/SBD?"  },
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
		        { "data":"valText", "title":"Amount"  },
		        // { "data":"type", "title":"STEEM/SBD?"  },
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
		    	  "render": $.fn.dataTable.render.number( ',', '.', 1, '' )}
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
		        { "title":"# Of Donation"}
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
		        // { "data":"timestamp", "title":"Timestamp"},
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
    	tot_acc = transfers.reduce((acc, val)=> {return acc + val.usd}, 0);
    	donors = Array.from(new Set(transfers.map(d => d.fromLink))).join(', ');

    	$('#raised').text(tot_acc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    	$('#dist').text(tot_dist.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    	$('#donors').html(donors);
  		console.log(transfers);
	});
} );
