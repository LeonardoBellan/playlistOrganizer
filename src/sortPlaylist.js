import ora from "ora";
import { get_playlist_name, get_playlist_tracks, move_track } from "./API.js";

export async function sortPlaylists(PLAYLIST_IDs) {
    try {
        console.log(PLAYLIST_IDs);
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
}

async function sortTracks(playlist_id) {
    let playlist_name = await get_playlist_name(playlist_id);
    let tracks = await get_playlist_tracks(playlist_id);

    //Loading animation
    const loading = ora(
        `\x1b[34mOrganizing ${playlist_name} :\x1b[0m ${tracks.length} tracks`
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
        text: `\x1b[34mOrganized ${playlist_name}:\x1b[0m ${tracks.length} tracks`,
    });
}

//Compares two tracks by their artist name, album and track number
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
