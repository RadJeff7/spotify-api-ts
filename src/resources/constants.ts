import { Authorization } from "../types";

export const host_url = "http://localhost:8888";
export const Default_Auth_Details: Authorization = {
	clientId: "92562013dc554005abdb2f2f6ea58754",
	clientSecret: "9300cc0736a949adacdb24100913f161",
	redirectUri: `${host_url}/callback`,
};

export const playlist_scopes = [
	"playlist-read-collaborative",
	"playlist-modify-public",
	"playlist-read-private",
	"playlist-modify-private",
];

export const user_scopes = [
	"user-library-modify",
	"user-library-read",
	"user-top-read",
	"user-read-playback-position",
	"user-read-recently-played",
	"user-follow-read",
	"user-follow-modify",
	"user-read-email",
	"user-read-private",
	"user-read-playback-state",
	"user-modify-playback-state",
	"user-read-currently-playing",
];

export const extra_scopes = [
	"ugc-image-upload",
	"streaming",
	"app-remote-control",
];

export const TargetPlaylist = {
	name: "Archive of weekly songs",
	description:
		"This is a archive of discover weekly songs - created by spotify api",
};
