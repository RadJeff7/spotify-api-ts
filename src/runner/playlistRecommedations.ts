import dotenv from "dotenv";
dotenv.config();
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as C from "../resources/constants";
import { makeSimilarPlaylistFromPlaylist } from "../utilities";
import { userPlaylistsRecommedationGererator } from "./runnerUtilities";

const crawlerSelected = process.env.CRAWLER_UTIL_NAME || "automatic";
//provide "userinput"(anything else than automatic) as CRAWLER_UTIL_NAME to select userInput Flow - By Default automatic flow is used

async function askForPlaylistLink() {
	const ac = new AbortController();
	const signal = ac.signal;
	const timeoutInSeconds = 20;
	let answer = "";
	setTimeout(() => ac.abort(), timeoutInSeconds * 1000);
	const rl = readline.createInterface({ input, output });
	try {
		answer = await rl.question(
			`Provide 1 User Playlist Link: [example: ${C.DEFAULT_PLAYLIST_FOR_CRAWL}]: \n\n`,
			{ signal }
		);
		console.log(`Thank you for sharing the Playlist Link`);
	} catch (err) {
		console.log(
			`You took too long. Try again within ${timeoutInSeconds} seconds. - Using Default Playlist`
		);
		answer = C.DEFAULT_PLAYLIST_FOR_CRAWL;
	} finally {
		rl.close();
	}
	return answer.length ? answer : C.DEFAULT_PLAYLIST_FOR_CRAWL;
}

const recommededPlaylistCreateWithPlaylistURLInput = async () => {
	const playlistLink = await askForPlaylistLink();
	console.log(
		`recommededPlaylistCreateWithPlaylistURLInput() > Playlist Link: ${playlistLink}`
	);

	console.log(
		`****** Started Running Function to create Random Playlist from Playlist URL  ****** \n\n`
	);

	const recommedingPlaylistId = playlistLink
		.split("?si")[0]
		.split("/playlist/")[1];

	if (recommedingPlaylistId)
		await makeSimilarPlaylistFromPlaylist(recommedingPlaylistId);

	console.log(
		`****** Completed Function to create Random Playlist from Playlist URL  ****** \n\n`
	);
};

const main = async () => {
	if (crawlerSelected.match(/auto/i)) {
		await userPlaylistsRecommedationGererator(2);
	} else {
		await recommededPlaylistCreateWithPlaylistURLInput();
	}
};

main().catch(err => {
	console.error(`PlaylistRecommedationCreator() Error >> ${err}`);
	process.exit(-1);
});
