import path from "path";
import { PlaylistDetails } from "../types";
import { ImageDownloader, Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import logger from "../resources/logger";

export const updatePlaylistCoverImagesFromUnsplashUtil = async (
	playlistUtil: Playlists,
	playlist: PlaylistDetails,
	updateRequired = true
) => {
	try {
		const coverArtsFilePaths: string[] = [];
		if (updateRequired) {
			try {
				const downloadedImagePaths =
					await new ImageDownloader().downloadCoverArts();
				coverArtsFilePaths.push(...downloadedImagePaths);
			} catch (err) {
				logger.error(
					`updatePlaylistCoverImagesFromUnsplashUtil() > Error In Downloading Cover Arts: ${err}`
				);
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
	} catch (err) {
		logger.error(
			`updatePlaylistCoverImagesFromUnsplashUtil() > Error In Updating Playlist Image: ${err}`
		);
	}
};
