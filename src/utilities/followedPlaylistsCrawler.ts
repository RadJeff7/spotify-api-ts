import { Playlists } from "../core";
import * as Helpers from "../resources/helpers";
import * as C from "../resources/constants";
import { GivenUsersPlaylistCrawler } from "./index";

const FollowedPlaylistsUserCrawler = async (count = 5) => {
	const playlistUtil = new Playlists();
	const playlists = await playlistUtil.getAllUserPlaylists();
	console.log(
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
	console.log(
		`followedPlaylistsUserCrawler() > Total Unique User IDs available  >> ${uniqueUserIds.length}`
	);

	const usersProfileTobeCrawled =
		uniqueUserIds.length > count
			? Helpers.getRandomItemsFromArray(uniqueUserIds, count)
			: uniqueUserIds;

	console.log(
		`followedPlaylistsUserCrawler() > Users selected for Creating Recommendation Mix >> ${
			usersProfileTobeCrawled.length
		} >> Names: ${usersProfileTobeCrawled.join(", ")} \n\n`
	);

	for (const profileId of usersProfileTobeCrawled) {
		try {
			console.log(
				`followedPlaylistsUserCrawler() > Starting to Crawl Playlist of UserID: ${profileId}`
			);
			await GivenUsersPlaylistCrawler(profileId);
		} catch (err) {
			console.log(
				`followedPlaylistsUserCrawler() > UserID: ${profileId} > Failure to crawl user playlists ${err}`
			);
		}
	}
};

export { FollowedPlaylistsUserCrawler as default };
