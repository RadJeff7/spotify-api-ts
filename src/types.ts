export type Authorization = {
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
};

export type Token = {
	access_token: string;
	expiry: number;
	refresh_token?: string;
};

export interface PlaylistDetails {
	id: string;
	name: string;
	owner?: string;
}

export interface TrackDetails {
	name: string;
	uri: string;
	id: string;
	primaryArtist: string;
	featuringArtists?: string[];
	album: string;
	genres?: string;
	duration?: string;
	released?: string;
}

export type SimpleTrackDetails = Pick<TrackDetails, "id" | "uri" | "name">;

export interface RecentlyPlayedTrackDetails extends TrackDetails {
	lastPlayedAt: string;
}

export type TrackFeatures = {
	trackName: string;
	trackId: string;
	audioFeatures: Pick<
		SpotifyApi.AudioFeaturesResponse,
		| "acousticness"
		| "danceability"
		| "energy"
		| "instrumentalness"
		| "liveness"
		| "speechiness"
		| "valence"
		| "duration_ms"
	>;
};

export type AverageTrackFeaturesWithGenres = {
	avgAudioFeatures: TrackFeatures["audioFeatures"];
	frequentGenres: string[];
	randomTrack: TrackDetails;
};
