import {
    get_playlist_tracks,
    move_track,
    get_playlist_name,
} from "../src/API.js";

function trackComparator(track1, track2) {
    //Criteria: Artist, Album, Track Number
    let compare = track1.track.artists[0].name.localeCompare(
        track2.track.artists[0].name,
    );
    if (compare !== 0) return compare;
    compare = track1.track.album.name.localeCompare(track2.track.album.name);
    if (compare !== 0) return compare;
    if (track1.track.track_number == track2.track.track_number) return 0;
    return track1.track.track_number < track2.track.track_number ? -1 : 1;
}

// Build a map of desired index for each track URI
function buildDesiredIndexMap(tracks) {
    const sorted = [...tracks].sort(trackComparator);
    const map = new Map();
    sorted.forEach((item, idx) => map.set(item.track.uri, idx));
    return map;
}

async function sortPlaylist(playlist_id) {
    console.log(`Sorting playlist ${playlist_id}...`);
    const playlistName = await get_playlist_name(playlist_id);
    const tracks = await get_playlist_tracks(playlist_id);

    if (tracks.length <= 1) {
        console.log(`Nothing to sort in playlist: ${playlistName}`);
        return;
    }

    const desiredIndex = buildDesiredIndexMap(tracks);

    // We'll do one pass and move tracks to correct position. Spotify API allows move_track chunk operations.
    let snapshot_id = null;

    for (let i = 0; i < tracks.length; i++) {
        const currentTrack = tracks[i];
        const currentUri = currentTrack.track.uri;
        const targetIndex = desiredIndex.get(currentUri);

        if (targetIndex === undefined || targetIndex === i) continue;

        const rangeStart = i;
        const rangeLength = 1;
        const insertBefore = targetIndex < i ? targetIndex : targetIndex + 1;

        snapshot_id = await move_track(
            playlist_id,
            rangeStart,
            rangeLength,
            insertBefore,
            snapshot_id,
        );
        console.log(
            `Moved ${currentTrack.track.name} to position ${insertBefore}`,
        );

        // After each move we need a fresh snapshot for consistency.
    }

    console.log(`Finished sorting playlist "${playlistName}"`);
}

async function main() {
    const playlistId = process.argv[2];
    if (!playlistId) {
        console.error("Usage: npm run sort-playlist <playlist_id>");
        process.exit(1);
    }

    try {
        await sortPlaylist(playlistId);
    } catch (err) {
        console.error("Error sorting playlist:", err.message || err);
        process.exit(1);
    }
}

main();
