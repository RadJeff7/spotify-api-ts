import dotenv from "dotenv";
dotenv.config();
const operationSelected = process.env.CUSTOM_UTIL || "all"; //use 'random' = randomPlaylist Generation, 'weekly' = weeklyPlaylist Generation, 'all' = all available utility
import {
	makeRandomPlaylists,
	createWeeklyArchiveFromDiscoverWeekly,
} from "./core";
const sleep = (ms = 5000) => new Promise(r => setTimeout(r, ms));
const main = async () => {
	if (operationSelected.match(/random|all/i)) {
		console.log(
			`****** Started Running Function to create Random Playlist from Daily Mix ****** \n\n`
		);
		await makeRandomPlaylists();

		console.log(
			`****** Completed Function to create Random Playlist from Daily Mix ******  \n\n`
		);
	}

	if (operationSelected.match(/all/i)) await sleep();

	if (operationSelected.match(/weekly|all/i)) {
		console.log(
			`****** Started Running Function to create Archival Playlist from Discover Weekly ******  \n\n`
		);
		await createWeeklyArchiveFromDiscoverWeekly();

		console.log(
			`****** Completed Function to create Archival Playlist from Discover Weekly ******  \n\n`
		);
	}
};

main().catch(err => {
	console.error(`Error >> ${err}`);
});
