import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import * as commons from "./commonFunctions";
import { Playlists } from "../core";
import { PlaylistDetails } from "../types";

const userPlaylistCrawler = async () => {
	const playlistUtil = new Playlists();
	const completeProfileLink = await askForUserProfileLink();
	console.log(
		`userPlaylistCrawler() > User Profile URL: ${completeProfileLink}`
	);

	const recommedingUser = completeProfileLink
		.split("?si")[0]
		.split("/user/")[1];
	console.log(`userPlaylistCrawler() > User ID: ${recommedingUser}`);

	const userDetails = await playlistUtil.getUserDetails(recommedingUser);
	console.log(
		`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Followers: ${userDetails.followers?.total}`
	);

	const totalInputUserPlaylists = await playlistUtil.getAllUserPlaylists(
		recommedingUser
	);
	const inputPlaylists =
		totalInputUserPlaylists.length > 20
			? Helpers.getRandomItemsFromArray(totalInputUserPlaylists, 20)
			: totalInputUserPlaylists;
	console.log(
		`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Total User Playlists >> ${totalInputUserPlaylists.length}`
	);
	console.log(
		`userPlaylistCrawler() > User: ${
			userDetails.display_name
		} - Playlists selected for mix >> ${
			inputPlaylists.length
		} >> Names: ${inputPlaylists.map(i => i.name).join(", ")} \n\n`
	);

	const sourcePlaylists: PlaylistDetails[] = inputPlaylists
		.map(playlist => {
			return {
				id: playlist.id,
				name: playlist.name,
				owner: playlist.owner?.display_name,
			};
		})
		.filter(i => {
			return !i.owner?.toLowerCase().includes("spotify");
		});

	if (!sourcePlaylists || !sourcePlaylists.length) {
		throw new Error(
			`userPlaylistCrawler() > Source Playlists not found - skipping rest of the process`
		);
	}

	const targetPlaylistDetails = C.RecommendationsPlaylistFromUser;
	targetPlaylistDetails.name = targetPlaylistDetails.name.replace(
		/user/gi,
		userDetails.display_name || "User"
	);
	targetPlaylistDetails.description = `${targetPlaylistDetails.description.replace(
		/user/gi,
		userDetails.display_name || "User"
	)}${completeProfileLink}`;

	let newPlaylist: PlaylistDetails;

	const targetPlaylistExistsInCurrentUser = (
		await playlistUtil.getAllUserPlaylists()
	).find(i => i.name === targetPlaylistDetails.name);
	if (!targetPlaylistExistsInCurrentUser) {
		console.log(
			`userPlaylistCrawler() > ${targetPlaylistDetails.name} needs to be created in Current User profile`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			targetPlaylistDetails.name,
			targetPlaylistDetails.description
		);
	} else {
		console.log(
			`userPlaylistCrawler() > ${targetPlaylistDetails.name} already exists in Current User profile`
		);
		newPlaylist = {
			id: targetPlaylistExistsInCurrentUser.id,
			name: targetPlaylistExistsInCurrentUser.name,
			owner: targetPlaylistExistsInCurrentUser.owner?.display_name,
		};
	}
	console.log(
		`userPlaylistCrawler() > Target Playlist >> ${JSON.stringify(newPlaylist)}`
	);
	if (newPlaylist) {
		const forcefulImageUpdate =
			userDetails.display_name === C.DEFAULT_SPOTIFY_USER.username
				? false
				: true;

		await commons.updatePlaylistCoverImagesFromUnsplashUtil(
			playlistUtil,
			newPlaylist,
			forcefulImageUpdate
		);

		const allRandomTracks: SpotifyApi.TrackObjectFull[] = [];

		await Promise.all(
			sourcePlaylists.map(async playlist => {
				const randomTracks = await playlistUtil.getRandomSongsFromPlaylist(
					playlist,
					3
				);
				if (randomTracks && randomTracks.length) {
					allRandomTracks.push(...randomTracks);
				}
			})
		);
		console.log(
			`userPlaylistCrawler() > Total Random Tracks picked From Daily Mix >> ${allRandomTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = allRandomTracks.map(i => {
			return { uri: i.uri, name: i.name };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 80);
	}
};

async function askForUserProfileLink() {
	const ac = new AbortController();
	const signal = ac.signal;
	const timeoutInSeconds = 20;
	let answer = "";
	setTimeout(() => ac.abort(), timeoutInSeconds * 1000);
	const rl = readline.createInterface({ input, output });
	try {
		answer = await rl.question(
			`Provide User Profile Link: [example: ${C.DEFAULT_SPOTIFY_USER.profile_url}]: \n\n`,
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
	return answer;
}

userPlaylistCrawler().then(() => {
	console.log(`End`);
	process.exit(0);
});
