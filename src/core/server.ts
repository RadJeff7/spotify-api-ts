import Express from "express";
import { Authorization } from "../types";
import * as C from "../resources/constants";
import Base from "./base";
import moment from "moment";
import fs from "fs";

export default class Server extends Base {
	protected _app: ReturnType<typeof Express>;
	constructor(auth?: Authorization) {
		super(auth);
		this._app = Express();
	}

	private async login() {
		const scopes = [...C.playlist_scopes, ...C.user_scopes];
		this._app.get("/login", (_, res) => {
			const authorizeURL = this._spUtil.createAuthorizeURL(
				scopes,
				"test",
				true
			);
			console.log(authorizeURL);
			res.redirect(authorizeURL);
		});
	}

	private async callBack() {
		this._app.get("/callback", async (req, res) => {
			const error = req.query.error;
			const code = req.query.code as string;
			const state = req.query.state;
			console.log(`Started: ${error} - ${code} - ${state}`);

			if (error) {
				console.error("Callback Error:", error);
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

			console.log("access_token:", access_token);
			console.log("refresh_token:", refresh_token);

			console.log(
				`Sucessfully retreived access token. Expires in ${expires_in} s.`
			);
			res.send("Success! You can now close the window.");

			setInterval(async () => {
				const data = await this._spUtil.refreshAccessToken();
				const access_token = data.body["access_token"];

				console.log("The access token has been refreshed!");
				console.log("access_token:", access_token);
				this._spUtil.setAccessToken(access_token);
				this._userToken.access_token = access_token;
				fs.writeFileSync(
					"./token.json",
					JSON.stringify(this._userToken, null, 2)
				);
			}, (expires_in / 2) * 1000);
		});
	}

	async start() {
		await this.login();
		await this.callBack();

		this._app.listen(8888, () => {
			console.log(`Http Server is UP. go to ${C.host_url}/login`);
		});
	}
}
