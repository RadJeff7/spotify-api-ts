import Playlists from "./playlists";
import * as C from "../resources/constants";
import { Simple_Playlist_Details } from "../types";

const createWeeklyArchive = async () => {
	const playlistUtil = new Playlists();
	// Get All User Playlists
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`createWeeklyArchive() > Total User Playlists >> ${playlists.length}`
	);

	// Find required Playlist ID from All playlists
	const featuredPlaylist: Simple_Playlist_Details = playlists
		.filter(i => i.name.match(/(discover)/i))
		?.map(i => {
			return {
				id: i.id,
				name: i.name,
				owner: i.owner?.display_name,
			};
		})[0];

	if (!featuredPlaylist) {
		throw new Error(
			`createWeeklyArchive() > Featured Playlist not found - skipping rest of the process`
		);
	}

	let newPlaylist: Simple_Playlist_Details;
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
		const featuredTracks = await playlistUtil.getAllTracksForGivenPlaylist(
			featuredPlaylist
		);
		console.log(
			`createWeeklyArchive() > Total Tracks on Discover Weeekly >> ${featuredTracks.length}`
		);
		const targetTracksURI = featuredTracks.map(i => i.uri);
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracksURI);
	}
};

export { createWeeklyArchive as default };
