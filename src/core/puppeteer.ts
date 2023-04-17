import dotenv from "dotenv";
import assert from "assert";
import Puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import logger from "../resources/logger";
dotenv.config();
const runOnHeadless = (process.env.RUN_ON_HEADLESS || "true") === "true";

export default class BrowserClass {
	private _browserUtil!: Browser;
	private _loginPage!: Page;
	private _authPage!: Page;
	private _screenRecorder!: PuppeteerScreenRecorder;
	private _errorPage: Page | undefined;

	protected async getBrowserObj() {
		Helpers.deleteAndCreateFolder("./screenshots");
		try {
			if (!this._browserUtil) {
				this._browserUtil = await Puppeteer.launch({
					headless: runOnHeadless,
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
	}

	async openSpotifyLoginPage() {
		if (!this._loginPage) {
			if (!this._browserUtil) {
				await this.getBrowserObj();
			}
			try {
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
					`Spotify Login Page unable to launch`
				);
				logger.info(
					`${
						this.constructor.name
					} > openSpotifyLoginPage() > Current Page: ${await page.title()}`
				);
				this._loginPage = page;
			} catch (err) {
				this._errorPage = this._loginPage ?? undefined;
				await this.handleErrors(
					`${this.constructor.name} > openSpotifyLoginPage() > Failure in Opening Spotify Login Page`
				);
			}
		}
	}

	async handleSpotifyLogin(retryCount = 3) {
		if (!(C.Spotify_User_Creds.email && C.Spotify_User_Creds.password)) {
			await this.handleErrors(
				`${this.constructor.name} > handleSpotifyLogin() > Spotify User Creds are not filled - Skipping Browser Automation Flow`
			);
		}
		if (!this._loginPage) {
			await this.openSpotifyLoginPage();
		}
		let retries = 0,
			errorStr = "";
		while (retries < retryCount) {
			try {
				const usernameField = await this._loginPage.$(`#login-username`);
				assert.ok(usernameField, "UserName Field could not be Found");
				await usernameField.click({ clickCount: 3 });
				await this._loginPage.keyboard.press("Backspace");
				await usernameField.type(C.Spotify_User_Creds.email);

				const passwordField = await this._loginPage.$(`#login-password`);
				assert.ok(passwordField, "Password Field could not be Found");
				await passwordField.click({ clickCount: 3 });
				await this._loginPage.keyboard.press("Backspace");
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
				const loginBtn = (
					await this._loginPage.$x("//*[text()='Log In']")
				)?.[0];
				assert.ok(loginBtn, "Log In Button Could not be found");
				await (loginBtn as ElementHandle<Element>).click();
				await this._loginPage.waitForNavigation({
					waitUntil: "domcontentloaded",
				});
				if ((await this._loginPage.title()).includes(`Authorize`)) {
					logger.info(
						`${
							this.constructor.name
						} > handleSpotifyLogin() > Current Page: ${await this._loginPage.title()} - Authorized`
					);
					this._authPage = this._loginPage;
					break;
				}
			} catch (e) {
				errorStr = `${
					this.constructor.name
				} > handleSpotifyLogin() > Retry Count: ${
					retries + 1
				} - Error in Login: ${e}`;
				logger.error(errorStr);
			}
			// If authorization failed, wait for a while before retrying
			await Helpers.sleep(3000);
			retries++;
		}

		if (retries >= retryCount && !this._authPage) {
			this._errorPage = this._loginPage ?? undefined;
			await this.handleErrors(`${errorStr}`);
		}
	}

	async handleSpotifyAuthorization() {
		if (!this._authPage) {
			await this.handleSpotifyLogin();
		}
		try {
			assert.ok(
				(await this._authPage.title()).includes(`Authorize`),
				"Authorization Page Not Loaded"
			);
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
			this._errorPage = this._authPage ?? this._loginPage ?? undefined;
			await this.handleErrors(
				`${this.constructor.name} > handleSpotifyAuthorization() > Failure in handling Spotify Auth Page: ${err}`
			);
		}
	}

	async closeBrowserInstance(errorStr?: string) {
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
		if (errorStr) logger.error(errorStr, " - Closing the browser instance");

		if (this._browserUtil) {
			logger.info(
				`${this.constructor.name} > closeBrowserInstance() > Browser Instance Closed`
			);
			this._browserUtil.close();
		}
	}

	async handleErrors(errorMessage: string) {
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
		await this.closeBrowserInstance(errorMessage);
		throw new Error(errorMessage);
	}
}
