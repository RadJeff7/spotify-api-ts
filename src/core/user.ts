import assert from "assert";
import { Authorization } from "../types";
import Base from "./base";

export default class User extends Base {
	constructor(auth?: Authorization) {
		super(auth);
	}

	async getAlbumDetails() {
		try {
			await this.setClientTokens();
			const albumResponse = await this._util.getArtistAlbums(
				"43ZHCT0cAZBISjO8DG9PnE"
			);
			const albumList = albumResponse.body.items.map(i => {
				return {
					name: i.name,
					date: i.release_date,
					total_tracks: i.total_tracks,
				};
			});
			return albumList;
		} catch (err) {
			throw new Error(`getAlbumDetails() > Error: ${err}`);
		}
	}

	async getUserDetails() {
		try {
			this.setUserTokens();
			const userResponse = await this._util.getMe();
			return userResponse.body;
		} catch (err) {
			throw new Error(`getUserDetails() > Error: ${err}`);
		}
	}

	async getAllUserPlaylists() {
		const completePlaylists: SpotifyApi.PlaylistObjectSimplified[] = [];
		const limit = 20;
		let count = limit;
		try {
			this.setUserTokens();
			const playlistResponse = await this._util.getUserPlaylists({
				limit: limit,
			});
			const totalPlaylists = playlistResponse.body.total;
			completePlaylists.push(...playlistResponse.body.items.map(i => i));

			while (totalPlaylists > count) {
				const playlistResponse = await this._util.getUserPlaylists({
					limit: limit,
					offset: count,
				});
				completePlaylists.push(...playlistResponse.body.items.map(i => i));
				count += limit;
			}
		} catch (err) {
			throw new Error(`getAllUserPlaylists() > Error: ${err}`);
		}
		return completePlaylists;
	}

	async getTracksForGivenPlaylist(playlistId: string) {
		const tracksArr: SpotifyApi.TrackObjectFull[] = [];
		try {
			this.setUserTokens();
			const playlistTracksResponse = await this._util.getPlaylistTracks(
				playlistId
			);
			playlistTracksResponse.body.items.map(i => {
				if (i.track) tracksArr.push(i.track);
			});
		} catch (err) {
			throw new Error(`getTracksForGivenPlaylist() > Error: ${err}`);
		}
		return tracksArr;
	}

	async addTracksToPlaylist(playlistId: string, tracksURIs: string[]) {
		try {
			this.setUserTokens();
			const addTracksRes = await this._util.addTracksToPlaylist(
				playlistId,
				tracksURIs
			);

			assert.equal(addTracksRes.statusCode, 201, "Added Tracks not successful");
			console.log("addTracksToPlaylist() > Successfully updated the playlist");
		} catch (err) {
			throw new Error(`addTracksToPlaylist() > Error: ${err}`);
		}
	}

	async createNewPlaylist(name: string, description: string) {
		try {
			this.setUserTokens();
			const createPlaylistRes = await this._util.createPlaylist(name, {
				public: true,
				description: description,
				collaborative: false,
			});
			assert.equal(
				createPlaylistRes.statusCode,
				201,
				`Creation of Playlist: ${name} not successfull`
			);
			console.log(`createNewPlaylist() > Created new Playlist - name: ${name}`);
			const playlistId = createPlaylistRes.body.id;
			return playlistId;
		} catch (err) {
			throw new Error(`addTracksToPlaylist() > Error: ${err}`);
		}
	}

	async updatePlaylistWithSongs(playlistId: string, newTracksURIs: string[]) {
		try {
			this.setUserTokens();
			console.log(
				`updatePlaylistWithSongs() New songs to be added in Playlist >> ${newTracksURIs.length}`
			);
			const tracksInPlaylist = await this.getTracksForGivenPlaylist(playlistId);
			const uniqueURIs = newTracksURIs.filter(
				newTrack =>
					!tracksInPlaylist.some(
						existingTrack => existingTrack.uri === newTrack
					)
			);
			console.log(
				`updatePlaylistWithSongs() New and Unique songs to be added in Playlist >> ${uniqueURIs.length}`
			);
			if (uniqueURIs.length) {
				await this.addTracksToPlaylist(playlistId, uniqueURIs);
			}
		} catch (err) {
			throw new Error(`addTracksToPlaylist() > Error: ${err}`);
		}
	}
}
