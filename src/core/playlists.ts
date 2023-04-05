import assert from "assert";
import {
	Authorization,
	PlaylistDetails,
	RecentlyPlayedTrackDetails,
	SimpleTrackDetails,
	TrackDetails,
} from "../types";
import * as Helpers from "../resources/helpers";
import Base from "./base";
import fs from "fs";
import moment from "moment";
import logger from "../resources/logger";

export default class Playlists extends Base {
	constructor(auth?: Authorization) {
		super(auth);
	}

	async getUserDetails(userid?: string) {
		try {
			this.setUserTokens();
			const userResponse = !userid
				? await this._spUtil.getMe()
				: await this._spUtil.getUser(userid);
			const userBody = userResponse.body;
			logger.info(
				`${this.constructor.name} > getUserDetails() > User Name: ${userBody.display_name}`
			);
			return userBody;
		} catch (err) {
			const errStr = `${this.constructor.name} > getUserDetails() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getAllUserPlaylists(userid?: string) {
		const completePlaylists: SpotifyApi.PlaylistObjectSimplified[] = [];
		const limit = 50;
		let count = limit;
		try {
			this.setUserTokens();
			/* eslint-disable */
			const playlistResponse = !userid
				? await this._spUtil.getUserPlaylists({
						limit: limit,
				  })
				: await this._spUtil.getUserPlaylists(userid, {
						limit: limit,
				  });
			/* eslint-enable */
			const totalPlaylists = playlistResponse.body.total;
			logger.info(
				`${this.constructor.name} > getAllUserPlaylists() > User: ${
					userid ?? "currentUser"
				} Total Playlists Present: ${totalPlaylists}, Fetched ${
					limit < totalPlaylists ? limit : totalPlaylists
				} playlists as of now, Remaining Playlists to be Fetched: ${
					limit < totalPlaylists ? totalPlaylists - limit : 0
				}`
			);
			completePlaylists.push(...playlistResponse.body.items.map(i => i));

			while (totalPlaylists > count) {
				/* eslint-disable */
				const playlistResponse = !userid
					? await this._spUtil.getUserPlaylists({
							limit: limit,
							offset: count,
					  })
					: await this._spUtil.getUserPlaylists(userid, {
							limit: limit,
							offset: count,
					  });
				/* eslint-enable */
				completePlaylists.push(...playlistResponse.body.items.map(i => i));
				count += limit;
				logger.info(
					`${this.constructor.name} > getAllUserPlaylists() > User: ${
						userid ?? "currentUser"
					} Total Playlists Present: ${totalPlaylists}, Fetched ${
						count < totalPlaylists ? count : totalPlaylists
					} playlists as of now, Remaining Playlists to be Fetched: ${
						count < totalPlaylists ? totalPlaylists - count : 0
					}`
				);
			}
		} catch (err) {
			const errStr = `${
				this.constructor.name
			} > getAllUserPlaylists() > User: ${
				userid ?? "currentUser"
			} Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
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
			logger.info(
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
			const totalTracksToBeFetched =
				totalTracksPresent > 1000 ? 1000 : totalTracksPresent;
			while (totalTracksToBeFetched > count) {
				const playlistTracksResponse = await this._spUtil.getPlaylistTracks(
					playlist.id,
					{ limit: limit, offset: count }
				);

				playlistTracksResponse.body.items.map(i => {
					if (i.track) allTracksArr.push(i.track);
				});
				count += limit;
				logger.info(
					`${
						this.constructor.name
					} > getAllTracksForGivenPlaylist() > Playlist: ${
						playlist.name
					} > Total Tracks to be Fetched: ${totalTracksToBeFetched}, Fetched ${
						count < totalTracksToBeFetched ? count : totalTracksToBeFetched
					} Tracks as of now, Remaining Tracks to be Fetched: ${
						count < totalTracksToBeFetched ? totalTracksToBeFetched - count : 0
					}`
				);
			}
		} catch (err) {
			const errStr = `${this.constructor.name} > getAllTracksForGivenPlaylist() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
		return allTracksArr;
	}

	async addTracksToPlaylist(
		playlist: PlaylistDetails,
		tracks: SimpleTrackDetails[]
	) {
		try {
			this.setUserTokens();
			// max length  for one time usage = 100
			const inputTracksChunksArr = Helpers.groupsOfN(tracks, 100);

			for (const inputTracks of inputTracksChunksArr) {
				const addTracksRes = await this._spUtil.addTracksToPlaylist(
					playlist.id,
					inputTracks.map(track => track.uri)
				);

				assert.equal(
					addTracksRes.statusCode,
					201,
					`${this.constructor.name} > Playlist: ${playlist.name} > Adding Tracks To Playlist not successful`
				);
				logger.info(
					`${this.constructor.name} > Playlist: ${
						playlist.name
					} > addTracksToPlaylist() > Successfully updated the playlist With ${
						inputTracks.length
					} Songs -> ${inputTracks.map(track => track.name).join(" , ")}\n`
				);
			}
		} catch (err) {
			const errStr = `${this.constructor.name} > Playlist: ${playlist.name} > addTracksToPlaylist() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async createNewPlaylist(
		name: string,
		description: string,
		makePublicFlag = false
	): Promise<PlaylistDetails> {
		try {
			this.setUserTokens();
			const createPlaylistRes = await this._spUtil.createPlaylist(name, {
				public: makePublicFlag,
				description: description,
				collaborative: false,
			});
			assert.equal(
				createPlaylistRes.statusCode,
				201,
				`${this.constructor.name} > Creation of Playlist: ${name} not successfull`
			);
			logger.info(
				`${this.constructor.name} > createNewPlaylist() > Created new Playlist - name: ${name}`
			);
			return {
				id: createPlaylistRes.body.id,
				name: createPlaylistRes.body.name,
				owner: createPlaylistRes.body.owner?.display_name,
			};
		} catch (err) {
			const errStr = `${this.constructor.name} > createNewPlaylist() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async updatePlaylistWithSongs(
		playlist: PlaylistDetails,
		newTracks: SimpleTrackDetails[]
	) {
		try {
			this.setUserTokens();
			logger.info(
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
			logger.info(
				`${this.constructor.name} > updatePlaylistWithSongs() > Playlist: ${playlist.name} > New and Unique songs to be added in Playlist >> ${uniqueTracks.length}`
			);
			if (uniqueTracks.length) {
				await this.addTracksToPlaylist(playlist, uniqueTracks);
			}
		} catch (err) {
			const errStr = `${this.constructor.name} > updatePlaylistWithSongs() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getRandomSongsFromPlaylist(playlist: PlaylistDetails, count = 10) {
		let randomTracksArr: SpotifyApi.TrackObjectFull[] = [];
		try {
			this.setUserTokens();
			const allTracksArr = await this.getAllTracksForGivenPlaylist(playlist);
			logger.info(
				`${this.constructor.name} > getRandomSongsFromPlaylist() > Playlist: ${playlist.name} > Total Tracks Present: ${allTracksArr.length} - Fetching random ${count} Tracks`
			);
			randomTracksArr = Helpers.getRandomItemsFromArray(allTracksArr, count);
		} catch (err) {
			const errStr = `${this.constructor.name} > getRandomSongsFromPlaylist() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
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
			logger.info(
				`${this.constructor.name} > Playlist: ${playlist.name} > deleteSongsFromPlaylist() > Successfully updated the playlist`
			);
		} catch (err) {
			const errStr = `${this.constructor.name} > Playlist: ${playlist.name} > deleteSongsFromPlaylist() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async maintainPlaylistsAtSize(playlist: PlaylistDetails, size = 50) {
		try {
			this.setUserTokens();
			const allTracksArr = await this.getAllTracksForGivenPlaylist(playlist);
			const playlistLength = allTracksArr.length;
			logger.info(
				`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Total Tracks Present: ${playlistLength}`
			);
			if (playlistLength <= size) {
				logger.info(
					`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Playlist size is within Max Size(${size})`
				);
				return;
			} else {
				let deletionSize = playlistLength - size;
				if (deletionSize > 0) {
					deletionSize = deletionSize >= 100 ? 100 : deletionSize;
					const randomSongsForDeletion: SpotifyApi.TrackObjectFull[] =
						Helpers.getRandomItemsFromArray(allTracksArr, deletionSize);
					logger.info(
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
			const errStr = `${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getPlaylistDetails(playlist: PlaylistDetails) {
		try {
			this.setUserTokens();
			const playlistDetailsBody = (await this._spUtil.getPlaylist(playlist.id))
				.body;
			logger.info(
				`${this.constructor.name} > getPlaylistDetails() > Playlist: ${playlist.name} > Owner: ${playlistDetailsBody.owner.display_name}, Total Tracks: ${playlistDetailsBody.tracks.total}, Followers: ${playlistDetailsBody.followers.total}`
			);
			return playlistDetailsBody;
		} catch (err) {
			const errStr = `${this.constructor.name} > getPlaylistDetails() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async updatePlaylistCoverImage(
		playlist: PlaylistDetails,
		fullFilePath: string,
		force?: boolean
	) {
		try {
			this.setUserTokens();
			let updateRequired = Boolean(force);
			// if by force = true; Skip check for userUploadedImageExists Check
			if (!force) {
				// Check if
				const playlistDetails = await this.getPlaylistDetails(playlist);

				const userUploadedCoverImageExists =
					playlistDetails.images.length &&
					playlistDetails.images.every(
						i => !i.url.match(/mosaic/) //mosaic images are auto-generated
					);
				updateRequired = !userUploadedCoverImageExists;
			}
			if (updateRequired) {
				if (fs.existsSync(fullFilePath)) {
					logger.info(
						`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Trying to update playlist Image`
					);
					const imgbase64URI = fs.readFileSync(fullFilePath, "base64");
					await this._spUtil.uploadCustomPlaylistCoverImage(
						playlist.id,
						imgbase64URI
					);
				} else {
					logger.error(
						`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > ImagePath not Found`
					);
				}
			} else {
				logger.info(
					`${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Playlist already has User Uploaded image`
				);
			}
		} catch (err) {
			const errStr = `${this.constructor.name} > updateAutogeneratedPlaylistImages() > Playlist: ${playlist.name} > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getLastPlayedTracks(count = 50) {
		try {
			this.setUserTokens();
			const lastPlayedRes = await this._spUtil.getMyRecentlyPlayedTracks({
				limit: count,
			});

			const consolidatedTrackDetailsArr: RecentlyPlayedTrackDetails[] =
				lastPlayedRes.body.items.map(history => {
					return {
						name: history.track.name.replace(/"/g, ""),
						uri: history.track.uri,
						id: history.track.id,
						primaryArtist: history.track.artists[0].name,
						featuringArtists:
							history.track.artists.length > 1
								? history.track.artists.slice(1).map(i => i.name)
								: undefined,
						album: history.track.album.name.replace(/"/g, ""),
						duration: moment.utc(history.track.duration_ms).format("mm:ss"),
						released: history.track.album.release_date,
						lastPlayedAt: moment(history.played_at).format(
							"YYYY-MM-DD h:mm:ss a"
						),
					};
				});
			logger.info(
				`${this.constructor.name} > getLastPlayedTracks() > Last Played Tracks >> ${consolidatedTrackDetailsArr.length}`
			);
			return consolidatedTrackDetailsArr;
		} catch (err) {
			const errStr = `${this.constructor.name} > getLastPlayedTracks() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getGenreRecommendations() {
		try {
			this.setUserTokens();
			const genreRecommendationsRes =
				await this._spUtil.getAvailableGenreSeeds();
			const recommendedGenres = genreRecommendationsRes.body.genres;
			logger.info(
				`${this.constructor.name} > getGenreRecommendations() > Genres Recommendations >> ${recommendedGenres.length}`
			);
			return recommendedGenres;
		} catch (err) {
			const errStr = `${this.constructor.name} > getGenreRecommendations() > Error: ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async getRecommendedTracks(config: {
		count?: number;
		seed_tracks_array?: TrackDetails[];
		seed_genres_array?: string[];
	}) {
		try {
			this.setUserTokens();
			// only 5 seed tracks are allowed
			const selected_seed_tracks =
				config.seed_tracks_array && config.seed_tracks_array.length > 5
					? config.seed_tracks_array.splice(0, 4)
					: config.seed_tracks_array;
			const seedTracksURI = selected_seed_tracks
				? selected_seed_tracks.map(i => i.id)
				: undefined;
			const inputGenres =
				config.seed_genres_array && config.seed_genres_array.length > 5
					? config.seed_genres_array.splice(0, 4)
					: config.seed_genres_array;
			const recommedationFunction = this._spUtil.getRecommendations;
			type requestConfigObj = NonNullable<
				Parameters<typeof recommedationFunction>[0]
			>;
			const requestConfig: requestConfigObj = {
				limit: config.count ?? 100,
				seed_tracks: seedTracksURI,
				seed_genres: inputGenres,
				market: "IN",
			};
			logger.debug(
				`${
					this.constructor.name
				} > getRecommendedTracks() > Recommendation Request Object: ${JSON.stringify(
					requestConfig
				)}`
			);
			const recommedationsResponse = await this._spUtil.getRecommendations(
				requestConfig
			);
			const recommendedTracks: TrackDetails[] =
				recommedationsResponse.body.tracks.map(track => {
					return {
						name: track.name.replace(/"/g, ""),
						uri: track.uri,
						id: track.id,
						primaryArtist: track.artists[0].name,
						featuringArtists:
							track.artists.length > 1
								? track.artists.slice(1).map(i => i.name)
								: undefined,
						album: track.album.name.replace(/"/g, ""),
						duration: moment.utc(track.duration_ms).format("mm:ss"),
						released: track.album.release_date,
					};
				});
			logger.debug(
				`${
					this.constructor.name
				} > getRecommendedTracks() > Recommendation Request Object: ${JSON.stringify(
					requestConfig
				)} >> Recommedated Tracks Received >> ${recommendedTracks.length}`
			);
			return recommendedTracks;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getRecommendedTracks() > Error: ${err}`
			);
		}
	}

	async updatePlaylistDetails(
		playlist: PlaylistDetails,
		updateOptions: {
			name?: string;
			description?: string;
			collaborative?: boolean;
			public?: boolean;
		}
	) {
		try {
			this.setUserTokens();
			logger.info(
				`${this.constructor.name} > updatePlaylistDetails() > Playlist: ${
					playlist.name
				} > Updating Below Details: ${JSON.stringify(updateOptions)}`
			);
			if (
				updateOptions.name ||
				updateOptions.description ||
				updateOptions.collaborative !== undefined ||
				updateOptions.public !== undefined
			) {
				await this._spUtil.changePlaylistDetails(playlist.id, {
					name: updateOptions.name,
					description: updateOptions.description,
					public: updateOptions.public,
					collaborative: updateOptions.collaborative,
				});
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > updatePlaylistDetails() > Error: ${err}`
			);
		}
	}

	async getTrackFeatures(track: SimpleTrackDetails) {
		try {
			this.setUserTokens();
			const audioFeatureRes = await this._spUtil.getAudioFeaturesForTrack(
				track.id
			);
			const audioFeatureObj = audioFeatureRes.body;
			return audioFeatureObj;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > updatePlaylistDetails() > Error: ${err}`
			);
		}
	}
}
