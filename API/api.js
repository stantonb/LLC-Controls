import "dotenv/config.js";

let cookie = process.env.COOKIE;

export async function get(url) {
	let myHeaders = new Headers();
	myHeaders.append("Cookie", cookie);

	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	};

	const response = await fetch(url, requestOptions);


	//handle error response
	if (!response.ok) {
		console.log('Error retrieving data, Cookie probably expired');
		return null;
	}
	
	return response.json();
}