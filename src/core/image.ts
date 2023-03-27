import assert from "assert";
import path from "path";
import fs from "fs";
import download from "image-downloader";
import { createApi } from "unsplash-js";
import { Authorization } from "../types";
import * as C from "../resources/constants";
import * as Helpers from "../resources/helpers";
import logger from "../resources/logger";
type UNSPLASH_AUTH = Pick<Authorization, "clientId">;

export default class ImageDownloader {
	protected _unsplashAPIAuth: UNSPLASH_AUTH;
	protected _unsplashUtil!: ReturnType<typeof createApi>;
	constructor(auth?: UNSPLASH_AUTH) {
		this._unsplashAPIAuth = auth?.clientId
			? { clientId: auth.clientId }
			: { clientId: C.Unsplash_API_Creds.clientId };
	}

	protected async downloadToPath(url: string, fullPath: string) {
		const result = await download.image({
			dest: fullPath,
			url: url,
			extractFilename: true,
		});
		assert.ok(result.filename);
	}

	protected async getUnsplashUtil() {
		if (!this._unsplashUtil) {
			if (!this._unsplashAPIAuth.clientId) {
				const errStr = `${this.constructor.name} > getUnsplashUtil() > Client ID not set`;
				logger.error(errStr);
				throw new Error(errStr);
			}

			this._unsplashUtil = createApi({
				accessKey: this._unsplashAPIAuth.clientId,
			});
			logger.info(
				`${this.constructor.name} > getUnsplashUtil() > Unsplash Util is created`
			);
		}
	}

	protected async getImageURLsBySearch(
		searhTerm: string,
		page = 1,
		per_page = 8,
		orientation: "landscape" | "portrait" | "squarish" = "squarish"
	) {
		try {
			this.getUnsplashUtil();
			const allColors = [
				"white",
				"black",
				"yellow",
				"orange",
				"red",
				"purple",
				"magenta",
				"green",
				"teal",
				"blue",
				"black_and_white",
			] as const;
			const randomColor: (typeof allColors)[number] =
				allColors[Math.random() * allColors.length];
			const getPhotosFunc = this._unsplashUtil.search.getPhotos;
			type searchConfigObj = Parameters<typeof getPhotosFunc>[0];
			const searchConfig: searchConfigObj = {
				query: searhTerm,
				page,
				perPage: per_page,
				orientation: orientation,
				contentFilter: "high",
				color: randomColor,
				orderBy: "relevant",
			};
			const searchRes = await this._unsplashUtil.search.getPhotos(searchConfig);
			const urls = searchRes.response?.results.map(i => i.urls.small);
			logger.info(
				`${
					this.constructor.name
				} > getImageURLsBySearch() > Search Params >> ${JSON.stringify(
					searchConfig
				)} >> Images Found >> ${urls?.length}`
			);
			if (!urls || !urls.length) {
				const errStr = `${
					this.constructor.name
				} > getImageURLsBySearch() > Valid URLs not found - Check Search Params >> ${JSON.stringify(
					searchConfig
				)}`;
				logger.error(errStr);
				throw new Error(errStr);
			}
			return urls.length > 5 ? Helpers.getRandomItemsFromArray(urls, 5) : urls;
		} catch (err) {
			const errStr = `${this.constructor.name} > getImageURLsBySearch() > ${err}`;
			logger.error(errStr);
			throw new Error(errStr);
		}
	}

	async downloadCoverArts(count = 10) {
		const searhTerms = ["playlist", "concert", "aesthetic", "music", "sky"];
		const fullfolderPath = path.resolve(
			__dirname,
			`../../src/${C.Relative_Image_Folder}/download`
		);
		Helpers.deleteAndCreateFolder(fullfolderPath);
		const searchObj = {
			page: Math.floor(Math.random() * 10),
			per_page: count,
		};
		const urls = await this.getImageURLsBySearch(
			Helpers.getRandomItemsFromArray(searhTerms, 2).join(" "),
			searchObj.page,
			searchObj.per_page
		);
		await Promise.all(
			urls.map(async url => {
				await this.downloadToPath(url, fullfolderPath);
			})
		);
		const files = fs.readdirSync(fullfolderPath);
		for (const file of files) {
			const fileInfo = path.parse(file);
			if (!fileInfo.ext) {
				const oldPath = path.join(fullfolderPath, file);
				const newPath = path.join(
					fullfolderPath,
					`Spotify-Cover-${Math.floor(Math.random() * searchObj.per_page)}.jpg`
				);
				fs.renameSync(oldPath, newPath);
			}
		}
		const imageFileNames = fs.readdirSync(fullfolderPath);
		const imageFilePaths = imageFileNames.map(i =>
			path.join(fullfolderPath, i)
		);
		assert.ok(
			imageFilePaths.length,
			`${this.constructor.name} > downloadCoverArts() > Cover Arts are Not downloaded`
		);
		return imageFilePaths;
	}
}
