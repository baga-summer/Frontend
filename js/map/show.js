/* global L */
export let mouseCoord = null;
let hiddenAlerts = [];
let visibleAlerts = 0;
let usedTimers = [];
let timers = [];


// Imports the map object.
import { map, objectData } from "./loadLeafletMap.js";

// Imports polylines and clears the start polyline.
import { polylines, add } from "./add.js";

import { popup } from "./popup.js";

// Imports the edit file.
import { edit, createGraph, findNextPolyline } from "./edit.js";

export const show = {

    /**
     * activeObj - Shows which object is clicked in the sidebar menu by adding
     * and removing the active class.
     *
     * @param {object} event
     * @returns {void}
     */
    activeObj: () => {
        const obj = document.getElementsByClassName("obj");

        // Gets all buttons and adds a click event to each.
        for (let i = 0; i < obj.length; i++) {
            obj[i].parentElement.addEventListener("click", function() {
                let current = document.getElementsByClassName(
                    "active");

                // If current have the class "active" replace it with "".
                if (current.length > 0) {
                    current[0].className =
                        current[0].className.replace(" active", "");
                }

                current = document.getElementsByClassName("active3");
                if (current.length > 0) {
                    current[0].className = current[0].className.replace(" active3", "");
                }

                // Clicked object gets the class active.
                this.className += " active";
                edit.clearMapsEvents();
            });
        }
    },

    /**
     * activeCustomControl - Shows which button is active from the leaflet
     * custom control buttons.
     *
     * @param {object} event
     * @returns {void}
     */
    activeCustomControl: (event) => {
        let current = document.getElementsByClassName("active");

        if (current.length > 0) {
            current[0].className = current[0].className.replace(" active", "");
        }

        current = document.getElementsByClassName("active3");

        if (current.length > 0) {
            current[0].className = current[0].className.replace(" active3", "");
        }
        if (event.target.localName == 'div') {
            event.target.className += " active3";
            // Clears all events from the map
            edit.clearMapsEvents();
        } else {
            event.target.parentElement.className += " active3";
            // Clears all events from the map
            edit.clearMapsEvents();
        }
    },

    /**
     * mouseCoordOnMap - Shows the user the latLngs of the mouse on the map.
     *
     * @param {object} event
     * @returns {void}
     */
    mouseCoordOnMap: (event) => {
        if (mouseCoord == null) {
            mouseCoord = L.circle(event.latlng, { radius: 0 }).addTo(map);
        } else {
            document.getElementById("myMap").style.cursor = "pointer";
            mouseCoord.setLatLng(event.latlng);
            mouseCoord.bindTooltip("lat:" + event.latlng.lat + ", lng:" + event.latlng.lng)
                .openTooltip(event.latlng);
        }
    },

    /**
     * hideMouseCoord - Hides the latLngs from the users mouse.
     *
     * @param {object} event
     * @returns {void}
     */
    hideMouseCoord: () => {
        if (mouseCoord != null) {
            mouseCoord.remove();
            mouseCoord = null;
        }
    },

    /**
     * polylineLengths - Gets each pipes length and also gets the total length of
     * all pipes.
     *
     * @returns {void}
     */
    polylineLengths: () => {
        var thisPipeDistance = 0;
        var firstPoint;
        var secondPoint;

        // Loop each polyline
        polylines.eachLayer((polyline) => {
            var tempPolyline = polyline._latlngs;

            // If polyline only has 2 points.
            if (tempPolyline.length == 2) {
                // Calculate current pipe's length.
                thisPipeDistance = tempPolyline[0].distanceTo(tempPolyline[1]);
                // Bind a popup with length for current polyline.
                polyline.bindTooltip("Längd: " + Math.round(thisPipeDistance * 100) / 100 +
                    "m" + "<br>Statisk höjd: " +
                    (polyline.elevation.highest - polyline.elevation.first).toFixed(1), {
                    autoClose: false
                }).openTooltip();
                // If polylines have more than 2 points.
            } else if (tempPolyline.length > 2) {
                for (var i = 0; i < tempPolyline.length - 1; i++) {
                    firstPoint = tempPolyline[i];
                    secondPoint = tempPolyline[i + 1];
                    thisPipeDistance += L.latLng(firstPoint).distanceTo(secondPoint);
                }
                polyline.bindTooltip("Längd: " + Math.round(thisPipeDistance * 100) / 100 +
                    "m" + "<br>Statisk höjd: " +
                    (polyline.elevation.highest - polyline.elevation.first).toFixed(1), {
                    autoClose: false
                }).openTooltip();
            }
        });
    },

    /**
     * pumpDistance - change colors to all polylines after pumpstation.
     * 				- This helps to visulize which distance the pumpstation is pumping
     * 				- function is also used to reset colors to original colors when popup is closed
     *
     * @param {type} pumpstation  The pumpstation that we begin fromw
     * @param {type} list         the list the pumpstation is part of
     * @param {type} all          All elements (houses, markers & polylines) currently placed on map
     * @param {type} allPolylines All polylines currently placed on map
     * @param {type} reset        boolean value that tells which colors it should use
     *
     * @returns {void}
     */
    pumpDistance: (list, first, all, allPolylines, reset) => {
        let vertices = list.getAll();
        let graph = createGraph(vertices, all, allPolylines, false);

        while (first != null && first.id != graph.last().id) {
            if (first == null) {
                break;
            }
            let polyline = findNextPolyline(first, 'first');

            if (!reset) {
                polyline.setStyle({
                    color: '#ff00f4'
                });
                polyline.decorator.setStyle({
                    color: '#7f007a'
                });
                polyline.decorator._patterns[0].symbolFactory.options.pathOptions.color = '#7f007a';
            } else {
                let color = polyline.type == 0 ? '#3388ff' : 'red';

                polyline.setStyle({
                    color: color
                });
                polyline.decorator.setStyle({
                    color: '#004377'
                });
                polyline.decorator._patterns[0].symbolFactory.options.pathOptions.color = '#004377';
            }

            first = graph.getChild(first);
            first = first[0];
        }
    },

    /**
     * alert - Displays warnings when pressure is too high or too low.
     *
     * @param {object} first
     * @param {object} result
     *
     * @returns {void}
     */
    alert: (first, result) => {
        let div = document.createElement('div');
        let parent = document.getElementById('myMap');
        let close = document.getElementsByClassName("closebtn");
        let alerts = document.getElementsByClassName(first.id);
        let html;
        let cap = 3;

        first.attributes.id = first.id;
        first.attributes.Pumpsträcka = result.pumpDistance.toFixed(2) + " m";
        first.attributes["Total tryck"] = result.totalPressure.toFixed(2) + " m";
        first.attributes["Tryck utifrån (10%)"] = result.additionalPressure.toFixed(2) + " m";
        first.attributes.Flödeshastighet = result.calculations.mps.toFixed(2) + " m/s";
        first.attributes["Antal personer som högst"] = result.nop;
        first.attributes.Flöde = result.capacity * 1000 + " l/s";
        first.setPopupContent(popup.marker(first.attributes, objectData) +
            popup.changeCoord(first._latlng));

        switch (result.calculations.status) {
            case 0:
                html =
                    `<div class="alert success">
                        <span class="closebtn">&times;</span>
                        <strong>OK!</strong>
                        Flödeshastighet: ${result.calculations.mps.toFixed(2)} m/s

                         <span class="info-text">
                            ${first.attributes.Modell}
                            id: ${first.id}
                         </span>
                    </div>`;
                if (alerts.length < 1) {
                    div.classList.add(first.id);
                    div.innerHTML = html;

                    parent.appendChild(div);

                    if (!usedTimers.includes(first.id)) {
                        let timer = new Timer(() => {
                            div.children[0].style.opacity = "0";
                            setTimeout(() => div.remove(), 600);
                        }, 2000);

                        timers.push(timer);
                        usedTimers.push(first.id);
                    } else {
                        timers[usedTimers.indexOf(first.id)].reset(() => {
                            div.children[0].style.opacity = "0";
                            setTimeout(() => div.remove(), 600);
                        }, 2000);
                    }
                } else {
                    alerts[0].innerHTML = html;
                    if (hiddenAlerts.includes(alerts[0]) == false) {
                        visibleAlerts--;
                        if (hiddenAlerts.length > 0) {
                            hiddenAlerts[0].style.display = "block";
                            hiddenAlerts.shift();
                            visibleAlerts++;
                        }
                    }
                    if (!usedTimers.includes(first.id)) {
                        let timer = new Timer(() => {
                            alerts[0].children[0].style.opacity = "0";
                            setTimeout(() => alerts[0].remove(), 600);
                        }, 2000);

                        timers.push(timer);
                        usedTimers.push(first.id);
                    } else {
                        timers[usedTimers.indexOf(first.id)].reset(() => {
                            if (alerts[0] != null) {
                                alerts[0].children[0].style.opacity = "0";
                                setTimeout(() => {
                                    if (alerts[0] != null) {
                                        alerts[0].remove();
                                    }
                                }, 600);
                            }
                        }, 2000);
                    }
                }

                first._icon.classList.remove('warning-icon');
                first._icon.classList.remove('alert-icon');
                first._icon.classList.add('transparent-border');
                break;
            case 1:
                html =
                    `<div class="alert warning">
                        <span class="closebtn">&times;</span>
                        <strong>För låg flödeshastighet!</strong>
                        Flödeshastighet: ${result.calculations.mps.toFixed(2)} m/s

                        <span class="info-text">
                            ${first.attributes.Modell}
                            id: ${first.id}
                        </span>
                    </div>`;
                if (alerts.length < 1) {
                    div.classList.add(first.id);
                    div.innerHTML = html;

                    parent.appendChild(div);
                } else {
                    alerts[0].innerHTML = html;

                    if (usedTimers.includes(first.id)) {
                        timers[usedTimers.indexOf(first.id)].stop();
                    }
                }

                first._icon.classList.remove('alert-icon');
                first._icon.classList.remove('transparent-border');
                first._icon.classList.add('warning-icon');
                break;
            case 2:
                html =
                    `<div class="alert warning">
                        <span class="closebtn">&times;</span>
                        <strong>För hög flödeshastighet!</strong>
                        Flödeshastighet: ${result.calculations.mps.toFixed(2)} m/s

                        <span class="info-text">
                            ${first.attributes.Modell}
                            id: ${first.id}
                        </span>
                    </div>`;

                if (alerts.length < 1) {
                    div.classList.add(first.id);
                    div.innerHTML = html;

                    parent.appendChild(div);
                } else {
                    alerts[0].innerHTML = html;

                    if (usedTimers.includes(first.id)) {
                        timers[usedTimers.indexOf(first.id)].stop();
                    }
                }

                first._icon.classList.remove('alert-icon');
                first._icon.classList.remove('transparent-border');
                first._icon.classList.add('warning-icon');
                break;
            case 3:
                html =
                    `<div class="alert red">
                        <span class="closebtn">&times;</span>
                        <strong>För högt tryck!</strong>
                        Totaltrycket: ${result.totalPressure.toFixed(2)} m
                        <span class="info-text">
                            ${first.attributes.Modell}
                            id: ${first.id}
                        </span>
                    </div>`;

                if (alerts.length < 1) {
                    div.classList.add(first.id);
                    div.innerHTML = html;

                    parent.appendChild(div);
                } else {
                    alerts[0].innerHTML = html;

                    if (usedTimers.includes(first.id)) {
                        timers[usedTimers.indexOf(first.id)].stop();
                    }
                }

                first._icon.classList.remove('warning-icon');
                first._icon.classList.remove('transparent-border');
                first._icon.classList.add('alert-icon');
                break;
            case 4:
                html =
                    `<div class="alert red">
                        <span class="closebtn">&times;</span>
                        <strong>För lågt tryck!</strong>
                        Totaltrycket: ${result.totalPressure.toFixed(2)} m
                        <span class="info-text">
                            ${first.attributes.Modell}
                            id: ${first.id}
                        </span>
                    </div>`;


                if (alerts.length < 1) {
                    div.classList.add(first.id);
                    div.innerHTML = html;

                    parent.appendChild(div);
                } else {
                    alerts[0].innerHTML = html;

                    if (usedTimers.includes(first.id)) {
                        timers[usedTimers.indexOf(first.id)].stop();
                    }
                }

                first._icon.classList.remove('warning-icon');
                first._icon.classList.remove('transparent-border');
                first._icon.classList.add('alert-icon');
                break;
        }
        if (div.innerHTML.length > 0) {
            if (visibleAlerts < cap && div.children[0].classList[1] != "success") {
                visibleAlerts++;
            } else if (div.children[0].classList[1] != "success") {
                div.style.display = "none";
                hiddenAlerts.push(div);
            }
        }

        if (close.length > 0) {
            for (let i = 0; i < close.length; i++) {
                close[i].onclick = function() {
                    let div = this.parentElement.parentElement;

                    if (hiddenAlerts.length > 0) {
                        hiddenAlerts[0].style.display = "block";
                        hiddenAlerts.shift();
                    } else {
                        visibleAlerts--;
                    }

                    div.children[0].style.opacity = "0";
                    setTimeout(() => div.remove(), 600);
                };
            }
        }
    },

    /**
     * hideAlert - Hides the warnings.
     *
     * @param {object} element
     * @returns {void}
     */
    hideAlert: (element) => {
        let alerts = document.getElementsByClassName(element.attributes.id);

        if (element.attributes.Kategori != "Förgrening") {
            delete element.attributes.Flöde;
            delete element.attributes.Totaltryck;
            delete element.attributes.Flödeshastighet;
            delete element.attributes["Antal personer som högst"];
            element.attributes.id = element.id;
            element.setPopupContent(popup.marker(element.attributes, objectData) +
                popup.changeCoord(element._latlng));
        }


        for (let i = alerts.length - 1; i >= 0; i--) {
            let index = hiddenAlerts.indexOf(alerts[i]);

            if (index > -1) {
                hiddenAlerts.splice(index, 1);
            } else {
                visibleAlerts--;
            }

            alerts[i].remove();
        }
        if (element._icon != null) {
            element._icon.classList.remove('warning-icon');
            element._icon.classList.remove('alert-icon');
            element._icon.classList.add('transparent-border');
        }
    },

    /**
     * openModal - It handles the opening and closing of boxes that shows when
     * save button and pipe specifications.
     *
     * @param {object} modal
     * @returns {void}
     */
    openModal: (modal) => {
        var span = modal.children[0].children[0];
        let success = false;

        // Open the modal
        modal.style.display = 'block';
        let firstInput = modal.getElementsByTagName('input')[0];
        let button = modal.getElementsByTagName('input')[modal.getElementsByTagName('input')
            .length - 1];

        firstInput.focus();

        // When the user clicks on <span> (x), close the modal
        span.onclick = () => {
            modal.style.display = "none";
            add.clearStartPolyline();
        };

        document.addEventListener('keyup', (event) => {
            if (event.keyCode == 27) {
                modal.style.display = "none";
                add.clearStartPolyline();
            } else if (event.keyCode == 13) {
                event.preventDefault();
                button.click();
            }
        });

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
                add.clearStartPolyline();
            }
        };

        return success;
    },
};


/**
 * Timer - Class for starting, stoping and reseting setTimeout calls
 */
class Timer {
    /**
     * constructor - initiate and start the timeout
     *
     * @param {Function} fn What is going to happend after the timeout expires
     * @param {number} t    What runtime the timeout will have
     */
    constructor(fn, t) {
        this.fn = fn;
        this.time = t;
        this.timeout = setTimeout(fn, t);
    }

    /**
     * stop - Clear timeout and reset value
     * @returns {Timer} this
     */
    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        return this;
    }


    /**
     * start - Start timer using current settings (if it's not already running)
     * @returns {Timer} this
     */
    start() {
        if (!this.timeout) {
            this.stop();
            this.timeout = setTimeout(this.fn, this.time);
        }
        return this;
    }


    /**
     * reset - Set new values for function and time, stop current timeout and start new timeout
     * @param {Function} fn What is going to happend after the timeout expires
     * @param {number} t    What time the timer will have
     *
     * @returns {Timer} this
     */
    reset(fn, t) {
        this.fn = fn;
        this.time = t;
        return this.stop().start();
    }
}
