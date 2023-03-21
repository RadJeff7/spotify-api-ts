import User from "./user";
import * as C from "../resources/constants";

const createWeeklyArchive = async () => {
	const userObj = new User();
	const playlists = await userObj.getAllUserPlaylists();

	console.log(
		`createWeeklyArchive() > Total User Playlists >> ${playlists.length}`
	);
	const featuredPlaylistId = playlists.filter(i =>
		i.name.match(/(discover)/i)
	)?.[0]?.id;

	if (!featuredPlaylistId) {
		throw new Error(
			`createWeeklyArchive() > Featured Playlist not found - skipping rest of the process`
		);
	}

	const featuredTracks = await userObj.getTracksForGivenPlaylist(
		featuredPlaylistId
	);
	console.log(
		`createWeeklyArchive() > Total Tracks on Discover Weeekly >> ${featuredTracks.length}`
	);
	let playlistId = "";
	const playlistExists = playlists.find(i => i.name === C.TargetPlaylist.name);
	if (!playlistExists) {
		console.log(
			`createWeeklyArchive() > ${C.TargetPlaylist.name} needs to be created`
		);
		playlistId = await userObj.createNewPlaylist(
			C.TargetPlaylist.name,
			C.TargetPlaylist.description
		);
	} else {
		console.log(
			`createWeeklyArchive() > ${C.TargetPlaylist.name} already exists -> appending songs`
		);
		playlistId = playlistExists.id;
	}
	console.log(`createWeeklyArchive() > Target Playlist ID >> ${playlistId}`);
	if (playlistId) {
		const targetTracksURI = featuredTracks.map(i => i.uri);
		await userObj.updatePlaylistWithSongs(playlistId, targetTracksURI);
	}
};

export { createWeeklyArchive };
