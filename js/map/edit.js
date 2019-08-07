/* global L, calculations, configuration, API */
export let isEdit = null;
let tempPolylineArray = [];

export let lists = [];

//Imports the map object
import { map, token, pumps, icons, projectInfo } from "./loadLeafletMap.js";

import { add, polylines, markers, polygons } from "./add.js";

import { show, mouseCoord } from "./show.js";

import { Marker, House, Pipe, mapId, setMapId, } from "./classes.js";

import { StartData, PumpstationData, BranchConnData, DefaultData } from "./calculationClasses.js";

import { LinkedList } from "./linkedList.js";

import { Graph, Queue } from "./graph.js";


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
        let listData = [];

        for (let i = 0; i < lists.length; i++) {
            listData.push(lists[i].getAll());
        }

        temp = {
            zoom: map.getZoom(),
            center: map.getCenter(),
            mapId: mapId,
            lists: listData,
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
                    used: polygon.calculation.used,
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
        for (let i = 0; i < json[0].lists.length; i++) {
            let list = new LinkedList;

            for (let j = 0; j < json[0].lists[i].length; j++) {
                list.add(json[0].lists[i][j]);
            }
            lists.push(list);
        }

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
            let allPolylines = [];
            let checkbox = document.getElementById('toggleCalculations');

            if (element == null || checkbox.checked == false) { return false; }

            polylines.eachLayer((polyline) => {
                all.push(polyline);
                allPolylines.push(polyline);
            });
            markers.eachLayer((marker) => { all.push(marker); });
            polygons.eachLayer((polygon) => { all.push(polygon); });

            let first = all.find(find => find.id == element.connected_with.first);
            let last = all.find(find => find.id == element.connected_with.last);
            let list;
            let index;
            let temp;

            switch (first.constructor) {
                case L.Polygon:
                    if (first.calculation.used == false) {
                        first.calculation.used = true;

                        let current = new StartData(first.id);

                        temp = findMyList(first, last);

                        list = temp.list;
                        index = temp.index;
                        first.calculation.listIndex = index;

                        list.add(current.data);
                        checkNextList(list, true, all, allPolylines);
                    }
                    break;

                case L.Marker:
                    temp = findMyList(first, last);

                    list = temp.list;
                    index = temp.index;

                    if (list.ready && !last.calculation.used) {
                        temp = beginNewList(
                            list.pumpstation.id,
                            first.id,
                            all,
                            allPolylines,
                            list);

                        list = temp.list;
                        index = temp.index;
                        addMarkerToList(first, list);
                        first.calculation.listIndex = index;
                    }

                    if (first.calculation.used == null) {
                        first.calculation.used = true;
                        first.calculation.listIndex = index;
                        addMarkerToList(first, list);
                    }
                    break;
            }
            if (list != null) {
                switch (last.constructor) {
                    case L.Marker:
                        if (last.calculation.used == null) {
                            last.calculation.used = true;
                            last.calculation.listIndex = index;
                            addMarkerToList(last, list);
                        } else {
                            if (list instanceof Array) {
                                if (list[0] != list[1]) {
                                    if (!list[0].end.status && list[0].pumpstation) {
                                        if (last instanceof L.Marker) {
                                            if (last.attributes != "Förgrening") {
                                                addMarkerToList(last, list[0]);
                                                temp = new StartData(first.id);

                                                list[1].add(temp.data);
                                                checkNextList(list[0], true, all,
                                                    allPolylines);
                                            }
                                        }
                                    } else if (!list[0].ready || !list[1].ready) {
                                        list[0].concat(list[1]);
                                        last.calculation.listIndex = index;
                                    }
                                }
                                list = list[0];
                                index = index[0];
                            }
                        }
                        break;
                }
                if (list.ready) {
                    calculateList(list, all, allPolylines);
                }

                lists[index] = list;
                if (list != undefined) {
                    console.log(list.getAll());
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
 * findMyList - Finds out which list the elements belongs to
 *
 * @param {type} first The first element connected to the polyline that is currently being used
 * @param {type} last  The last element connected to the current polyline
 *
 * @returns {object} returns the list(s) and the index(es) that the elements belongs to
 */
let findMyList = (first, last) => {
    if (!Number.isInteger(first.calculation.listIndex) && !Number.isInteger(
        last.calculation.listIndex)) {
        return {
            list: new LinkedList,
            index: lists.length
        };
    } else if (!Number.isInteger(first.calculation.listIndex) &&
        Number.isInteger(last.calculation.listIndex)) {
        return {
            list: lists[last.calculation.listIndex],
            index: last.calculation.listIndex
        };
    } else if (Number.isInteger(first.calculation.listIndex) &&
        !Number.isInteger(last.calculation.listIndex)) {
        return {
            list: lists[first.calculation.listIndex],
            index: first.calculation.listIndex
        };
    } else {
        return {
            list: [lists[first.calculation.listIndex], lists[last.calculation.listIndex]],
            index: [first.calculation.listIndex, last.calculation.listIndex]
        };
    }
};

/**
 * addMarkerToList - Adds marker and correct type to selected list
 *
 * @param {type} marker Selected marker that will be added to the list
 * @param {type} list   Selected list that the marker will be added
 *
 * @returns {void}
 */
let addMarkerToList = (marker, list) => {
    let current;

    switch (marker.attributes.Kategori) {
        case "Pumpstationer":
            current = new PumpstationData(marker.id);
            break;
        case "Förgrening":
            current = new BranchConnData(marker.id);
            break;
        default:
            current = new DefaultData(marker.id);
            break;
    }
    list.add(current.data);
};

/**
 * beginNewList - When the previous list is full (ready) a new list needs to be created but some
 * 				  elements from the previous list needs to be added to the new list
 *
 * @param {type} start        The pumpstation from the previous list
 * @param {type} end          The first element in the new list
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} allPolylines All polylines currently placed on map
 * @param {type} list         previous list
 *
 * @returns {object} returns the new list and the new list index
 */
let beginNewList = (start, end, all, allPolylines, list) => {
    let vertices = list.getAll();
    let graph = createGraph(vertices, all, allPolylines, false);

    let newList = new LinkedList;
    let newIndex = lists.length;

    let temp = new StartData(start);

    newList.add(temp.data);

    let current = graph.getChildren(start);

    current = current[0];
    while (current != end) {
        current = all.find(find => find.id == current);
        addMarkerToList(current, newList);
        current = current.id;

        current = graph.getChildren(current);
        current = current[0];
    }

    return { list: newList, index: newIndex };
};

/**
 * calculateList - When a list is full (ready) it is send here to be calculated
 *
 * @param {type} list         The list that is going to be calculated
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} allPolylines All polylines currently placed on map
 *
 * @returns {void}
 */
let calculateList = (list, all, allPolylines) => {
    // sort the list so that type 0 is first, this means that elements with flow is first and
    // the last element is placed last
    let vertices = list.sort();
    let usedVertices = [];
    let graph = createGraph(vertices, all, allPolylines, true);

    // only for debugging
    graph.printGraph();

    // go through every vertices
    for (let i = 0; i < vertices.length - 1; i++) {
        let current = vertices[i];
        // get current element from all array

        current = all.find(find => find.id == current);
        // if current is a marker (pumpstation, branch connection or another product)
        if (current instanceof L.Marker) {
            calculateParents(current, all, graph, usedVertices);
        }
        calculateChildren(current, all, graph, usedVertices);
    }

    let end = vertices[vertices.length - 1];
    let pumpstation = list.pumpstation.id;

    pumpstation = all.find(find => find.id == pumpstation);

    calculateLast(end, pumpstation, graph, all, polylines.getLayers());
};

/**
 * createGraph - Create a data structure graph. Starts by adding all vertices and reset values from
 * 				 previous calculation.
 * 				 After that are edges added (this is which vertices are connected to which)
 * 				 A queue is used to handle if a vertices is connected to multiple vertices
 *
 * @param {type} vertices     All elements that the graph will include
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} allPolylines All polylines currently placed on map
 *
 * @returns {Graph} Returns created graph with edges
 */
let createGraph = (vertices, all, allPolylines, reset) => {
    let graph = new Graph(vertices.length);
    let queue = new Queue();

    for (let i = 0; i < vertices.length; i++) {
        graph.addVertex(vertices[i].id);

        // if reset is true
        if (reset) {
            // reset values for everyone except vertices with type 0
            if (vertices[i].type != 0) {
                let current = all.find(find => find.id == vertices[i].id);

                current.calculation.nop = 0;
                current.calculation.capacity = 0;
            }
        }
        vertices[i] = vertices[i].id;

        let connected = allPolylines.filter(find => find.connected_with.first == vertices[i]);

        for (let j = 0; j < connected.length; j++) {
            let last = all.find(find => find.id == connected[j].connected_with.last);

            queue.enqueue({ first: vertices[i], last: last.id });
        }
    }

    while (!queue.isEmpty()) {
        let queueElement = queue.dequeue();

        if (vertices.includes(queueElement.last)) {
            graph.addEdge(queueElement.first, queueElement.last);
        }
    }

    return graph;
};

/**
 * calculateParents - Check current parents if one or more element have not been used.
 * 					  If unused parent is found add nop (number of people) to current and add
 * 					  parent to used vertices
 *
 * @param {type} current      The child element
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} graph        The graph that is being used for the calculations
 * @param {type} usedVertices A array with all vertices that have been used already
 *
 * @returns {void}
 */
let calculateParents = (current, all, graph, usedVertices) => {
    let parents = graph.getParents(current.id);

    if (parents.length > 0) {
        for (let i = 0; i < parents.length; i++) {
            let parent = all.find(find => find.id == parents[i]);

            if (parent instanceof L.Marker && !usedVertices.includes(parent)) {
                current.calculation.nop += parseFloat(parent.calculation.nop);
                usedVertices.push(parent);
            }
        }
    }
};


/**
 * calculateChildren - Add nop (number of people) to all current children
 *
 * @param {type} current      The parent element
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} graph        The graph that is being used for the calculations
 * @param {type} usedVertices A array with all vertices that have been used already
 *
 * @returns {void}
 */
let calculateChildren = (current, all, graph, usedVertices) => {
    // find children (vertices that are connected to current)
    let children = graph.getChildren(current.id);

    // if a child/children is found
    if (children.length > 0) {
        let nop = current instanceof L.Polygon ? current.nop : current.calculation.nop;

        // go through every children
        for (let j = 0; j < children.length; j++) {
            let child = all.find(find => find.id == children[j]);

            // if child is a pumpstation or branch connection
            if (child instanceof L.Marker && !usedVertices.includes(child)) {
                child.calculation.nop += parseFloat(nop);
                usedVertices.push(current);
            }

            let flow = checkFlow(child.calculation.nop);

            child.calculation.capacity = parseFloat(flow);

            console.log("child: ", child.id);
            console.log("nop", child.calculation.nop);
        }
    }
};

/**
 * calculateLast - Check if their is branch connection(s) between the pumpstation and the last
 * 				   element.
 * 				   If there is, sum total length and handle tilt and calculate total pressure.
 * 				   If not, calculate total pressure as standard.
 *
 * 				   Lastly call getResults() to display calculation
 *
 * @param {type} end          the last element in graph
 * @param {type} pumpstation  the pumpstation element in list
 * @param {type} graph        The graph that is being used for the calculations
 * @param {type} all          All elements (houses, markers & polylines) currently placed on map
 * @param {type} allPolylines All polylines currently placed on map
 *
 * @returns {void}
 */
let calculateLast = (end, pumpstation, graph, all, allPolylines) => {
    let polylines = [];
    let total = 0;
    let current = pumpstation.id;

    // continue until current child is the end
    while (current != end) {
        // add each polyline to array that is not connected to the end
        polylines.push(allPolylines.find(find => find.connected_with.first == current));

        // go to next child in graph
        current = graph.getChildren(current);
        current = current[0];
    }

    if (polylines.length > 1) {
        // create a new polyline with the total length and tilt
        let length = 0;
        let tilt = 0;

        for (let i = 0; i < polylines.length; i++) {
            length += polylines[i].length;
            // find the highest point
            if (tilt < polylines[i].tilt) {
                tilt = polylines[i].tilt;
            }
        }

        total = calculateTotalPressure(
            pumpstation.calculation.capacity,
            polylines[0].dimension.inner,
            length,
            tilt,
        );

        console.log(length);
        console.log(tilt);
    } else {
        total = calculateTotalPressure(
            pumpstation.calculation.capacity,
            polylines[0].dimension.inner,
            polylines[0].length,
            polylines[0].tilt,
        );
    }

    getResults(pumpstation, total, polylines[0].dimension.inner);
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
    let allMarkersAndPolygons = markers.getLayers();

    allMarkersAndPolygons = allMarkersAndPolygons.concat(polygons.getLayers());

    let first = allMarkersAndPolygons.find(find => find.id == element.connected_with.first);
    let last = allMarkersAndPolygons.find(find => find.id == element.connected_with.last);

    if (last != null && last instanceof L.Marker) {
        let list = findMyList(first, last);

        list = list.list;
        if (list instanceof Array) {
            if (list[0] != list[1]) {
                list[0].remove(list[0].indexOf(last.id));
                if (!list[0].ready) {
                    hideAlertsFromList(list[0].getAll());
                }

                list[1].remove(list[1].indexOf(first.id));

                list = list[1];
            } else {
                list = list[0];

                // check if it is first or last that should be removed and reset values
                let firstPolyline = findNextPolyline(first, 'last');
                let lastPolyline = findNextPolyline(last, 'first');

                if (firstPolyline == null) {
                    list.remove(list.indexOf(first.id));

                    if (first instanceof L.Polygon) {
                        first.calculation.used = false;
                    } else if (first instanceof L.Marker) {
                        first.calculation.used = null;
                    }
                    first.calculation.listIndex = null;
                } else if (lastPolyline == null) {
                    list.remove(list.indexOf(last.id));
                    last.calculation.used = null;
                    last.calculation.listIndex = null;
                }
            }
        }

        // hide all alerts on pumpstations that are part of the list
        if (!list.ready) {
            hideAlertsFromList(list.getAll());
        } else {
            let allPolylines = polylines.getLayers();
            let all = allMarkersAndPolygons;

            all = all.concat(allPolylines);

            calculateList(list, all, allPolylines);
        }
        // check if there is a different list connected to the current list and set flow to false
        if (!list.includesType(0)) {
            checkNextList(list, false);
        } else {
            let allPolylines = polylines.getLayers();
            let all = allMarkersAndPolygons;

            all = all.concat(allPolylines);

            checkNextList(list, true, all, allPolylines);
        }

        console.log(list.getAll());
    }
};

/**
 * hideAlertsFromList - If a list i broken (was 'ready' or missing 'flow' but not anymore) hide
 * 						alerts on all markers from that list
 *
 * @param {type} temp The list that have been broken
 *
 * @returns {void}
 */
let hideAlertsFromList = (temp) => {
    let allMarkers = markers.getLayers();

    for (let i = 0; i < temp.length; i++) {
        if (temp[i].type == 2) {
            let current = allMarkers.find(find => find.id == temp[i].id);

            show.hideAlert(current);
        }
    }
};

/**
 * checkNextList - If the list have been broken or ready check how next list is effected
 *
 * @param {type} list                The selected list
 * @param {type} value               true/false, this is indicator if the list is ready or broken
 * @param {null} [all=null]			 All elements currently placed on map
 * @param {null} [allPolylines=null] All polylines currently placed on map
 *
 * @returns {void}
 */
let checkNextList = (list, value, all = null, allPolylines = null) => {
    let allMarkers = markers.getLayers();

    if (list.end.status) {
        let obj = allMarkers.find(find => find.id == list.end.id);
        let newList = lists[obj.calculation.listIndex];

        if (newList != list) {
            newList.flow = value;
            hideAlertsFromList(newList.getAll());

            if (list.ready && list.flow) {
                calculateList(list, all, allPolylines);
            }
            if (newList.ready && newList.flow) {
                calculateList(newList, all, allPolylines);
            }

            checkNextList(newList, value, all, allPolylines);
        }
    }
};


let checkbox = document.getElementById('toggleCalculations');

checkbox.addEventListener("change", () => {
    if (checkbox.checked == false) {
        resetAllMarkers();
        checkbox.used = true;
    } else if (checkbox.used != null) {
        restoreAllMarkers();
        checkbox.used = null;
    }
});

/**
 * resetAllMarkers - removes alerts on all markers and borders
 *
 * @returns {void}
 */
let resetAllMarkers = () => {
    markers.eachLayer((marker) => {
        show.hideAlert(marker);
    });
};

/**
 * restoreAllMarkers - Add red or yellow border to all markers that should have it
 *
 * @returns {void}
 */
let restoreAllMarkers = () => {
    markers.eachLayer((marker) => {
        if (marker.calculation.status != null) {
            if (marker.calculation.status == 3 || marker.calculation.status == 4) {
                marker._icon.classList.remove('transparent-border');
                marker._icon.classList.add('alert-icon');
            } else if (marker.calculation.status == 1 || marker.calculation.status == 2) {
                marker._icon.classList.remove('transparent-border');
                marker._icon.classList.add('warning-icon');
            }
        }
    });
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
 * getResults - Checks values against the pump curve by using the checkPump function
 *
 * @param {L.Marker} first     The marker that have the pump inside it
 * @param {float} 	 total     total pressure that are calculated beforehand
 * @param {string} 	 dimension Inner dimension of the selected pipe
 *
 * @returns {void}
 */
let getResults = (first, total, dimension) => {
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
