import assert from "assert";
import {
	Authorization,
	PlaylistDetails,
	RecentlyPlayedTrackDetails,
	SimpleTrackDetails,
	TrackDetails,
	TrackFeatures,
	AverageTrackFeaturesWithGenres,
	PlaylistTrackObject,
	FrequencyMapperObj,
} from "../types";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
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
		const allTracksArr: PlaylistTrackObject[] = [];
		const limit = C.PLAYLIST_USAGE_MAX_LIMIT;
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
				if (i.track)
					allTracksArr.push({
						track: i.track,
						added_at: i.added_at,
						added_by: i.added_by.display_name,
					});
			});
			const totalTracksToBeFetched =
				totalTracksPresent > 1000 ? 1000 : totalTracksPresent;
			while (totalTracksToBeFetched > count) {
				const playlistTracksResponse = await this._spUtil.getPlaylistTracks(
					playlist.id,
					{ limit: limit, offset: count }
				);

				playlistTracksResponse.body.items.map(i => {
					if (i.track)
						allTracksArr.push({
							track: i.track,
							added_at: i.added_at,
							added_by: i.added_by.display_name,
						});
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
			const inputTracksChunksArr = Helpers.groupsOfN(
				tracks,
				C.PLAYLIST_USAGE_MAX_LIMIT
			);

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
						existingTrack => existingTrack.track.uri === newTrack.uri
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
		let randomTracksArr: PlaylistTrackObject[] = [];
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
				const deletionSize = playlistLength - size;
				if (deletionSize > 0) {
					const songsSelectedForDeletion: PlaylistTrackObject[] =
						allTracksArr.slice(0, deletionSize);
					// Helpers.getRandomItemsFromArray(allTracksArr, deletionSize);
					logger.info(
						`${this.constructor.name} > maintainPlaylistsAtSize() > Playlist: ${playlist.name} > Playlist size(${playlistLength}) is more than Max Size(${size}) - Deleting in Total ${deletionSize} songs `
					);

					// max length  for one time usage = 100
					const toBeDeletedTracksChunksArr = Helpers.groupsOfN(
						songsSelectedForDeletion,
						C.PLAYLIST_USAGE_MAX_LIMIT
					);

					let deletedTracksCount = 0;
					for (const tobeDeletedTracks of toBeDeletedTracksChunksArr) {
						logger.info(
							`${
								this.constructor.name
							} > maintainPlaylistsAtSize() > Playlist: ${
								playlist.name
							} > Current Playlist size(${
								playlistLength - deletedTracksCount
							}) is more than Max Size(${size}) - Deleted ${
								tobeDeletedTracks.length
							} songs In Batch -> ${tobeDeletedTracks
								.map(playlistTrack => playlistTrack.track.name)
								.join(" , ")}.\n`
						);
						await this.deleteSongsFromPlaylist(
							playlist,
							tobeDeletedTracks.map(playlistTrack => {
								return { uri: playlistTrack.track.uri };
							})
						);
						deletedTracksCount += tobeDeletedTracks.length;
						if (deletedTracksCount >= deletionSize) {
							break;
						}
					}
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
		seed_tracks_array: TrackDetails[];
		seed_artist_array?: string[];
		seed_genres_array: string[];
		audioFeatures?: AverageTrackFeaturesWithGenres["avgAudioFeatures"];
	}) {
		try {
			this.setUserTokens();
			// only 2 seed tracks are allowed
			const selected_seed_tracks =
				config.seed_tracks_array.length > 3
					? Helpers.getRandomItemsFromArray(config.seed_tracks_array, 2)
					: config.seed_tracks_array;
			const seedTracksURI = selected_seed_tracks
				? selected_seed_tracks.map(i => i.id)
				: undefined;
			const inputGenres =
				config.seed_genres_array.length > 4
					? Helpers.getRandomItemsFromArray(config.seed_genres_array, 3)
					: config.seed_genres_array;
			const inputArtists =
				config.seed_artist_array && config.seed_artist_array.length > 2
					? Helpers.getRandomItemsFromArray(config.seed_artist_array, 1)
					: config.seed_artist_array;
			const requestConfig: SpotifyApi.RecommendationsOptionsObject = {
				limit: config.count ?? 50, //max can be set to 100
				seed_tracks: seedTracksURI,
				seed_genres: inputGenres,
				seed_artists: inputArtists,
				target_acousticness: config.audioFeatures?.acousticness,
				target_danceability: config.audioFeatures?.danceability,
				target_energy: config.audioFeatures?.energy,
				target_instrumentalness: config.audioFeatures?.instrumentalness,
				target_liveness: config.audioFeatures?.liveness,
				target_speechiness: config.audioFeatures?.speechiness,
				target_valence: config.audioFeatures?.valence,
				market: "IN",
			};
			logger.info(
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
			logger.info(
				`${
					this.constructor.name
				} > getRecommendedTracks() > Recommendation Request Object: ${JSON.stringify(
					requestConfig
				)} >> Recommedated Tracks Received >> ${
					recommendedTracks.length
				} >> Songs are: ${recommendedTracks
					.map(i => {
						return `${i.name} - By ${i.primaryArtist}`;
					})
					.join(" , ")}`
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

	async getAudioFeaturesForSingleTrack(
		track: SimpleTrackDetails
	): Promise<TrackFeatures> {
		try {
			this.setUserTokens();
			const { body: audioFeatures } =
				await this._spUtil.getAudioFeaturesForTrack(track.id);
			const trackFeatures: TrackFeatures = {
				trackName: track.name,
				trackId: track.id,
				audioFeatures: {
					acousticness: audioFeatures.acousticness,
					danceability: audioFeatures.danceability,
					energy: audioFeatures.energy,
					instrumentalness: audioFeatures.instrumentalness,
					liveness: audioFeatures.liveness,
					speechiness: audioFeatures.speechiness,
					valence: audioFeatures.valence,
					duration_ms: audioFeatures.duration_ms,
				},
			};
			logger.info(
				`${this.constructor.name} > getTrackFeatures() > ${JSON.stringify(
					trackFeatures
				)}`
			);
			return trackFeatures;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getTrackFeatures() > Error: ${err}`
			);
		}
	}

	async getAudioFeaturesForMultipleTracks(
		tracks: SimpleTrackDetails[]
	): Promise<TrackFeatures[]> {
		const completeTrackFeatures: TrackFeatures[] = [];
		try {
			this.setUserTokens();
			const inputTracksChunksArr = Helpers.groupsOfN(
				tracks,
				C.PLAYLIST_USAGE_MAX_LIMIT
			);

			for (const inputTracks of inputTracksChunksArr) {
				// Get Audio Features of Multiple Tracks in One API call
				const { body: audioFeatures } =
					await this._spUtil.getAudioFeaturesForTracks(
						inputTracks.map(track => track.id)
					);
				// Iterate the AudioFeatures Array to parse the required details
				audioFeatures.audio_features.map(audiofeatureObj => {
					const trackFeatureObj: TrackFeatures = {
						trackId: audiofeatureObj.id,
						trackName:
							inputTracks.find(i => i.id === audiofeatureObj.id)?.name ?? "",
						audioFeatures: {
							acousticness: audiofeatureObj.acousticness,
							danceability: audiofeatureObj.danceability,
							energy: audiofeatureObj.energy,
							instrumentalness: audiofeatureObj.instrumentalness,
							liveness: audiofeatureObj.liveness,
							speechiness: audiofeatureObj.speechiness,
							valence: audiofeatureObj.valence,
							duration_ms: audiofeatureObj.duration_ms,
						},
					};
					logger.info(
						`${
							this.constructor.name
						} > getAudioFeaturesForMultipleTracks() > Current Tracks Features:  ${JSON.stringify(
							trackFeatureObj
						)} - adding in completeTrackFeatures Object`
					);
					completeTrackFeatures.push(trackFeatureObj);
				});
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAudioFeaturesForMultipleTracks() > Error: ${err}`
			);
		}
		logger.info(
			`${this.constructor.name} > getAudioFeaturesForMultipleTracks() > Total Tracks Features Added: ${completeTrackFeatures.length}`
		);

		return completeTrackFeatures;
	}

	async getFrequentArtistAndGenres(
		artists: SpotifyApi.ArtistObjectSimplified[],
		count = 5
	): Promise<FrequencyMapperObj> {
		const completeSortedArtistAndGenres: {
			sortedGenres: string[];
			sortedArtists: string[];
		} = {
			sortedArtists: [],
			sortedGenres: [],
		};

		// Fetch artists' details in bulk
		try {
			this.setUserTokens();
			const artistNames: string[] = [];
			const completeArtistsResponse: SpotifyApi.ArtistObjectFull[] = [];
			const inputArtistsChunkArr = Helpers.groupsOfN(artists, 50);
			for (const inputArtists of inputArtistsChunkArr) {
				const {
					body: { artists },
				} = await this._spUtil.getArtists(inputArtists.map(i => i.id));
				const currentArtistsGroup = inputArtists.map(i => i.name);
				artistNames.push(...currentArtistsGroup);
				logger.info(
					`${
						this.constructor.name
					} > getFrequentArtistGenres() > Current Artists Array: ${currentArtistsGroup.join(
						", "
					)} - Fetching Genre Details`
				);
				completeArtistsResponse.push(...artists);
			}

			// Extract genres from the fetched artists
			const genres: string[] = completeArtistsResponse.reduce(
				(acc: string[], artist) => {
					acc.push(...artist.genres);
					return acc;
				},
				[]
			);

			// Create a frequency count of genres using a Map
			const genreCounts: Map<string, number> = new Map();
			genres.forEach((genre: string) => {
				const count: number = genreCounts.get(genre) || 0;
				genreCounts.set(genre, count + 1);
			});

			// Create a frequency count of Artists using a Map
			const artistNameCounts: Map<string, number> = new Map();
			artistNames.forEach((artist: string) => {
				const count: number = artistNameCounts.get(artist) || 0;
				artistNameCounts.set(artist, count + 1);
			});

			// Sort genres by frequency in descending order
			completeSortedArtistAndGenres.sortedGenres = Array.from(
				genreCounts.keys()
			).sort((a, b) => {
				const countA: number = genreCounts.get(a) || 0;
				const countB: number = genreCounts.get(b) || 0;
				return countB - countA;
			});

			// Sort artists by frequency in descending order
			completeSortedArtistAndGenres.sortedArtists = Array.from(
				artistNameCounts.keys()
			).sort((a, b) => {
				const countA: number = artistNameCounts.get(a) || 0;
				const countB: number = artistNameCounts.get(b) || 0;
				return countB - countA;
			});
			logger.info(
				`${
					this.constructor.name
				} > getFrequentArtistGenres() > Sorted By Frequency: ${JSON.stringify(
					completeSortedArtistAndGenres
				)}`
			);
		} catch (err) {
			logger.error(
				`${this.constructor.name} > getFrequentArtistGenres() > Error: ${err}`
			);
		}

		// Return the top most frequent genres
		return {
			sortedArtists: completeSortedArtistAndGenres.sortedArtists.slice(
				0,
				count
			),
			sortedGenres: completeSortedArtistAndGenres.sortedGenres.slice(0, count),
		};
	}

	async getAvgAudioFeaturesBasedOnPlaylist(
		playlist: PlaylistDetails
	): Promise<AverageTrackFeaturesWithGenres> {
		try {
			this.setUserTokens();
			// Retrieve the list of tracks in the playlist and analyze their audio features and genres
			const tracks = await this.getAllTracksForGivenPlaylist(playlist);

			const { sortedGenres, sortedArtists } =
				await this.getFrequentArtistAndGenres(
					tracks.map(playlistTrack => playlistTrack.track.artists[0])
				);

			const randomTrack: TrackDetails = [
				Helpers.shuffleArray(
					tracks.filter(i => i.track.artists[0].name === sortedArtists[0])
				)?.[0] ?? Helpers.getRandomItemsFromArray(tracks, 1)[0],
			].map(i => {
				return {
					name: i.track.name,
					id: i.track.id,
					uri: i.track.uri,
					album: i.track.name,
					primaryArtist: i.track.artists[0].name,
				};
			})[0];

			// Get Track Features of each track
			const analyzedTracks = await this.getAudioFeaturesForMultipleTracks(
				tracks.map(playlistTrack => {
					return {
						id: playlistTrack.track.id,
						name: playlistTrack.track.name,
						uri: playlistTrack.track.uri,
					};
				})
			);

			logger.info(
				`${this.constructor.name} > getAvgAudioFeaturesBasedOnPlaylist() > Total Analyzed Songs: ${analyzedTracks.length}`
			);

			// Calculate the average audio features of the tracks in the playlist
			const avgAudioFeatures: TrackFeatures["audioFeatures"] =
				analyzedTracks.reduce(
					(sum, trackFeatureObj) => ({
						acousticness:
							sum.acousticness + trackFeatureObj.audioFeatures.acousticness,
						danceability:
							sum.danceability + trackFeatureObj.audioFeatures.danceability,
						energy: sum.energy + trackFeatureObj.audioFeatures.energy,
						instrumentalness:
							sum.instrumentalness +
							trackFeatureObj.audioFeatures.instrumentalness,
						liveness: sum.liveness + trackFeatureObj.audioFeatures.liveness,
						speechiness:
							sum.speechiness + trackFeatureObj.audioFeatures.speechiness,
						valence: sum.valence + trackFeatureObj.audioFeatures.valence,
						duration_ms:
							sum.duration_ms + trackFeatureObj.audioFeatures.duration_ms,
					}),
					{
						acousticness: 0,
						danceability: 0,
						energy: 0,
						instrumentalness: 0,
						liveness: 0,
						speechiness: 0,
						valence: 0,
						duration_ms: 0,
					}
				);

			avgAudioFeatures.acousticness /= analyzedTracks.length;
			avgAudioFeatures.danceability /= analyzedTracks.length;
			avgAudioFeatures.energy /= analyzedTracks.length;
			avgAudioFeatures.instrumentalness /= analyzedTracks.length;
			avgAudioFeatures.liveness /= analyzedTracks.length;
			avgAudioFeatures.speechiness /= analyzedTracks.length;
			avgAudioFeatures.valence /= analyzedTracks.length;
			avgAudioFeatures.duration_ms /= analyzedTracks.length;

			// Round the values of the audio features to 3 decimal places
			Object.keys(avgAudioFeatures).forEach(key => {
				avgAudioFeatures[key as keyof TrackFeatures["audioFeatures"]] = Number(
					avgAudioFeatures[key as keyof TrackFeatures["audioFeatures"]].toFixed(
						3
					)
				);
			});

			logger.info(
				`${
					this.constructor.name
				} > getAvgAudioFeaturesBasedOnPlaylist() > Average Audio Features of Playlist: ${
					playlist.name
				}: ${JSON.stringify(avgAudioFeatures)}`
			);

			const analyzedFeaturesObj: AverageTrackFeaturesWithGenres = {
				avgAudioFeatures,
				frequentGenres: sortedGenres,
				randomTrack,
			};

			logger.info(
				`${
					this.constructor.name
				} > getAvgAudioFeaturesBasedOnPlaylist() > Complete Audio Features Analysis: ${
					playlist.name
				}: ${JSON.stringify(analyzedFeaturesObj)}`
			);

			return analyzedFeaturesObj;
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getAvgAudioFeaturesBasedOnPlaylist() > Error: ${err}`
			);
		}
	}
}
