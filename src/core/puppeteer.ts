import assert from "assert";
import Puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import logger from "../resources/logger";

export default class BrowserClass {
	private _browserUtil!: Browser;
	private _loginPage!: Page;
	private _authPage!: Page;
	private _screenRecorder!: PuppeteerScreenRecorder;
	private _errorPage: Page | undefined;

	protected async getBrowserObj() {
		try {
			if (!this._browserUtil) {
				this._browserUtil = await Puppeteer.launch({
					headless: true,
					defaultViewport: null,
					ignoreHTTPSErrors: true,
					args: [
						"--start-maximized", // you can also use '--start-fullscreen'
						"--window-size=1920,1040",
					],
				});
				logger.info(
					`${
						this.constructor.name
					} > getBrowserObj() > Browser Object Initialized $${await this._browserUtil.version()}`
				);
			}
		} catch (err) {
			await this.handleErrors(
				`${this.constructor.name} > getBrowserObj() > Failure in opening Browser Instance: ${err}`
			);
		}
		Helpers.deleteAndCreateFolder("./screenshots");
	}

	async openSpotifyLoginPage() {
		if (!this._loginPage) {
			try {
				if (!this._browserUtil) {
					await this.getBrowserObj();
				}
				const page = await this._browserUtil.newPage();
				await page.setViewport({ width: 1920, height: 1040 });
				if (!this._screenRecorder) {
					this._screenRecorder = new PuppeteerScreenRecorder(page);
					await this._screenRecorder.start(
						`./screenshots/Auth-Token-Generation.mp4`
					);
					logger.info(
						`${this.constructor.name} > openSpotifyLoginPage() > Starting Screen Recording`
					);
				}

				await page.goto(`${C.host_url}/login`);

				assert.ok(
					(await page.title()).includes(`Login`),
					`${this.constructor.name} > openSpotifyLoginPage() > Spotify Page not found`
				);
				logger.info(
					`${
						this.constructor.name
					} > openSpotifyLoginPage() > Current Page: ${await page.title()}`
				);
				this._loginPage = page;
			} catch (err) {
				this._errorPage = this._loginPage ? this._loginPage : undefined;
				await this.handleErrors(
					`${this.constructor.name} > openSpotifyLoginPage() > Failure in Opening Spotify Login Page`
				);
			}
		}
	}

	async handleSpotifyLogin() {
		if (!(C.Spotify_User_Creds.email && C.Spotify_User_Creds.password)) {
			await this.handleErrors(
				`${this.constructor.name} > handleSpotifyLogin() > Spotify User Creds are not filled - Skipping Browser Automation Flow`
			);
		}
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
			logger.info(
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
			const loginBtn = (await this._loginPage.$x("//*[text()='Log In']"))?.[0];
			assert.ok(loginBtn, "Log In Button Could not be found");
			await (loginBtn as ElementHandle<Element>).click();
			await this._loginPage.waitForNavigation({
				waitUntil: "domcontentloaded",
			});
			this._authPage = this._loginPage;
		} catch (err) {
			this._errorPage = this._loginPage ? this._loginPage : undefined;
			await this.handleErrors(
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
			logger.info(
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
			assert.ok(bodyHTML.includes(`Success!`), "Success Page not displayed");
			logger.info(
				`${this.constructor.name} > handleSpotifyAuthorization() > Current Page Content: ${bodyHTML}`
			);
		} catch (err) {
			this._errorPage = this._authPage
				? this._authPage
				: this._loginPage
				? this._loginPage
				: undefined;
			await this.handleErrors(
				`${this.constructor.name} > handleSpotifyLogin() > Failure in handling Spotify Login Page: ${err}`
			);
		}
	}

	async closeBrowserInstance() {
		logger.info(
			`${this.constructor.name} > closeBrowserInstance() > Trying to stop screen-recorder and browser instance`
		);
		if (this._screenRecorder) {
			const status = await this._screenRecorder.stop();
			logger.info(
				`${
					this.constructor.name
				} > closeBrowserInstance() > Screen Recorder Status: ${status} - Duration: ${this._screenRecorder.getRecordDuration()}`
			);
		}

		if (this._browserUtil) {
			logger.info(
				`${this.constructor.name} > closeBrowserInstance() > Browser Instance Closed`
			);
			this._browserUtil.close();
		}
	}

	async handleErrors(errorMessage: string) {
		const errStr = `${this.constructor.name} > handleErrors() > ${errorMessage}`;
		logger.error(errStr);

		try {
			if (this._errorPage) {
				await this._errorPage.screenshot({
					path: `./screenshots/${this.constructor.name}-handleErrors-Error.png`,
					fullPage: true,
				});
			}
		} catch (err) {
			logger.error(
				`${this.constructor.name} > handleErrors() > unable to take Error screen shot`
			);
		}
		await this.closeBrowserInstance();

		throw new Error(errStr);
	}
}
