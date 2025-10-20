import Conf from "conf";
import dotenv from "dotenv";
dotenv.config();

// Local storage setup
const auth = new Conf({
    configName: "auth",
    projectName: "spotify-playlist-organizer",
    projectVersion: "1.0.0",
    encryptionKey: process.env.ENCRYPTION_KEY,
});

// ENV variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export async function get_access_token() {
    // Check if CLIENT_ID and CLIENT_SECRET are set
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error(
            "Please set CLIENT_ID and CLIENT_SECRET in your .env file."
        );
        return;
    }

    //Return access token
    if (
        auth.get("access_token") !== null &&
        auth.get("expires_in") > Date.now()
    )
        return auth.get("access_token");

    //access token not found
    console.log("\x1b[33mAccess token expired, refreshing...\x1b[0m");
    await refresh_access_token();
}

async function refresh_access_token() {
    const refresh_token = auth.get("refresh_token");
    if (refresh_token === null) {
        throw new Error(
            "Refresh token not found in local storage, try running init"
        );
    }

    //Request a new access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        auth.set("access_token", data.access_token);
        auth.set("expires_in", Date.now() + data.expires_in * 1000);
        return data.access_token;
    } else {
        throw new Error("Failed to refresh token: " + response.statusText);
    }
}
