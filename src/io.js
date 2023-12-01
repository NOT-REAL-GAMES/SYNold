export async function getJSON(path){
	var result;
	await fetch(path).then(
		(response) => response.json()
	).then(
		(json) => {result = json;}
	);	
	return result;
}

export async function getRaw(path){
	var result;
	await fetch(path).then(
		(response) => {result = response.text();}
	);	
	return result;
}