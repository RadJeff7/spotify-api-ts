import fs from "fs";
import logger from "./logger";
export const getRandomItemsFromArray = <T>(arr: T[], count: number): T[] => {
	let n = count;
	const len = arr.length;

	if (n > len) {
		logger.info(
			`getRandomItemsFromArray() > Count of Items(${count}) is Greater than Length of Original Array(${len}) - Retrieving ${
				len - 1
			} Random items`
		);
		n = len - 1;
	}

	if (n === 1) return [arr[Math.floor(Math.random() * len)]];

	return arr
		.map(value => {
			return { value, sort: Math.random() };
		})
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value)
		.slice(0, n);
};

export const shuffleArray = <T>(arr: T[]): T[] => {
	return arr
		.map(value => {
			return { value, sort: Math.random() };
		})
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);
};

export const deleteAndCreateFolder = (path: string) => {
	if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });

	if (!fs.existsSync(path)) fs.mkdirSync(path);
};

export const groupsOfN = <T>(arr: T[], n: number): T[][] => {
	const resultArr: T[][] = [];
	while (arr.length) {
		const group = arr.splice(-n);
		resultArr.push(group);
	}
	return resultArr;
};
