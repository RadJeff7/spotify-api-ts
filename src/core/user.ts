import { Authorization } from "../types";
import Base from "./base";

export default class User extends Base {
	constructor(auth?: Authorization) {
		super(auth);
	}

	async getAlbumDetails() {
		try {
			await this.setClientTokens();
			const albumResponse = await this._util.getArtistAlbums(
				"43ZHCT0cAZBISjO8DG9PnE"
			);
			const albumList = albumResponse.body.items.map(i => {
				return {
					name: i.name,
					date: i.release_date,
					total_tracks: i.total_tracks,
				};
			});
			console.dir(albumList);
		} catch (err) {
			console.error(`getAlbumDetails() > Error: ${err}`);
		}
	}

	async getUserDetails() {
		try {
			this.setUserTokens();
			const user = await this._util.getMe();
			console.dir(user.body, { depth: null });
		} catch (err) {
			console.error(`getUserDetails() > Error: ${err}`);
		}
	}
}
