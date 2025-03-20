import request from "request";
import { get_access_token, refresh_token } from "./spotifyAuth.js";
import ora from "ora";

//Playlists IDs
const PLAYLIST_IDs = process.argv.slice(2);

(async () => {
    try {
        console.log(
            "Token: \x1b[33m" + (await get_access_token()) + "\x1b[0m\n"
        );

        //Organize all playlists
        for (const playlist_id of PLAYLIST_IDs) {
            //Move the tracks in the correct position
            await sortTracks(playlist_id);
        }
        console.log("\x1b[32m Playlists organized! \x1b[0m");
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
    let tracks = await get_playlist_tracks(playlist_id);

    const loading = ora(
        "Organizing:\x1b[34m " +
            playlist_id +
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
            playlist_id +
            "\x1b[0m: " +
            tracks.length +
            " tracks ",
    });
}

//Spotify API calls
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
