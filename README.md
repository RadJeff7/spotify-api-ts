# Spotify - Typescipt Utilities

This repo contains various utilities automated using Spotify APIs with Typescript

## Current Available Functionalities

👉 **Create & Update Archive Playlist with Discover Weekly Playlist** 🚀

Spotify Generates a Weekly Playlist which gets auto-refreshed each week, now this will archive those for me to listen those recommendations later

👉 **Create & Update Archive Playlist with random songs picked from Daily Mix Playlists** 💥

Spotify create 5-6 Daily Mix Playlist which gets auto-refreshed each day, now this will randomly pick few songs and archive those for me to listen those recommendations later

## Installation

- Clone the repository

```bash
  git clone https://github.com/RadJeff7/spotify-api-ts.git
  cd spotify-api-ts
```

- Open with VSCODE or any editor of your choice
- Install the npm packages

```bash
  npm i
```

## Usage/Examples

- Open two terminal window - One for Server Function to generate OAuth Access Tokens & one for the main Utility

```bash
  npm run build; npm run start:server
```

The above generates a URL which needs to accessed from Browser and Click on Agree.

Then Run the main script

```bash
  npm run build; npm run main
```

## Demo

![Spotify Playlist](https://user-images.githubusercontent.com/53948620/226859162-35ba3b5c-91dd-4b2c-926a-d3b773135db9.png)


## Acknowledgements

- [Spotify Node API Package](https://github.com/thelinmichael/spotify-web-api-node)
- [Spotify Developer API](https://developer.spotify.com/documentation/)
