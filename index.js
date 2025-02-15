require("dotenv").config();
const request = require("request");
const { get_access_token, refresh_token } = require("./spotifyAuth.js");

//Playlists IDs
const PLAYLIST_IDs = process.argv.slice(2);

//Organize all playlists
(async () => {
    try {
        console.log("Token: \x1b[33m" + (await get_access_token()) + "\x1b[0m");
        for (const playlist_id of PLAYLIST_IDs) {
            console.log("\nOrganizing:\x1b[34m " + playlist_id + "\x1b[0m");
            //Move the tracks in the correct position
            let tracks = await get_playlist_tracks(playlist_id);
            for (let i = 0; i + 1 < tracks.length; i++) {
                if (compareTracks(tracks[i], tracks[i + 1]) == 1) {
                    // i+1 unsorted item
                    console.log(
                        "\t\x1b[31m Moving " +
                            tracks[i + 1].track.name +
                            "\x1b[0m"
                    );

                    //Search for correct position
                    for (let j = 0; j <= i; j++) {
                        if (compareTracks(tracks[j], tracks[i + 1]) == 1) {
                            await move_track(playlist_id, i + 1, 1, j);
                            console.log("\tTrack moved successfully");
                            break;
                        }
                    }

                    tracks = await get_playlist_tracks(playlist_id);
                }
            }
        }
        console.log("\n\x1b[32m Playlists organized! \x1b[0m");
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
    if (compare == 0) {
        compare = track1.track.album.name.localeCompare(
            track2.track.album.name
        );
        if (compare == 0)
            return track1.track.track_number >= track2.track.track_number;
    }
    return compare;
}

//Spotify API calls
async function get_playlist_tracks(playlist_id) {
    const access_token = await get_access_token();

    const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
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
        return data.items;
    } else {
        throw new Error("Failed to move track: " + response.statusText);
    }
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
