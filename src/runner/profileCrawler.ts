import dotenv from "dotenv";
dotenv.config();
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as C from "../resources/constants";
import {
	GivenUsersPlaylistCrawler,
	FollowedUserPlaylistCrawler,
} from "../utilities";

const crawlerSelected = process.env.CRAWLER_UTIL_NAME || "automatic";
//provide "userinput"(anything else than automatic) as CRAWLER_UTIL_NAME to select userInput Flow - By Default automatic flow is used

async function askForUserProfileLink() {
	const ac = new AbortController();
	const signal = ac.signal;
	const timeoutInSeconds = 20;
	let answer = "";
	setTimeout(() => ac.abort(), timeoutInSeconds * 1000);
	const rl = readline.createInterface({ input, output });
	try {
		answer = await rl.question(
			`Provide 1 User Profile Link: [example: ${C.DEFAULT_SPOTIFY_USER.profile_url}]: \n\n`,
			{ signal }
		);
		console.log(`Thank you for sharing the profile Link`);
	} catch (err) {
		console.log(
			`You took too long. Try again within ${timeoutInSeconds} seconds. - Using Default User Profile`
		);
		answer = C.DEFAULT_SPOTIFY_USER.profile_url;
	} finally {
		rl.close();
	}
	return answer.length ? answer : C.DEFAULT_SPOTIFY_USER.profile_url;
}

const PlaylistCrawlerWithUserProfileURLInput = async () => {
	const completeProfileLink = await askForUserProfileLink();
	console.log(
		`PlaylistCrawlerWithInput() > User Profile URL: ${completeProfileLink}`
	);

	console.log(
		`****** Started Running Function to create Random Playlist from User Profile URL  ****** \n\n`
	);

	const recommedingUser = completeProfileLink
		.split("?si")[0]
		.split("/user/")[1];
	console.log(`PlaylistCrawlerWithInput() > User ID: ${recommedingUser}`);

	if (recommedingUser) await GivenUsersPlaylistCrawler(recommedingUser);

	console.log(
		`****** Completed Function to create Random Playlist from User Profile URL  ****** \n\n`
	);
};

const CrawlerForFollowedPlaylistOwnersForNewPlaylist = async (
	count?: number
) => {
	console.log(
		`****** Started Running Function to create Random Playlist from FollowedPlaylistOwners  ****** \n\n`
	);
	await FollowedUserPlaylistCrawler(count);
	console.log(
		`****** Completed Function to create Random Playlist from FollowedPlaylistOwners  ****** \n\n`
	);
};

const main = async () => {
	if (crawlerSelected.match(/auto/i)) {
		await CrawlerForFollowedPlaylistOwnersForNewPlaylist();
	} else {
		await PlaylistCrawlerWithUserProfileURLInput();
	}
};

main()
	.catch(err => {
		console.error(`profileCrawler() Error >> ${err}`);
	})
	.then(() => {
		console.log("END");
		process.exit(0);
	});
