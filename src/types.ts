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
