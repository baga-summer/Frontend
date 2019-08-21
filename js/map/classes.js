/*global L API*/
import { map, projectInfo, objectData, icons } from "./loadLeafletMap.js";

import { popup } from "./popup.js";

import { options } from "./options.js";

import { polylines, markers, polygons, add, getLength, clearHouse } from "./add.js";

import { edit, calculateNextPolyline, findNextPolyline, resetMarkers, lists } from "./edit.js";

import { show, mouseCoord } from "./show.js";

import { key } from "./getKey.js";

import { pipes } from "./pipes.js";

export let guideline = null;
export let mapId = 0;
let lastUsedPipeValues = { type: "PEM", innerdim: "35.2 mm", outerdim: "40 mm", strokeWeight: "2" };

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
        this.marker = new L.Marker(data.coordinates, options.marker(data.icon))
            .on("dragend", this.dragEnd)
            .on("drag", edit.moveMarker)
            .on('popupopen', this.updateCoords)
            .on('popupclose', this.resetPipeColor)
            .on('remove', this.onRemove);

        if (data.id != null) {
            this.marker.id = data.id;
        } else {
            this.marker.id = mapId++;
        }
        this.marker.attributes = this.attributes;
        (async () => {
            let elevation = await this.getElevation({
                target: this.marker,
                latlngs: data.coordinates
            });

            this.marker.attributes.id = this.marker.id;
            this.marker.elevation = elevation;
            this.marker.attributes["M ö.h"] = elevation;
            if (this.marker.attributes.Kategori != "Förgrening") {
                this.marker.bindPopup(
                    popup.marker(this.marker.attributes, objectData) +
                    popup.changeCoord(data.coordinates));
            }
        })();


        this.marker.updateElevation = async (event) => { return await this.getElevation(event); };
        this.marker.disableDragging = () => { this.marker.dragging.disable(); return this.marker; };
        this.marker.enableDragging = () => { this.marker.dragging.enable(); };

        if (data.calculation) {
            this.marker.calculation = data.calculation;
        } else {
            this.marker.calculation = {};
            this.marker.calculation.capacity = 0;
            this.marker.calculation.nop = 0;
            this.marker.calculation.used = null;
        }


        // Add marker to markers layer
        markers.addLayer(this.marker).addTo(map);
        this.marker._icon.classList.add("transparent-border");


        if (data.calculation) {
            if (data.calculation.status == 1) {
                this.marker._icon.classList.add('warning-icon');
                this.marker._icon.classList.remove('transparent-border');
            } else if (data.calculation.status == 2) {
                this.marker._icon.classList.add('warning-icon');
                this.marker._icon.classList.remove('transparent-border');
            } else if (data.calculation.status == 3) {
                this.marker._icon.classList.add('alert-icon');
                this.marker._icon.classList.remove('transparent-border');
            } else if (data.calculation.status == 4) {
                this.marker._icon.classList.add('alert-icon');
                this.marker._icon.classList.remove('transparent-border');
            }
        }
    }

    /**
     * resetPipeColor - reset pipe colors to original colors
     *
     * @param {type} event
     *
     * @returns {void}
     */
    resetPipeColor(event) {
        if (event.target.calculation.listIndex != null) {
            let index = event.target.calculation.listIndex;
            let all = markers.getLayers();

            if (index instanceof Array) {
                for (let i = 0; i < index.length - 1; i++) {
                    if (lists[index[i]].ready) {
                        let curr = lists[index[i]].pumpstation.element;

                        show.pumpDistance(lists[index[i]], curr, all, polylines.getLayers(), true);
                    }
                }
                index = index[index.length - 1];
            }

            if (lists[index].ready) {
                let current = lists[index].pumpstation.element;

                show.pumpDistance(lists[index], current, all, polylines.getLayers(), true);
            }
        }
    }

    /**
     * updateCoords - Updates markers coordinates from user input and updates popup content with
     * 			 	- the new coordinates
     *updateElevation
     * @param {object} event
     *
     * @returns {void}
     */
    updateCoords(event) {
        if (event.target.calculation.listIndex != null) {
            let index = event.target.calculation.listIndex;
            let all = markers.getLayers();

            if (index instanceof Array) {
                for (let i = 0; i < index.length - 1; i++) {
                    if (lists[index[i]].ready) {
                        let list = lists[index[i]];
                        let curr = list.pumpstation.element;

                        if (event.target.id == curr.id ||
                            event.target.id == list.end.element.id &&
                            event.target.attributes.Kategori != "Pumpstationer") {
                            show.pumpDistance(list, curr, all, polylines.getLayers(), false);
                        }
                    }
                }
                index = index[index.length - 1];
            }

            if (lists[index].ready) {
                let list = lists[index];
                let current = lists[index].pumpstation.element;

                if (event.target.id == current.id ||
                    event.target.id == list.end.element.id &&
                    event.target.attributes.Kategori != "Pumpstationer") {
                    show.pumpDistance(list, current, all, polylines.getLayers(), false);
                }
            }
        }

        // Get button after popup is open
        let buttons = document.getElementsByClassName('sendCoords');

        // Add event listener on click on button
        buttons[buttons.length - 1].addEventListener('click', () => {
            // Get new values after click
            let latLng = L.latLng(
                parseFloat(document.getElementById('latitud').value),
                parseFloat(document.getElementById('longitud').value)
            );
            let pumpingStations = document.getElementById('pumpingStation').value;

            if (pumpingStations != event.target.attributes.Modell) {
                let first = findNextPolyline(event.target, "first");
                let last = findNextPolyline(event.target, "last");
                let icon = icons.find(element => element.category == "Pumpstationer");
                let object;

                markers.removeLayer(event.target);

                for (let i = 0; i < objectData.length; i++) {
                    if (pumpingStations == objectData[i].Modell) {
                        object = objectData[i];
                        break;
                    }
                }
                object.calculation = event.target.attributes.calculation;

                let newObj = new Marker({
                    coordinates: event.target._latlng,
                    attributes: object,
                    icon: icon.icon
                });

                if (first != null && last != null) {
                    let distanceMin = Infinity;
                    let segmentMin = null;
                    let firstLatlngs;
                    let secondLatlngs;

                    for (let i = 0; i < last._latlngs.length - 1; i++) {
                        let segment = [last._latlngs[i], last._latlngs[i + 1]];
                        let distance = L.GeometryUtil.distanceSegment(map, event.target._latlng,
                            segment[0], segment[1]);

                        if (distance < distanceMin) {
                            distanceMin = distance;
                            segmentMin = segment;
                        }
                    }

                    firstLatlngs = last._latlngs.splice(0, last._latlngs.indexOf(
                        segmentMin[0]) + 1);
                    secondLatlngs = last._latlngs.splice(last._latlngs.indexOf(segmentMin[1]),
                        last._latlngs.length);

                    firstLatlngs.push(event.target._latlng);

                    let newPipe = new Pipe({
                        coordinates: firstLatlngs,
                        attributes: [""],
                        pipeType: first.type,
                        first: last.connected_with.first,
                    });

                    newPipe.draw({
                        last: newObj.marker.id,
                        elevation: first.elevation,
                        material: first.material,
                        dimension: first.dimension,
                        tilt: first.tilt,
                    });


                    let temp = polygons.getLayers();
                    let find = temp.find(find => find.id == last.connected_with.first);

                    if (find != null) {
                        find.used = false;
                    }

                    last.connected_with.first = newObj.marker.id;

                    secondLatlngs.unshift(event.target._latlng);
                    last.setLatLngs(secondLatlngs);
                    last.decorator.setPaths(secondLatlngs);
                } else if (first != null) {
                    let newPipe = new Pipe({
                        coordinates: first._latlngs,
                        attributes: [""],
                        pipeType: first.type,
                        first: newObj.marker.id,
                    });

                    newPipe.draw({
                        last: first.connected_with.last,
                        elevation: first.elevation,
                        material: first.material,
                        dimension: first.dimension,
                        tilt: first.tilt,
                    });
                } else if (last != null) {
                    let newPipe = new Pipe({
                        coordinates: last._latlngs,
                        attributes: [""],
                        pipeType: last.type,
                        first: last.connected_with.first
                    });

                    newPipe.draw({
                        last: newObj.marker.id,
                        elevation: last.elevation,
                        material: last.material,
                        dimension: last.dimension,
                        tilt: last.tilt,
                    });
                }

                calculateNextPolyline(newObj.marker, 'last');
                calculateNextPolyline(newObj.marker, 'first');
            } else {
                // Close active popup
                event.target.closePopup();
                // Insert new values to active marker
                event.target.setLatLng(latLng);
                // Move center to map to new values (coordinates)
                map.panTo(latLng);

                //get each polyline
                polylines.eachLayer((polyline) => {
                    //check if polylines are connected to a marker, by first point and last point.
                    if (event.target.id === polyline.connected_with.first) {
                        //if polyline is connected with marker change lat lng to match marker
                        let newLatlng = polyline.getLatLngs();

                        newLatlng.shift();
                        newLatlng.unshift(latLng);

                        polyline.setLatLngs(newLatlng);
                        polyline.decorator.setPaths(newLatlng);
                    } else if (event.target.id === polyline.connected_with.last) {
                        let newLatlng = polyline.getLatLngs();

                        newLatlng.pop();
                        newLatlng.push(latLng);

                        polyline.setLatLngs(newLatlng);
                        polyline.decorator.setPaths(newLatlng);
                    }
                });
                // Update popup content with new values
                event.target.attributes.id = event.target.id;
                event.target.setPopupContent(popup.marker(this.attributes, objectData) +
                    popup.changeCoord(latLng));
            }
        });
    }

    /**
     * dragEnd - Update elevation values for marker and connected polylines when user stop dragging
     *
     * @param {type} event
     *
     * @returns {void}
     */
    dragEnd(event) {
        (async () => {
            event.target.elevation = await event.target.updateElevation(event);
            event.target.attributes.id = event.target.id;
            event.target.attributes["M ö.h"] = event.target.elevation;
            event.target.setPopupContent(popup.marker(event.target.attributes, objectData) +
                popup.changeCoord(event.target._latlng));
        })();
        //get each polyline
        polylines.eachLayer(async (polyline) => {
            //check if polylines are connected to a marker, by first point and last point.
            if (event.target.id === polyline.connected_with.first) {
                //Calculates new length of pipe
                polyline.length = getLength(polyline._latlngs);
                edit.warning.pressure(polyline);
                //update elevation for polyline
                polyline.elevation = await polyline.updateElevation(polyline._latlngs);
            } else if (event.target.id === polyline.connected_with.last) {
                //Calculates new length of pipe
                polyline.length = getLength(polyline._latlngs);
                edit.warning.pressure(polyline);
                //update elevation for polyline
                polyline.elevation = await polyline.updateElevation(polyline._latlngs);
            }
        });
    }

    /**
     * getElevation - Gets elevation on a location using Google elevation API.
     *
     * @param {event} event
     *
     * @returns {void}
     **/
    async getElevation(event) {
        let latlngString = "";

        latlngString = event.target._latlng.lat + "," + event.target._latlng.lng;

        let url = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com" +
            "/maps/api/elevation/json?locations=" + latlngString + "&key=" + key;

        let response = await API.get(url);

        if (response.results[0] == undefined) {
            return 0;
        } else {
            if (event.target.attributes.Kategori != "Förgrening") {
                return response.results[0].elevation.toFixed(2);
            }
        }
    }

    /**
     * onRemove - When removing a connected marker make connected polylines into one instead
     *
     * @returns {void}
     */
    onRemove() {
        let temp = polylines.getLayers();
        let firstPolyline = temp.filter(find => find.connected_with.last == this.id);
        let lastPolyline = temp.filter(find => find.connected_with.first == this.id);

        if (this.calculation.listIndex != null) {
            let index = this.calculation.listIndex;

            if (index instanceof Array) {
                for (let i = 0; i < index.length - 1; i++) {
                    let list = lists[index[i]];

                    list.remove(list.indexOf(this.id));
                }
                index = index[index.length - 1];
            }

            let list = lists[index];

            list.remove(list.indexOf(this.id));
            show.hideAlert(this);
        }

        if (firstPolyline.length > 0 && lastPolyline.length > 0) {
            let restOf = [];

            for (let i = 1; i < firstPolyline.length; i++) {
                restOf.push(firstPolyline[i]);
            }

            lastPolyline = lastPolyline[0];
            let newLatlngs = firstPolyline[0]._latlngs;

            newLatlngs.pop();
            lastPolyline._latlngs.shift();

            for (let i = 0; i < lastPolyline._latlngs.length; i++) {
                newLatlngs.push(lastPolyline._latlngs[i]);
            }

            firstPolyline[0].setLatLngs(newLatlngs);
            firstPolyline[0].connected_with.last = lastPolyline.connected_with.last;

            lastPolyline.connected_with.first = null;
            lastPolyline.connected_with.last = null;
            polylines.removeLayer(lastPolyline);
            for (let i = 0; i < restOf.length; i++) {
                polylines.removeLayer(restOf[i]);
            }

            edit.warning.pressure(firstPolyline[0]);
        } else if (firstPolyline.length > 0) {
            for (let i = 0; i < firstPolyline.length; i++) {
                polylines.removeLayer(firstPolyline[i]);
            }
        } else {
            if (lastPolyline.length > 0) {
                for (let i = 0; i < lastPolyline.length; i++) {
                    polylines.removeLayer(lastPolyline[i]);
                }
            }
        }
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
        this.polygon.calculation = { used: false };
        this.polygon.on('popupclose', this.resetPipeColor);
        this.polygon.on('remove', () => {
            let lastPolyline = findNextPolyline(this.polygon, 'first');

            if (lastPolyline != null) {
                polylines.removeLayer(lastPolyline);
            }
        });

        if (data.id == null) {
            this.polygon.id = mapId++;
        }

        guideline = L.polyline([data.coordinates, data.coordinates], {
            dashArray: '5, 10'
        }).addTo(map);

        map.on('mousemove', this.updateGuideLine);
        this.stopDrawListener();
    }

    /**
     * draw - Adds new point with coordinates and displays polygon on map.
     * 		- Updates guideline start position to new coordinates
     *
     * @param {array} latlng Coordinates (latitude and longitude) for the new point in polygon
     *
     * @returns {void}
     */
    draw(latlng) {
        this.polygon.addLatLng(latlng);
        polygons.addLayer(this.polygon).addTo(map);

        let coord = guideline.getLatLngs();

        coord.shift();
        coord.unshift(latlng);
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
        this.polygon.calculation = data.calculation;
        this.completed = true;

        map.off('mousemove', this.updateGuideLine);
        this.polygon.on('popupopen', this.updateValues);
        this.polygon.on('remove', () => {
            let lastPolyline = findNextPolyline(this.polygon, 'first');

            if (lastPolyline != null) {
                polylines.removeLayer(lastPolyline);
            }
        });
        guideline.remove();
    }

    /**
     * updateGuideLine - update the guideline coordinates to mouse coordinates
     * 				   - from mousemove.
     *
     * @param {object} event
     * @returns {void}
     *
     **/
    updateGuideLine(event) {
        let coord = guideline.getLatLngs();

        coord.pop();
        coord.push(event.latlng);
        guideline.setLatLngs(coord);
    }

    /**
     * stopDrawListener - When user clicks the 'esc' button
     * 					- hides guideline and stops adding points to house object on click and
     * 					- adds popup content for house with address.
     * 					- Click event listener runs once
     * @returns {void}
     */
    stopDrawListener() {
        // start function when user on keyup
        document.addEventListener("keyup", (event) => {
            // If user keyup is key 'esc'
            if (event.keyCode == 27) {
                if (guideline != null && this.polygon != null && this.completed == false) {
                    this.completed = true;
                    let addr;

                    L.esri.Geocoding.reverseGeocode()
                        .latlng(this.polygon._latlngs[0][0])
                        .run((error, result) => {
                            addr = result.address.Match_addr;

                            this.polygon.bindPopup(popup.house(
                                addr,
                                "Hus",
                                projectInfo.default.peoplePerHouse,
                                projectInfo.default.litrePerPerson,
                                "#3388ff",
                            ));

                            this.polygon.address = addr;
                        });

                    this.polygon.definition = "Hus";
                    this.polygon.nop = projectInfo.default.peoplePerHouse;
                    this.polygon.flow = projectInfo.default.litrePerPerson;
                    this.polygon.on('popupopen', this.updateValues);
                    map.off('mousemove', this.updateGuideLine);
                    guideline.remove();
                    clearHouse();
                }
            }
        }), { once: true };
    }

    /**
     * resetPipeColor - reset pipe colors to original colors
     *
     * @param {type} event
     *
     * @returns {void}
     */
    resetPipeColor(event) {
        if (event.target.calculation.listIndex != null) {
            let index = event.target.calculation.listIndex;

            if (lists[index].ready) {
                let all = markers.getLayers();

                all = all.concat(polygons.getLayers());

                show.pumpDistance(lists[index], event.target, all, polylines.getLayers(), true);
            }
        }
    }

    /**
     * updateValues - Updates house values from user input and updates popup content with
     * 			 	- the new values
     *
     * @param {object} event
     *
     * @returns {void}
     */
    updateValues(event) {
        // Get button after popup is open
        let buttons = document.getElementsByClassName('updateValuesInHouse');


        if (event.target.calculation.listIndex != null) {
            let index = event.target.calculation.listIndex;

            if (lists[index].ready) {
                let all = markers.getLayers().concat(polygons.getLayers());

                show.pumpDistance(lists[index], event.target, all, polylines.getLayers(), false);
            }
        }

        // Add event listener on click on button
        buttons[buttons.length - 1].addEventListener('click', () => {
            // Get new values after click
            let addr = document.getElementById('address').innerHTML;
            let type = document.getElementById('houseType').value;
            let newColor = document.getElementById('houseColor').value;
            let nop = document.getElementById('per').value;
            let flow = document.getElementById('cons').value;

            // Close active popup
            event.target.closePopup();

            event.target.setStyle({
                color: newColor,
                fillColor: newColor,
                fillOpacity: 0.5,
                weight: 1.5
            });

            event.target.nop = nop;
            event.target.flow = flow;
            event.target.definition = type;
            // Update popup content with new values
            event.target.setPopupContent(popup.house(addr, type, nop, flow, newColor));
            calculateNextPolyline(event.target, 'first');
        }), { once: true };
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
     * @param {null} [data.dimension=null]			Option to add preconfigured dimension
     * @param {null} [tilt=null]      	Option to add preconfigured tilt
     *
     * @returns {void}
     **/
    async draw(data) {
        this.last = data.last;
        if (data.coordinates != null) { this.latlngs.push(data.coordinates); }

        if (data.material == null && data.dimension == null && data.tilt == null) {
            show.openModal(document.getElementById('pipeModal'));
            let elem = document.getElementsByClassName("material")[0];

            pipes.listen(elem, lastUsedPipeValues);

            this.elevation = await this.getElevation(this.latlngs);

            document.getElementById('tilt').value = (this.elevation.highest - this.elevation.first)
                .toFixed(1);
            document.getElementById('elevation').style.display = 'block';
            document.getElementById('loading').style.display = 'none';

            document.getElementById("pipeSpecifications").eventObject = this;

            document.getElementById("pipeSpecifications")
                .addEventListener('click', this.savePipeValues, { once: true });
        } else {
            this.elevation = data.elevation;
            this.material = data.material;
            this.dimension = data.dimension;
            this.tilt = data.tilt;

            this.createPolyline();
        }
    }

    /**
     * createPolyline - Creates a new polyline depending on what type is choosen with preconfigured
     * 				  - options, popup, length, dimension and tilt. Lastly add the new created
     * 				  - polyline to map
     *
     * @returns {void}
     */
    async createPolyline() {
        if (this.type == 0) {
            this.polyline = new L.polyline(this.latlngs, options.pipe(this.dimension.strokeWeight));

            this.polyline.decorator = L.polylineDecorator(this.polyline, {
                patterns: [{
                    offset: '50%',
                    repeat: 0,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 15,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: '#004377'
                        }
                    })
                }]
            }).addTo(map);
        } else if (this.type == 1) {
            this.polyline =
                new L.polyline(this.latlngs, options.stemPipe(this.dimension.strokeWeight));

            this.polyline.decorator = L.polylineDecorator(this.polyline, {
                patterns: [{
                    offset: '50%',
                    repeat: 0,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 15,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: '#004377'
                        }
                    })
                }]
            }).addTo(map);
        }

        this.polyline.connected_with = {
            first: this.first,
            last: this.last
        };
        polylines.addLayer(this.polyline).addTo(map);
        this.polyline.bindPopup(popup.pipe((this.elevation.highest - this.elevation.first)
            .toFixed(1)));
        this.polyline.length = getLength(this.latlngs);
        this.polyline.elevation = this.elevation;
        this.polyline.updateElevation = async (latlngs) => {
            let elevation = await this.getElevation(latlngs);

            this.polyline.bindPopup(popup.pipe((elevation.highest - elevation.first).toFixed(
                1)));
            return elevation;
        };
        this.polyline.type = this.type;
        this.polyline.material = this.material;
        this.polyline.dimension = this.dimension;
        this.polyline.tilt = this.tilt;
        this.polyline.decorator.on('click', (event) => this.polyline.openPopup(event._latlng));
        this.polyline.on('click', add.pipe);
        this.polyline.on('popupopen', this.updateValues);
        this.polyline.on('remove', this.onRemove);
        this.polyline.editingDrag.removeHooks();
        if (mouseCoord != null) {
            map.on('mousemove', show.mouseCoordOnMap);
        }
    }

    /**
     * savePipeValues - Description
     *
     * @returns {type} Description
     */
    savePipeValues() {
        document.getElementById("pipeModal").style.display = "none";
        document.getElementById("elevation").style.display = "none";
        document.getElementById('loading').style.display = 'block';
        this.eventObject.material = document.getElementsByClassName('material')[0].value;
        let value = document.getElementsByClassName("dimension")[0].value;

        value = value.split(",");
        this.eventObject.dimension = {
            inner: value[0],
            outer: value[1],
            strokeWeight: value[2],
        };
        this.eventObject.tilt = document.getElementById("tilt").value;


        lastUsedPipeValues = {
            type: this.eventObject.material,
            innerdim: this.eventObject.dimension.inner,
            outerdim: this.eventObject.dimension.outer,
            strokeWeight: this.eventObject.dimension.strokeWeight
        };

        this.eventObject.createPolyline();
        edit.warning.pressure(this.eventObject.polyline);
        add.clearStartPolyline();
    }

    /**
     * updateValues - Updates pipe values from user input and updates popup content with
     * 			 	- the new values
     *
     * @param {object} event
     *
     * @returns {void}
     */
    updateValues(event) {
        // Get button after popup is open
        let button = document.getElementById('pipeSpecifications');
        let material = document.getElementsByClassName("materialPopup");

        material = material[material.length - 1];
        pipes.listen(material, lastUsedPipeValues);
        material.value = event.target.material;
        material.dispatchEvent(new Event('change'));

        let dimension = document.getElementsByClassName("dimension");

        dimension = dimension[dimension.length - 1];

        for (let i = 0; i < dimension.options.length; i++) {
            if (dimension.options[i].text == event.target.dimension.outer) {
                dimension.options[i] = null;
                break;
            }
        }

        let option = document.createElement("option");

        option.text = event.target.dimension.outer;
        option.value =
            `${event.target.dimension.inner},
			${event.target.dimension.outer},
			${event.target.dimension.strokeWeight}`;

        dimension.add(option, 0);

        dimension.options[0].selected = "selected";


        // Add event listener on click on button
        button.addEventListener('click', () => {
            // Get new value after click
            let tilt = document.getElementById('tilt').value;
            let material = document.getElementsByClassName("materialPopup");
            let dimension = document.getElementsByClassName("dimension");

            material = material[material.length - 1];
            dimension = dimension[dimension.length - 1];
            dimension = dimension.value.split(",");
            event.target.dimension = {
                inner: dimension[0],
                outer: dimension[1],
                strokeWeight: dimension[2]
            };


            event.target.tilt = tilt;
            event.target.material = material.value;

            // Close active popup
            event.target.closePopup();

            // Update popup content with new values
            event.target.setPopupContent(popup.pipe(tilt));
            if (event.target.type == 0) {
                event.target.setStyle(options.pipe(event.target.dimension.strokeWeight));
            } else {
                event.target.setStyle(options.stemPipe(event.target.dimension.strokeWeight));
            }
            edit.warning.pressure(event.target);
        }), { once: true };
    }

    /**
     * getElevation - Gets elevation along a path using Google elevation API.
     *
     * @returns {object} elevationObj
     **/
    async getElevation(latlngs) {
        let latlngsArray = [];
        let elevationObj = {};
        let samples = 0;
        let highestElevation;
        let lowestElevation;
        let firstElevation;
        let lastElevation;

        for (var i = 0; i < latlngs.length; i++) {
            latlngsArray.push(latlngs[i].lat + "," + latlngs[i].lng);
        }
        latlngsArray = latlngsArray.join('|');
        if (Math.round(getLength(latlngs) / 2) > 500) {
            samples = 500;
        } else {
            samples = Math.round(getLength(latlngs) / 2);
        }

        let url = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com" +
            "/maps/api/elevation/json?path=" + latlngsArray + "&samples=" +
            samples + "&key=" + key;

        let response = await API.get(url);

        if (response.results[0] == undefined) {
            highestElevation = 0;
            lowestElevation = 0;
            firstElevation = 0;
            lastElevation = 0;
        } else {
            highestElevation = Math.max(...response.results.map(o => o.elevation), 0);
            lowestElevation = Math.min(...response.results.map(o => o.elevation));
            firstElevation = response.results[0].elevation;
            lastElevation = response.results[response.results.length - 1].elevation;
        }

        elevationObj = {
            highest: highestElevation,
            lowest: lowestElevation,
            first: firstElevation,
            last: lastElevation
        };

        return elevationObj;
    }

    /**
     * onRemove - When removing a connected pipe remove connecteded markers warning
     * 			- Removes selected polyline decorator (arrow) too
     * 			- if first is connected to house -> reset house
     *
     * @returns {void}
     */
    onRemove() {
        let temp = markers.getLayers();

        temp.concat(polygons.getLayers());

        let first = temp.find(find => find.id == this.connected_with.first);
        let last = temp.find(find => find.id == this.connected_with.last);

        if (first != null || last != null) {
            resetMarkers(this);
        }

        this.decorator.remove();
    }
}

/**
 * setMapId - Set value to mapId from load function
 *
 * @param {type} value
 *
 * @returns {void}
 */
export let setMapId = (value) => {
    mapId = value;
};
