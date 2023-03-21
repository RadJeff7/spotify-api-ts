import SpotifyWebApi from "spotify-web-api-node";
import moment from "moment";
import { Authorization, Token } from "../types";
import * as C from "../resources/constants";
import fs from "fs";

export default class Base {
	protected _util: SpotifyWebApi;
	protected _clientToken!: Token;
	protected _userToken!: Token;
	constructor(auth?: Authorization) {
		this._util = new SpotifyWebApi(auth ?? C.Default_Auth_Details);
	}

	protected async setClientTokens() {
		if (
			!this._clientToken?.access_token ||
			!this._clientToken?.expiry ||
			(this._clientToken?.expiry && this._clientToken.expiry < moment().unix())
		) {
			const clientData = await this._util.clientCredentialsGrant();
			if (clientData.statusCode === 200) {
				this._clientToken = {
					access_token: clientData.body.access_token,
					expiry: moment().unix() + (clientData.body.expires_in - 100),
				};
			}
		}

		console.log(`setClientTokens() > ${JSON.stringify(this._clientToken)}`);
		this._util.setAccessToken(this._clientToken.access_token);
	}

	protected setUserTokens() {
		if (!this._userToken?.access_token || !this._userToken?.expiry) {
			const fileStr = fs.readFileSync("./token.json", { encoding: "utf8" });
			this._userToken = JSON.parse(fileStr);
		}
		if (this._userToken?.access_token) {
			this._util.setAccessToken(this._userToken.access_token);
		}
		console.log(`setUserTokens() > ${JSON.stringify(this._userToken)}`);
	}
}
