const loadButton =
    document.getElementById("loadPrices");

const results =
    document.getElementById("results");

const radiusSelect =
    document.getElementById("radius");

const fuelTypeSelect =
    document.getElementById("fuelType");

const sortTypeSelect =
    document.getElementById("sortType");

const locationInfo =
    document.getElementById("locationInfo");

let currentStations = [];

loadButton.addEventListener(
    "click",
    loadStations
);

fuelTypeSelect.addEventListener("change", () => {
    if (currentStations.length === 0) {
        return;
    }
    displayStations(currentStations);
});

sortTypeSelect.addEventListener("cahnge", () => {
    if (currentStations.length === 0) {
        return;
    }
    displayStations(currentStations);
});


function loadStations() {

    const fuelType =
        fuelTypeSelect.value;

    results.innerHTML = `
        <div class="loading">
            📍 Standort wird ermittelt...
        </div>
    `;

    locationInfo.innerHTML = "";


    if (!navigator.geolocation) {

        showError(
            "Dein Browser unterstützt keine Standortbestimmung."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;

            const radius =
                radiusSelect.value;


            locationInfo.innerHTML = `
                📍 Standort gefunden
                <br>
                Suche im Umkreis von ${radius} km
            `;


            results.innerHTML = `
                <div class="loading">
                    ⛽ Tankstellen werden geladen...
                </div>
            `;


            try {

                const url =
                    `/api/stations?lat=${encodeURIComponent(lat)}` +
                    `&lon=${encodeURIComponent(lon)}` +
                    `&radius=${encodeURIComponent(radius)}`;


                console.log(
                    "Anfrage an unseren Server:",
                    url
                );


                const response =
                    await fetch(url);


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Unbekannter Serverfehler."
                    );
                }


                if (
                    data.status !== "ok" ||
                    !Array.isArray(data.statii)
                ) {

                    throw new Error(
                        "Die API hat keine Tankstellen geliefert."
                    );
                }
                currentStations = data.statii;

                displayStations(currentStations);


            } catch (error) {

                console.error(error);

                showError(
                    error.message
                );
            }
        },


        (error) => {

            console.error(
                "Geolocation Fehler:",
                error
            );


            showError(
                "Der Standort konnte nicht ermittelt werden. " +
                "Bitte erlaube deinem Browser den Zugriff auf den Standort."
            );
        }
    );
}


function displayStations(stations) {

    if (stations.length === 0) {
        showError(
            "Keine Tankstellen im gewählten Umkreis gefunden."
        );
        return;
    }

    const fuelTypes = {
        benzina: {
            name: "Super E5",
            icon: "⛽"
        },

        e10: {
            name: "Super E10",
            icon: "🟢"
        },

        motorina: {
            name: "Diesel",
            icon: "🚛"
        }
    };

    const fuelType =
        fuelTypeSelect.value;

    const fuel =
        fuelTypes[fuelType];

    if (!fuel) {
        showError(
            "Unbekannte Spritart."
        );
        return;
    }

    const available =
        stations.filter(station => {

            const price =
                station[fuelType];

            return (
                typeof price === "number" &&
                price > 0
            );
        });

    const sortType =
        sortTypeSelect.value;


    if (sortType === "priceAsc") {

        available.sort((a, b) => {
            return (
                a[fuelType] -
                b[fuelType]
            );
        });

    }


    else if (sortType === "priceDesc") {

        available.sort((a, b) => {
            return (
                b[fuelType] -
                a[fuelType]
            );
        });

    }


    else if (sortType === "distance") {

        available.sort((a, b) => {

            return (
                a.dist_km -
                b.dist_km
            );

        });

    }

    if (available.length === 0) {
        showError(
            `Keine Preise für ${fuel.name} gefunden.`
        );
        return;
    }

    let html = `
        <section class="fuel-section">

            <h2>
                ${fuel.icon}
                ${fuel.name}
            </h2>
    `;

    for (const station of available) {

        const price =
            station[fuelType];

        const distance =
            typeof station.dist_km === "number"
                ? station.dist_km.toFixed(1)
                : "-";

        const openStatus =
            station.deschis === true
                ? `<span class="open">
                    🟢 Geöffnet
                   </span>`
                : `<span class="closed">
                    🔴 Geschlossen
                   </span>`;

        html += `
            <div class="station">

                <div class="station-info">

                    <span class="station-name">
                        ${escapeHtml(
            station.nume ||
            "Tankstelle"
        )}
                    </span>

                    <span class="station-brand">
                        ${escapeHtml(
            station.brand || ""
        )}
                    </span>

                    <span class="station-address">
                        ${escapeHtml(
            station.adresa || ""
        )}
                    </span>

                    <span class="station-distance">
                        📍 ${distance} km
                    </span>

                    ${openStatus}

                </div>

                <div class="price">
                    ${price.toFixed(3)} €
                </div>

            </div>
        `;
    }

    html += `
        </section>
    `;

    results.innerHTML = html;
}


function showError(message) {

    results.innerHTML = `
        <div class="error">
            ❌ ${escapeHtml(message)}
        </div>
    `;
}


function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}