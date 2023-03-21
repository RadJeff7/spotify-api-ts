import { createWeeklyArchive } from "./core";

const main = async () => {
	await createWeeklyArchive();
};

main().catch(err => {
	console.error(`Error >> ${err}`);
});
