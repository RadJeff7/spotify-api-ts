import Playlists from "./playlists";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import path from "path";
import ImageDownloader from "./image";

const makeRecommendationPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`makeRecommendationPlaylists() > Total User Playlists >> ${playlists.length}`
	);

	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RecommendationsPlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`makeRecommendationPlaylists() > ${C.RecommendationsPlaylist.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.RecommendationsPlaylist.name,
			C.RecommendationsPlaylist.description
		);
	} else {
		console.log(
			`makeRecommendationPlaylists() > ${C.RecommendationsPlaylist.name} already exists`
		);
		newPlaylist = {
			id: archivePlaylistExists.id,
			name: archivePlaylistExists.name,
			owner: archivePlaylistExists.owner?.display_name,
		};
	}
	console.log(
		`makeRecommendationPlaylists() > Target Playlist >> ${JSON.stringify(
			newPlaylist
		)}`
	);
	if (newPlaylist) {
		const coverArtsFilePaths: string[] = [];
		try {
			coverArtsFilePaths.push(
				...(await new ImageDownloader().downloadCoverArts(5))
			);
		} catch (err) {
			`makeRecommendationPlaylists() > Error In Downloading Cover Arts: ${err}`;
		}
		console.log(coverArtsFilePaths);
		const fullFilePath = coverArtsFilePaths.length
			? coverArtsFilePaths[
					Math.floor(Math.random() * coverArtsFilePaths.length)
			  ]
			: path.resolve(
					__dirname,
					`../../src/${C.Relative_Playlist_Image_Path.recommendation}`
			  );
		await playlistUtil.updatePlaylistCoverImage(
			newPlaylist,
			fullFilePath,
			true
		);
		const lastPlayedTracks = await playlistUtil.getLastPlayedTracks();
		const genres = await playlistUtil.getGenreRecommendations();
		const selectedGenres = Helpers.getRandomItemsFromArray(genres, 2);
		const selectedTracks = Helpers.getRandomItemsFromArray(lastPlayedTracks, 3);
		console.log(
			`makeRecommendationPlaylists() > Selected Tracks for Seeding => ${selectedTracks
				.map(i => i.name)
				.join(" \n")}`
		);
		console.log(
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

		console.log(
			`makeRecommendationPlaylists() > Total Random Tracks picked From Recommendations >> ${allRandomRecommendedTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = allRandomRecommendedTracks.map(i => {
			return { uri: i.uri, name: i.name };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 80);
	}
};

export { makeRecommendationPlaylists as default };
