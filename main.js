// ==UserScript==
// @name         GeoFS Extra Vehicles (MeLovesLego Safe Fork)
// @version      1.4.1
// @description  Adds extra vehicles to GeoFS
// @author       AF267 (forked & stabilized by MeLovesLego)
// @updateURL    https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/refs/heads/main/main.js
// @downloadURL  https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/refs/heads/main/main.js
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  console.log("GeoFS Extra Vehicles (MeLovesLego fork version) running...");

  // IMPORTANT: use RAW github content URLs
  var RAW_BASE = "https://raw.githubusercontent.com/MeLovesLego/GeoFS-Extra-Vehicles/refs/heads/main/";
  var DATA_URL = RAW_BASE + "vehicles.json";

  // ---------- UI: add Extras button and panel ----------
  var aircraftButton = document.querySelector('button[data-toggle-panel=".geofs-aircraft-list"]');
  if (!aircraftButton) {
    console.warn("Aircraft button not found. GeoFS UI may have changed.");
    return;
  }

  // Create button
  var extrasButton = aircraftButton.cloneNode(true);
  extrasButton.textContent = "Extras";
  extrasButton.setAttribute("data-toggle-panel", ".geofs-extras-list");
  extrasButton.id = "extras-button";
  aircraftButton.parentNode.insertBefore(extrasButton, aircraftButton);

  // Create panel
  var extrasPanel = document.createElement("ul");
  extrasPanel.className = "geofs-list geofs-extras-list geofs-toggle-panel";

  // Header
  var header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "10px";
  header.style.paddingLeft = "20px";

  var headerImg = document.createElement("img");
  headerImg.src = RAW_BASE + "JXT%20Logo.png";
  headerImg.style.width = "100px";
  headerImg.style.height = "auto";

  var headerTitle = document.createElement("h4");
  headerTitle.style.margin = "0";
  headerTitle.textContent = "GeoFS Extra Vehicles";

  header.appendChild(headerImg);
  header.appendChild(headerTitle);
  extrasPanel.appendChild(header);

  // Insert panel after aircraft list
  var aircraftPanel = document.querySelector(".geofs-aircraft-list");
  if (aircraftPanel && aircraftPanel.parentNode) {
    aircraftPanel.parentNode.insertBefore(extrasPanel, aircraftPanel.nextSibling);
  } else {
    console.warn("Aircraft list panel not found (.geofs-aircraft-list).");
  }

  // ---------- Helpers ----------
  function safeText(t) {
    return (t === undefined || t === null) ? "" : String(t);
  }

  function sortByName(items) {
    items.sort(function (a, b) {
      var an = safeText(a && a.name).toLowerCase();
      var bn = safeText(b && b.name).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
  }

  function createCategorySection(title, items) {
    var category = document.createElement("li");
    category.className = "geofs-list-collapsible-item";
    category.textContent = title;

    var sublist = document.createElement("ul");
    sublist.className = "geofs-collapsible";

    sortByName(items);

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || !item.url || !item.name) continue;

      var li = document.createElement("li");
      li.setAttribute("data-url", item.url);
      li.setAttribute("data-mpid", item.id);

      var span = document.createElement("span");
      span.appendChild(document.createTextNode(item.name));

      // Multiplayer icon
      if (item.mp) {
        var icon = document.createElement("img");
        icon.style.width = "20px";
        icon.style.height = "20px";
        icon.style.marginLeft = "8px";

        if (item.mp === "green") icon.src = RAW_BASE + "green.png";
        else if (item.mp === "yellow") icon.src = RAW_BASE + "yellow.png";
        else if (item.mp === "red") icon.src = RAW_BASE + "red.png";
        else if (item.mp === "addon") {
          icon.src = RAW_BASE + "addon.png";

          // Register into geofs.aircraftList if available
          try {
            if (window.geofs && geofs.aircraftList && item.id !== undefined) {
              geofs.aircraftList[item.id] = {
                id: item.id,
                community: 1,
                multiplayerFiles: "",
                name: item.name,
                path: item.url
              };
            }
          } catch (e) {}
        }

        span.appendChild(icon);
      }

      // LiverySelector icon
      if (item.ls === 1) {
        var ls = document.createElement("img");
        ls.style.width = "20px";
        ls.style.height = "20px";
        ls.style.marginLeft = "8px";
        ls.src = RAW_BASE + "ls-logo.png";
        span.appendChild(ls);
      }

      li.appendChild(span);
      sublist.appendChild(li);
    }

    category.appendChild(sublist);
    return category;
  }

  function appendAboutSection() {
    var aboutSection = document.createElement("li");
    aboutSection.className = "geofs-list-collapsible-item";
    aboutSection.textContent = "About";

    var aboutContent = document.createElement("ul");
    aboutContent.className = "geofs-collapsible";

    aboutContent.innerHTML =
      '<a href="https://github.com/MeLovesLego/GeoFS-Extra-Vehicles" target="_blank" rel="nofollow">' +
      '<h4>GeoFS Extra Vehicles (MeLovesLego fork)</h4></a>' +
      '<p>This is a community addon (not affiliated with GeoFS). If something breaks after a GeoFS update, reload and try again.</p>' +
      '<h5>Multiplayer Icons</h5>' +
      '<span><img src="' + RAW_BASE + 'green.png" style="width:24px;height:auto;margin:8px">Multiplayer model supported</span><br/>' +
      '<span><img src="' + RAW_BASE + 'addon.png" style="width:24px;height:auto;margin:8px">Multiplayer model supported via addon</span><br/>' +
      '<span><img src="' + RAW_BASE + 'yellow.png" style="width:24px;height:auto;margin:8px">Multiplayer model shows as similar vehicle</span><br/>' +
      '<span><img src="' + RAW_BASE + 'red.png" style="width:24px;height:auto;margin:8px">Multiplayer model not supported</span>';

    aboutSection.appendChild(aboutContent);
    extrasPanel.appendChild(aboutSection);
  }

  // ---------- Aircraft loader (safe spawn fallback) ----------
  function getSpawnCoordsFallback() {
    // Try GeoFS API if available; otherwise Monaco.
    try {
      if (window.geofs && geofs.aircraft && geofs.aircraft.instance) {
        if (typeof geofs.aircraft.instance.getCurrentCoordinates === "function") {
          var c = geofs.aircraft.instance.getCurrentCoordinates();
          if (c && c.length >= 3) return c;
        }
      }
    } catch (e) {}

    // Monaco @ 200m
    return [43.7347, 7.4206, 200];
  }

  function loadAircraftFromUrl(baseUrl, mpID, name) {
    if (!baseUrl) return;

    // Ensure trailing slash
    if (baseUrl.charAt(baseUrl.length - 1) !== "/") baseUrl = baseUrl + "/";

    if (!window.$ || !$.ajax) {
      console.error("jQuery ($.ajax) not found. Cannot load external aircraft.");
      return;
    }

    console.log("Loading aircraft from:", baseUrl);

    $.ajax(baseUrl + "aircraft.json?v=" + Date.now(), {
      dataType: "text",
      success: function (jsonText) {
        try {
          if (!window.geofs || !geofs.aircraft || !geofs.aircraft.instance) {
            console.error("GeoFS aircraft instance not available yet.");
            return;
          }

          var record = {
            id: "custom_" + Date.now(),
            name: name || "Extra Vehicle",
            fullPath: baseUrl,
            isPremium: false,
            isCommunity: false,
            definition: btoa(jsonText),
            multiplayerFiles: [
              baseUrl + "multiplayer.glb",
              baseUrl + "multiplayer-low.glb"
            ]
          };

          var parsed = geofs.aircraft.instance.parseRecord(JSON.stringify(record));
          if (!parsed) {
            if (window.ui && ui.notification && ui.notification.show) {
              ui.notification.show("Failed to parse aircraft.json");
            }
            console.error("parseRecord() returned null/false");
            return;
          }

          var spawn = getSpawnCoordsFallback();

          // Unload current aircraft, then init new
          geofs.aircraft.instance.unloadAircraft();

          record.id = mpID;
          geofs.aircraft.instance.id = mpID;
          geofs.aircraft.instance.fullPath = record.fullPath;
          geofs.aircraft.instance.aircraftRecord = record;

          geofs.aircraft.instance.init(parsed, spawn);

          console.log("✅ Loaded:", record.name, "Spawn:", spawn);
        } catch (e) {
          console.error("❌ Load failed:", e);
          if (window.ui && ui.notification && ui.notification.show) {
            ui.notification.show("Load failed: " + (e && e.message ? e.message : "unknown error"));
          }
        }
      },
      error: function (xhr) {
        console.error("❌ Could not load aircraft.json from", baseUrl, xhr && xhr.status);
        if (window.ui && ui.notification && ui.notification.show) {
          ui.notification.show("Could not load aircraft.json");
        }
      }
    });
  }

  // Click handler
  extrasPanel.addEventListener("click", function (e) {
    var target = e.target;
    while (target && target !== extrasPanel) {
      if (target.tagName === "LI" && target.getAttribute("data-url")) break;
      target = target.parentNode;
    }
    if (!target || target === extrasPanel) return;

    var url = target.getAttribute("data-url");
    var mpid = target.getAttribute("data-mpid");
    var nm = target.innerText || target.textContent;

    loadAircraftFromUrl(url, mpid, nm);
  });

  // ---------- Load vehicle list (JSON) ----------
  function fetchVehiclesJson(url, cb) {
    // Use fetch if available; fall back to XHR
    if (window.fetch) {
      fetch(url, { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (data) { cb(null, data); })
        .catch(function (err) { cb(err); });
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          cb(null, JSON.parse(xhr.responseText));
        } catch (e) {
          cb(e);
        }
      } else {
        cb(new Error("HTTP " + xhr.status));
      }
    };
    xhr.send();
  }

  fetchVehiclesJson(DATA_URL, function (err, data) {
    if (err) {
      console.error("Vehicle list failed to load:", err);
      // Still add About so the panel isn't "empty / broken"
      appendAboutSection();
      return;
    }

    try {
      for (var category in data) {
        if (!data.hasOwnProperty(category)) continue;
        extrasPanel.appendChild(createCategorySection(category, data[category]));
      }
    } catch (e) {
      console.error("Vehicle list parse/render error:", e);
    }

    appendAboutSection();
  });

})();
