import Playlists from "./playlists";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";

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
		})[0];

	if (!featuredPlaylist) {
		throw new Error(
			`createWeeklyArchive() > Featured Playlist not found - skipping rest of the process`
		);
	}
	// Create new Playlist if required and get its details - If already Exists then get its details
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
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist);
	}
};

export { createWeeklyArchive as default };
