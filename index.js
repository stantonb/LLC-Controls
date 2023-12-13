import "dotenv/config.js";

var cookie = process.env.COOKIE;

async function main(){
	var walletInfo = await getWalletInfo();
	
	var firms = await getProfitableFirms(walletInfo);
	console.log(firms);	
}

async function getProfitableFirms(walletInfo){
	var firms = walletInfo?.resp?.firms;
	var profitableFirms = [];

	if (!firms) {
		console.log('No firms found');
		return profitableFirms;
	}

	for (let firm of firms) {
		let firmProfit = await getProfite(firm);

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

async function getProfite(firm){
	return 1;
}
main();