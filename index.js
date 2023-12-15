import "dotenv/config.js";
import firmData from "./firmData.json"  with { type: "json" };

let cookie = process.env.COOKIE;

async function main(){
	let walletInfo = await getWalletInfo();
	
	let firms = await getProfitableFirms(walletInfo);

	for (let firm of firms.profitableFirms) {
		toggleFirmStatus(firm, 'opened');
	}

	for (let firm of firms.unprofitableFirms) {
		toggleFirmStatus(firm, 'closed');
	}
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

	for (let firm of firms) {
		let firmProfit = await getProfit(firm, marketInfo);

		if (firmProfit > 0) {
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

	const response = await fetch("https://llcgame.io/rpc/authaccounts/getWalletInfo?", requestOptions)

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

async function getProfit(firm, marketInfo){
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

		//check recipe if factory
		switch (firmType) {
			case "factorysmall":
				let recipe = input[recipe];
				break;
			default:
				break;
		}

		firmProfit += input * marketInputPrice;
	}

	//loop through outputs and get market price
	for(let key in firmOutputs){
		let output = firmOutputs[key];
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

async function toggleFirmStatus(firm, status){
	let myHeaders = new Headers();
	let closed = status == 'closed' ? 1 : 0;
	myHeaders.append("Cookie", cookie);

	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};

	const response = await fetch(`https://llcgame.io/rpc/authfirm/setClosed?id=${firm.id}&closed=${closed}`, requestOptions);
	console.log(firm.name + ' was ' + status);
	return response.json();

}

main();