import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import * as commons from "./commonFunctions";
import { Playlists } from "../core";
import { PlaylistDetails } from "../types";

const GivenUsersPlaylistCrawler = async (userId: string) => {
	const playlistUtil = new Playlists();
	const recommedingUser = userId;
	console.log(`userPlaylistCrawler() > Input User ID: ${recommedingUser}`);
	const userDetails = await playlistUtil.getUserDetails(recommedingUser);
	console.log(
		`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Followers: ${userDetails.followers?.total}`
	);
	const totalInputUserPlaylists = await playlistUtil.getAllUserPlaylists(
		recommedingUser
	);
	// simplify Playlist Object and do required Filters
	const inputPlaylists: PlaylistDetails[] = totalInputUserPlaylists
		.map(playlist => {
			return {
				id: playlist.id,
				name: playlist.name,
				owner: playlist.owner?.display_name,
			};
		})
		.filter(i => {
			return !i.owner?.match(/spotify/i);
		});
	// setting Max Limit as 20 playlist per user
	const sourcePlaylists =
		inputPlaylists.length > 20
			? Helpers.getRandomItemsFromArray(inputPlaylists, 20)
			: inputPlaylists;
	console.log(
		`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Total User Playlists >> ${totalInputUserPlaylists.length}`
	);
	console.log(
		`userPlaylistCrawler() > Recommending User: ${
			userDetails.display_name
		} - Playlists selected for mix >> ${
			sourcePlaylists.length
		} >> Names: ${sourcePlaylists.map(i => i.name).join(", ")} \n\n`
	);

	if (!sourcePlaylists || !sourcePlaylists.length) {
		throw new Error(
			`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Source Playlists not found - skipping rest of the process`
		);
	}
	// Update Playlist name and Description - new playlist will be created if required - else tracks will be appended
	const newPlaylistName = C.RecommendationsPlaylistFromUser.name.replace(
		/user/gi,
		userDetails.display_name || "User"
	);
	const newPlaylistDescription = `${C.RecommendationsPlaylistFromUser.description.replace(
		/user/gi,
		userDetails.display_name || "User"
	)} URL: ${userDetails.external_urls.spotify}`;

	let newPlaylist: PlaylistDetails;

	const targetPlaylistExistsInCurrentUser = (
		await playlistUtil.getAllUserPlaylists()
	).find(i => i.name === newPlaylistName);
	if (!targetPlaylistExistsInCurrentUser) {
		console.log(
			`userPlaylistCrawler() > ${newPlaylistName} needs to be created in Current User profile`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			newPlaylistName,
			newPlaylistDescription
		);
	} else {
		console.log(
			`userPlaylistCrawler() > ${newPlaylistName} already exists in Current User profile`
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

export { GivenUsersPlaylistCrawler as default };
