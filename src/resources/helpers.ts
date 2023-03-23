export const getRandomItemsFromArray = <T>(arr: T[], count: number): T[] => {
	let n = count;
	const len = arr.length;
	if (n > len) {
		console.log(
			`shuffleArray() > Count of Items(${count}) is Greater than Length of Original Array(${len}) - Retrieving ${
				len - 1
			} Random items`
		);
		n = len - 1;
	}
	return arr
		.map(value => {
			return { value, sort: Math.random() };
		})
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value)
		.slice(0, n);
};
