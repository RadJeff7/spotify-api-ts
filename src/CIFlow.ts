import dotenv from "dotenv";
dotenv.config();
const utilSelected = process.env.UTIL_NAME || "all"; //use 'random' = randomPlaylist Generation, 'weekly' = weeklyPlaylist Generation, 'all' = all utility
import {
	Server,
	PuppeteerBrowser,
	makeRandomPlaylists,
	createWeeklyArchiveFromDiscoverWeekly,
} from "./core";
const sleep = (ms = 5000) => new Promise(r => setTimeout(r, ms));

const actionsStatus: { [key: string]: boolean } = {
	server: false,
	auth: false,
	playlistUtil_1: false,
	playlistUtil_2: false,
};

const main = async () => {
	try {
		const server = new Server();
		await server.start();
		actionsStatus.server = true;
	} catch (error) {
		console.error(`tokenGenerator() > Error in server > ${error}`);
	}
	const serverStart = performance.now();
	await sleep();
	console.log(
		`tokenGenerator() > Server is now Up and Running - Starting headless Browser Authentication`
	);

	const browserUtil = new PuppeteerBrowser();
	try {
		await browserUtil.handleSpotifyAuthorization();
		await sleep();
		console.log(`tokenGenerator() > Headless Browser Authentication Done`);
		await browserUtil.closeBrowserInstance();
		actionsStatus.auth = true;
	} catch (err) {
		console.error(
			`tokenGenerator() > Error in headless Browser Authentication > ${err}`
		);
		await browserUtil.closeBrowserInstance();
	}
	if (actionsStatus.auth) {
		console.log(`tokenGenerator() >  Ready to Run Main Utilities now`);
		await sleep();
		if (utilSelected.match(/random|all/i)) {
			try {
				console.log(
					`****** Started Running Function to create Random Playlist from Daily Mix ****** \n\n`
				);
				await makeRandomPlaylists();
				console.log(
					`****** Completed Function to create Random Playlist from Daily Mix ******  \n\n`
				);
				actionsStatus.playlistUtil_1 = true;
			} catch (err) {
				console.error(`Error in Random Playlist from Daily Mix -> ${err}`);
			}
		}
		if (utilSelected.match(/all/i)) await sleep();
		if (utilSelected.match(/weekly|all/i)) {
			try {
				console.log(
					`****** Started Running Function to create Archival Playlist from Discover Weekly ******  \n\n`
				);
				await createWeeklyArchiveFromDiscoverWeekly();

				console.log(
					`****** Completed Function to create Archival Playlist from Discover Weekly ******  \n\n`
				);
				actionsStatus.playlistUtil_2 = true;
			} catch (err) {
				console.error(
					`Error in creating Archival Playlist from Discover Weekly -> ${err}`
				);
			}
		}
		const allUtilsPassed = Object.values(actionsStatus).every(i => i);
		if (allUtilsPassed) {
			const totalTime = (performance.now() - serverStart) / 1000;

			console.log(
				`Total Time Taken in Running all utils is - ${totalTime} seconds`
			);
			process.exit(0);
		} else {
			console.log(
				`All Utils didn't pass every step -> Status: ${JSON.stringify(
					actionsStatus
				)}`
			);
			process.exit(1);
		}
	} else {
		console.log(
			`AUth Utils Didnt Pass -> Skipping rest -> Status: ${JSON.stringify(
				actionsStatus
			)}`
		);
		process.exit(1);
	}
};

main().catch(err => {
	console.error(`Error >> ${err}`);
	process.exit(-1);
});
