import Playlists from "./playlists";
import * as C from "../resources/constants";

const makeRandomPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`makeRandomPlaylists() > Total User Playlists >> ${playlists.length}`
	);
	const featuredPlaylistsId = playlists
		.filter(i => i.name.match(/(Daily)/i))
		?.map(playlist => playlist.id);

	if (!featuredPlaylistsId || !featuredPlaylistsId.length) {
		throw new Error(
			`makeRandomPlaylists() > Featured Playlists not found - skipping rest of the process`
		);
	}

	let newPlaylistId = "";
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RandomArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} needs to be created`
		);
		newPlaylistId = await playlistUtil.createNewPlaylist(
			C.RandomArchivePlaylist.name,
			C.RandomArchivePlaylist.description
		);
	} else {
		console.log(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} already exists -> appending songs`
		);
		newPlaylistId = archivePlaylistExists.id;
	}
	console.log(`makeRandomPlaylists() > Target Playlist ID >> ${newPlaylistId}`);
	if (newPlaylistId) {
		const allRandomTracks: SpotifyApi.TrackObjectFull[] = [];

		await Promise.all(
			featuredPlaylistsId.map(async id => {
				const randomTracks = await playlistUtil.getRandomSongsFromPlaylist(
					id,
					2
				);
				if (randomTracks && randomTracks.length) {
					allRandomTracks.push(...randomTracks);
				}
			})
		);
		console.log(
			`RandomArchivePlaylist() > Total Random Tracks picked From Daily Mix >> ${allRandomTracks.length}`
		);
		const targetTracksURI = allRandomTracks.map(i => i.uri);
		await playlistUtil.updatePlaylistWithSongs(newPlaylistId, targetTracksURI);
	}

	console.log();
};

export { makeRandomPlaylists as default };
