import open from "open";
import express from "express";
import dotenv from "dotenv";
import { LocalStorage } from "node-localstorage";
import querystring from "querystring";

// Setup
let app = express();
app.listen(3000, () => {});
dotenv.config({ path: "./.env" });
const localStorage = new LocalStorage("./localStorage");

// ENV variables
const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

(async () => {
    // Check if CLIENT_ID and REDIRECT_URI are set
    if (!CLIENT_ID || !REDIRECT_URI) {
        console.error(
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
    await open(authURL);
})();

app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;
    const state = req.query.state || null;

    if (error) {
        console.error("Error during authentication:", error);
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
        console.error("Error getting access token:", tokenData.error);
        res.status(500).send("Error getting access token. Please try again.");
        return;
    }

    // Store the access token and refresh token in local storage
    //localStorage.setItem("access_token", tokenData.access_token);
    //localStorage.setItem("refresh_token", tokenData.refresh_token);

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
