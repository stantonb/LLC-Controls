import "dotenv/config.js";
import firmData from "./firmData.json"  with { type: "json" };
import stockpilingControls from "./stockPileControls.json"  with { type: "json" };
import { calculateAverageDividends, sortFirms } from "./Utils/helpers.js";
import { get } from "./API/api.js";

async function main(){
	let walletInfo = await get("https://llcgame.io/rpc/authaccounts/getWalletInfo?");
	var totalProfitPerHour = 0;

	if (!walletInfo) {
		console.log('No wallet info found');
		return;
	}

	let firms = await calculateProfitableFirms(walletInfo);
	
	console.log("------------------------------------------")

	// for (let firm of firms.profitableFirms) {
	// 	let firmRecipe = firm.data?.recipe;
	// 	let shouldStockpile = stockpilingControls[firmRecipe] && firm.profit < 2;

	// 	toggleFirmStatus(firm, 'opened');
	// 	toggleFirmStockpilingStatus(firm, shouldStockpile, firmRecipe);
	// 	totalProfitPerHour += shouldStockpile ? 0 : firm.profit;
	// }

	for (let firm of firms) {
		let firmRecipe = firm.data?.recipe;
		let shouldProduce = firm.profit > -2;
		let shouldStockpile = stockpilingControls[firmRecipe] && shouldProduce && firm.profit < 2;

		await toggleFirmStatus(firm, shouldProduce);
		await toggleFirmStockpilingStatus(firm, shouldStockpile, firmRecipe);
		totalProfitPerHour += shouldStockpile ? 0 : firm.profit;
		//if stockpile is true and profit is greater than -2 then we want to set selling off and turn firm on
		//else toggle firm off

		// if (stockpilingControls[firm.type]?.stockpile && firm.profit > -2) {
		// 	toggleFirmStockpilingStatus(firm);
		// 	toggleFirmStatus(firm, 'opened');
		// }
	}

	console.log("------------------------------------------")
	console.log(`Hourly Profit: ${totalProfitPerHour}`);
	console.log("------------------------------------------")

	let averageDividends = await calculateAverageDividends();

	console.log("------------------------------------------")
	console.log(`Average Dividends: ${averageDividends}`);
	console.log("------------------------------------------")
}

async function calculateProfitableFirms(walletInfo){
	let firms = walletInfo?.resp?.firms.filter(firm => firm?.type !== undefined);
	// let profitableFirms = [];
	// let unprofitableFirms = [];
	let marketInfo = await get("https://llcgame.io/rpc/markets/getMarkets?");

	if (!firms || firms.length == 0 || !marketInfo || marketInfo.length == 0) {
		console.log('No firms or market info found');
		return [];
	}

	//sort by type then recipe
	firms = await sortFirms(firms);

	for (let firm of firms) {
		if(firm.type == 'supermarket') {
			console.log('Skipping supermarket');
			continue;
		}

		firm.profit = await calculateProfit(firm, marketInfo);

		// if (firm.profit > 0) {
		// 	profitableFirms.push(firm);
		// } else {
		// 	unprofitableFirms.push(firm);
		// }
	}

	// return {
	// 	profitableFirms: profitableFirms,
	// 	unprofitableFirms: unprofitableFirms
	// };
	return firms;
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

async function toggleFirmStatus(firm, shouldProduce){
	console.log(firm.name);
	console.log(firm.closed);
	console.log(shouldProduce);

	if (!firm.closed == shouldProduce){
		// console.log(firm.name + ' is already ' + status);
		return;
	}

	// await get(`https://llcgame.io/rpc/authfirm/setClosed?id=${firm.id}&closed=${shouldProduce}`);
	console.log(firm.name + ' was turned ' + (shouldProduce ? 'on' : 'off'));
}

async function toggleFirmStockpilingStatus(firm, shouldStockpile, firmRecipe){
	if (!firmRecipe || !!firm?.data?.hold == shouldStockpile){ //if firm recipe doesnt exist its because its a turbine, whihc doesnt produce anything you can stockpile
		// console.log(firm.name + ' is already has stock piling set to ' + shouldStockpile);
		return;
	}

	// await get(`https://llcgame.io/rpc/authfirm/setHold?id=${firm.id}&hold=${shouldStockpile}`);
	console.log(firm.name + ' stockpiling was set to ' + (shouldStockpile ? 'on' : 'off'));
}

main();

// I want to check historical data for all resources
// if profit is +ve right now I want to sell
// if profit is -ve I want to check if it within 5% of historical average
	//if so I want to turn firm on but turn off selling
	//if outside 5% I want to stop firm


//TODO
//apartments run at -ve profit most of the time but increase foot traffic to superMarkets, so need to check supermarket profit is > than total apartments -ve

