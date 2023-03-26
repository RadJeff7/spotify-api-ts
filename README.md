# Spotify - Typescipt Utilities

[![Node.js Build CI](https://github.com/RadJeff7/spotify-api-ts/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/RadJeff7/spotify-api-ts/actions/workflows/build.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=RadJeff7_spotify-api-ts&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=RadJeff7_spotify-api-ts)

This repo contains various utilities automated using Spotify APIs with Typescript

## Current Available Functionalities

👉 **Create & Update Archive Playlist with Discover Weekly Playlist** 🚀

Spotify Generates a Weekly Playlist which gets auto-refreshed each week, now this will archive those for me to listen those recommendations later

👉 **Create & Update Archive Playlist with random songs picked from Daily Mix Playlists** 💥

Spotify create 5-6 Daily Mix Playlist which gets auto-refreshed each day, now this will randomly pick few songs and archive those for me to listen those recommendations later

Each of these are designed to maintain the playlist size at user-defined length, to avoid over-crowding. Also has ability to upload playlist cover image.

## Getting Started

Make sure you have Node installed.

[Register](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/) your application with `http://localhost:8888/callback` as the redirect URI to obtain a client ID and secret.

## Installation

- Clone the repository and step inside.

```bash
  git clone https://github.com/RadJeff7/spotify-api-ts.git
  cd spotify-api-ts
```

Set up a .env file in the project directory that looks like this: (refer the `.env_sample` file)

```
SPOTIFY_API_CLIENT_ID=<Specify Spotify Client ID>
SPOTIFY_API_CLIENT_SECRET=<Specify Spotify Client Secret>
SPOTIFY_API_REDIRECT_URI=<Specify Spotify Redirect URI>
SPOTIFY_USER_EMAIL=<Specify Spotify User Email - Used for Browser Automation>
SPOTIFY_USER_PASS=<Specify Spotify User Pass - Used for Browser Automation>
BROWSER_EXECUTABLE_PATH=<Specify Local Browser Executable Path - Used for Browser Automation>
```

- Open with VSCODE or any editor of your choice
- Install the npm dependencies

```bash
  npm install
```

## Usage/Examples

- Open two terminal window - One for Server Function to generate OAuth Access Tokens & one for the main Utility

Server NPM Command

```bash
  npm run build; npm run start:token
```

The above generates a URL which needs to accessed from Browser and Click on Agree. Currently using puppeteer to automate that process too. After server is live - Puppeteer launches a local headless browser instance for doing this Authorization step.

After successful execution of complete process, a local token.json file will be created with OAuth Token Details.

Please keep the terminal window open - the Server is set to Auto-refresh after certain time to regenerate valid tokens - Server will be auto-closed after 20 minutes.

Then Open up another terminal and run the main script

```bash
  npm run build; npm run main
```

**Note**: By default, `npm run main` will run all available utilities.

If you want to run specific utilities set an environment variable `UTIL_NAME` - as shown below

```bash
  npm run build;$env:UTIL_NAME="weekly"; npm run main
```

`weekly`: Discover Weekly Playlist Utility & `random`: Daily Mix Random Playlist Utility

## Demo

![Spotify Playlist](https://user-images.githubusercontent.com/53948620/226859162-35ba3b5c-91dd-4b2c-926a-d3b773135db9.png)

## Acknowledgements

- [Spotify Node API Package](https://github.com/thelinmichael/spotify-web-api-node)
- [Spotify Developer Web API](https://developer.spotify.com/documentation/web-api/reference/#/)
