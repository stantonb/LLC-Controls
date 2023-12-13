import "dotenv/config.js";
import firmData from "./firmData.json"  with { type: "json" };

var cookie = process.env.COOKIE;

async function main(){
	let walletInfo = await getWalletInfo();
	
	let firms = await getProfitableFirms(walletInfo);
	// console.log(firms);
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
	console.log(firm);

	let firmType = firm.type;
	let firmInputs = firmData[firmType]?.inputs;
	let firmOutputs = firmData[firmType]?.outputs;
	let firmProfit = 0;

	if (!firmInputs || !firmOutputs) {
		console.log('No inputs or outputs found for ' + firmType);
		return 0;
	}

	//loop through inputs and get market price
	for(let key in firmInputs){
		let input = firmInputs[key];
		let marketInputPrice = marketInfo?.resp[key][0]/100;

		if (!input || !marketInputPrice) {
			console.log('No market input found for ' + input?.type);
			return 0;
		}

		switch (firmType) {
			case "factorysmall":
				break;
			default:
				break;
		}
		
		firmProfit += input * marketInputPrice;
	}

	//loop through outputs and get market price
	for(let key in firmOutputs){
		let output = firmOutputs[key];

		// console.log('Key: ' + key);
		// console.log(marketInfo?.resp[key]);

		let marketOutputPrice = marketInfo?.resp[key][0]/100;

		if (!output || !marketOutputPrice) {
			console.log('No market output found for ' + output?.type);
			return 0;
		}

		firmProfit += output * marketOutputPrice;
	}
	
	console.log(firmType + ' profit: ' + firmProfit);

	return firmProfit;
}

main();