import { get } from "../API/api.js";

export async function calculateAverageDividends(){
	let allDividends =  await get("https://llcgame.io/rpc/markets/getMarketDetails?goodname=share_LQV")
	let totalDividends = 0;

	for(let dividend of allDividends.resp.tickHistory){
		totalDividends = totalDividends + (dividend?.data?.dividend ?? 0);
	}

	return totalDividends/allDividends.resp.tickHistory.length/100;
}

export async function sortFirms(firms){
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