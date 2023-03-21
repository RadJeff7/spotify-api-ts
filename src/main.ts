import { User } from "./core";
import * as C from "./resources/constants";
import fs from "fs";

const main = async () => {
	const userObj = new User();
	const playlists = await userObj.getAllUserPlaylists();

	console.log(`Total Playlists >> ${playlists.length}`);
	fs.writeFileSync("./allPlaylists.json", JSON.stringify(playlists, null, 2));
	const featuredPlaylistId = playlists.filter(i =>
		i.name.match(/(discover)/i)
	)?.[0].id;

	const featuredTracks = await userObj.getTracksForGivenPlaylist(
		featuredPlaylistId
	);
	console.log(`Total Tracks on Discover Weeekly >> ${featuredTracks.length}`);
	fs.writeFileSync(
		"./DiscoverWeekly.json",
		JSON.stringify(featuredTracks, null, 2)
	);
	let playlistId = "";
	const playlistExists = playlists.find(i => i.name === C.TargetPlaylist.name);
	if (!playlistExists) {
		console.log(`${C.TargetPlaylist.name} needs to be created`);
		playlistId = await userObj.createNewPlaylist(
			C.TargetPlaylist.name,
			C.TargetPlaylist.description
		);
	} else {
		console.log(`${C.TargetPlaylist.name} already exists -> appending songs`);
		playlistId = playlistExists.id;
	}
	console.log(`Target Playlist ID >> ${playlistId}`);
	if (playlistId) {
		const targetTracksURI = featuredTracks.map(i => i.uri);
		await userObj.updatePlaylistWithSongs(playlistId, targetTracksURI);
	}
};

main().catch(err => {
	console.error(`Error >> ${err}`);
});
