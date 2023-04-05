import { Playlists } from "../core";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import path from "path";
import logger from "../resources/logger";

const makeRandomPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	logger.info(
		`makeRandomPlaylists() > Total User Playlists >> ${playlists.length}`
	);
	const featuredPlaylists: PlaylistDetails[] = playlists
		.filter(i => i.name.match(/(Daily)/i))
		?.map(playlist => {
			return {
				id: playlist.id,
				name: playlist.name,
				owner: playlist.owner?.display_name,
			};
		})
		.filter(i => {
			return i.owner?.toLowerCase().includes("spotify");
		});

	if (!featuredPlaylists || !featuredPlaylists.length) {
		const errStr = `makeRandomPlaylists() > Featured Playlists not found - skipping rest of the process`;
		logger.error(errStr);
		throw new Error(errStr);
	}

	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RandomArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		logger.info(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.RandomArchivePlaylist.name,
			C.RandomArchivePlaylist.description
		);
	} else {
		logger.info(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} already exists`
		);
		newPlaylist = {
			id: archivePlaylistExists.id,
			name: archivePlaylistExists.name,
			owner: archivePlaylistExists.owner?.display_name,
		};
	}
	logger.info(
		`makeRandomPlaylists() > Target Playlist >> ${JSON.stringify(newPlaylist)}`
	);
	if (newPlaylist) {
		const fullFilePath = path.resolve(
			__dirname,
			`../../src/${C.Relative_Playlist_Image_Path.random}`
		);
		try {
			await playlistUtil.updatePlaylistCoverImage(newPlaylist, fullFilePath);
		} catch (err) {
			logger.error(
				`makeRandomPlaylists() > Error In Updating Playlist Image: ${err}`
			);
		}
		const allRandomTracks: SpotifyApi.TrackObjectFull[] = [];

		await Promise.all(
			featuredPlaylists.map(async playlist => {
				const randomTracks = await playlistUtil.getRandomSongsFromPlaylist(
					playlist,
					3
				);
				if (randomTracks && randomTracks.length) {
					allRandomTracks.push(...randomTracks);
				}
			})
		);
		logger.info(
			`makeRandomPlaylists() > Total Random Tracks picked From Daily Mix >> ${allRandomTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracks = allRandomTracks.map(i => {
			return { uri: i.uri, name: i.name, id: i.id };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist);
	}
};

export { makeRandomPlaylists as default };
