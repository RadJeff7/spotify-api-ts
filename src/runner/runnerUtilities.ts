import dotenv from "dotenv";
dotenv.config();
const utilSelected = process.env.UTIL_NAME || "all"; //use 'random' = randomPlaylist Generation, 'weekly' = weeklyPlaylist Generation, 'recommend'= recommedation Playlist Generation - 'all' = all utility
import {
	makeRandomPlaylistsFromDailyMix,
	createWeeklyArchiveFromDiscoverWeekly,
	createRecommendationPlaylist,
	makeSimilarPlaylistFromPlaylist,
} from "../utilities";
import { sleep } from "../resources/helpers";

export const runAllSpotifyUtils = async () => {
	if (utilSelected.match(/random|all/i)) {
		console.log(
			`****** Started Running Function to create Random Playlist from Daily Mix ****** \n\n`
		);
		await makeRandomPlaylistsFromDailyMix();

		console.log(
			`****** Completed Function to create Random Playlist from Daily Mix ******  \n\n`
		);
	}

	if (utilSelected.match(/all/i)) await sleep();

	if (utilSelected.match(/weekly|all/i)) {
		console.log(
			`****** Started Running Function to create Archival Playlist from Discover Weekly ******  \n\n`
		);
		await createWeeklyArchiveFromDiscoverWeekly();

		console.log(
			`****** Completed Function to create Archival Playlist from Discover Weekly ******  \n\n`
		);
	}

	if (utilSelected.match(/all/i)) await sleep();

	if (utilSelected.match(/recommend|all/i)) {
		console.log(
			`****** Started Running Function to create Recommedation Playlist ******  \n\n`
		);
		await createRecommendationPlaylist();

		console.log(
			`****** Completed Function to create create Recommedation Playlist ******  \n\n`
		);
	}

	if (utilSelected.match(/all/i)) await sleep();

	if (utilSelected.match(/playlist|all/i)) {
		await userPlaylistsRecommedationGererator();
	}
};

export const userPlaylistsRecommedationGererator = async (count = 1) => {
	for (let i = 0; i < count; i++) {
		console.log(
			`****** Started Running Function to create Random Similar Playlist ${
				i + 1
			} from User's Playlists ****** \n\n`
		);
		await makeSimilarPlaylistFromPlaylist();
		console.log(
			`****** Completed Function to create Random Similar Playlist ${
				i + 1
			} from User's Playlists ****** \n\n`
		);
	}
};
