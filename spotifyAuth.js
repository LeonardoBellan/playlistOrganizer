const LocalStorage = require("node-localstorage").LocalStorage;
require("dotenv").config();

// Local storage setup
const localStorage = new LocalStorage("./localStorage");

// ENV variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function get_access_token() {
    if (
        localStorage.getItem("access_token") === null ||
        Number(localStorage.getItem("expiration")) < Date.now()
    ) {
        console.log("Access token not found or expired");
        localStorage.setItem("access_token", await refresh_token());
    }
    return localStorage.getItem("access_token");
}

async function refresh_token() {
    const refresh_token = localStorage.getItem("refresh_token");
    console.log("Refresh token: ", refresh_token);

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
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("expiration", Date.now() + data.expires_in * 1000);
        return data.access_token;
    } else {
        throw new Error("Failed to refresh token: " + response.statusText);
    }
}

module.exports = {
    get_access_token,
};
