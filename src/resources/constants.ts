import dotenv from "dotenv";
dotenv.config();
import { Authorization } from "../types";

export const host_url = "http://localhost:8888";
export const Default_Auth_Details: Authorization = {
	clientId:
		process.env.SPOTIFY_API_CLIENT_ID || "92562013dc554005abdb2f2f6ea58754",
	clientSecret:
		process.env.SPOTIFY_API_CLIENT_SECRET || "9300cc0736a949adacdb24100913f161",
	redirectUri: process.env.SPOTIFY_API_REDIRECT_URI || `${host_url}/callback`,
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

export const WeeklyArchivePlaylist = {
	name: "Archive of weekly songs",
	description:
		"This is a archive of discover weekly songs - created by spotify api",
};

export const RandomArchivePlaylist = {
	name: "Spotify Mix Archive",
	description:
		"This is a Archive of Random Songs from Daily Mix - created by spotify api 💥 - Each Time 20-25 songs added",
};

export const Spotify_User_Creds = {
	email: process.env.SPOTIFY_USER_EMAIL || "rajdeepde77@gmail.com",
	password: process.env.SPOTIFY_USER_PASS || "raj2911dey",
};
