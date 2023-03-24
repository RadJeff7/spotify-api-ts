import assert from "assert";
import Puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import * as C from "../resources/constants";
import fs from "fs";

export default class BrowserClass {
	private _browserUtil!: Browser;
	private _loginPage!: Page;
	private _authPage!: Page;

	protected async getBrowserObj() {
		try {
			if (!this._browserUtil) {
				this._browserUtil = await Puppeteer.launch({
					headless: true,
					defaultViewport: null,
					ignoreHTTPSErrors: true,
					args: [
						"--start-maximized", // you can also use '--start-fullscreen'
					],
				});
			}
		} catch (err) {
			throw new Error(
				`${this.constructor.name} > getBrowserObj() > Failure in opening Browser Instance: ${err} - Check the executable Path(Path: ${C.Browser_Executable_Path})`
			);
		}
		// screenshots folder
		if (fs.existsSync("./screenshots"))
			fs.rmSync("./screenshots", { recursive: true, force: true });

		if (!fs.existsSync("./screenshots")) fs.mkdirSync("./screenshots");
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
				console.log(
					`${
						this.constructor.name
					} > openSpotifyLoginPage() > Current Page: ${await page.title()}`
				);
				this._loginPage = page;
				await page.screenshot({
					path: `./screenshots/${this.constructor.name}-openSpotifyLoginPage-Initial.png`,
					fullPage: true,
				});
			} catch (err) {
				throw new Error(
					`${this.constructor.name} > openSpotifyLoginPage() > Failure in Opening Spotify Login Page`
				);
			}
		}
	}

	async handleSpotifyLogin() {
		if (!(C.Spotify_User_Creds.email && C.Spotify_User_Creds.password)) {
			throw new Error(
				`${this.constructor.name} > handleSpotifyLogin() > Spotify User Creds are not filled - `
			);
		}
		console.log(`DEBUG: ${JSON.stringify(C.Spotify_User_Creds)}`);
		try {
			if (!this._loginPage) {
				await this.openSpotifyLoginPage();
			}
			const usernameField = await this._loginPage.$(`#login-username`);
			assert.ok(usernameField, "UserName Field could not be Found");
			await usernameField.type(C.Spotify_User_Creds.email);

			const passwordField = await this._loginPage.$(`#login-password`);
			assert.ok(passwordField, "Password Field could not be Found");
			await passwordField.type(C.Spotify_User_Creds.password);

			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-Filled.png`,
				fullPage: true,
			});
			console.log(
				`${
					this.constructor.name
				} > handleSpotifyLogin() > Current Page: ${await this._loginPage.title()} - Login Details Filled`
			);
			const viewPassword = (
				await this._loginPage.$x(
					"//button[contains(@aria-label, 'show password')]"
				)
			)[0];
			assert.ok(viewPassword, "View Password Could not be found");
			await (viewPassword as ElementHandle<Element>).click();
			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-password.png`,
				fullPage: true,
			});
			const loginBtn = (await this._loginPage.$x("//*[text()='Log In']"))?.[0];
			assert.ok(loginBtn, "Log In Button Could not be found");
			await (loginBtn as ElementHandle<Element>).click();
			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyLogin-Filled.png`,
				fullPage: true,
			});
			await this._loginPage.waitForNavigation({
				waitUntil: "domcontentloaded",
			});
			this._authPage = this._loginPage;
		} catch (err) {
			console.log(
				`${this.constructor.name} > handleSpotifyLogin() > Failure in handling Spotify Login Page: ${err}`
			);
			const currPage = this._loginPage ?? undefined;
			if (currPage)
				await currPage.screenshot({
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
			console.log(
				`${
					this.constructor.name
				} > handleSpotifyAuthorization() > Current Page: ${await this._authPage.title()}`
			);
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
			assert.ok(bodyHTML.includes(`Success!`), "Success Page not displayed");
			console.log(
				`${this.constructor.name} > handleSpotifyAuthorization() > Current Page Content: ${bodyHTML}`
			);
		} catch (err) {
			console.log(
				`${this.constructor.name} > handleSpotifyAuthorization() > Failure in handling Spotify Login Page: ${err}`
			);
			await this._loginPage.screenshot({
				path: `./screenshots/${this.constructor.name}-handleSpotifyAuthorization-Error.png`,
				fullPage: true,
			});
			throw new Error(
				`${this.constructor.name} > handleSpotifyAuthorization() > Failure in handling Spotify Authorization Page: ${err}`
			);
		}
	}

	async closeBrowserInstance() {
		if (this._browserUtil) {
			console.log(
				`${this.constructor.name} > closeBrowserInstance() > Browser Instance Closed`
			);
			this._browserUtil.close();
		}
	}
}
