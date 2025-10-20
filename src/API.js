import request from "request";
import { get_access_token } from "./spotifyAuth.js";

export async function get_playlist_name(playlist_id) {
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

export async function get_playlist_tracks(playlist_id) {
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

export async function move_track(
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
