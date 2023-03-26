import { Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import { GivenUsersPlaylistCrawler } from "./index";
import logger from "../resources/logger";

const FollowedPlaylistsUserCrawler = async (count = 5) => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	logger.info(
		`followedPlaylistsUserCrawler() > Total User Playlists >> ${playlists.length}`
	);
	const notRequiredOwnerRegex = new RegExp(
		`${C.DEFAULT_SPOTIFY_USER.username}|spotify`,
		"i"
	);

	const follwedPlaylistCreatorIds = playlists
		.filter(
			playlist => !playlist.owner.display_name?.match(notRequiredOwnerRegex)
		)
		.map(i => i.owner.id);

	const uniqueUserIds = [...new Set(follwedPlaylistCreatorIds)];
	logger.info(
		`followedPlaylistsUserCrawler() > Total Unique User IDs available  >> ${uniqueUserIds.length}`
	);

	const usersProfileTobeCrawled =
		uniqueUserIds.length > count
			? Helpers.getRandomItemsFromArray(uniqueUserIds, count)
			: uniqueUserIds;

	logger.info(
		`followedPlaylistsUserCrawler() > Users selected for Creating Recommendation Mix >> ${
			usersProfileTobeCrawled.length
		} >> Names: ${usersProfileTobeCrawled.join(", ")} \n\n`
	);

	for (const profileId of usersProfileTobeCrawled) {
		try {
			logger.info(
				`followedPlaylistsUserCrawler() > Starting to Crawl Playlist of UserID: ${profileId}`
			);
			await GivenUsersPlaylistCrawler(profileId);
		} catch (err) {
			logger.error(
				`followedPlaylistsUserCrawler() > UserID: ${profileId} > Failure to crawl user playlists ${err}`
			);
		}
	}
};

export { FollowedPlaylistsUserCrawler as default };
