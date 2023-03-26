import path from "path";
import { PlaylistDetails } from "../types";
import { ImageDownloader, Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";

export const updatePlaylistCoverImagesFromUnsplashUtil = async (
	playlistUtil: Playlists,
	playlist: PlaylistDetails,
	updateRequired = true
) => {
	const coverArtsFilePaths: string[] = [];
	if (updateRequired) {
		try {
			coverArtsFilePaths.push(
				...(await new ImageDownloader().downloadCoverArts(5))
			);
		} catch (err) {
			`makeRecommendationPlaylists() > Error In Downloading Cover Arts: ${err}`;
		}
	}
	const fullFilePath = coverArtsFilePaths.length
		? Helpers.getRandomItemsFromArray(coverArtsFilePaths, 1)[0]
		: path.resolve(
				__dirname,
				`../../src/${C.Relative_Playlist_Image_Path.recommendation}`
		  );
	await playlistUtil.updatePlaylistCoverImage(
		playlist,
		fullFilePath,
		updateRequired
	);
};
