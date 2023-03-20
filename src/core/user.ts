import { Authorization } from "../types";
import Base from "./base";

export default class User extends Base {
	constructor(auth?: Authorization) {
		super(auth);
	}

	async getUserDetails() {
		await this.setClientTokens();
		const user = await this._util.getArtistAlbums("43ZHCT0cAZBISjO8DG9PnE");
		console.dir(user, { depth: null });
	}
}
