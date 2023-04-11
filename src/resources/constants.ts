import dotenv from "dotenv";
dotenv.config();
import { Authorization } from "../types";

export const host_url = "http://localhost:8888";
export const Default_Auth_Details: Authorization = {
	clientId: process.env.SPOTIFY_API_CLIENT_ID || "", //Mention ClientID in .env file
	clientSecret: process.env.SPOTIFY_API_CLIENT_SECRET || "", //Mention ClientSecret in .env file
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
	name: "Discover Weekly Archive",
	description:
		"Weekly Spotify Recommendations at one place 🎶 Created by spotify api - Maintained at around 60 Songs",
};

export const RandomArchivePlaylist = {
	name: "Random Daily Mix",
	description:
		"Random Songs from Spotify Daily - created by spotify api 💥 - Maintained at 50 Songs",
};

export const RecommendationsPlaylistFromSpotify = {
	name: "Spotify Recommendations Mix",
	description:
		"Random Songs from Spotify Recommendations - created by spotify api 🎶 - Maintained at 100 Songs",
};

export const RecommendationsPlaylistFromUser = {
	name: "User Recommendations",
	description:
		"Random Songs picked from USER's playlists - created by spotify api 🎶 - ",
};

export const Spotify_User_Creds = {
	email: process.env.SPOTIFY_USER_EMAIL || "", //Mention User Email in .env file
	password: process.env.SPOTIFY_USER_PASS || "", //Mention User password in .env file
};

export const Browser_Executable_Path =
	process.env.BROWSER_EXECUTABLE_PATH || ""; //Mention Path in .env file

export const Default_Server_Uptime_Minutes = 20;

export const Relative_Image_Folder = "/resources/images";

export const Relative_Playlist_Image_Path = {
	random: `${Relative_Image_Folder}/Random-Mix-Playlist.jpg`,
	weekly: `${Relative_Image_Folder}/DiscoverWeekly-Mix-Playlist.jpg`,
	recommendation: `${Relative_Image_Folder}/Recommendation_Mix.jpg`,
};

export const DEFAULT_SPOTIFY_USER = {
	username: "RadJeff",
	profile_url: "https://open.spotify.com/user/rajdeepde77?si=8af6aede337c43b3",
};

export const DEFAULT_PLAYLIST_FOR_CRAWL =
	"https://open.spotify.com/playlist/6GPDJt2IcoelLKSPOg96N6?si=53cca069a7e04a34";

export const Unsplash_API_Creds = {
	clientId: process.env.UNSPLASH_API_CLIENT_ID || "",
	clientSecret: process.env.UNSPLASH_API_CLIENT_SECRET || "",
};

export const ImageSearhTerms = [
	"music",
	"playlist",
	"album",
	"singer",
	"instruments",
	"concert",
	"DJ",
	"vinyl",
	"headphones",
	"speakers",
	"concert",
	"aesthetic",
	"guitar",
	"indie",
	"hiphop",
];

export const PLAYLIST_USAGE_MAX_LIMIT = 100 as const;
