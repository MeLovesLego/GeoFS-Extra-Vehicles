// ==UserScript==
// @name         GeoFS Extra Vehicles (MeLovesLego Safe Fork)
// @version      1.4
// @description  Adds extra vehicles to GeoFS
// @author       AF267 (forked by MeLovesLego)
// @updateURL    https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/main.js
// @downloadURL  https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/main.js
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log("GeoFS Extra Vehicles (MeLovesLego fork) running...");

    // 🔒 PINNED TO YOUR REPO
    const DATA_URL =
        "https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/vehicles.json";

    const aircraftButton = document.querySelector(
        'button[data-toggle-panel=".geofs-aircraft-list"]'
    );

    if (!aircraftButton) {
        console.warn("Aircraft button not found.");
        return;
    }

    const extrasButton = aircraftButton.cloneNode(true);
    extrasButton.textContent = "Extras";
    extrasButton.removeAttribute("data-toggle-panel");
    extrasButton.setAttribute("data-toggle-panel", ".geofs-extras-list");
    extrasButton.id = "extras-button";
    aircraftButton.parentNode.insertBefore(extrasButton, aircraftButton);

    const extrasPanel = document.createElement("ul");
    extrasPanel.className =
        "geofs-list geofs-extras-list geofs-toggle-panel";

    extrasPanel.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding-left:20px;">
            <img src="https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/JXT%20Logo.png"
                 style="width:100px;height:auto;" />
            <h4 style="margin:0;">GeoFS Extra Vehicles</h4>
        </div>
    `;

    const aircraftPanel = document.querySelector(".geofs-aircraft-list");
    if (aircraftPanel && aircraftPanel.parentNode) {
        aircraftPanel.parentNode.insertBefore(
            extrasPanel,
            aircraftPanel.nextSibling
        );
    }

    function createCategorySection(title, items) {
        const category = document.createElement("li");
        category.className = "geofs-list-collapsible-item";
        category.textContent = title;

        const sublist = document.createElement("ul");
        sublist.className = "geofs-collapsible";

        items.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );

        items.forEach(item => {
            const li = document.createElement("li");
            li.setAttribute("data-url", item.url);
            li.setAttribute("data-mpid", item.id);

            const span = document.createElement("span");
            span.appendChild(document.createTextNode(item.name));

            if (item.mp) {
                const icon = document.createElement("img");
                icon.style.width = "20px";
                icon.style.height = "20px";
                icon.style.marginLeft = "8px";

                const base =
                    "https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/";

                if (item.mp === "green") icon.src = base + "green.png";
                else if (item.mp === "yellow") icon.src = base + "yellow.png";
                else if (item.mp === "red") icon.src = base + "red.png";
                else if (item.mp === "addon") {
                    icon.src = base + "addon.png";

                    geofs.aircraftList[item.id] = {
                        id: item.id,
                        community: 1,
                        multiplayerFiles: "",
                        name: item.name,
                        path: item.url
                    };
                }

                span.appendChild(icon);
            }

            if (item.ls === 1) {
                const ls = document.createElement("img");
                ls.style.width = "20px";
                ls.style.height = "20px";
                ls.style.marginLeft = "8px";
                ls.src =
                    "https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/main/ls-logo.png";
                span.appendChild(ls);
            }

            li.appendChild(span);
            sublist.appendChild(li);
        });

        category.appendChild(sublist);
        return category;
    }

    function loadAircraftFromUrl(baseUrl, mpID, name) {
        $.ajax(baseUrl + "aircraft.json", {
            dataType: "text",
            success: function (jsonText) {
                const record = {
                    id: "custom_" + Date.now(),
                    name: name,
                    fullPath: baseUrl,
                    isPremium: false,
                    isCommunity: false,
                    definition: btoa(jsonText),
                    multiplayerFiles: [
                        baseUrl + "multiplayer.glb",
                        baseUrl + "multiplayer-low.glb"
                    ]
                };

                const parsed =
                    geofs.aircraft.instance.parseRecord(
                        JSON.stringify(record)
                    );

                if (!parsed) {
                    ui.notification.show("Failed to parse aircraft.json");
                    return;
                }

                geofs.aircraft.instance.unloadAircraft();
                record.id = mpID;
                geofs.aircraft.instance.id = mpID;
                geofs.aircraft.instance.fullPath = record.fullPath;
                geofs.aircraft.instance.aircraftRecord = record;

                geofs.aircraft.instance.init(
                    parsed,
                    geofs.aircraft.instance.getCurrentCoordinates()
                );
            },
            error: function () {
                ui.notification.show("Could not load aircraft.json");
            }
        });
    }

    extrasPanel.addEventListener("click", e => {
        const li = e.target.closest("li[data-url]");
        if (!li) return;

        loadAircraftFromUrl(
            li.getAttribute("data-url"),
            li.getAttribute("data-mpid"),
            li.innerText
        );
    });

    fetch(DATA_URL)
        .then(r => r.json())
        .then(data => {
            for (const [category, items] of Object.entries(data)) {
                extrasPanel.appendChild(
                    createCategorySection(category, items)
                );
            }
        })
        .catch(err => {
            console.error("Vehicle list failed to load:", err);
        });

})();
