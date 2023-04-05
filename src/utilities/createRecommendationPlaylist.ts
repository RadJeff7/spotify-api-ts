import { Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as commons from "./commonFunctions";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import logger from "../resources/logger";

const makeRecommendationPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	logger.info(
		`makeRecommendationPlaylists() > Total User Playlists >> ${playlists.length}`
	);

	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RecommendationsPlaylistFromSpotify.name
	);
	if (!archivePlaylistExists) {
		logger.info(
			`makeRecommendationPlaylists() > ${C.RecommendationsPlaylistFromSpotify.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.RecommendationsPlaylistFromSpotify.name,
			C.RecommendationsPlaylistFromSpotify.description
		);
	} else {
		logger.info(
			`makeRecommendationPlaylists() > ${C.RecommendationsPlaylistFromSpotify.name} already exists`
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
		const genres = await playlistUtil.getGenreRecommendations();
		const selectedGenres = Helpers.getRandomItemsFromArray(genres, 2);
		const selectedTracks = Helpers.getRandomItemsFromArray(lastPlayedTracks, 3);
		logger.info(
			`makeRecommendationPlaylists() > Selected Tracks for Seeding => ${selectedTracks
				.map(i => i.name)
				.join(" \n")}`
		);
		logger.info(
			`makeRecommendationPlaylists() Selected Genres for Seeding => ${selectedGenres.join(
				" \n"
			)}`
		);

		const recommendedTracks = await playlistUtil.getRecommendedTracks({
			seed_tracks_array: selectedTracks,
			seed_genres_array: selectedGenres,
		});

		const allRandomRecommendedTracks = Helpers.getRandomItemsFromArray(
			recommendedTracks,
			60
		);

		logger.info(
			`makeRecommendationPlaylists() > Total Random Tracks picked From Recommendations >> ${allRandomRecommendedTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = allRandomRecommendedTracks.map(i => {
			return { uri: i.uri, name: i.name, id: i.id };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 80);
	}
};

export { makeRecommendationPlaylists as default };
