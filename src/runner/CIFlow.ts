import { PuppeteerBrowser, Server } from "../core";
import { runAllSpotifyUtils } from "./runnerUtilities";

const sleep = (ms = 5000) => new Promise(r => setTimeout(r, ms));
const actionsStatus: { [key: string]: boolean } = {
	server: false,
	auth: false,
	playlistUtils: false,
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
	}
	if (actionsStatus.auth) {
		console.log(`tokenGenerator() >  Ready to Run Main Utilities now`);
		await sleep();
		await runAllSpotifyUtils();
		actionsStatus.playlistUtils = true;
		const allUtilsPassed = Object.values(actionsStatus).every(i => i);
		if (allUtilsPassed) {
			const totalTime = (performance.now() - serverStart) / 1000;

			console.log(
				`Total Time Taken in Running all utils is - ${totalTime.toFixed(
					2
				)} seconds`
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
			`Auth Utils Didnt Pass -> Skipping rest -> Status: ${JSON.stringify(
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
