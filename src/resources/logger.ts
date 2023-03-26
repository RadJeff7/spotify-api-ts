import dotenv from "dotenv";
dotenv.config();
import * as log4js from "log4js";
import path from "path";
import fs from "fs";

const keepLogs = (process.env.KEEP_LOGS || "false") === "true";

class Logger {
	private _logger!: log4js.Logger;

	setLogger() {
		if (!this._logger) {
			const logFileName = "applogs.log";
			if (!keepLogs) {
				const logFilePath = path.resolve(
					__dirname,
					`../../logs/${logFileName}`
				);
				if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath);
			}

			log4js.configure({
				appenders: {
					logs: { type: "file", filename: `./logs/${logFileName}` },
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
