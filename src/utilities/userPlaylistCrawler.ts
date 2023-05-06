import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import * as commons from "./commonFunctions";
import { Playlists } from "../core";
import { PlaylistDetails, PlaylistTrackObject } from "../types";
import logger from "../resources/logger";

const GivenUsersPlaylistCrawler = async (userId: string) => {
	const playlistUtil = new Playlists();
	const recommedingUser = userId;
	logger.info(`userPlaylistCrawler() > Input User ID: ${recommedingUser}`);
	const userDetails = await playlistUtil.getUserDetails(recommedingUser);
	logger.info(
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
	logger.info(
		`userPlaylistCrawler() > Recommending User: ${userDetails.display_name} - Total User Playlists >> ${totalInputUserPlaylists.length}`
	);
	logger.info(
		`userPlaylistCrawler() > Recommending User: ${
			userDetails.display_name
		} - Playlists selected for mix >> ${
			sourcePlaylists.length
		} >> Names: ${sourcePlaylists.map(i => i.name).join(", ")} \n\n`
	);

	if (!sourcePlaylists?.length) {
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
		logger.info(
			`userPlaylistCrawler() > ${newPlaylistName} needs to be created in Current User profile`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			newPlaylistName,
			newPlaylistDescription
		);
	} else {
		logger.info(
			`userPlaylistCrawler() > ${newPlaylistName} already exists in Current User profile`
		);
		newPlaylist = {
			id: targetPlaylistExistsInCurrentUser.id,
			name: targetPlaylistExistsInCurrentUser.name,
			owner: targetPlaylistExistsInCurrentUser.owner?.display_name,
		};
	}
	logger.info(
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

		const allRandomTracks: PlaylistTrackObject[] = [];

		await Promise.all(
			sourcePlaylists.map(async playlist => {
				const randomTracks = await playlistUtil.getRandomSongsFromPlaylist(
					playlist,
					5
				);
				if (randomTracks?.length) {
					allRandomTracks.push(...randomTracks);
				}
			})
		);
		logger.info(
			`userPlaylistCrawler() > Total Random Tracks picked From Recommending User: ${userDetails.display_name}'s playlist >> ${allRandomTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = allRandomTracks.map(i => {
			return { uri: i.track.uri, name: i.track.name, id: i.track.id };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 100);
	}
};

export { GivenUsersPlaylistCrawler as default };
