import fs from "fs";
import SpotifyWebApi from "spotify-web-api-node";
import moment from "moment";
import { Authorization, Token } from "../types";
import * as C from "../resources/constants";
import logger from "../resources/logger";

export default class Base {
	protected _authDetails: Authorization;
	protected _spUtil: SpotifyWebApi;
	protected _clientToken!: Token;
	protected _userToken!: Token;
	protected _scopes: string[];
	constructor(auth?: Authorization) {
		this._authDetails = auth ?? C.Default_Auth_Details;
		this._spUtil = new SpotifyWebApi(this._authDetails);
		this._scopes = [...C.playlist_scopes, ...C.user_scopes, ...C.extra_scopes];
	}

	protected async setClientTokens() {
		if (
			!this._clientToken?.access_token ||
			!this._clientToken?.expiry ||
			(this._clientToken?.expiry && this._clientToken.expiry < moment().unix())
		) {
			const clientData = await this._spUtil.clientCredentialsGrant();
			if (clientData.statusCode === 200) {
				this._clientToken = {
					access_token: clientData.body.access_token,
					expiry: moment().unix() + (clientData.body.expires_in - 100),
				};
			}
		}

		logger.info(
			`${this.constructor.name} > setClientTokens() > ${JSON.stringify(
				this._clientToken
			)}`
		);
		this._spUtil.setAccessToken(this._clientToken.access_token);
	}

	protected setUserTokens() {
		if (!this._userToken?.access_token || !this._userToken?.expiry) {
			const fileStr = fs.readFileSync("./token.json", { encoding: "utf8" });
			this._userToken = JSON.parse(fileStr);
			logger.info(
				`${
					this.constructor.name
				} > setUserTokens() > Read Tokens from File: ${JSON.stringify(
					this._userToken
				)}`
			);
		}
		if (this._userToken?.access_token && this._userToken.expiry) {
			if (this._userToken.expiry < moment().unix()) {
				const errStr = `${this.constructor.name} > setUserTokens() > Token Expiry time has passed - Access token might be Expired - Generate new Token using TokenGenerator`;
				logger.error(errStr);
				throw new Error(errStr);
			}
			this._spUtil.setAccessToken(this._userToken.access_token);
		}
	}
}
