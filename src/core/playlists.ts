import assert from "assert";
import { Authorization, PlaylistDetails } from "../types";
import * as Helpers from "../resources/helpers";
import Base from "./base";
import fs from "fs";
import path from "path";

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

	async getAllTracksForGivenPlaylist(playlist: PlaylistDetails) {
		const allTracksArr: SpotifyApi.TrackObjectFull[] = [];
		const limit = 100;
		let count = limit;
		try {
			this.setUserTokens();
			const playlistTracksResponse = await this._spUtil.getPlaylistTracks(
				playlist.id,
				{ limit: limit }
			);
			const totalTracksPresent = playlistTracksResponse.body.total;
			console.log(
				`${
					this.constructor.name
				} > getAllTracksForGivenPlaylist() > Playlist: ${
					playlist.name
				} > Total Tracks Present: ${totalTracksPresent}, Fetched ${
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
					playlist.id,
					{ limit: limit, offset: count }
				);

				playlistTracksResponse.body.items.map(i => {
					if (i.track) allTracksArr.push(i.track);
				});
				count += limit;
				console.log(
					`${
						this.constructor.name
					} > getAllTracksForGivenPlaylist() > Playlist: ${
						playlist.name
					} > Total Tracks Present: ${totalTracksPresent}, Fetched ${
						count < totalTracksPresent ? count : totalTracksPresent
					} Tracks as of now, Remaining Tracks to be Fetched: ${
						count < totalTracksPresent ? totalTracksPresent - count : 0
					}`
				);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAllTracksForGivenPlaylist() > Playlist: ${playlist.name} > Error: ${err}`
			);
		}
		return allTracksArr;
	}

	async addTracksToPlaylist(
		playlist: PlaylistDetails,
		tracks: { uri: string; name: string }[]
	) {
		try {
			this.setUserTokens();
			const addTracksRes = await this._spUtil.addTracksToPlaylist(
				playlist.id,
				tracks.map(track => track.uri)
			);

			assert.equal(
				addTracksRes.statusCode,
				201,
				`${this.constructor.name} > Playlist: ${playlist.name} > Adding Tracks To Playlist not successful`
			);
			console.log(
				`${this.constructor.name} > Playlist: ${
					playlist.name
				} > addTracksToPlaylist() > Successfully updated the playlist With Songs -> ${tracks
					.map(track => track.name)
					.join(" , ")}\n`
			);
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > Playlist: ${playlist.name} > addTracksToPlaylist() > Error: ${err}`
			);
		}
	}

	async createNewPlaylist(
		name: string,
		description: string
	): Promise<PlaylistDetails> {
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
			return {
				id: createPlaylistRes.body.id,
				name: createPlaylistRes.body.name,
				owner: createPlaylistRes.body.owner?.display_name,
			};
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > createNewPlaylist() > Error: ${err}`
			);
		}
	}

	async updatePlaylistWithSongs(
		playlist: PlaylistDetails,
		newTracks: { uri: string; name: string }[]
	) {
		try {
			this.setUserTokens();
			console.log(
				`${this.constructor.name} > updatePlaylistWithSongs() > Playlist: ${playlist.name} > New songs to be added in Playlist >> ${newTracks.length}`
			);
			const tracksInPlaylist = await this.getAllTracksForGivenPlaylist(
				playlist
			);
			const uniqueTracks = newTracks.filter(
				newTrack =>
					!tracksInPlaylist.some(
						existingTrack => existingTrack.uri === newTrack.uri
					)
			);
			console.log(
				`${this.constructor.name} > updatePlaylistWithSongs() > Playlist: ${playlist.name} > New and Unique songs to be added in Playlist >> ${uniqueTracks.length}`
			);
			if (uniqueTracks.length) {
				await this.addTracksToPlaylist(playlist, uniqueTracks);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > updatePlaylistWithSongs() > Playlist: ${playlist.name} > Error: ${err}`
			);
		}
	}

	async getRandomSongsFromPlaylist(playlist: PlaylistDetails, count = 10) {
		let randomTracksArr: SpotifyApi.TrackObjectFull[] = [];
		try {
			this.setUserTokens();
			const allTracksArr = await this.getAllTracksForGivenPlaylist(playlist);
			console.log(
				`${this.constructor.name} > getRandomSongsFromPlaylist() > Playlist: ${playlist.name} > Total Tracks Present: ${allTracksArr.length} - Fetching random ${count} Tracks`
			);
			randomTracksArr = Helpers.getRandomItemsFromArray(allTracksArr, count);
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getRandomSongsFromPlaylist() > Playlist: ${playlist.name} > Error: ${err}`
			);
		}
		return randomTracksArr;
	}

	async deleteSongsFromPlaylist(
		playlist: PlaylistDetails,
		trackURIs: { uri: string }[]
	) {
		try {
			this.setUserTokens();
			const deleteTracksRes = await this._spUtil.removeTracksFromPlaylist(
				playlist.id,
				trackURIs
			);

			assert.equal(
				deleteTracksRes.statusCode,
				200,
				`${this.constructor.name} > Playlist: ${playlist.name} > Deletion of Tracks To Playlist not successful`
			);
			console.log(
				`${this.constructor.name} > Playlist: ${playlist.name} > deleteSongsFromPlaylist() > Successfully updated the playlist`
			);
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > Playlist: ${playlist.name} > deleteSongsFromPlaylist() > Error: ${err}`
			);
		}
	}

	async maintainPlaylistsAtSize(playlist: PlaylistDetails, size = 50) {
		try {
			this.setUserTokens();
			const allTracksArr = await this.getAllTracksForGivenPlaylist(playlist);
			const playlistLength = allTracksArr.length;
			console.log(
				`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Total Tracks Present: ${playlistLength}`
			);
			if (playlistLength <= size) {
				console.log(
					`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Playlist size is within Max Size(${size})`
				);
				return;
			} else {
				const deletionSize = playlistLength - size;
				if (deletionSize > 0) {
					const randomSongsForDeletion: SpotifyApi.TrackObjectFull[] =
						Helpers.getRandomItemsFromArray(allTracksArr, deletionSize);
					console.log(
						`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${
							playlist.name
						} > Playlist size(${playlistLength}) is more than Max Size(${size}) - Deleting ${deletionSize} songs -> ${randomSongsForDeletion
							.map(song => song.name)
							.join(" , ")}.\n`
					);
					return await this.deleteSongsFromPlaylist(
						playlist,
						randomSongsForDeletion.map(song => {
							return { uri: song.uri };
						})
					);
				}
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Error: ${err}`
			);
		}
	}

	async updatePlaylistCoverImage(
		playlist: PlaylistDetails,
		relativeImgPath: string
	) {
		try {
			this.setUserTokens();
			const playlistDetails = (await this._spUtil.getPlaylist(playlist.id))
				.body;

			const userUploadedCoverImageExists =
				playlistDetails.images.length &&
				playlistDetails.images.every(
					i => !i.url.match(/mosaic/) //mosaic images are auto-generated
				);
			const fullFilePath = path.resolve(
				__dirname,
				`../../src/${relativeImgPath}`
			);
			if (!userUploadedCoverImageExists) {
				if (fs.existsSync(fullFilePath)) {
					console.log(
						`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Trying to update playlist Image`
					);
					const imgbase64URI = fs.readFileSync(fullFilePath, "base64");
					await this._spUtil.uploadCustomPlaylistCoverImage(
						playlist.id,
						imgbase64URI
					);
				} else {
					console.log(
						`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > ImagePath not Found`
					);
				}
			} else {
				console.log(
					`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Playlist already has User Uploaded image`
				);
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Error: ${err}`
			);
		}
	}
}
