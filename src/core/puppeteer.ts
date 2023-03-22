import assert from "assert";
import Puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import * as C from "../resources/constants";

export default class BrowserClass {
	private _browserUtil!: Browser;
	private _loginPage!: Page;
	private _authPage!: Page;

	protected async getBrowserObj() {
		if (!this._browserUtil) {
			this._browserUtil = await Puppeteer.launch({
				headless: true,
				ignoreHTTPSErrors: true,
			});
		}
	}

	async openSpotifyLoginPage() {
		if (!this._loginPage) {
			try {
				if (!this._browserUtil) {
					await this.getBrowserObj();
				}
				const page = await this._browserUtil.newPage();
				await page.goto(`${C.host_url}/login`);

				assert.ok(
					(await page.title()).includes(`Login`),
					`${this.constructor.name} > openSpotifyLoginPage() > Spotify Page not found`
				);
				this._loginPage = page;
			} catch (err) {
				throw new Error(
					`${this.constructor.name} > openSpotifyLoginPage() > Failure in Opening Spotify Login Page`
				);
			}
		}
	}

	async handleSpotifyLogin() {
		try {
			if (!this._loginPage) {
				await this.openSpotifyLoginPage();
			}
			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-Initial.png`,
				fullPage: true,
			});
			const usernameField = await this._loginPage.$(`#login-username`);
			assert.ok(usernameField, "UserName Field could not be Found");
			await usernameField.type(C.Spotify_User_Creds.email);

			const passwordField = await this._loginPage.$(`#login-password`);
			assert.ok(passwordField, "Password Field could not be Found");
			await passwordField.type(C.Spotify_User_Creds.password);

			const rememberMeBtn = (
				await this._loginPage.$x("//*[text()='Remember me']")
			)?.[0];

			await (rememberMeBtn as ElementHandle<Element>)?.click();

			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-Filled.png`,
				fullPage: true,
			});
			const loginBtn = (await this._loginPage.$x("//*[text()='Log In']"))?.[0];
			assert.ok(loginBtn, "Log In Button Could not be found");
			await (loginBtn as ElementHandle<Element>).click();
			await this._loginPage.waitForNavigation({
				waitUntil: "domcontentloaded",
			});
			this._authPage = this._loginPage;
		} catch (err) {
			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-Error.png`,
				fullPage: true,
			});
			throw new Error(
				`${this.constructor.name} > handleSpotifyLogin() > Failure in handling Spotify Login Page: ${err}`
			);
		}
	}

	async handleSpotifyAuthorization() {
		try {
			if (!this._authPage) {
				await this.handleSpotifyLogin();
			}
			assert.ok((await this._authPage.title()).includes(`Authorize`));
			await this._authPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyAuthorization-Initial.png`,
				fullPage: true,
			});
			const agreeBtn = (await this._authPage.$x("//*[text()='Agree']"))?.[0];
			assert.ok(agreeBtn, "Agree Button Could not be Found");

			await (agreeBtn as ElementHandle<Element>).click();
			await this._authPage.waitForNavigation({ waitUntil: "domcontentloaded" });

			const bodyHTML = await this._authPage.evaluate(
				() => document.documentElement.outerHTML
			);
			await this._authPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyAuthorization-Success.png`,
				fullPage: true,
			});
			assert.ok(bodyHTML.includes(`Success!`));
		} catch (err) {
			const currPage = this._authPage ?? this._loginPage;
			await currPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyAuthorization-Error.png`,
				fullPage: true,
			});
			throw new Error(
				`${this.constructor.name} > handleSpotifyLogin() > Failure in handling Spotify Authorization Page: ${err}`
			);
		}
	}

	async closeBrowserInstance() {
		if (this._browserUtil) {
			this._browserUtil.close();
		}
	}
}
