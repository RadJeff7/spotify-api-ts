import assert from "assert";
import { Authorization } from "../types";
import * as Helpers from "../resources/helpers";
import Base from "./base";

export default class Playlists extends Base {
	constructor(auth?: Authorization) {
		super(auth);
	}

	async getUserDetails() {
		try {
			this.setUserTokens();
			const userResponse = await this._spUtil.getMe();
			return userResponse.body;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAllTracksForGivenPlaylistgetUserDetails() > Error: ${err}`
			);
		}
	}

	async getAllUserPlaylists() {
		const completePlaylists: SpotifyApi.PlaylistObjectSimplified[] = [];
		const limit = 50;
		let count = limit;
		try {
			this.setUserTokens();
			const playlistResponse = await this._spUtil.getUserPlaylists({
				limit: limit,
			});
			const totalPlaylists = playlistResponse.body.total;
			console.log(
				`${
					this.constructor.name
				} > getAllUserPlaylists() > Total Playlists Present: ${totalPlaylists}, Fetched ${
					limit < totalPlaylists ? limit : totalPlaylists
				} playlists as of now, Remaining Playlists to be Fetched: ${
					limit < totalPlaylists ? totalPlaylists - limit : 0
				}`
			);
			completePlaylists.push(...playlistResponse.body.items.map(i => i));

			while (totalPlaylists > count) {
				const playlistResponse = await this._spUtil.getUserPlaylists({
					limit: limit,
					offset: count,
				});

				completePlaylists.push(...playlistResponse.body.items.map(i => i));
				count += limit;
				console.log(
					`${
						this.constructor.name
					} > getAllUserPlaylists() > Total Playlists Present: ${totalPlaylists}, Fetched ${
						count < totalPlaylists ? count : totalPlaylists
					} playlists as of now, Remaining Playlists to be Fetched: ${
						count < totalPlaylists ? totalPlaylists - count : 0
					}`
				);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAllUserPlaylists() > Error: ${err}`
			);
		}
		return completePlaylists;
	}

	async getAllTracksForGivenPlaylist(playlistId: string) {
		const allTracksArr: SpotifyApi.TrackObjectFull[] = [];
		const limit = 100;
		let count = limit;
		try {
			this.setUserTokens();
			const playlistTracksResponse = await this._spUtil.getPlaylistTracks(
				playlistId,
				{ limit: limit }
			);
			const totalTracksPresent = playlistTracksResponse.body.total;
			console.log(
				`${
					this.constructor.name
				} > getAllTracksForGivenPlaylist() > PlaylistID: ${playlistId} > Total Tracks Present: ${totalTracksPresent}, Fetched ${
					limit < totalTracksPresent ? limit : totalTracksPresent
				} Tracks as of now, Remaining Tracks to be Fetched: ${
					limit < totalTracksPresent ? totalTracksPresent - limit : 0
				}`
			);
			playlistTracksResponse.body.items.map(i => {
				if (i.track) allTracksArr.push(i.track);
			});
			while (totalTracksPresent > count) {
				const playlistTracksResponse = await this._spUtil.getPlaylistTracks(
					playlistId,
					{ limit: limit, offset: count }
				);

				playlistTracksResponse.body.items.map(i => {
					if (i.track) allTracksArr.push(i.track);
				});
				count += limit;
				console.log(
					`${
						this.constructor.name
					} > getAllTracksForGivenPlaylist() > PlaylistID: ${playlistId} > Total Tracks Present: ${totalTracksPresent}, Fetched ${
						count < totalTracksPresent ? count : totalTracksPresent
					} Tracks as of now, Remaining Tracks to be Fetched: ${
						count < totalTracksPresent ? totalTracksPresent - count : 0
					}`
				);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAllTracksForGivenPlaylist() > PlaylistID: ${playlistId} > Error: ${err}`
			);
		}
		return allTracksArr;
	}

	async addTracksToPlaylist(playlistId: string, tracksURIs: string[]) {
		try {
			this.setUserTokens();
			const addTracksRes = await this._spUtil.addTracksToPlaylist(
				playlistId,
				tracksURIs
			);

			assert.equal(
				addTracksRes.statusCode,
				201,
				`${this.constructor.name} > PlaylistID: ${playlistId} > Adding Tracks To Playlist not successful`
			);
			console.log(
				`${this.constructor.name} > PlaylistID: ${playlistId} > addTracksToPlaylist() > Successfully updated the playlist`
			);
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > PlaylistID: ${playlistId} > addTracksToPlaylist() > Error: ${err}`
			);
		}
	}

	async createNewPlaylist(name: string, description: string) {
		try {
			this.setUserTokens();
			const createPlaylistRes = await this._spUtil.createPlaylist(name, {
				public: true,
				description: description,
				collaborative: false,
			});
			assert.equal(
				createPlaylistRes.statusCode,
				201,
				`${this.constructor.name} > Creation of Playlist: ${name} not successfull`
			);
			console.log(
				`${this.constructor.name} > createNewPlaylist() > Created new Playlist - name: ${name}`
			);
			const playlistId = createPlaylistRes.body.id;
			return playlistId;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > createNewPlaylist() > Error: ${err}`
			);
		}
	}

	async updatePlaylistWithSongs(playlistId: string, newTracksURIs: string[]) {
		try {
			this.setUserTokens();
			console.log(
				`${this.constructor.name} > updatePlaylistWithSongs() > PlaylistID: ${playlistId} > New songs to be added in Playlist >> ${newTracksURIs.length}`
			);
			const tracksInPlaylist = await this.getAllTracksForGivenPlaylist(
				playlistId
			);
			const uniqueURIs = newTracksURIs.filter(
				newTrack =>
					!tracksInPlaylist.some(
						existingTrack => existingTrack.uri === newTrack
					)
			);
			console.log(
				`${this.constructor.name} > updatePlaylistWithSongs() > PlaylistID: ${playlistId} > New and Unique songs to be added in Playlist >> ${uniqueURIs.length}`
			);
			if (uniqueURIs.length) {
				await this.addTracksToPlaylist(playlistId, uniqueURIs);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > updatePlaylistWithSongs() > PlaylistID: ${playlistId} > Error: ${err}`
			);
		}
	}

	async getRandomSongsFromPlaylist(playlistId: string, count = 10) {
		let randomTracksArr: SpotifyApi.TrackObjectFull[] = [];
		try {
			this.setUserTokens();
			const allTracksArr = await this.getAllTracksForGivenPlaylist(playlistId);
			console.log(
				`${this.constructor.name} > getRandomSongsFromPlaylist() > PlaylistID: ${playlistId} > Total Tracks Present: ${allTracksArr.length} - Fetching random ${count} Tracks`
			);
			randomTracksArr = Helpers.getRandomItemsFromArray(allTracksArr, count);
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getRandomSongsFromPlaylist() > PlaylistID: ${playlistId} > Error: ${err}`
			);
		}
		return randomTracksArr;
	}
}
