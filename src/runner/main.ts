import { runAllSpotifyUtils } from "./runnerUtilities";
const main = async () => {
	await runAllSpotifyUtils();
};

main().catch(err => {
	console.error(`Error >> ${err}`);
});
