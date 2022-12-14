const zoom = 15;
let locations = [
    {lat: 52.22977, lng: 21.01178, info: '<b>Shop XY</b><br />One day I am gonna represent XY shops supply. 🤩'},
    {lat: 52.228, lng: 21.011, info: '<b>Shop XYZ</b><br />Another store.'}
];
const lat = 52.22977;
const lng = 21.01178;
const map = L.map('map').setView([lat, lng], zoom);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

locations.map(location => {
    let latLng = L.latLng(location.lat, location.lng);
    L.marker(latLng, {
        draggable: true,
        autoPan: true
    }).addTo(map)
        .bindPopup(location.info).openPopup();
})

var latLng = L.latLng(lat,lng);

// L.marker([lat, lng], {
L.marker(latLng, {
    draggable: true,
    autoPan: true
}).addTo(map)
    .bindPopup('<b>Shop XY</b><br />One day I am gonna represent XY shops supply. 🤩').openPopup();

function onMapClick(e) {
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`You clicked the map at ${e.latlng.toString()}`)
        .openOn(map);
}

map.on('click', onMapClick);

/**
 * geocoding addresses search engine outside the map
 */
window.addEventListener("DOMContentLoaded", function () {
    new Autocomplete("location", {
        selectFirst: true,
        howManyCharacters: 2,

        onSearch: function ({currentValue}) {
            const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=5&q=${encodeURI(
                currentValue
            )}`;

            return new Promise((resolve) => {
                fetch(api)
                    .then((response) => response.json())
                    .then((data) => {
                        resolve(data.features);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            });
        },
        // nominatim
        onResults: ({currentValue, matches, template}) => {
            const regex = new RegExp(currentValue, "i");
            // checking if we have results if we don't
            // take data from the noResults method
            return matches === 0
                ? template
                : matches
                    .map((element) => {
                        return `
              <li class="loupe" role="option">
                ${element.properties.display_name.replace(
                            regex,
                            (str) => `<b>${str}</b>`
                        )}
              </li> `;
                    })
                    .join("");
        },

        onSubmit: ({object}) => {
            // const {display_name} = object.properties;
            const cord = object.geometry.coordinates;
            // custom id for marker
            // const customId = Math.random();

            // const marker = L.marker([cord[1], cord[0]], {
            //     title: display_name,
            //     id: customId,
            // });
            //
            // marker.addTo(map).bindPopup(display_name);

            map.setView([cord[1], cord[0]], 8);

            // map.eachLayer(function (layer) {
            //     if (layer.options && layer.options.pane === "markerPane") {
            //         if (layer.options.id !== customId) {
            //             map.removeLayer(layer);
            //         }
            //     }
            // });
        },

        // get index and data from li element after
        // hovering over li with the mouse or using
        // arrow keys ↓ | ↑
        onSelectedItem: ({index, element, object}) => {
            console.log("onSelectedItem:", index, element, object);
        },

        // the method presents no results
        noResults: ({currentValue, template}) =>
            template(`<li>No results found: "${currentValue}"</li>`),
    });
});

// create custom button
const customControl = L.Control.extend({
    // button position
    options: {
        position: "topleft",
        className: "locate-button leaflet-bar",
        html: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
        style:
            "margin-top: 0; left: 0; display: flex; cursor: pointer; justify-content: center; font-size: 2rem;",
    },

    // method
    onAdd: function (map) {
        this._map = map;
        const button = L.DomUtil.create("div");
        L.DomEvent.disableClickPropagation(button);

        button.title = "locate";
        button.innerHTML = this.options.html;
        button.className = this.options.className;
        button.setAttribute("style", this.options.style);

        L.DomEvent.on(button, "click", this._clicked, this);

        return button;
    },
    _clicked: function (e) {
        L.DomEvent.stopPropagation(e);

        // this.removeLocate();

        this._checkLocate();

        return;
    },
    _checkLocate: function () {
        return this._locateMap();
    },

    _locateMap: function () {
        const locateActive = document.querySelector(".locate-button");
        const locate = locateActive.classList.contains("locate-active");
        // add/remove class from locate button
        locateActive.classList[locate ? "remove" : "add"]("locate-active");

        // remove class from button
        // and stop watching location
        if (locate) {
            this.removeLocate();
            this._map.stopLocate();
            return;
        }

        // location on found
        this._map.on("locationfound", this.onLocationFound, this);
        // locataion on error
        this._map.on("locationerror", this.onLocationError, this);

        // start locate
        this._map.locate({ setView: true, enableHighAccuracy: true });
    },
    onLocationFound: function (e) {
        // add circle
        this.addCircle(e).addTo(this.featureGroup()).addTo(map);

        // add marker
        this.addMarker(e).addTo(this.featureGroup()).addTo(map);

        // add legend
    },
    // on location error
    onLocationError: function (e) {
        this.addLegend("Location access denied.");
    },
    // feature group
    featureGroup: function () {
        return new L.FeatureGroup();
    },
    // add legend
    addLegend: function (text) {
        const checkIfDescriotnExist = document.querySelector(".description");

        if (checkIfDescriotnExist) {
            checkIfDescriotnExist.textContent = text;
            return;
        }

        const legend = L.control({ position: "bottomleft" });

        legend.onAdd = function () {
            let div = L.DomUtil.create("div", "description");
            L.DomEvent.disableClickPropagation(div);
            const textInfo = text;
            div.insertAdjacentHTML("beforeend", textInfo);
            return div;
        };
        legend.addTo(this._map);
    },
    addCircle: function ({ accuracy, latitude, longitude }) {
        return L.circle([latitude, longitude], accuracy / 2, {
            className: "circle-test",
            weight: 2,
            stroke: false,
            fillColor: "#136aec",
            fillOpacity: 0.15,
        });
    },
    addMarker: function ({ latitude, longitude }) {
        return L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: "located-animation",
                iconSize: L.point(17, 17),
                popupAnchor: [0, -15],
            }),
        }).bindPopup("Your are here :)");
    },
    removeLocate: function () {
        this._map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                const { icon } = layer.options;
                if (icon?.options.className === "located-animation") {
                    map.removeLayer(layer);
                }
            }
            if (layer instanceof L.Circle) {
                if (layer.options.className === "circle-test") {
                    map.removeLayer(layer);
                }
            }
        });
    },
});

// adding new button to map controll
map.addControl(new customControl());