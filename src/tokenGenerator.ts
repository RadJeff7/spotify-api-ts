import { Server, PuppeteerBrowser } from "./core";
const sleep = (ms = 5000) => new Promise(r => setTimeout(r, ms));

const main = async () => {
	const server = new Server();
	await server.start();
	await sleep();
	console.log(
		`Server is now Up and Running - Starting headless Browser Authentication`
	);

	const browserUtil = new PuppeteerBrowser();
	try {
		await browserUtil.handleSpotifyAuthorization();
		await sleep();
		console.log(`Headless Browser Authentication Done`);
		await browserUtil.closeBrowserInstance();
	} catch (err) {
		console.log(`tokenGenerator() > headless Browser Authentication > ${err}`);
		await browserUtil.closeBrowserInstance();
	}
};

main();
