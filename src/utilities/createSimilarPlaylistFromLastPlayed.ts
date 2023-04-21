import { Playlists } from "../core";
import * as commons from "./commonFunctions";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import logger from "../resources/logger";

const recommedTracksBasedOnLastPlayedTracksofUser = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	logger.info(
		`recommedTracksBasedOnLastPlayedTracksofUser() > Total User Playlists >> ${playlists.length}`
	);

	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RecommendationsPlaylistFromSpotify.name
	);
	if (!archivePlaylistExists) {
		logger.info(
			`recommedTracksBasedOnLastPlayedTracksofUser() > ${C.RecommendationsPlaylistFromSpotify.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.RecommendationsPlaylistFromSpotify.name,
			C.RecommendationsPlaylistFromSpotify.description
		);
	} else {
		logger.info(
			`recommedTracksBasedOnLastPlayedTracksofUser() > ${C.RecommendationsPlaylistFromSpotify.name} already exists`
		);
		newPlaylist = {
			id: archivePlaylistExists.id,
			name: archivePlaylistExists.name,
			owner: archivePlaylistExists.owner?.display_name,
		};
	}
	logger.info(
		`makeRecommendationPlaylists() > Target Playlist >> ${JSON.stringify(
			newPlaylist
		)}`
	);
	if (newPlaylist) {
		await commons.updatePlaylistCoverImagesFromUnsplashUtil(
			playlistUtil,
			newPlaylist
		);
		const lastPlayedTracks = await playlistUtil.getLastPlayedTracks();
		const { avgAudioFeatures, frequentGenres, randomTracks } =
			await playlistUtil.getAvgAudioFeaturesBasedOnTracks(lastPlayedTracks);

		const recommendedTracks = await playlistUtil.getRecommendedTracks({
			count: 50,
			seed_tracks_array: randomTracks,
			seed_genres_array: frequentGenres,
			audioFeatures: avgAudioFeatures,
		});

		logger.info(
			`recommedTracksBasedOnLastPlayedTracksofUser() > Total Tracks picked From Recommendations From Last Played Tracks >> ${recommendedTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = recommendedTracks.map(i => {
			return { uri: i.uri, name: i.name, id: i.id };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 80);
	}
};

export { recommedTracksBasedOnLastPlayedTracksofUser as default };
