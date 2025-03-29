import request from "request";
import dotenv from "dotenv";
import { get_access_token, refresh_token } from "./spotifyAuth.js";
import ora from "ora";
dotenv.config();

//Playlists IDs
const PLAYLIST_IDs = process.argv.slice(2);

(async () => {
    try {
        console.log(
            "Token: \x1b[33m" + (await get_access_token()) + "\x1b[0m\n"
        );

        //Test playlist
        if (PLAYLIST_IDs.length === 0) {
            console.log("\x1b[33mTest playlist\x1b[0m");
            PLAYLIST_IDs.push(process.env.TEST_PLAYLIST_ID);

            //Shuffle the playlist randomly
            await shufflePlaylist(PLAYLIST_IDs[0]);
        }

        //Organize all playlists
        let time = Date.now();
        for (const playlist_id of PLAYLIST_IDs) {
            //Move the tracks in the correct position
            await sortTracks(playlist_id);
        }

        time = ((Date.now() - time) / 1000).toPrecision(3);
        console.log(`\x1b[32m Playlists organized in ${time}s\x1b[0m`);
    } catch (error) {
        console.error("Error organizing playlists: ", error);
    }
})();

//Functions
function compareTracks(track1, track2) {
    //Criteria: Artist, Album, Track Number
    let compare = track1.track.artists[0].name.localeCompare(
        track2.track.artists[0].name
    );
    if (compare !== 0) return compare;
    compare = track1.track.album.name.localeCompare(track2.track.album.name);
    if (compare !== 0) return compare;
    if (track1.track.track_number == track2.track.track_number) return 0;
    return track1.track.track_number < track2.track.track_number ? -1 : 1;
}
async function sortTracks(playlist_id) {
    let playlist_name = await get_playlist_name(playlist_id);
    let tracks = await get_playlist_tracks(playlist_id);

    //Loading animation
    const loading = ora(
        "Organizing:\x1b[34m " +
            playlist_name +
            "\x1b[0m: " +
            tracks.length +
            " tracks "
    ).start();

    //Search for unsorted items
    for (let i = 0; i + 1 < tracks.length; i++) {
        let compare = compareTracks(tracks[i], tracks[i + 1]);
        if (compare === 1) {
            // i+1 unsorted item
            //Search for correct position
            for (let j = 0; j <= i; j++) {
                if (compareTracks(tracks[j], tracks[i + 1]) == 1) {
                    await move_track(playlist_id, i + 1, 1, j);
                    tracks.splice(j, 0, tracks.splice(i + 1, 1)[0]);
                    break;
                }
            }
        }
    }
    loading.stopAndPersist({
        symbol: "\x1b[32m✔\x1b[0m",
        text:
            "Organized:\x1b[34m " +
            playlist_name +
            "\x1b[0m: " +
            tracks.length +
            " tracks ",
    });
}
async function shufflePlaylist(playlist_id) {
    //Loading animation
    const loading = ora("Shuffling playlist...").start();
    let time = Date.now();
    let playlistLength = (await get_playlist_tracks(playlist_id)).length;

    //Shuffle
    for (let i = 0; i < 2 * playlistLength; i++) {
        await move_track(
            PLAYLIST_IDs[0],
            Math.floor(Math.random() * playlistLength),
            1,
            Math.floor(Math.random() * playlistLength),
            null
        );
    }

    time = ((Date.now() - time) / 1000).toPrecision(3);
    loading.stopAndPersist({
        symbol: "\x1b[32m✔\x1b[0m",
        text: `Shuffled in ${time}s`,
    });
}

//Spotify API calls
async function get_playlist_name(playlist_id) {
    const access_token = await get_access_token();
    const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist_id}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            json: true,
        }
    );
    if (response.ok) {
        const data = await response.json();
        return data.name;
    } else {
        throw new Error("Failed to move track: " + response.statusText);
    }
}

async function get_playlist_tracks(playlist_id) {
    const access_token = await get_access_token();
    let tracks = [];
    let offset = 0;
    while (offset !== null) {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=${offset}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
                json: true,
            }
        );

        if (response.ok) {
            const data = await response.json();
            tracks = tracks.concat(data.items);
            if (data.next === null) offset = null;
            else offset = data.offset + data.limit;
        } else {
            throw new Error("Failed to move track: " + response.statusText);
        }
    }
    return tracks;
}

async function move_track(
    playlist_id,
    range_start,
    range_length,
    insert_before,
    snapshot_id
) {
    const access_token = await get_access_token();
    const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                range_start: range_start,
                range_length: range_length,
                insert_before: insert_before,
                snapshot_id: snapshot_id,
            }),
        }
    );

    if (response.ok) {
        const data = await response.json();
        return data.snapshot_id;
    } else {
        throw new Error("Failed to move track: " + response.statusText);
    }
}
