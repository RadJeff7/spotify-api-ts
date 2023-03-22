import {
	makeRandomPlaylists,
	createWeeklyArchiveFromDiscoverWeekly,
} from "./core";

const main = async () => {
	console.log(
		`****** Started Running Function to create Random Playlist from Daily Mix ****** \n\n`
	);
	await makeRandomPlaylists();

	console.log(
		`****** Completed Function to create Random Playlist from Daily Mix ******  \n\n`
	);
	await sleep();

	console.log(
		`****** Started Running Function to create Archival Playlist from Discover Weekly ******  \n\n`
	);
	await createWeeklyArchiveFromDiscoverWeekly();

	console.log(
		`****** Completed Function to create Archival Playlist from Discover Weekly ******  \n\n`
	);
};

main().catch(err => {
	console.error(`Error >> ${err}`);
});

const sleep = (ms = 5000) => new Promise(r => setTimeout(r, ms));
