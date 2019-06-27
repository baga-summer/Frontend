/* global L, calculations, configuration, API */
export let isEdit = null;
let tempPolylineArray = [];

//Imports the map object
import { map, token, pumps, icons, projectInfo } from "./loadLeafletMap.js";

import { add, polylines, markers, polygons } from "./add.js";

import { show, mouseCoord } from "./show.js";

import { Marker, House, Pipe, mapId, setMapId, guideline } from "./classes.js";

export const edit = {

    /**
     * moveMarker - Moves a marker and connected polyline follows.
     *
     * @param {object} event
     * @returns {void}
     */
    moveMarker: (event) => {
        //get each polyline
        polylines.eachLayer((polyline) => {
            //check if polylines are connected to a marker, by first point and last point.
            if (event.target.id === polyline.connected_with.first) {
                //if polyline is connected with marker change lat lng to match marker
                let newLatlng = polyline.getLatLngs();

                newLatlng.shift();
                newLatlng.unshift(event.latlng);

                polyline.setLatLngs(newLatlng);
                polyline.decorator.setPaths(newLatlng);
            } else if (event.target.id === polyline.connected_with.last) {
                let newLatlng = polyline.getLatLngs();

                newLatlng.pop();
                newLatlng.push(event.latlng);

                polyline.setLatLngs(newLatlng);
                polyline.decorator.setPaths(newLatlng);
            }

            edit.warning.unsavedChanges(true);
        });
    },

    /**
     * polylines - Makes polylines editable by adding hooks and dragging.
     * library?
     *
     * @returns {void}
     */
    polylines: () => {
        polylines.eachLayer((polyline) => {
            polyline.editingDrag.addHooks();
            polyline.decorator.removeFrom(map);
            tempPolylineArray.push(polyline._latlngs.length);
        });

        edit.warning.unsavedChanges(true);
        isEdit = true;
    },

    /**
     * removeArrows - Removes the arrows when adding or editing pipes.
     *
     * @returns {void}
     */
    removeArrows: () => {
        polylines.eachLayer((polyline) => {
            polyline.decorator.removeFrom(map);
        });
    },

    /**
     * clearMapsEvents - Clear the map from events.
     *
     * @returns {void}
     */
    clearMapsEvents: () => {
        //Gets each polylines and removes the "editing hooks".
        polylines.eachLayer((polyline) => {
            polyline.decorator.addTo(map);
            polyline.decorator.setPaths(polyline._latlngs);
        });

        //Turn off click events for markers and polylines.
        map.off("click", add.marker);
        map.off('click', add.polygone);
        add.clearStartPolyline();

        //If polylines has been edited
        if (isEdit == true) {
            var i = 0;

            //For each element in polylines
            polylines.eachLayer(async (polyline) => {
                polyline.editingDrag.removeHooks();
                polyline.decorator.addTo(map);
                polyline.decorator.setPaths(polyline._latlngs);

                //If amount of points has changed
                if (polyline._latlngs.length != tempPolylineArray[i++]) {
                    polyline.elevation = await polyline.updateElevation(polyline._latlngs);
                    polyline.bindTooltip("Längd: " + Math.round(polyline.length * 100) /
                        100 + "m" + "<br>Statisk höjd: " +
                        (polyline.elevation.highest - polyline.elevation.first).toFixed(
                            1)
                    );
                }
            });
            isEdit = null;
            if (mouseCoord != null) {
                map.on('mousemove', show.mouseCoordOnMap);
            }
        }

        //Closes popups and turns off click events for remove and addPipe.
        map.closePopup();
        map.eachLayer((layer) => {
            if (layer._popup != null) { layer._popup.options.autoPan = true; }

            layer.off("click", edit.remove);
            layer.off("click", add.pipe);
        });
        document.getElementById("myMap").style.cursor = "grab";
        if (guideline != null) {
            polygons.eachLayer((polygon) => {
                polygon.stopDrawing();
            });
        }
    },

    /**
     * remove - Removes objects from the map.
     *
     * @param {object} event
     * @returns {void}
     */
    remove: (event) => {
        //Remove polylines, markers and polygons when clicked
        polylines.removeLayer(event.target);
        markers.removeLayer(event.target);
        polygons.removeLayer(event.target);

        edit.warning.unsavedChanges(true);
    },

    /**
     * notification - Gets status from response and then shows an appropriate
     * snackbar.
     *
     * @returns {void}
     */
    notification: (status) => {
        // Get the snackbar DIV
        let snackbar = document.getElementById("snackbar");

        if (status == "error") {
            snackbar.style.backgroundColor = "red";
            snackbar.innerHTML = "Sparandet misslyckades. Du har ingen internetuppkoppling";
        } else if (status == "error2") {
            snackbar.style.backgroundColor = "red";
            snackbar.innerHTML = "Sparandet misslyckades";
        } else if (status == "success") {
            snackbar.style.backgroundColor = "green";
            snackbar.innerHTML = "Sparad";
        }

        // Add the "show" class to DIV
        snackbar.className = "showSave";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function() {
            snackbar.className = snackbar.className.replace("showSave", "");
        }, 3000);
    },

    /**
     * notificationRead - Notifices the user has reading acces right.
     *
     * @returns {void}
     */
    notificationRead: () => {
        // Get the snackbar DIV
        let snackbar = document.getElementById("snackbar");

        snackbar.style.backgroundColor = "white";
        snackbar.style.color = "black";
        snackbar.innerHTML = "Du har läsbehörighet";

        // Add the "show" class to DIV
        snackbar.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function() {
            snackbar.className = snackbar.className.replace("show", "");
        }, 5000);
    },

    /**
     * notificationWrite - Notifices the user has write acccess right.
     *
     * @returns {void}
     */
    notificationWrite: () => {
        // Get the snackbar DIV
        let snackbar = document.getElementById("snackbar");

        snackbar.style.backgroundColor = "white";
        snackbar.style.color = "black";
        snackbar.innerHTML = "Du har skrivbehörighet";

        // Add the "show" class to DIV
        snackbar.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function() {
            snackbar.className = snackbar.className.replace("show", "");
        }, 5000);
    },

    /**
     * save - Saves the objects from the map in a json format.
     *
     * @param {string} version version number the user wants to save the project under
     * @returns {void}
     */
    save: async (version) => {
        let json = [];
        let temp;
        let status;

        temp = {
            zoom: map.getZoom(),
            center: map.getCenter(),
            mapId: mapId
        };

        json.push(temp);
        //Loop through all polylines and save them in a json format
        polylines.eachLayer((polyline) => {
            temp = {
                type: "polyline",
                data: {
                    coordinates: polyline._latlngs,
                    attributes: polyline.attributes,
                    connected_with: polyline.connected_with,
                    elevation: polyline.elevation,
                    length: polyline.length,
                    tilt: polyline.tilt,
                    material: polyline.material,
                    dimension: polyline.dimension,
                    pipeType: polyline.type,
                }
            };

            json.push(temp);
        });

        //Loop through all markers and save them in a json format
        markers.eachLayer((marker) => {
            temp = {
                type: "marker",
                data: {
                    coordinates: { lat: marker._latlng.lat, lng: marker._latlng.lng },
                    id: marker.id,
                    calculation: marker.calculation,
                    attributes: marker.attributes,
                }
            };

            json.push(temp);
        });

        polygons.eachLayer((polygon) => {
            temp = {
                type: "polygon",
                data: {
                    coordinates: polygon._latlngs,
                    id: polygon.id,
                    popup: {
                        address: polygon.address,
                        definition: polygon.definition,
                        nop: polygon.nop,
                        flow: polygon.flow,
                        color: polygon.options.color.replace('#', ''),
                    },
                    used: polygon.used,
                }
            };

            json.push(temp);
        });

        if (version == projectInfo.version) {
            let id = new URL(window.location.href).searchParams.get('id');

            let response = await API.post(
                `${configuration.apiURL}/proj/update/data/${id}?token=${token}`,
                'application/json', JSON.stringify(json));

            if (response[1] == "error") {
                edit.notification("error");
            } else if (response[0] == undefined) {
                edit.notification("error2");
            } else {
                edit.notification("success");
            }

            edit.warning.unsavedChanges(false);
        } else {
            projectInfo.version = version;

            let response = await API.post(
                `${configuration.apiURL}/proj/insert?token=${token}`,
                'application/json', JSON.stringify(projectInfo));

            let res = await API.post(
                `${configuration.apiURL}/proj/update/data/${response._id}?token=${token}`,
                'application/json', JSON.stringify(json));

            if (res[1] == "error") {
                status = "error";
            } else {
                status = "success";
            }

            edit.warning.unsavedChanges(false);
            document.location.href = `map.html?id=${response._id}&savestatus=${status}`;
        }
    },

    /**
         * load - Load objects(markers, polylines, polygons) to the map using json data.
         *
         * @returns {void}
         */
    load: (json) => {
        let icon;
        let newObj;
        let temp;

        map.setView(json[0].center, json[0].zoom);
        setMapId(json[0].mapId);

        //Loop through json data.
        for (let i = 1; i < json.length; i++) {
            switch (json[i].type) {
                //If marker add it to the map with its options
                case "marker":
                    icon = icons.find(element =>
                        element.category == json[i].data.attributes.Kategori);
                    json[i].data.icon = icon.icon;
                    newObj = new Marker(json[i].data);
                    break;
                    //If polyline
                case "polyline":
                    json[i].data.first = json[i].data.connected_with.first;

                    newObj = new Pipe(json[i].data);
                    json[i].data.last = json[i].data.connected_with.last;
                    json[i].data.coordinates = null;
                    newObj.draw(json[i].data);
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
    },

    /**
         * warning - Warning message object.
         *
         * @returns {void}
         */
    warning: {
        /**
             * unsavedChanges - Display a warning box when user tries to leave the page that some
             * 				  - information may not be saved if user exit the page.
             *				  - Uses window.onbeforeunload.
             * @returns {void}
             */
        unsavedChanges: (value) => {
            if (value) {
                window.onbeforeunload = () => {
                    return "Are you sure you want to navigate away?";
                };
            } else {
                window.onbeforeunload = () => {};
            }
        },

        pressure: async (element) => {
            let all = [];
            let total;
            let flow;

            if (element == null) { return false; }

            polylines.eachLayer((polyline) => {
                all.push(polyline);
            });
            markers.eachLayer((marker) => {
                all.push(marker);
            });
            polygons.eachLayer((polygon) => {
                all.push(polygon);
            });

            let first = all.find(find => find.id == element.connected_with.first);
            let last = all.find(find => find.id == element.connected_with.last);


            if (first != null) {
                switch (first.constructor) {
                    case L.Polygon:
                        if (first.used == false) {
                            last.calculation.nop += parseInt(first.nop);
                            flow = checkFlow(first.nop);
                            last.calculation.capacity = parseFloat(flow);
                            first.used = true;

                            checkBranchConnection(first, last);
                        }
                        calculateNextPolyline(last, 'first');
                        break;

                    case L.Marker:
                        if (first.calculation.capacity > 0) {
                            if (first.attributes.Kategori == "Pumpstationer") {
                                total = calculateTotalPressure(
                                    first.calculation.capacity,
                                    element.dimension.inner,
                                    element.length,
                                    element.tilt,
                                );

                                if (last instanceof L.Marker) {
                                    if (last.attributes.Kategori == "Förgrening" &&
                                            last.calculation.used == null) {
                                        last.calculation.nop +=
                                                parseInt(first.calculation.nop);

                                        let temp = polylines.getLayers();
                                        let connected = temp.filter(find => find.connected_with
                                            .last == last.id && find != element);

                                        if (connected != null) {
                                            connected = connected[0];
                                            temp = markers.getLayers();
                                            temp = temp.find(find => find.id == connected
                                                .connected_with.first);
                                            if (temp != null) {
                                                last.calculation.nop +=
                                                        parseInt(temp.calculation.nop);
                                            }
                                        }
                                        last.calculation.used = true;
                                        let next = findNextPolyline(last, 'first');

                                        temp = markers.getLayers();
                                        temp = temp.find(find => find.id == next.connected_with
                                            .last);
                                        if (temp != null) {
                                            temp.calculation.nop +=
                                                    parseInt(first.calculation.nop);
                                            let flow = checkFlow(temp.calculation.nop);

                                            temp.calculation.capacity = parseFloat(flow);
                                            calculateNextPolyline(temp, 'first');
                                        }
                                    }
                                }

                                calculateLast(first, last, pumps, total, element.dimension
                                    .inner);
                            } else if (first.attributes.Kategori == "Förgrening") {
                                let polyline = findNextPolyline(first, 'last');

                                let temp = markers.getLayers();
                                let find = temp.find(find =>
                                    find.id == polyline.connected_with.first);

                                if (find != null) {
                                    if (find.attributes.Kategori == "Pumpstationer") {
                                        edit.warning.pressure(polyline);
                                    }
                                }
                                last.calculation.nop = first.calculation.nop;
                                last.calculation.capacity = first.calculation.capacity;
                                calculateNextPolyline(last, 'first');
                            } else {
                                last.calculation.nop = first.calculation.nop;
                                last.calculation.capacity = first.calculation.capacity;
                                calculateNextPolyline(last, 'first');
                            }
                        } else {
                            resetMarkers(element);
                        }

                        break;
                }
            }
        }
    },
};


/**
 * calculateNextPolyline - if polyline is found run pressure function on new polyline
 *
 * @param {L.Marker} element element that is connected with polyline
 * @param {string}   value   determines if polyline is connected with first or last point
 */
export let calculateNextPolyline = (element, value) => {
    let find = findNextPolyline(element, value);

    if (find != null) {
        edit.warning.pressure(find);
    }
};

/**
 * findNextPolyline - return next connected polyline that are connected with element
 *
 * @param {L.Marker} element element that is connected with polyline
 * @param {string}   value   determines if polyline is connected with first or last point
 *
 * @returns {L.Polyline} if polyline is found
 * @returns {null}		 If polyline is not found
 */
export let findNextPolyline = (element, value) => {
    let temp = polylines.getLayers();

    return temp.find(find => find.connected_with[value] == element.id);
};

/**
 * resetMarkers - Removes warnings to pump and reset flow to zero
 * 				- Set last.used to undefined so houses can be connected again
 *
 * @param {L.polyline} element The polyline that we are examine
 *
 * @returns {void}
 */
export let resetMarkers = (element) => {
    let next;
    let temp = markers.getLayers();

    temp = temp.concat(polygons.getLayers());

    let first = temp.find(find => find.id == element.connected_with.first);
    let last = temp.find(find => find.id == element.connected_with.last);

    if (last != null && last instanceof L.Marker) {
        if (last.calculation.capacity > 0) {
            if (first != null) {
                if (first instanceof L.Polygon) {
                    last.calculation.nop -= parseInt(first.nop);
                    let flow = checkFlow(last.calculation.nop);

                    last.calculation.capacity = parseFloat(flow);
                } else if (first instanceof L.Marker) {
                    if (first.attributes.Kategori != "Förgrening") {
                        last.calculation.nop = 0;
                        last.calculation.capacity = 0;
                    } else {
                        last.calculation.nop = first.calculation.nop;
                        last.calculation.capacity = first.calculation.capacity;
                    }
                }
                next = findNextPolyline(last, 'first');
                edit.warning.pressure(next);
                show.hideAlert(last);
            }
        }
    }
};

/**
 * checkBranchConnection - checks if last point is a branch connection and increases number of
 * 						 - people if a pump with capacity is connected to the branch connection
 *
 * @param {type} last The element to check if it is a branch connection or not
 *
 * @returns {void}
 */
let checkBranchConnection = (first, last) => {
    if (last.attributes.Kategori == "Förgrening") {
        let next = findNextPolyline(last, 'first');
        let temp = markers.getLayers();


        let find = temp.find(find =>
            find.id == next.connected_with.last);

        if (last.calculation.used == null) {
            if (find != null && find.calculation.capacity > 0) {
                last.calculation.nop += find.calculation.nop;
                last.calculation.old = [{ id: find.id, nop: find.calculation.nop }];
                let flow = checkFlow(last.calculation.nop);


                last.calculation.capacity = parseFloat(flow);
                last.calculation.used = true;
            }
        }
    }
};

/**
 * calculateTotalPressure - Calculates total pressure by first calculate pressure loss by using
 * 						  - calculations.calcPressure function.
 * 						  - Secound calculation is total pressure.
 * 						  - Lastly we send back result with two decimals and in float form
 *
 * @param {float}  capacity  Amount of water
 * @param {string} dimension Inner dimension of selected pipe
 * @param {string} length    Total length of selected pipe
 * @param {string} height    Static height of selected pipe
 *
 * @returns {float} returns result from the calculations
 */
let calculateTotalPressure = (capacity, dimension, length, height) => {
    let mu = 0.1;
    let loss = calculations.calcPressure(
        parseFloat(capacity),
        parseFloat(mu),
        parseFloat(dimension),
        parseFloat(length)
    );

    loss *= 9.81;
    let result = calculations.totalPressure(parseFloat(loss), parseFloat(height));

    return parseFloat(result);
};


/**
 * calculateLast - Manage different scenarios on the last object that are connected to polyline
 * 				 - Biggest alteration is when the last object is a branch connection
 *
 * @param {L.Marker} first     The marker that have the pump inside it
 * @param {object}   last      The last object that we are handing in the switch case
 * @param {object}   pumps     All the pumps that the database have
 * @param {float} 	 total     total pressure that are calculated beforehand
 * @param {string} 	 dimension Inner dimension of the selected pipe
 *
 * @returns {void}
 */
let calculateLast = (first, last, pumps, total, dimension) => {
    let total2;
    let combinedPressure;
    let nextPolyline;

    switch (last.constructor) {
        case L.Marker:
            if (last.attributes.Kategori == "Pumpstationer") {
                last.calculation.nop = first.calculation.nop;
                last.calculation.capacity = first.calculation.capacity;
                getResults(first, pumps, total, dimension);
                calculateNextPolyline(last, 'first');
            } else if (last.attributes.Kategori == "Förgrening") {
                nextPolyline = findNextPolyline(last, 'first');
                if (last.calculation.old != null) {
                    let index = last.calculation.old.map((e) => { return e.id; }).indexOf(first.id);

                    if (index != -1) {
                        if (last.calculation.old[index].nop != first.calculation.nop) {
                            last.calculation.nop -= last.calculation.old[index].nop;
                            last.calculation.nop += first.calculation.nop;
                            last.calculation.old[index].nop = first.calculation.nop;
                            calculateNextPolyline(last, 'first');
                        }
                    }
                } else {
                    last.calculation.old = [];
                }

                getConnectedValues(first, last);


                let flow = checkFlow(last.calculation.nop);

                last.calculation.capacity = parseFloat(flow);

                total2 = calculateTotalPressure(
                    parseFloat(last.calculation.capacity),
                    parseFloat(nextPolyline.dimension.inner),
                    parseFloat(nextPolyline.length),
                    parseFloat(nextPolyline.tilt)
                );

                combinedPressure = parseFloat(total) + parseFloat(total2);
                getResults(first, pumps, combinedPressure, dimension);
            } else {
                getResults(first, pumps, total, dimension);
                last.calculation.nop = first.calculation.nop;
                last.calculation.capacity = first.calculation.capacity;
                calculateNextPolyline(last, 'first');
            }
            break;
        default:
            getResults(first, pumps, total, dimension);
    }
};

/**
 * getResults - Checks values against the pump curve by using the checkPump function
 *
 * @param {L.Marker} first     The marker that have the pump inside it
 * @param {object}   pumps     All the pumps that the database have
 * @param {float} 	 total     total pressure that are calculated beforehand
 * @param {string} 	 dimension Inner dimension of the selected pipe
 *
 * @returns {void}
 */
let getResults = (first, pumps, total, dimension) => {
    let result = {};
    let pump = pumps.find(element =>
        element.Modell == first.attributes.Pump);

    result.nop = first.calculation.nop;
    result.calculations = checkPump(pump, total, parseFloat(dimension));
    result.totalPressure = total;
    result.capacity = first.calculation.capacity;
    first.calculation.status = result.calculations.status;
    show.alert(first, result);
};

/**
 * getConnectedValues - adds all connected pipes to calculation.old attribute so that if new values
 * 					  - are added branch connection are updated with correct values
 *
 * @param {type} first first object connected to polyline
 * @param {type} last  last object connected to polyline
 *
 * @returns {void}
 */
let getConnectedValues = (first, last) => {
    let temp = polylines.getLayers();
    let connected = temp.filter(find => find.connected_with.last == last.id && find != first);

    temp = markers.getLayers();

    for (let i = 0; i < connected.length; i++) {
        let tempMarker = temp.find(find => find.id == connected[i].connected_with.first);

        if (tempMarker != null) {
            let index = last.calculation.old.map((e) => {
                return e.id;
            }).indexOf(tempMarker.id);

            if (index == -1) {
                last.calculation.old.push({
                    id: tempMarker.id,
                    nop: tempMarker.calculation.nop
                });
            }
        }
    }
};

/**
 * checkPump - Recommends pumps according to calculations.
 *
 * @param {object} pump     Selected pump to examine
 * @param {number} pressure total pressure from previous calculations
 * @param {number} dim 		Inner dimension of the selected pipe
 *
 * @returns {void}
 */
let checkPump = (pump, pressure, dim) => {
    let found = false;
    let mps = 0;
    let result = {};

    for (let i = 0; i < pump.Pumpkurva.length; i++) {
        if (pump.Pumpkurva[i].y == pressure) {
            mps = calculations.calcVelocity(pump.Pumpkurva[i].x, dim);
            mps /= 1000;
            result.mps = mps;
            if (mps >= 0.6 && mps <= 3) {
                result.status = 0;
                found = true;
                break;
            } else if (mps < 0.6) {
                result.status = 1;
                break;
            } else if (mps > 3) {
                result.status = 2;
                break;
            }
        }
    }
    if (!found) {
        if (pressure < pump.Pumpkurva[0].y && pressure >
            pump.Pumpkurva[pump.Pumpkurva.length - 1].y) {
            mps = calculations.calcVelocity(calculations.estPumpValue(pressure,
                pump.Pumpkurva), dim);
            mps /= 1000;
            result.mps = mps;
            if (mps >= 0.6 && mps <= 3) {
                result.status = 0;
                found = true;
            } else if (mps < 0.6) {
                result.status = 1;
            } else if (mps > 3) {
                result.status = 2;
            }
        } else if (pressure > pump.Pumpkurva[0].y) {
            mps = calculations.calcVelocity(calculations.estPumpValue(pressure,
                pump.Pumpkurva), dim);
            mps /= 1000;
            result.mps = mps;
            result.status = 3;
        } else if (pressure < pump.Pumpkurva[pump.Pumpkurva.length - 1].y) {
            mps = calculations.calcVelocity(calculations.estPumpValue(pressure,
                pump.Pumpkurva), dim);
            mps /= 1000;
            result.mps = mps;
            result.status = 4;
        }
        found = false;
    }
    return result;
};

/**
 * checkFlow - Checks flow according to number of people in a sewage system.
 *
 * @param {object} nop   The number of people
 * @param {number} flow  The water flow
 *
 * @returns {number} flow according to number of people
 */
export let checkFlow = (nop) => {
    let nrOf = parseFloat(nop);
    let flow = 0;

    if (nrOf == 0) {
        flow = 0;
    } else if (nrOf <= 10 && nrOf > 0) {
        flow = 0.7;
    } else if (nrOf <= 20 && nrOf > 10) {
        flow = 0.9;
    } else if (nrOf <= 30 && nrOf > 20) {
        flow = 1.1;
    } else if (nrOf <= 40 && nrOf > 30) {
        flow = 1.3;
    } else if (nrOf <= 50 && nrOf > 40) {
        flow = 1.5;
    } else if (nrOf <= 60 && nrOf > 50) {
        flow = 1.6;
    } else if (nrOf <= 70 && nrOf > 60) {
        flow = 1.7;
    } else if (nrOf <= 80 && nrOf > 70) {
        flow = 1.8;
    } else if (nrOf <= 90 && nrOf > 80) {
        flow = 1.9;
    } else if (nrOf <= 100 && nrOf > 90) {
        flow = 2;
    } else if (nrOf <= 200 && nrOf > 100) {
        flow = 3;
    } else if (nrOf <= 300 && nrOf > 200) {
        flow = 4;
    } else if (nrOf <= 400 && nrOf > 300) {
        flow = 4.9;
    } else if (nrOf <= 500 && nrOf > 400) {
        flow = 5.4;
    } else if (nrOf <= 600 && nrOf > 500) {
        flow = 6;
    } else if (nrOf <= 700 && nrOf > 600) {
        flow = 6.7;
    } else if (nrOf <= 800 && nrOf > 700) {
        flow = 7;
    } else if (nrOf <= 900 && nrOf > 800) {
        flow = 7.7;
    } else if (nrOf <= 1000 && nrOf > 900) {
        flow = 8;
    }

    return flow / 1000;
};
