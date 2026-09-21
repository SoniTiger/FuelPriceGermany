const express = require("express");

const app = express();
const PORT = 3000;

const SPRIT_API =
    "https://pretcarburant.ro/api/v1/de-statii";

app.use(express.static("public"));

app.get("/api/stations", async (req, res) => {
    try {
        const { lat, lon, radius = 5 } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: "Latitude und Longitude sind erforderlich."
            });
        }

        const latitude = Number(lat);
        const longitude = Number(lon);
        const searchRadius = Number(radius);

        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude) ||
            Number.isNaN(searchRadius)
        ) {
            return res.status(400).json({
                error: "Ungültige Koordinaten."
            });
        }

        if (searchRadius < 1 || searchRadius > 25) {
            return res.status(400).json({
                error: "Der Suchradius muss zwischen 1 und 25 km liegen."
            });
        }

        const params = new URLSearchParams({
            lat: latitude.toString(),
            lng: longitude.toString(),
            rad: searchRadius.toString()
        });

        const url = `${SPRIT_API}?${params.toString()}`;

        console.log("");
        console.log("================================");
        console.log("⛽ Spritpreis-Anfrage");
        console.log("================================");
        console.log(url);

        const response = await fetch(url, {
            headers: {
                Accept: "application/json"
            }
        });

        console.log("API Status:", response.status);

        const text = await response.text();

        if (!response.ok) {
            console.error("API Fehler:", text);

            return res.status(response.status).json({
                error: "Die Spritpreis-API hat einen Fehler zurückgegeben.",
                details: text
            });
        }

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("Ungültige JSON-Antwort:", text);

            return res.status(500).json({
                error: "Die API hat keine gültige JSON-Antwort geliefert."
            });
        }

        if (data.status !== "ok") {
            return res.status(500).json({
                error: "Die API meldet einen Fehler.",
                details: data
            });
        }

        console.log(
            `Tankstellen gefunden: ${data.nr_statii ?? data.statii?.length ?? 0}`
        );

        res.json(data);

    } catch (error) {
        console.error("");
        console.error("SERVER FEHLER:");
        console.error(error);

        res.status(500).json({
            error: "Die Tankstellen konnten nicht geladen werden.",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("⛽ Spritpreise Webapp");
    console.log("================================");
    console.log("");
    console.log(`Webapp läuft auf:`);
    console.log(`http://localhost:${PORT}`);
    console.log("");
});