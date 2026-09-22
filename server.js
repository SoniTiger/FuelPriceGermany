const express = require("express");

console.log("🔥 DIESE SERVER.JS WIRD AUSGEFÜHRT");

const app = express();

const PORT =
    process.env.PORT || 3000;


const SPRIT_API =
    "https://pretcarburant.ro/api/v1/de-statii";


// ========================================
// WEBSEITE
// ========================================

app.use(
    express.static("public")
);


// ========================================
// TANKSTELLEN
// ========================================

app.get(
    "/api/stations",
    async (req, res) => {

        try {

            const {
                lat,
                lon,
                radius = 5
            } = req.query;


            if (!lat || !lon) {

                return res.status(400).json({
                    error:
                        "Latitude und Longitude sind erforderlich."
                });
            }


            const latitude =
                Number(lat);

            const longitude =
                Number(lon);

            const searchRadius =
                Number(radius);


            if (
                Number.isNaN(latitude) ||
                Number.isNaN(longitude) ||
                Number.isNaN(searchRadius)
            ) {

                return res.status(400).json({
                    error:
                        "Ungültige Koordinaten."
                });
            }


            if (
                searchRadius < 1 ||
                searchRadius > 25
            ) {

                return res.status(400).json({
                    error:
                        "Der Suchradius muss zwischen 1 und 25 km liegen."
                });
            }


            const params =
                new URLSearchParams({
                    lat:
                        latitude.toString(),

                    lng:
                        longitude.toString(),

                    rad:
                        searchRadius.toString()
                });


            const url =
                `${SPRIT_API}?${params.toString()}`;


            console.log("");
            console.log("================================");
            console.log("⛽ Spritpreis-Anfrage");
            console.log("================================");
            console.log(url);


            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        }
                    }
                );


            console.log(
                "API Status:",
                response.status
            );


            const text =
                await response.text();


            if (!response.ok) {

                console.error(
                    "API Fehler:",
                    text
                );


                return res.status(
                    response.status
                ).json({
                    error:
                        "Die Spritpreis-API hat einen Fehler zurückgegeben.",

                    details:
                        text
                });
            }


            let data;


            try {

                data =
                    JSON.parse(text);

            } catch {

                console.error(
                    "Ungültige JSON-Antwort:",
                    text
                );


                return res.status(500).json({
                    error:
                        "Die API hat keine gültige JSON-Antwort geliefert."
                });
            }


            if (
                data.status !== "ok"
            ) {

                return res.status(500).json({
                    error:
                        "Die API meldet einen Fehler.",

                    details:
                        data
                });
            }


            console.log(
                `Tankstellen gefunden: ${data.nr_statii ??
                data.statii?.length ??
                0
                }`
            );


            return res.json(data);


        } catch (error) {

            console.error("");
            console.error(
                "SERVER FEHLER:"
            );
            console.error(error);


            return res.status(500).json({
                error:
                    "Die Tankstellen konnten nicht geladen werden.",

                details:
                    error.message
            });
        }
    }
);



// ========================================
// ORT / PLZ SUCHEN
// ========================================

app.get(
    "/api/geocode",
    async (req, res) => {

        try {

            const query =
                String(
                    req.query.query || ""
                ).trim();


            if (!query) {

                return res.status(400).json({
                    error:
                        "Bitte einen Ort oder eine PLZ eingeben."
                });
            }


            console.log("");
            console.log("================================");
            console.log("🔎 Ortssuche");
            console.log("================================");
            console.log(
                "Suchbegriff:",
                query
            );


            const params =
                new URLSearchParams({

                    q:
                        query,

                    format:
                        "jsonv2",

                    addressdetails:
                        "1",

                    limit:
                        "1",

                    countrycodes:
                        "de"
                });


            const url =
                "https://nominatim.openstreetmap.org/search?" +
                params.toString();


            console.log(
                "Nominatim URL:",
                url
            );


            const response =
                await fetch(
                    url,
                    {
                        headers: {

                            Accept:
                                "application/json",

                            "User-Agent":
                                "Spritpreise-Webapp/1.0"
                        }
                    }
                );


            console.log(
                "Nominatim Status:",
                response.status
            );


            const text =
                await response.text();


            console.log(
                "Nominatim Antwort:",
                text
            );


            if (!response.ok) {

                return res.status(500).json({
                    error:
                        "Die Ortssuche konnte nicht durchgeführt werden.",

                    details:
                        text
                });
            }


            let data;


            try {

                data =
                    JSON.parse(text);

            } catch {

                return res.status(500).json({
                    error:
                        "Die Ortssuche hat keine gültige Antwort geliefert."
                });
            }


            if (
                !Array.isArray(data) ||
                data.length === 0
            ) {

                return res.status(404).json({
                    error:
                        `Ort oder PLZ "${query}" wurde nicht gefunden.`
                });
            }


            const result =
                data[0];


            const lat =
                Number(result.lat);

            const lon =
                Number(result.lon);


            if (
                Number.isNaN(lat) ||
                Number.isNaN(lon)
            ) {

                return res.status(500).json({
                    error:
                        "Für den Ort wurden keine gültigen Koordinaten gefunden."
                });
            }


            return res.json({

                lat:
                    lat,

                lon:
                    lon,

                name:
                    result.display_name
            });


        } catch (error) {

            console.error("");
            console.error(
                "GEOCODING FEHLER:"
            );
            console.error(error);


            return res.status(500).json({
                error:
                    "Fehler bei der Ortssuche.",

                details:
                    error.message
            });
        }
    }
);



// ========================================
// SERVER STARTEN
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("================================");
        console.log("⛽ Spritpreise Webapp");
        console.log("================================");
        console.log("");
        console.log(
            "Webapp läuft auf:"
        );
        console.log(
            `http://localhost:${PORT}`
        );
        console.log("");
    }
);