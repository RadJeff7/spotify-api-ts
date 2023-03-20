import SpotifyWebApi from "spotify-web-api-node";
import moment from "moment";
import { Authorization, Token } from "../types";
import * as C from "../resources/constants";

export default class Base {
	protected _util: SpotifyWebApi;
	protected _token!: Token;
	constructor(auth?: Authorization) {
		this._util = new SpotifyWebApi(auth ?? C.Default_Auth_Details);
	}

	async setClientTokens() {
		if (
			!this._token?.access_token ||
			!this._token?.expiry ||
			(this._token?.expiry && this._token.expiry < moment().unix())
		) {
			const clientData = await this._util.clientCredentialsGrant();
			if (clientData.statusCode === 200) {
				this._token = {
					access_token: clientData.body.access_token,
					expiry: moment().unix() + (clientData.body.expires_in - 100),
				};
			}
		}
		console.log(this._token);
		this._util.setAccessToken(this._token.access_token);
	}
}
