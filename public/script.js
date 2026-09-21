const loadButton =
    document.getElementById("loadPrices");

const results =
    document.getElementById("results");

const radiusSelect =
    document.getElementById("radius");

const locationInfo =
    document.getElementById("locationInfo");


loadButton.addEventListener(
    "click",
    loadStations
);


function loadStations() {

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


                displayStations(data.statii);


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


    const fuelTypes = [

        {
            key: "benzina",
            name: "Super E5",
            icon: "⛽"
        },

        {
            key: "e10",
            name: "Super E10",
            icon: "🟢"
        },

        {
            key: "motorina",
            name: "Diesel",
            icon: "🚛"
        }
    ];


    let html = "";


    for (const fuel of fuelTypes) {

        const available =
            stations
                .filter(station => {

                    const price =
                        station[fuel.key];

                    return (
                        typeof price === "number" &&
                        price > 0
                    );
                })
                .sort(
                    (a, b) =>
                        a[fuel.key] -
                        b[fuel.key]
                );


        if (available.length === 0) {
            continue;
        }


        html += `
            <section class="fuel-section">

                <h2>
                    ${fuel.icon}
                    ${fuel.name}
                </h2>
        `;


        for (const station of available) {

            const price =
                station[fuel.key];


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
    }


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