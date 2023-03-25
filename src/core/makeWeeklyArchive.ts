import { Playlists } from "../utilities";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";
import path from "path";

const createWeeklyArchive = async () => {
	const playlistUtil = new Playlists();
	// Get All User Playlists
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`createWeeklyArchive() > Total User Playlists >> ${playlists.length}`
	);

	// Find required Playlist ID from All playlists
	const featuredPlaylist: PlaylistDetails = playlists
		.filter(i => i.name.match(/(discover)/i))
		?.map(i => {
			return {
				id: i.id,
				name: i.name,
				owner: i.owner?.display_name,
			};
		})
		.filter(i => {
			return i.owner?.toLowerCase().includes("spotify");
		})?.[0];
	if (!featuredPlaylist) {
		throw new Error(
			`createWeeklyArchive() > Featured Playlist not found - skipping rest of the process`
		);
	}
	// Try to find our Target(archive) Playlist from list of user playlists - if not found create new playlist
	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.WeeklyArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`createWeeklyArchive() > ${C.WeeklyArchivePlaylist.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.WeeklyArchivePlaylist.name,
			C.WeeklyArchivePlaylist.description
		);
	} else {
		console.log(
			`createWeeklyArchive() > ${C.WeeklyArchivePlaylist.name} already exists -> appending songs`
		);
		newPlaylist = {
			id: archivePlaylistExists.id,
			name: archivePlaylistExists.name,
			owner: archivePlaylistExists.owner?.display_name,
		};
	}
	console.log(
		`createWeeklyArchive() > Target Playlist >> ${JSON.stringify(newPlaylist)}`
	);
	if (newPlaylist) {
		const fullFilePath = path.resolve(
			__dirname,
			`../../src/${C.Relative_Playlist_Image_Path.weekly}`
		);
		await playlistUtil.updatePlaylistCoverImage(newPlaylist, fullFilePath);
		const featuredTracks = await playlistUtil.getAllTracksForGivenPlaylist(
			featuredPlaylist
		);
		console.log(
			`createWeeklyArchive() > Total Tracks on Discover Weeekly >> ${featuredTracks.length}`
		);
		const targetTracks = featuredTracks.map(i => {
			return { uri: i.uri, name: i.name };
		});
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracks);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist, 60);
	}
};

export { createWeeklyArchive as default };
