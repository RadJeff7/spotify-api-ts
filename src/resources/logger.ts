import dotenv from "dotenv";
dotenv.config();
import * as log4js from "log4js";

class Logger {
	private _logger!: log4js.Logger;

	setLogger() {
		if (!this._logger) {
			const logFileName = "applogs-spotify0.log";
			log4js.configure({
				appenders: {
					logs: { type: "file", filename: `./logs/${logFileName}` },
				},
				categories: { default: { appenders: ["logs"], level: "all" } },
			});
			this._logger = log4js.getLogger("spotify-utilities");
			this._logger.info(
				`${this.constructor.name} > spotify-utilities > Logger Object has been initialized `
			);
		}
		return this._logger;
	}
}

export default new Logger().setLogger();
