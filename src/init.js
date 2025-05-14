import open from "open";
import express from "express";
import dotenv from "dotenv";
import Conf from "conf";
import querystring from "querystring";
import e from "express";

// Setup
let app = express();
app.listen(3000, () => {});

dotenv.config({ path: "./.env" });
const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

const authStorage = new Conf({
    configName: "auth",
    projectName: "spotify-playlist-organizer",
    projectVersion: "1.0.0",
    encryptionKey: process.env.ENCRYPTION_KEY,
});

(async () => {
    // Check if CLIENT_ID and REDIRECT_URI are set
    if (!CLIENT_ID || !REDIRECT_URI) {
        throw new Error(
            "Please set CLIENT_ID and REDIRECT_URI in your .env file."
        );
        return;
    }

    //Request authorization from the user
    var state = generateRandomString(16);
    var scope =
        "playlist-read-private playlist-modify-public playlist-modify-private";

    console.log("Opening Spotify authorization page...");
    let authURL =
        "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI,
            state: state,
        });
    await open(authURL, { wait: true });
})();

app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;

    if (error) {
        throw new Error("Error during authentication:", error);
        res.status(500).send("Authentication failed. Please try again.");
        return;
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    Buffer.from(
                        CLIENT_ID + ":" + process.env.CLIENT_SECRET
                    ).toString("base64"),
            },
            body: querystring.stringify({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        }
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
        throw new Error("Error getting access token:", tokenData.error);
        res.status(500).send("Error getting access token. Please try again.");
        return;
    }

    // Store the access token and refresh token in local storage
    authStorage.set("access_token", tokenData.access_token);
    authStorage.set("refresh_token", tokenData.refresh_token);
    authStorage.set("expires_in", Date.now() + tokenData.expires_in * 1000);

    res.send("Authentication successful! You can close this tab.");
});

function generateRandomString(length) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
}
