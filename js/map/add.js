/* global L */
let pipe = null;
let first;
let firstTarget;
let markerClicked = false;
let houseClicked = false;

export let house = null;

export let polylines = L.layerGroup();
export let markers = L.layerGroup();
export let polygons = L.layerGroup();

// Imports the map object.
import { map, icons, pipeChoice, objectData } from "./loadLeafletMap.js";

// Imports three classes that are used for the project.
import { Marker, House, Pipe } from "./classes.js";

import { lists, addElementToList } from "./edit.js";

export const add = {
    activeObjName: "",
    activeIcon: "",

    /**
     * AddMarker - Adds a "marker" to the map, markers is also known as pumps.
     *
     * @param {object} event
     * @returns {void}
     */
    marker: (event) => {
        let object = {};

        if (add.activeObjName != "Förgrening") {
            for (let i = 0; i < objectData.length; i++) {
                if (add.activeObjName == objectData[i].Modell) {
                    object = objectData[i];
                    break;
                }
            }
        } else {
            object = { Kategori: "Förgrening" };
        }
        new Marker({
            coordinates: event.latlng,
            attributes: object,
            icon: add.activeIcon
        });
    },

    /**
     * addHouse - Adds a polygon to the map, polygons is used to mark houses.
     *
     * @param {object} event
     * @returns {void}
     */
    house: (event) => {
        // Draws houses and displays it on map.
        if (house != null) {
            house.draw(event.latlng);
        } else {
            house = new House({
                coordinates: event.latlng,
                attributes: ["house"],
                popup: { color: '#3388ff' }
            });
        }
    },

    /**
     * addPipe - Draws polylines on the map, polylines is also known as pipes.
     *
     * @param {object} event
     * @returns {void}
     */
    pipe: (event) => {
        let target = event.target;
        let point = {};

        target.closePopup();

        // If pipe is null create the first point.
        if (pipe != null && target.id != firstTarget.id) {
            point.id = target.id;
            if (target.length) {
                point = addBranchConnection(event, target);
            }
            pipe.draw({ last: point.id, coordinates: event.latlng });
            if (first) {
                first.enableDragging();
                first = null;
            }
            pipe = null;
            if (markerClicked) {
                firstTarget._icon.classList.remove("connect-icon");
                firstTarget._icon.classList.add("transparent-border");
                markerClicked = false;
            } else if (houseClicked) {
                firstTarget._path.classList.remove("polygon-stroke");
                houseClicked = false;
            }
        } else {
            point.id = target.id;
            if (target.length) {
                point = addBranchConnection(event, target);
                point.marker._icon.classList.remove("transparent-border");
                point.marker._icon.classList.add("connect-icon");
                firstTarget = point.marker;
                markerClicked = true;
                first = point.marker.disableDragging();
            } else if (target.options.draggable) {
                first = target.disableDragging();
            }
            pipe = new Pipe({
                coordinates: [event.latlng],
                attributes: ["", ""],
                pipeType: pipeChoice,
                first: point.id
            });

            if (event.target._icon) {
                target._icon.classList.remove("transparent-border");
                target._icon.classList.add("connect-icon");
                firstTarget = target;
                markerClicked = true;
            } else if (target instanceof L.Polygon) {
                target._path.classList.add("polygon-stroke");
                firstTarget = target;
                houseClicked = true;
            }
        }

        document.onkeydown = function(event) {
            event = event || window.event;
            if (event.key == "Escape") {
                if (markerClicked) {
                    firstTarget._icon.classList.remove("connect-icon");
                    firstTarget._icon.classList.add("transparent-border");
                    markerClicked = false;
                    pipe = null;
                } else if (houseClicked) {
                    firstTarget._path.classList.remove("polygon-stroke");
                    houseClicked = false;
                    pipe = null;
                }
            }
        };
    },

    /**
     * search - Search functionality to the map using a plugin.
     *    - @see {@link https://esri.github.io/esri-leaflet/api-reference/controls/geosearch.html}
     *
     * @returns {void}
     */
    search: () => {
        L.esri.Geocoding.geosearch().addTo(map);
    },
    /**
     * clearStartPolyline - Set varible pipe equals to null.
     * 					  - This is called from clearMapsEvents()
     * 		 			  - This function is used because export varibles is read-only
     *
     * @returns {void}
     */
    clearStartPolyline: () => {
        document.getElementById("elevation").style.display = "none";
        document.getElementById('loading').style.display = 'block';
        if (pipe != null) {
            document.getElementById("pipeSpecifications")
                .removeEventListener('click', pipe.savePipeValues);
        }
        pipe = null;
    },
};

/**
 * getLength - Gets an individual polyline and calculates the length.
 *
 * @param {L.polyline} polyline @see {@link https://leafletjs.com/reference-1.4.0.html#polyline}
 * @returns {void}
 */
export let getLength = (latlngs) => {
    let thisPipeDistance = 0;

    // Calulates the total length according to number of points in the polyline.
    if (latlngs.length == 2) {
        return L.latLng(latlngs[0]).distanceTo(latlngs[1]);
    } else if (latlngs.length > 2) {
        for (var i = 0; i < latlngs.length - 1; i++) {
            var firstPoint = latlngs[i];
            var secondPoint = latlngs[i + 1];

            thisPipeDistance += L.latLng(firstPoint).distanceTo(secondPoint);
        }
        return thisPipeDistance;
    }
};

/**
 * addBranchConnection - Connecting pipes with each other and add a branch
 * connector between them.
 *
 * @param {type} event
 * @param {type} target The element selected by the user.
 *
 * @returns {void}
 */
let addBranchConnection = (event, target) => {
    let targetLatlngs = target.getLatLngs();
    let firstLatlngs;
    let secondLatlngs;
    let newLine;
    let distanceMin = Infinity;
    let segmentMin = null;

    // Finds closest point where user's click when connecting two pipes.
    for (let i = 0; i < targetLatlngs.length - 1; i++) {
        let segment = [targetLatlngs[i], targetLatlngs[i + 1]];
        let distance = L.GeometryUtil.distanceSegment(map, event.latlng, segment[0], segment[1]);

        if (distance < distanceMin) {
            distanceMin = distance;
            segmentMin = segment;
        }
    }

    firstLatlngs = targetLatlngs.splice(0, targetLatlngs.indexOf(segmentMin[0]) + 1);
    secondLatlngs = targetLatlngs.slice(targetLatlngs.indexOf(segmentMin[1]), targetLatlngs.length);

    firstLatlngs.push(event.latlng);
    target.setLatLngs(firstLatlngs);
    target.length = getLength(firstLatlngs);
    target.decorator.setPaths(firstLatlngs);


    secondLatlngs.unshift(event.latlng);

    // Creates the marker for branch connector.
    let icon = icons.find(element => element.category == "Förgrening");

    let branchMarker = new Marker({
        coordinates: event.latlng,
        attributes: { Kategori: "Förgrening" },
        icon: icon.icon
    });

    branchMarker.marker.on('click', add.pipe);

    let temp = markers.getLayers();

    let find = temp.find(find => find.id == target.connected_with.last);

    if (find != null) {
        let index = find.calculation.listIndex;

        if (Number.isInteger(index)) {
            addElementToList(branchMarker.marker, lists[index], index);
        } else if (index instanceof Array) {
            for (let i = 0; i < index.length; i++) {
                addElementToList(branchMarker.marker, lists[index[i]], index[i]);
            }
        }
    }


    newLine = {
        latlngs: secondLatlngs,
        first: branchMarker.marker.id,
        last: target.connected_with.last
    };
    target.connected_with.last = branchMarker.marker.id;

    let newPipe = new Pipe({
        coordinates: newLine.latlngs,
        attributes: [""],
        pipeType: target.type,
        first: newLine.first
    });

    newPipe.draw({
        last: newLine.last,
        coordinates: null,
        elevation: target.elevation,
        material: target.material,
        dimension: target.dimension,
        tilt: target.tilt
    });

    return {
        marker: branchMarker.marker,
        id: branchMarker.marker.id
    };
};




/**
 * clearHouse - A house is marked when user cancels the drawing tool.
 *
 * @returns {void}
 */
export let clearHouse = () => {
    house = null;
};
