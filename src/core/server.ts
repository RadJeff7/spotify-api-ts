import Express from "express";
import { Authorization } from "../types";
import * as C from "../resources/constants";
import Base from "./base";
import moment from "moment";
import fs from "fs";
import assert from "assert";

export default class Server extends Base {
	protected _expressUtil: ReturnType<typeof Express>;
	constructor(auth?: Authorization) {
		super(auth);
		this._expressUtil = Express();
	}

	private async login() {
		this._expressUtil.get("/login", (_, res) => {
			const authorizeURL = this._spUtil.createAuthorizeURL(
				this._scopes,
				"test",
				true
			);
			console.log(
				`${this.constructor.name} > login() > Login Page Invoked => Authorize URL: ${authorizeURL}`
			);
			res.redirect(authorizeURL);
		});
	}

	private async callBack() {
		this._expressUtil.get("/callback", async (req, res) => {
			const error = req.query.error;
			const code = req.query.code as string;

			if (error) {
				console.error(
					`${this.constructor.name} > callBack() > Callback Error: ${error}`
				);
				res.send(`Callback Error: ${error}`);
				return;
			}

			const authData = await this._spUtil.authorizationCodeGrant(code);

			const access_token = authData.body["access_token"];
			const refresh_token = authData.body["refresh_token"];
			const expires_in = authData.body["expires_in"];
			this._userToken = {
				access_token: access_token,
				refresh_token: refresh_token,
				expiry: moment().unix() + (expires_in - 100),
			};

			this._spUtil.setAccessToken(access_token);
			this._spUtil.setRefreshToken(refresh_token);

			fs.writeFileSync(
				"./token.json",
				JSON.stringify(this._userToken, null, 2)
			);

			console.log(
				`${this.constructor.name} > callBack() > Sucessfully retreived access token. Expires in ${expires_in} s.`
			);
			res.send("Success! You can now close the window.");

			setInterval(async () => {
				const data = await this._spUtil.refreshAccessToken();
				const access_token = data.body["access_token"];
				const new_expiry = data.body["expires_in"];
				console.log(
					`${this.constructor.name} > callBack() > The access token has been refreshed!`
				);
				this._spUtil.setAccessToken(access_token);
				this._userToken.access_token = access_token;
				this._userToken.expiry = moment().unix() + (new_expiry - 100);

				fs.writeFileSync(
					"./token.json",
					JSON.stringify(this._userToken, null, 2)
				);
			}, (expires_in / 2) * 1000);
		});
	}

	async start() {
		try {
			assert.ok(
				this._authDetails.clientId && this._authDetails.clientSecret,
				"AuthDetails are not set - Check ClientId and Client Secret Values"
			);
		} catch (err) {
			console.log(`${this.constructor.name} > start() > Error: ${err}`);
			return;
		}

		await this.login();
		await this.callBack();

		const server = this._expressUtil.listen(8888, () => {
			console.log(
				`${this.constructor.name} > start() > Http Server is UP. go to ${C.host_url}/login`
			);
		});
		return server;
	}
}
