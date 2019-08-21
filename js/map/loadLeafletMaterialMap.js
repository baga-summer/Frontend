/* global L configuration, API */

let polylines = L.layerGroup();
let markers = L.layerGroup();
let polygons = L.layerGroup();
let newDiv;
let newP;
let boundsArray = [];
let numbersObj = {};
let token = localStorage.getItem('token');
let table = document.getElementById('myMaterialTable');
let icons = [];

// Imports Google maps javascript api key from getKey.js file
import { key } from "./getKey.js";
import { options } from "./options.js";
import { popup } from "./popup.js";

// Initialize the map with center coordinates on BAGA HQ and zoom 18.
export const map = L.map("myMaterialMap", {
    "editable": true,
    "zoomControl": false,
    "doubleClickZoom": false,
    "boxZoom": false,
    "dragging": false,
    "scrollWheelZoom": false,
    "zoom": 18
});

// Creates script link to Google Maps javascript API with our key
// then append it to head of map.html.
const script = document.createElement("script");

script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
document.head.appendChild(script);

/**
 * gridlayers - Creates the layer button in the top right corner with roadmap
 * 				and satellite alternatives
 *
 * @returns {void}
 */
let gridlayers = () => {
    // Creates Google maps roadmap (standard) grid layer and displays it on the map
    var roadmap = L.gridLayer.googleMutant({
        type: "roadmap"
    }).addTo(map);

    // Creates Google maps satellite grid layer
    var satellite = L.gridLayer.googleMutant({
        type: "satellite"
    });

    // Creates a array with roadmap and satellite inside and then add the array to a
    // new control layer and displays it to the map in the top right corner.
    var baseMaps = {
        "Karta": roadmap,
        "Satellit": satellite
    };

    L.control.layers(baseMaps).addTo(map);
};

/**
 * TBA
 *
 * @returns {void}
 */
let getBounds = () => {
    markers.eachLayer((marker) => {
        boundsArray.push({ lat: marker._latlng.lat, lng: marker._latlng.lng });
        marker.off("click");
        marker.options.interactive = false;
    });

    polylines.eachLayer((polyline) => {
        boundsArray.push(polyline._latlngs);
        polyline.options.interactive = false;
        polyline.off("click");
    });

    polygons.eachLayer((polygon) => {
        boundsArray.push(polygon._latlngs);
        polygon.off("click");
    });

    let highest = 0;
    let pos;

    for (var i = 0; i < boundsArray.length; i++) {
        if (boundsArray[i].lng > highest) {
            highest = boundsArray[i].lng;
            pos = i;
        }
    }

    highest -= 0.0005;
    boundsArray[pos].lng = highest;

    var bounds = new L.LatLngBounds(boundsArray);

    map.fitBounds(bounds);
};

map.on("moveend", () => {
    var i = 1;

    markers.eachLayer((marker) => {
        if (marker.attributes.Kategori != "Förgrening" &&
            marker.attributes.Kategori != "Utsläppspunkt") {
            if (!numbersObj.hasOwnProperty(marker.attributes.Modell)) {
                numbersObj[marker.attributes.Modell] = [i];
            } else {
                numbersObj[marker.attributes.Modell].push(i);
            }

            if (!numbersObj.hasOwnProperty(marker.attributes.Pump)) {
                numbersObj[marker.attributes.Pump] = [i];
            } else {
                numbersObj[marker.attributes.Pump].push(i);
            }

            var pixelPosition = map.latLngToContainerPoint(marker._latlng);

            newDiv = document.createElement("div");
            newP = document.createElement("p");
            newDiv.style.top = (pixelPosition.y + 10) + "px";
            newDiv.style.left = (pixelPosition.x + 15) + "px";
            newDiv.setAttribute("class", "circleNumbers");
            var newContent = document.createTextNode(i);

            i = i + 1;
            newP.appendChild(newContent);
            newDiv.appendChild(newP);

            var currentDiv = document.getElementById("mapDiv");

            document.body.insertBefore(newDiv, currentDiv);
            document.getElementById(marker.attributes.Modell).innerHTML =
                `Nummer på kartan: ${numbersObj[marker.attributes.Modell].join(', ')}`;
            if (marker.attributes.Pump != undefined) {
                document.getElementById(marker.attributes.Pump).innerHTML =
                    `Nummer på kartan: ${numbersObj[marker.attributes.Pump].join(', ')}`;
            }
        }
    });
    map.off("moveend");
});

map.on("resize", () => {
    let circleNumbers = document.getElementsByClassName('circleNumbers');
    let i = 0;

    markers.eachLayer((marker) => {
        if (marker.attributes.Kategori != "Förgrening" &&
            marker.attributes.Kategori != "Utsläppspunkt") {
            let pixelPosition = map.latLngToContainerPoint(marker._latlng);

            circleNumbers[i].style.top = (pixelPosition.y + 10) + "px";
            circleNumbers[i].style.left = (pixelPosition.x + 15) + "px";
            i++;
        }
    });
});

let id = new URL(window.location.href).searchParams.get('id');

/**
 * load - Load objects(markers, polylines, polygons) to the map using json
 * data
 *
 * @returns {void}
 */
let load = async (json) => {
    let newObj;


    let objects = {};
    let pumps = {};
    let pipes = {};

    //map.setView(json[0].center, json[0].zoom);
    let iconJson = await API.get(
        `${configuration.apiURL}/obj/categories/icon/all?token=${token}`);

    for (let i = 0; i < iconJson.length; i++) {
        let image = new Image();
        let iconSize;

        image.src = iconJson[i].Bild;
        /**
         * Scale icon image
         */
        let scaleImage = async () => {
            if (iconJson[i].Kategori != 'Förgrening') {
                iconSize = calculateAspectRatioFit(image.naturalWidth,
                    image.naturalHeight, 75, 40);
            } else {
                iconSize = { width: 20, height: 20 };
            }

            let icon = {
                category: iconJson[i].Kategori,
                icon: L.icon({
                    iconAnchor: [iconSize.width / 2, iconSize.height / 2],
                    iconSize: [iconSize.width, iconSize.height],
                    iconUrl: iconJson[i].Bild,
                    popupAnchor: [0, -(iconSize.height / 2)]
                })
            };

            icons.push(icon);
        };

        image.setAttribute = await scaleImage();
    }


    //Loop through json data.
    for (let i = 1; i < json.length; i++) {
        let id = "";
        let listName = "";
        let icon;
        let temp;

        switch (json[i].type) {
            //if marker add it to the map with its options
            case "marker":
                icon = icons.find(element =>
                    element.category == json[i].data.attributes.Kategori);

                json[i].data.icon = icon.icon;
                newObj = new Marker(json[i].data);


                if (json[i].data.attributes != undefined &&
                    json[i].data.attributes.Kategori != "Förgrening" &&
                    json[i].data.attributes.Kategori != "Utsläppspunkt") {
                    if (!objects.hasOwnProperty(json[i].data.attributes.Modell)) {
                        let id;

                        if (json[i].data.attributes.RSK != undefined) {
                            id = `<td>RSK: ${json[i].data.attributes.RSK}</td>`;
                        } else if (json[i].data.attributes.ArtikelNr != undefined) {
                            id = `<td>Artikelnummer: ${json[i].data.attributes.ArtikelNr}</td>`;
                        } else {
                            id = `<td></td>`;
                        }

                        table.innerHTML +=
                            `<td>${json[i].data.attributes.Modell}</td>
						<td id="${json[i].data.attributes.Modell}Amount">Antal: 1</td>
						<td>Kategori: ${json[i].data.attributes.Kategori}</td>
						${id}
						<td id="${json[i].data.attributes.Modell}"></td>
						<td class="right">
							Kostnad <input type="number" class='number-input' value=''/>
						</td>`;

                        if (json[i].data.attributes.Pump != undefined &&
                            !pumps.hasOwnProperty(json[i].data.attributes.Pump)) {
                            table.innerHTML +=
                                `<td>${json[i].data.attributes.Pump}</td>
    						<td id="${json[i].data.attributes.Pump}Amount">Antal:
                                ${parseInt(json[i].data.attributes["Antal pumpar"])}</td>
    						<td>Kategori: Pump</td>
    						<td></td>
    						<td id="${json[i].data.attributes.Pump}"></td>
    						<td class="right">
    							Kostnad <input type="number" class='number-input' value=''/>
    						</td>`;
                            pumps[json[i].data.attributes.Pump] = {
                                antal: parseInt(json[i].data.attributes["Antal pumpar"])
                            };
                        } else if (json[i].data.attributes.Pump != undefined) {
                            pumps[json[i].data.attributes.Pump].antal += parseInt(
                                json[i].data.attributes["Antal pumpar"]);
                            document.getElementById(`${json[i].data.attributes.Pump}Amount`)
                                .innerHTML =
                                `<td>
								Antal: ${parseInt(pumps[json[i].data.attributes.Pump].antal)}
								</td>`;
                        }
                        objects[json[i].data.attributes.Modell] = { antal: 1 };
                    } else {
                        objects[json[i].data.attributes.Modell].antal += 1;
                        document.getElementById(`${json[i].data.attributes.Modell}Amount`)
                            .innerHTML =
                            `<td>Antal: ${objects[json[i].data.attributes.Modell].antal}</td>`;
                        if (json[i].data.attributes.Pump != undefined) {
                            pumps[json[i].data.attributes.Pump].antal += parseInt(
                                json[i].data.attributes["Antal pumpar"]);
                            document.getElementById(`${json[i].data.attributes.Pump}Amount`)
                                .innerHTML =
                                `<td>
								Antal: ${parseInt(pumps[json[i].data.attributes.Pump].antal)}
								</td>`;
                        }
                    }
                }

                break;
                //if polyline
            case "polyline":
                json[i].data.first = json[i].data.connected_with.first;

                newObj = new Pipe(json[i].data);
                json[i].data.last = json[i].data.connected_with.last;
                json[i].data.coordinates = null;
                newObj.draw(json[i].data);

                if (json[i].data.pipeType == 1) { id = "Stamledning"; } else { id = "Ledning"; }

                listName = id + json[i].data.material + json[i].data.dimension.outer;
                if (!pipes.hasOwnProperty(listName)) {
                    table.innerHTML +=
                        `<td>${id}</td>
                        <td id="${listName}">${Math.round(json[i].data.length)} m</td>
                        <td>Material: ${json[i].data.material}</td>
                        <td>Dimension: <br>${json[i].data.dimension.outer}</td>
                        <td></td>
                        <td class="right">
                        Kostnad <input type="number" class='number-input' value=''/>
                        </td>`;

                    pipes[listName] = {
                        "material": json[i].data.material,
                        "dimension": json[i].data.dimension,
                        "length": json[i].data.length,
                        "pipeType": json[i].data.pipeType
                    };
                } else {
                    pipes[listName].length += json[i].data.length;
                    document.getElementById(listName).innerHTML =
                        `<td>${Math.round(pipes[listName].length)} m</td>`;
                }

                break;
            case "polygon":
                temp = json[i].data.coordinates;
                json[i].data.popup.color = `#${json[i].data.popup.color}`;
                newObj = new House(json[i].data);
                json[i].data.coordinates = temp;
                newObj.drawFromLoad(json[i].data);
                break;
        }
    }


    //Create Summary
    let row = table.insertRow(-1);

    row.insertCell(0).innerHTML = "Totala kostnaden: ";
    row.insertCell(1).innerHTML = "";
    row.insertCell(2).innerHTML = "";
    row.insertCell(3).innerHTML = "";
    row.insertCell(4).innerHTML = "";
    let cost = row.insertCell(5);

    cost.id = 'displayCost';
    cost.innerHTML = "0 kr";
    cost.className = "right";

    //let strValue = table.children[0].children[0].children[1].innerHTML;
    //console.log(stringToNumber(strValue));

    let inputs = document.getElementsByClassName('number-input');

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("input", () => {
            let costInput = document.getElementsByClassName("number-input");
            let totalCost = 0;

            for (let i = 0; i < costInput.length; i++) {
                if (costInput[i].value.length > 0) {
                    let strValue = table.children[i].children[0].children[1].innerHTML;
                    let multiplier = stringToNumber(strValue);

                    totalCost += parseInt(costInput[i].value * multiplier);
                }
            }
            document.getElementById("displayCost").innerHTML = totalCost + " kr";
        });
    }

    gridlayers();

    getBounds();
};

/**
 * fetch - fetch for map data
 *
 * @returns {void}
 */
let fetch = async () => {
    let json = await API.get(`${configuration.apiURL}/proj/data/${id}?token=${token}`);

    if (json[0].data.length > 0) {
        load(json[0].data);
    }
};

fetch();

/**
 * stringToNumber
 *
 * @returns {string} ret
 */
const stringToNumber = (strValue) => {
    let number = strValue.split(" ");
    let ret = "No Number";

    for (let i = 0; i < number.length; i++) {
        if (!isNaN(number[i])) {
            return parseInt(number[i]);
        }
    }

    return ret;
};

/**
 * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} srcWidth width of source image
 * @param {Number} srcHeight height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
 */
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth * ratio, height: srcHeight * ratio };
}

/**
 * Marker - Class for creation of marker and underlying functionality for each object
 *
 */
export class Marker {
    /**
     * constructor - Creates a L.Marker with preconfiged attributes from options.js and popup.js
     * 			   - @see {@link https://leafletjs.com/reference-1.4.0.html#marker}
     * 			   - Adds functionality for drag and when popup is open
     * 			   - Lastly displays the new marker on the map
     *
     * @param {array} latlng     Coordinates (latitude and longitude) for the new marker
     * @param {array} attributes Specific characteristics (values) for the new marker
     * @param {L.Icon} icon		 @see {@link https://leafletjs.com/reference-1.4.0.html#icon}
     * @param {null} [id=null]   Option to specify leaflet_id on creation
     *
     * @returns {void}
     */
    constructor(data) {
        this.attributes = data.attributes;
        this.marker = new L.Marker(data.coordinates, options.marker(data.icon));

        this.marker.attributes = this.attributes;


        // Add marker to markers layer
        markers.addLayer(this.marker).addTo(map);
        this.attributes.id = this.marker.id;
    }
}

/**
 * House - Class for creation of house and underlying functionality for each
 */
export class House {
    /**
     * constructor - Creates a L.polygon with preconfigured attributes from options.js and popup.js
     * 			   - @see {@link https://leafletjs.com/reference-1.4.0.html#polygon}
     * 			   - Creates a guideline with a dashed line to help user to line up the next point
     * 			   - Guideline update it's position on mousemove
     * 			   - Calls stopDrawListener() to listen for escape presses to stop drawing
     *
     * @param {array} latlng     Coordinates (latitude and longitude) for the first point
     * 							 to the new house
     * @param {array} attributes Specific characteristics (values) for the new house
     *
     * @returns {void}
     */
    constructor(data) {
        this.completed = false;
        this.attributes = this.attributes;
        this.polygon = L.polygon([data.coordinates], options.house(data.popup.color));
        this.polygon.used = false;
    }

    /**
     * drawFromLoad - Draws polygon from saved data
     *
     * @param {array} latlngs     The rest of the coordinates of the corners on the polygon
     * @param {string} address    The address of the polygon
     * @param {string} definition What type of building is it
     * @param {string} nop        number of people is living there
     * @param {string} flow       water flow per person
     *
     * @returns {void}
     */
    drawFromLoad(data) {
        this.polygon.setLatLngs(data.coordinates);
        this.polygon.bindPopup(popup.house(data.popup.address, data.popup.definition,
            data.popup.nop, data.popup.flow, data.popup.color));
        polygons.addLayer(this.polygon).addTo(map);

        this.polygon.address = data.popup.address;
        this.polygon.definition = data.popup.definition;
        this.polygon.nop = data.popup.nop;
        this.polygon.flow = data.popup.flow;
        this.polygon.id = data.id;
        this.polygon.used = data.used;
        this.completed = true;
    }
}

/**
 * Pipe - Class for creation of pipe and underlying functionality for each
 */
export class Pipe {
    /**
     * constructor - Saves params values to object
     *
     * @param {array} latlngs   Coordinates (latitude and longitude) for the new polyline
     * 							latlngs -> can be one och more points (latlng)
     * @param {let} attributes Specific characteristics (values) for the new pipe
     * @param {let} type       0 -> pipe, 1 -> stem pipe
     * @param {let} id         Unique number to first connected_with
     *
     * @returns {void}
     */
    constructor(data) {
        this.latlngs = data.coordinates;
        this.attribute = data.attributes;
        this.type = data.pipeType;
        this.first = data.first;
    }

    /**
     * draw - Creates a L.polyline with preconfigured attributes from options.js, popup.js and type
     * 		- @see {@link https://leafletjs.com/reference-1.4.0.html#polyline}
     * 		- Set connected_with values so the object knows what is it connected to
     * 		- Set length for new polyline
     * 		- Displays new polyline on map
     *
     * @param {let} id            		Unique number to last connected_with
     * @param {array} [latlng=null] 	Option to push new point into new polyline
     * @param {null} [dimension=null]	Option to add preconfigured dimension
     * @param {null} [tilt=null]      	Option to add preconfigured tilt
     *
     * @returns {void}
     **/
    draw(data) {
        this.elevation = data.elevation;
        this.material = data.material;
        this.dimension = data.dimension;
        this.tilt = data.tilt;

        this.createPolyline();
    }

    /**
     * createPolyline - Creates a new polyline depending on what type is choosen with preconfigured
     * 				  - options, popup, length, dimension and tilt. Lastly add the new created
     * 				  - polyline to map
     *
     * @returns {void}
     */
    createPolyline() {
        if (this.type == 0) {
            this.polyline = new L.polyline(this.latlngs, options.pipe);
        } else if (this.type == 1) {
            this.polyline = new L.polyline(this.latlngs, options.stemPipe);
        }


        this.polyline.connected_with = {
            first: this.first,
            last: this.last
        };
        polylines.addLayer(this.polyline).addTo(map);
        this.polyline.bindPopup(popup.pipe(this.dimension, this.tilt));
        this.polyline.type = this.type;
        this.polyline.dimension = this.dimension;
        this.polyline.tilt = this.tilt;
    }
}

//SDFS
document.getElementById("printMateriallist").addEventListener('click', () => {
    window.print();
});

document.getElementById("backToMap").addEventListener('click', () => {
    document.location.href = "map.html?id=" + id;
});
