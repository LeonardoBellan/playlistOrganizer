#!/usr/bin/env node

import dotenv from "dotenv";
import { sortPlaylists } from "./sortPlaylist.js";

//Setup
const program = new Command();
dotenv.config();

//Playlists IDs
const PLAYLIST_IDs = process.argv.slice(2);

/*(async () => {
        //If there are no arguments, use the test playlist
        if (PLAYLIST_IDs.length === 0) {
            console.log("\x1b[33mTest playlist\x1b[0m");
            PLAYLIST_IDs.push(process.env.TEST_PLAYLIST_ID);

            //Shuffle the playlist randomly
        //await shufflePlaylist(PLAYLIST_IDs[0]);
        }

    await sortPlaylists(PLAYLIST_IDs);
})();
*/
