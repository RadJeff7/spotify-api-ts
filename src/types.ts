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
