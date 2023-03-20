export type Authorization = {
	clientId: string;
	clientSecret: string;
};

export type Token = {
	access_token: string;
	expiry: number;
};
