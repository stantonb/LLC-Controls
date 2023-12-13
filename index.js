import "dotenv/config.js";
import firmData from "./firmData.json"  with { type: "json" };

var cookie = process.env.COOKIE;

async function main(){
	let walletInfo = await getWalletInfo();
	
	let firms = await getProfitableFirms(walletInfo);
	console.log(firms);
}

async function getProfitableFirms(walletInfo){
	let firms = walletInfo?.resp?.firms.filter(firm => firm?.type !== undefined);
	let profitableFirms = [];
	let marketInfo = await getMarketInfo();

	if (!firms || firms.length == 0 || !marketInfo || marketInfo.length == 0) {
		console.log('No firms or market info found');
		return profitableFirms;
	}

	for (let firm of firms) {
		let firmProfit = await getProfit(firm, marketInfo);

		if (firmProfit > 0) {
			profitableFirms.push(firm);
		}
	}

	return profitableFirms;
}

async function getWalletInfo(){
	var myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);

	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};

	const response = await fetch("https://llcgame.io/rpc/authaccounts/getWalletInfo?", requestOptions)

	return response.json();
}

async function getMarketInfo(){
	var myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);
	
	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};
	
	const response = await fetch("https://llcgame.io/rpc/markets/getMarkets?", requestOptions);

	return response.json();
}

async function getProfit(firm, marketInfo){
	let firmType = firm.type;
	let firmInputs = firmData[firmType]?.inputs;
	let firmOutputs = firmData[firmType]?.outputs;

	console.log(firmInputs);
	console.log(firmOutputs);
	
	return 1;
}

main();