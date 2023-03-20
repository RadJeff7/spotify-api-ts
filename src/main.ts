import { User } from "./core";

const main = async () => {
	await new User().getUserDetails();
};

main();
