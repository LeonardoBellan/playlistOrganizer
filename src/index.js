#!/usr/bin/env node

import dotenv from "dotenv";
import { intro, outro } from "@clack/prompts";

//Setup
dotenv.config();

intro("Inizio app");
//Playlists IDs
const PLAYLIST_IDs = process.argv.slice(2);
await sortPlaylists(PLAYLIST_IDs);

outro("Fine app");
