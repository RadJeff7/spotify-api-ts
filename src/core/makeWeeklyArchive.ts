import Playlists from "./playlists";
import * as C from "../resources/constants";

const createWeeklyArchive = async () => {
	const playlistUtil = new Playlists();
	// Get All User Playlists
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`createWeeklyArchive() > Total User Playlists >> ${playlists.length}`
	);

	// Find required Playlist ID from All playlists
	const featuredPlaylistId = playlists.filter(i =>
		i.name.match(/(discover)/i)
	)?.[0]?.id;

	if (!featuredPlaylistId) {
		throw new Error(
			`createWeeklyArchive() > Featured Playlist not found - skipping rest of the process`
		);
	}

	let newPlaylistId = "";
	const archivePlaylistExists = playlists.find(
		i => i.name === C.WeeklyArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`createWeeklyArchive() > ${C.WeeklyArchivePlaylist.name} needs to be created`
		);
		newPlaylistId = await playlistUtil.createNewPlaylist(
			C.WeeklyArchivePlaylist.name,
			C.WeeklyArchivePlaylist.description
		);
	} else {
		console.log(
			`createWeeklyArchive() > ${C.WeeklyArchivePlaylist.name} already exists -> appending songs`
		);
		newPlaylistId = archivePlaylistExists.id;
	}
	console.log(`createWeeklyArchive() > Target Playlist ID >> ${newPlaylistId}`);
	if (newPlaylistId) {
		const featuredTracks = await playlistUtil.getAllTracksForGivenPlaylist(
			featuredPlaylistId
		);
		console.log(
			`createWeeklyArchive() > Total Tracks on Discover Weeekly >> ${featuredTracks.length}`
		);
		const targetTracksURI = featuredTracks.map(i => i.uri);
		await playlistUtil.updatePlaylistWithSongs(newPlaylistId, targetTracksURI);
	}
};

export { createWeeklyArchive as default };
