export function getRandomItemsFromArray(arr: any[], count: number) {
	let n = count,
		len = arr.length;
	if (n > len) {
		console.log(
			`getRandomItemsFromArray() > Count of Items(${count}) is Greater than Length of Original Array(${len}) - Retrieving ${
				len - 1
			} Random items`
		);
		n = len - 1;
	}
	const result = new Array(n),
		taken = new Array(len);
	while (n--) {
		const x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result;
}
