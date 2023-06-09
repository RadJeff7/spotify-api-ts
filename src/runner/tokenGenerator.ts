import { PuppeteerBrowser, Server } from "../core";
import * as C from "../resources/constants";
import { sleep } from "../resources/helpers";
const main = async () => {
	let tokenFlowCompleted = false;
	const server = new Server();
	await server.start();
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
		tokenFlowCompleted = true;
	} catch (err) {
		console.log(`tokenGenerator() > headless Browser Authentication > ${err}`);
	}

	if (tokenFlowCompleted) {
		console.log(
			`tokenGenerator() > keep the Terminal Window open - The Token will be auto refreshed periodically(auto-closed after ${C.Default_Server_Uptime_Minutes} minutes) \n - Ready to Run Main Utilities now`
		);
		let serverUptimeMinutes = 0;

		while (serverUptimeMinutes <= C.Default_Server_Uptime_Minutes) {
			console.log(
				`tokenGenerator() > Server will kept on Listen Mode for total of ${
					C.Default_Server_Uptime_Minutes
				} Minutes - will be re-checked after ${
					C.Default_Server_Uptime_Minutes / 4
				} minutes`
			);
			await sleep((C.Default_Server_Uptime_Minutes / 4) * 60 * 1000);
			serverUptimeMinutes = (performance.now() - serverStart) / 1000 / 60;
		}
		if (serverUptimeMinutes > C.Default_Server_Uptime_Minutes) {
			console.log(
				`tokenGenerator() > Trying to close the server Instance - after ${C.Default_Server_Uptime_Minutes} Minutes`
			);
			process.exit(0);
		}
	} else {
		console.log(
			`tokenGenerator() > Token Flow didn't complete - status: ${tokenFlowCompleted}`
		);
		process.exit(1);
	}
};

main().catch(err => {
	console.error(`tokenGenerator() Error >> ${err}`);
	process.exit(-1);
});
