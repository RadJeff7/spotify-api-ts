import Playlists from "./playlists";
import * as C from "../resources/constants";
import { PlaylistDetails } from "../types";

const makeRandomPlaylists = async () => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
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
		});

	if (!featuredPlaylists || !featuredPlaylists.length) {
		throw new Error(
			`makeRandomPlaylists() > Featured Playlists not found - skipping rest of the process`
		);
	}

	let newPlaylist: PlaylistDetails;
	const archivePlaylistExists = playlists.find(
		i => i.name === C.RandomArchivePlaylist.name
	);
	if (!archivePlaylistExists) {
		console.log(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} needs to be created`
		);
		newPlaylist = await playlistUtil.createNewPlaylist(
			C.RandomArchivePlaylist.name,
			C.RandomArchivePlaylist.description
		);
	} else {
		console.log(
			`makeRandomPlaylists() > ${C.RandomArchivePlaylist.name} already exists`
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
					3
				);
				if (randomTracks && randomTracks.length) {
					allRandomTracks.push(...randomTracks);
				}
			})
		);
		console.log(
			`makeRandomPlaylists() > Total Random Tracks picked From Daily Mix >> ${allRandomTracks.length} - Adding Them to ${newPlaylist.name}`
		);
		const targetTracksURI = allRandomTracks.map(i => i.uri);
		await playlistUtil.updatePlaylistWithSongs(newPlaylist, targetTracksURI);
		await playlistUtil.maintainPlaylistsAtSize(newPlaylist);
	}

	console.log();
};

export { makeRandomPlaylists as default };
