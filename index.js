import "dotenv/config.js";
import firmData from "./firmData.json"  with { type: "json" };
import stockpilingControls from "./stockPileControls.json"  with { type: "json" };

let cookie = process.env.COOKIE;

async function main(){
	let walletInfo = await getWalletInfo();
	var totalProfitPerHour = 0;

	if (!walletInfo) {
		console.log('No wallet info found');
		return;
	}

	let firms = await getProfitableFirms(walletInfo);
	
	console.log("------------------------------------------")

	for (let firm of firms.profitableFirms) {
		totalProfitPerHour += firm.profit;
		toggleFirmStatus(firm, 'opened');

		//if stockpile is true then we want to set selling off
		// else selling is not on already we want to turn it on
	}

	for (let firm of firms.unprofitableFirms) {
		toggleFirmStatus(firm, 'closed');
	}

	console.log("------------------------------------------")
	console.log(`Hourly Profit: ${totalProfitPerHour}`);
	console.log("------------------------------------------")

	let averageDividends = await calculateAverageDividends();

	console.log("------------------------------------------")
	console.log(`Average Dividends: ${averageDividends}`);
	console.log("------------------------------------------")
}

async function getProfitableFirms(walletInfo){
	let firms = walletInfo?.resp?.firms.filter(firm => firm?.type !== undefined);
	let profitableFirms = [];
	let unprofitableFirms = [];
	let marketInfo = await getMarketInfo();

	if (!firms || firms.length == 0 || !marketInfo || marketInfo.length == 0) {
		console.log('No firms or market info found');
		return profitableFirms;
	}

	//sort by type then recipe
	firms = await sortFirms(firms);

	for (let firm of firms) {
		if(firm.type == 'supermarket') {
			console.log('Skipping supermarket');
			continue;
		}

		firm.profit = await calculateProfit(firm, marketInfo);

		if (firm.profit > 0) {
			profitableFirms.push(firm);
		} else {
			unprofitableFirms.push(firm);
		}
	}

	return {
		profitableFirms: profitableFirms,
		unprofitableFirms: unprofitableFirms
	};
}

async function getWalletInfo(){
	let myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);

	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};

	const response = await fetch("https://llcgame.io/rpc/authaccounts/getWalletInfo?", requestOptions);

	//handle error response
	if (!response.ok) {
		console.log('Error getting wallet info, Cookie probably expired');
		return null;
	}

	return response.json();
}

async function getMarketInfo(){
	let myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);
	
	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};
	
	const response = await fetch("https://llcgame.io/rpc/markets/getMarkets?", requestOptions);

	return response.json();
}

async function calculateProfit(firm, marketInfo) {
	let firmType = firm.type;
	let recipe = firm.data?.recipe;
	let firmInputs = firmData[firmType]?.inputs || firmData[firmType][recipe]?.inputs;
	let firmOutputs = firmData[firmType]?.outputs || firmData[firmType][recipe]?.outputs;
	let firmTax = firmData[firmType]?.tax || firmData[firmType][recipe]?.tax || 0;
	let firmProfit = 0;
	let firmOutputTotal = 0;
	let firminputTotal = 0;

	if (!firmInputs || !firmOutputs) {
		console.log('No inputs or outputs found for ' + firmType);
		return 0;
	}

	//loop through outputs and get market price
	for(let key in firmOutputs){

		let output = firmOutputs[key];
		let marketOutputPrice = marketInfo?.resp[key][0]/100;

		if (!output || !marketOutputPrice) {
			console.log('No market output found for ' + output?.type);
			return 0;
		}

		firmOutputTotal += output * marketOutputPrice;
	}

	//loop through inputs and get market price
	for(let key in firmInputs){
		let input = firmInputs[key];
		let marketInputPrice = marketInfo?.resp[key][0]/100;

		if (!input || !marketInputPrice) {
			console.log('No market input found for ' + input?.type);
			return 0;
		}

		firminputTotal += input * marketInputPrice;
	}

	firmProfit = firmOutputTotal - firminputTotal - firmTax;

	console.log(firmType + ' ' + (recipe ? recipe + ' ' : '') + 'profit: ' + firmProfit);

	return firmProfit;
}

async function toggleFirmStatus(firm, status){
	let shouldClose = status == 'closed' ? 1 : 0;

	if (firm.closed == shouldClose){
		console.log(firm.name + ' is already ' + status);
		return;
	}

	let myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);

	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};

	const response = await fetch(`https://llcgame.io/rpc/authfirm/setClosed?id=${firm.id}&closed=${shouldClose}`, requestOptions);
	
	console.log(firm.name + ' was ' + status);
	return response.json();
}

async function getDividends(){
	let myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);

	var requestOptions = {
		method: 'GET',
		redirect: 'follow'
	};
	
	const response = await fetch("https://llcgame.io/rpc/markets/getMarketDetails?goodname=share_LQV", requestOptions)

	return response.json();
}

async function calculateAverageDividends(){
	let allDividends = await getDividends();
	let totalDividends = 0;

	for(let dividend of allDividends.resp.tickHistory){
		totalDividends = totalDividends + (dividend?.data?.dividend ?? 0);
	}

	return totalDividends/allDividends.resp.tickHistory.length/100;
}

async function sortFirms(firms){
	return firms.sort((a, b) => {
		if (a.type < b.type) {
			return -1;
		} else if (a.type > b.type) {
			return 1;
		} else {
			if (a.data?.recipe < b.data?.recipe) {
				return -1;
			} else if (a.data?.recipe > b.data?.recipe) {
				return 1;
			} else {
				return 0;
			}
		}
	});
}

main();



// I want to check historical data for all resources
// if profit is +ve right now I want to sell
// if profit is -ve I want to check if it within 5% of historical average
	//if so I want to turn firm on but turn off selling
	//if outside 5% I want to stop firm


//TODO
//apartments run at -ve profit most of the time but increase foot traffic to superMarkets, so need to check supermarket profit is > than total apartments -ve

