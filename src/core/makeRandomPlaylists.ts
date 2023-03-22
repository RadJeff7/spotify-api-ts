import Playlists from "./playlists";
import * as C from "../resources/constants";
import { Simple_Playlist_Details } from "../types";

const makeRandomPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
		`makeRandomPlaylists() > Total User Playlists >> ${playlists.length}`
	);
	const featuredPlaylists: Simple_Playlist_Details[] = playlists
		.filter(i => i.name.match(/(Daily)/i))
		?.map(playlist => {
			return {
				id: playlist.id,
				name: playlist.name,
				owner: playlist.owner?.display_name,
			};
		});

	if (!featuredPlaylists || !featuredPlaylists.length) {
		throw new Error(
			`makeRandomPlaylists() > Featured Playlists not found - skipping rest of the process`
		);
	}

	let newPlaylist: Simple_Playlist_Details;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.WeeklyArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`makeRandomPlaylists() > ${C.WeeklyArchivePlaylist.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.WeeklyArchivePlaylist.name,
			C.WeeklyArchivePlaylist.description
		);
	} else {
		console.log(
			`makeRandomPlaylists() > ${C.WeeklyArchivePlaylist.name} already exists -> appending songs`
		);
		newPlaylist = {
			id: archivePlaylistExists.id,
			name: archivePlaylistExists.name,
			owner: archivePlaylistExists.owner?.display_name,
		};
	}
	console.log(
		`makeRandomPlaylists() > Target Playlist >> ${JSON.stringify(newPlaylist)}`
	);
	if (newPlaylist) {
		const allRandomTracks: SpotifyApi.TrackObjectFull[] = [];

		await Promise.all(
			featuredPlaylists.map(async playlist => {
				const randomTracks = await playlistUtil.getRandomSongsFromPlaylist(
					playlist,
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
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracksURI);
	}

	console.log();
};

export { makeRandomPlaylists as default };
