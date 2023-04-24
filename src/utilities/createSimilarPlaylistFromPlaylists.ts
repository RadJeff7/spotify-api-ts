import { Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as commons from "./commonFunctions";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import logger from "../resources/logger";

const makeSimilarPlaylistFromPlaylist = async (inpuPlaylistId?: string) => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	logger.info(
		`makeSimilarPlaylistFromPlaylist() > Total User Playlists >> ${playlists.length}`
	);

	const playlist = inpuPlaylistId
		? playlists
				.filter(
					i =>
						i.id === inpuPlaylistId &&
						!i.name.match(/(recommedation|similar|mix)/i)
				)
				?.map(playlist => {
					return {
						id: playlist.id,
						name: playlist.name,
						owner: playlist.owner?.display_name,
					};
				})[0]
		: Helpers.getRandomItemsFromArray(
				playlists.filter(
					playlist =>
						!playlist.owner.display_name?.match(/spotify/i) ||
						!playlist.name.match(/(recommedation|similar|mix)/i)
				),
				1
		  ).map(i => {
				return {
					id: i.id,
					name: i.name,
					owner: i.owner.display_name,
				};
		  })[0];

	if (!playlist) {
		const errStr = `makeSimilarPlaylistFromPlaylist() > Source Playlist not found - skipping rest of the process`;
		logger.error(errStr);
		throw new Error(errStr);
	}

	// Update Playlist name and Description - new playlist will be created if required - else tracks will be appended
	const newPlaylistName = C.SimilarPlaylistFromPlaylist.name.replace(
		/user/gi,
		playlist.name.trim()
	);
	const newPlaylistDescription = `${C.SimilarPlaylistFromPlaylist.description.replace(
		/Given/gi,
		playlist.name
	)} Source Playlist URL: https://open.spotify.com/playlist/${playlist.id}${
		playlist.owner ? " - From Owner: " + playlist.owner : ""
	}`;

	let newPlaylist: PlaylistDetails;

	const targetPlaylistExistsInCurrentUser = playlists.find(
		i => i.name === newPlaylistName
	);
	if (!targetPlaylistExistsInCurrentUser) {
		logger.info(
			`makeRecommendationPlaylistsFromPlaylist() > ${newPlaylistName} needs to be created in Current User profile`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			newPlaylistName,
			newPlaylistDescription
		);
	} else {
		logger.info(
			`makeSimilarPlaylistFromPlaylist() > ${newPlaylistName} already exists in Current User profile`
		);
		newPlaylist = {
			id: targetPlaylistExistsInCurrentUser.id,
			name: targetPlaylistExistsInCurrentUser.name,
			owner: targetPlaylistExistsInCurrentUser.owner?.display_name,
		};
	}
	logger.info(
		`makeSimilarPlaylistFromPlaylist() > Target Playlist >> ${JSON.stringify(
			newPlaylist
		)}`
	);
	if (!newPlaylist) {
		const errStr = `makeSimilarPlaylistFromPlaylist() > Destination Playlist not found - skipping rest of the process`;
		logger.error(errStr);
		throw new Error(errStr);
	}

	await commons.updatePlaylistCoverImagesFromUnsplashUtil(
		playlistUtil,
		newPlaylist
	);

	const { avgAudioFeatures, frequentGenres, randomTracks } =
		await playlistUtil.getAvgAudioFeaturesBasedOnPlaylist(playlist);

	const recommendedTracks = await playlistUtil.getRecommendedTracks({
		count: 50,
		seed_tracks_array: randomTracks,
		seed_genres_array: frequentGenres,
		audioFeatures: avgAudioFeatures,
	});

	logger.info(
		`makeSimilarPlaylistFromPlaylist() > Total Tracks picked From Recommendations >> ${recommendedTracks.length} - Adding Them to ${newPlaylist.name}`
	);
	const targetTracks = recommendedTracks.map(i => {
		return { uri: i.uri, name: i.name, id: i.id };
	});
	await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
	await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 70);
};

export { makeSimilarPlaylistFromPlaylist as default };
