import { Server } from "./core";

const main = async () => {
	const server = new Server();

	await server.start();
};

main();
