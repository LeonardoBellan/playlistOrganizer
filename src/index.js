#!/usr/bin/env node

import dotenv from "dotenv";
import { intro, outro, select } from "@clack/prompts";
import { sortPlaylists } from "./sortPlaylists.js";
//Setup
dotenv.config();

intro("Inizio app");

/*Opzioni app
Inizializzazione
Organizzare le playlist
Selezionare le playlist da organizzare
*/

const action = await select({
    message: "Cosa vuoi fare?",
    options: [
        {
            value: "sort",
            label: "Sort my playlists!",
        },
        {
            value: "select",
            label: "Select playlists to sort",
        },
    ],
});

//Playlists IDs
await sortPlaylists();

outro("Fine app");
