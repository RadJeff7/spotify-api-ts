import dotenv from "dotenv";
dotenv.config();
import * as Helpers from "./helpers";
import * as log4js from "log4js";
import path from "path";

const keepLogs = (process.env.KEEP_LOGS || "false") === "true";

class Logger {
	private _logger!: log4js.Logger;

	setLogger() {
		if (!this._logger) {
			if (!keepLogs) {
				Helpers.deleteAndCreateFolder(path.resolve(__dirname, `../../logs/`));
			}

			log4js.configure({
				appenders: {
					logs: { type: "file", filename: "./logs/applogs.log" },
				},
				categories: { default: { appenders: ["logs"], level: "all" } },
			});
			this._logger = log4js.getLogger("spotify-utilities");
		}
		return this._logger;
	}

	getLogger() {
		return this.setLogger();
	}
}

export default new Logger().getLogger();
