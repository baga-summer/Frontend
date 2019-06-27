/* global L configuration, API */
export let token = localStorage.getItem('token');
let id = new URL(window.location.href).searchParams.get('id');

export let projectInfo;
export let pipeChoice = null;
export let objectData = [];
export let icons = [];
export let pumps = [];

// Imports Google maps javascript api key from getKey.js file
import { key } from "./getKey.js";

// Imports object add with multible functions from add.js file that uses the leaflet library
import { add, markers } from "./add.js";

// Imports object edit with multible functions from eidt.js file that uses the leaflet library
import { edit } from "./edit.js";

// Imports object show with multible functions from show.js file that uses the leaflet library
import { show } from "./show.js";

import { popup } from "./popup.js";

// Initialize the map with center coordinates on BAGA HQ and zoom 18.
export let map;

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
        Karta: roadmap,
        Satellit: satellite
    };

    L.control.layers(baseMaps).addTo(map);
};

/**
 * customControl - Create the custom buttons on the top left side under
 * 				   zoom buttons with icons from material icons
 *
 * @param {string} iconName - The name of the material icon.
 *
 * @returns {void}
 */
let customControl = (iconName) => {
    // Create a new leaflet control extended
    var myCustomControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        // When the customControl have been added to the map
        onAdd: () => {
            // Creates a new 'div' with pre configured css classes
            var container = L.DomUtil.create('div',
                'leaflet-bar leaflet-control leaflet-control-custom'
            );

            // Adds id equals to iconName to later easly call button
            container.id = iconName;
            // Disables map events when the button is clicked
            L.DomEvent.disableClickPropagation(container);

            // Creates a new 'i' html element and displays a material icon
            let icon = L.DomUtil.create('i');

            icon.className = 'material-icons';
            icon.innerHTML = iconName;
            //appends it to the div we created earlier
            container.appendChild(icon);

            //returns the div
            return container;
        }
    });

    // adds our customControl we created above to the maps controls and displays it on the map
    map.addControl(new myCustomControl());
};

/**
 * Adds functionality to the sidebar accordions
 *
 * @returns {void}
 */
let accordions = () => {
    // Find all accordions
    let acc = document.getElementsByClassName("accordion");

    // Loop through each element
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", () => {
            // Toggle css class 'activeAccordion' on current accordion
            acc[i].classList.toggle("activeAccordion");
            // Find panel inside accordion
            var panel = acc[i].nextElementSibling;

            // If accordion is already open
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                // Set the panels css maxHeight value (0) equals to the panel
                // scrollHeight in px (panels true length)
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }
};

/**
 * saveBox - Opens the save modal when user press on the 'spara' button and adds version handling
 * 		   - and calls the save function
 *
 * @returns {void}
 */
let saveBox = () => {
    // Save box
    let modal = document.getElementById('saveModal');
    // html element select for version
    let select = document.getElementById("versions");
    // New version input field
    let newVersion = document.getElementById('newVersion');

    document.getElementById("save").addEventListener("click", () => {
        // Show the savebox
        show.openModal(modal);
        document.getElementById('projectNameInSave').innerHTML = `Spara ${projectInfo.name}`;

        for (let i = select.options.length - 1; i >= 0; i--) {
            select.remove(i);
        }
        newVersion.value = "";

        let currVersion = document.createElement('option');

        currVersion.text = projectInfo.version;
        select.add(currVersion);
        select.value = currVersion.text;

        // Check if user adds a input in the new version field
        newVersion.addEventListener('input', () => {
            // get html element option with id 'newOption'
            let newOption = document.getElementById('newOption');

            // if newOption do not exist
            if (newOption == null) {
                // Create a new html element option
                let option = document.createElement("option");

                // Set new option text equals the text in the input field newVersion
                option.text = newVersion.value;
                // Set id equals to newOption
                option.id = 'newOption';

                // Add new option to select with id 'version'
                select.add(option, select[0]);
                // Select new option in the select
                select.value = option.text;

                // Else if newOption already exists
            } else {
                // Update newOption text to updated text in input field newVersion
                newOption.text = newVersion.value;
            }
        });
        // When user clicks on saveButton
        document.getElementById('saveButton').addEventListener('click', () => {
            // Calls save in edit object from edit.js with version
            edit.save(select.value);

            // Hide save box
            modal.style.display = 'none';
        });
    });
};

/**
 * addHouseOnClick - On click the user draws polygons on the map and a house
 * 					 add are created
 *
 * @returns {void}
 */
let addHouseOnClick = () => {
    // Add click event listener on house button in sidebar
    document.getElementById("house").addEventListener('click', () => {
        // Call add.house function everytime user clicks on map
        map.on('click', add.house);
        document.getElementById("myMap").style.cursor = "pointer";
    });
};

/**
 * addPipeOnClick - Adds a polyline (pipe) between two objects after the
 * 					user clicks on two outplaced objects on map
 * 					(marker, polyline, or polygon)
 *
 * @returns {void}
 */
let addPipeOnClick = () => {
    // Adds a click event listener on pipe button
    document.getElementById("pipe").addEventListener("click", () => {
        // Set pipeChoice
        pipeChoice = 0;
        // On each layer of the map => this means all markers, all polylines
        // and all polygons but not the map itself
        map.eachLayer((layer) => {
            // On click, call addPipe function from add.js file
            if (layer._popup != null) { layer._popup.options.autoPan = false; }

            layer.on("click", add.pipe);
        });
    });

    // Adds a click event listener on stempipe button
    document.getElementById("stempipe").addEventListener("click", () => {
        // Set pipeChoice
        pipeChoice = 1;
        // On each layer of the map => this means all markers, all polylines
        // and all polygons but not the map itself
        map.eachLayer((layer) => {
            if (layer._popup != null) { layer._popup.options.autoPan = false; }
            // On click on add call addPipe function
            layer.on("click", add.pipe);
        });
    });
};

/**
 * doNothingonClick - Make it possible to drag and click on map with noting happening
 * 					  (This is the first custom button on the left side of the map)
 *
 * @returns {void}
 */
let doNothingonClick = () => {
    // Adds a click event listener on mouse icon button
    document.getElementById("map").addEventListener('click', (event) => {
        // Set this icon to the active icon
        show.activeCustomControl(event);
    });
};

/**
 * editpipesOnClick - Make it possible to bend pipes (polylines) by dragging
 * 					  (This is the second custom button on the left side of the map)
 *
 * @returns {void}
 */
let editpipesOnClick = () => {
    // Adds a click event listener on edit pipes button
    document.getElementById("timeline").addEventListener('click', (event) => {
        // Set this icon to the active icon
        show.activeCustomControl(event);
        // Enable editible polylines
        edit.polylines();
    });
};

/**
 * toggleMouseCoordOnClick - On click show or hide (toggle) toolbar next to the
 * 							 mouse with the coordinates of current pos of mouse
 * 					  		 (This is the third custom button on the left side of the map)
 *
 * @returns {void}
 */
let toggleMouseCoordOnClick = () => {
    // Add a click event listener to element
    document.getElementById('control_camera').addEventListener('click', (event) => {
        let target = event.target;

        // Toggle css class 'active2' to element. Switches each time user clicks on button
        document.getElementById('control_camera').classList.toggle('active2');

        // If the user clicks on the border of i element and by mistake select
        // the parent element instead
        if (target.localName == 'div') {
            let child = target.firstChild;

            // If button is already pressed
            if (child.active == true) {
                // Mark button as not active
                child.active = false;
                // Disable showMouseCoord function when user moves the mouse over the map
                map.off('mousemove', show.mouseCoordOnMap);
                // Hide toolbar
                show.hideMouseCoord();
            } else {
                // Mark button as active
                child.active = true;
                // Call showMouseCoord function everytime user moves the mouse over the map
                map.on('mousemove', show.mouseCoordOnMap);
            }
            //else if the user clicks on the icon ('i') element
            // Then it is the same procedure as above
        } else if (target.active == true) {
            target.active = false;
            map.off('mousemove', show.mouseCoordOnMap);
            show.hideMouseCoord();
        } else {
            target.active = true;
            map.on('mousemove', show.mouseCoordOnMap);
        }
    });
};

/**
 * getDistanceOnClick - Displays distance of each pipe (polyline) on the map
 * 						(This is the fourth custom button on the left side of the map)
 *
 * @returns {void}
 */
let getDistanceOnClick = () => {
    // Adds a click event listener on delete button
    document.getElementById("bar_chart").addEventListener("click", (event) => {
        // Set this icon to the active icon
        show.activeCustomControl(event);
        // Call polylineLengths from show.js to get the length from all polylines
        show.polylineLengths();
    });
};


/**
 * deleteOnClick - Make it possible to delete add on tha map by clicking
 * 				   (This is the fifth custom button on the left side of the map)
 *
 * @returns {void}
 */
let deleteOnClick = () => {
    // Adds a click event listener on delete button
    document.getElementById("delete").addEventListener("click", (event) => {
        show.activeCustomControl(event);
        edit.removeArrows();
        // On each layer of the map => this means all markers, all polylines
        // and all polygons but not the map itself
        map.eachLayer((layer) => {
            if (layer._popup != null) { layer._popup.options.autoPan = false; }
            // On click on add call remove function
            layer.on("click", edit.remove);
        });
    });
};

/**
 * addMarkerOnClick - Displays a marker on the map with its custom icon
 *
 * @param {array} elements All elements with the same class
 * @param {L.icon} icon    Leaflet icon @see {@link https://leafletjs.com/reference-1.4.0.html#icon}
 *
 * @returns {void}
 */
let addMarkerOnClick = (elements, icon) => {
    // For each element
    for (let i = 0; i < elements.length; i++) {
        // Add a click event listener
        elements[i].parentElement.addEventListener("click", () => {
            // Set markers info and icon
            add.activeObjName = elements[i].id;
            add.activeIcon = icon;

            // Call addMarker function in add.js
            map.on("click", add.marker);
            document.getElementById("myMap").style.cursor = "pointer";
        });
    }
};

/**
 * loadClickEvent - loads all icons to each category that is desplayed on map
 *					Calls addMarkerOnClick function to add eventListener to each product
 *
 * @returns {void}
 */
let loadClickEvent = async () => {
    for (let i = 0; i < icons.length; i++) {
        addMarkerOnClick(document.getElementsByClassName(icons[i].category), icons[i].icon);
    }
};


export let loadMap = {
    /**
     * loadProducts - Loads all products from database and each category creates a new accordion
     *
     * @returns {void}
     */
    loadProducts: async () => {
        let json = await API.get(`${configuration.apiURL}/obj/all/local/${id}?token=${token}`);
        let list = document.getElementsByClassName('obj-list')[0];

        for (let i = 0; i < json.length; i++) {
            if (json[i].Kategori != null) {
                if (document.getElementsByClassName(json[i].Kategori).length == 0 &&
                        json[i].Kategori != "Pump") {
                    list.innerHTML +=
                            `<button class="accordion desc">${json[i].Kategori}</button>
							<div class="panel"></div>`;

                    let panels = document.getElementsByClassName('panel');
                    let panel = panels[panels.length - 1];

                    let object = document.createElement('div');

                    object.innerHTML =
                            `<div class="obj-container">
							   <div id="${json[i].Modell}" class="obj ${json[i].Kategori}">
								   <img src="${json[i].Bild}"/>
							   </div>
							   <div class="obj-desc">${json[i].Modell}</div>
							</div>`;

                    panel.appendChild(object);

                    delete json[i].Bild;
                    delete json[i].creatorID;
                    delete json[i].isDisabled;
                    delete json[i].approved;
                    delete json[i]._id;
                    objectData.push(json[i]);
                } else if (json[i].Kategori != "Pump") {
                    let elements = document.getElementsByClassName(json[i].Kategori);
                    let panel = elements[0].parentElement.parentElement.parentElement;

                    let object = document.createElement('div');

                    object.innerHTML =
                            `<div class="obj-container">
							   <div id="${json[i].Modell}" class="obj ${json[i].Kategori}">
								   <img src="${json[i].Bild}"/>
							   </div>
							   <div class="obj-desc">${json[i].Modell}</div>
							</div>`;

                    panel.appendChild(object);

                    delete json[i].Bild;
                    delete json[i].creatorID;
                    delete json[i].isDisabled;
                    delete json[i].approved;
                    delete json[i]._id;
                    objectData.push(json[i]);
                } else {
                    pumps.push(json[i]);
                }
            }
        }

        objectData.push({ Modell: "Utsläppspunkt", Kategori: "Utsläppspunkt" });

        accordions();
        show.activeObj();
        loadClickEvent();
        addPipeOnClick();
        addHouseOnClick();
    },
    /**
         * loadData - Get project map json data and calls load function in edit.js
         *
         * @returns {void}
         */
    loadData: async (editPermission) => {
        let json = await API.get(
            `${configuration.apiURL}/proj/data/${id}?token=${token}`
        );

        let urlParam = new URLSearchParams(window.location.search);
        let myParam = urlParam.get('savestatus');

        if (myParam == "error") {
            edit.notification("error");
        } else if (myParam == "success") {
            edit.notification("success");
        }

        let currentState = history.state;

        history.replaceState(currentState, "page 2", `map.html?id=${id}`);

        if (json[0].data.length > 0) {
            edit.load(json[0].data);
        }

        map.on('layeradd', () => {
            edit.warning.unsavedChanges(true);
        });

        edit.clearMapsEvents();
        if (editPermission == true) {
            markers.eachLayer((marker) => {
                marker.disableDragging();
                marker.bindPopup(popup.marker(marker.attributes, objectData));
                marker.off("popupopen");
            });
        }
    },

    /**
             * loadProjectInfo - Get project info and sets project title and saves info for later
             *
             * @returns {void}
             */
    loadProjectInfo: async () => {
        let json = await API.get(
            `${configuration.apiURL}/proj/info/${id}?token=${token}`
        );
        let title = document.getElementsByClassName('projekt-titel')[0];

        title.innerHTML = `${json[0].name} ${json[0].version}`;

        projectInfo = json[0];
    },
};

/**
 * onLoadWrite - Initialize the map functionality with the html objects for
 * when a user has the write property
 *
 * @returns {void}
 */
let onLoadWrite = () => {
    map = L.map("myMap", {
        center: [56.208640, 15.632630],
        editable: true,
        zoom: 18
    });
    //loads all the products to the map
    loadMap.loadProducts();
    loadMap.loadProjectInfo();
    //loads the gridlayers, satellite or map
    gridlayers();
    //loads all the custom controls
    customControl('delete');
    customControl('bar_chart');
    customControl('control_camera');
    customControl('timeline');
    customControl('map');
    //loads search functionality
    add.search();

    doNothingonClick();
    editpipesOnClick();
    toggleMouseCoordOnClick();
    getDistanceOnClick();
    deleteOnClick();

    saveBox();

    //gets project data and info
    loadMap.loadData(false);
};

/**
 * onLoadRead - Initialize the map functionality with html objects, when user
 * has read property
 *
 * @returns {void}
 */
let onLoadRead = () => {
    //Gets the HTML objets which needs to change
    let sidebar = document.getElementsByClassName("sidebar");
    let mapElem = document.getElementsByClassName("map");
    let back = document.getElementById("readBack");

    //hides the sidebar
    sidebar[0].style.display = "none";
    //map width to 100%
    mapElem[0].style.width = "100%";
    //reinitializes the map after it has gotten width = 100% to remove gray area
    map = L.map("myMap", {
        center: [56.208640, 15.632630],
        editable: true,
        zoom: 18
    });

    loadMap.loadProducts();
    loadMap.loadProjectInfo();

    gridlayers();
    //loads the custom controls for read property
    customControl('map');
    customControl('control_camera');
    customControl('bar_chart');
    //loads search functionality
    add.search();
    doNothingonClick();
    toggleMouseCoordOnClick();
    getDistanceOnClick();

    //create an a tag to go back to home
    var backLink = document.createElement("a");

    //sets the CSS and attributes for the a tag
    backLink.setAttribute("class", "material-icons");
    backLink.setAttribute("href", "/home.html");
    backLink.innerHTML = "arrow_back";
    back.appendChild(backLink);
    backLink.style.position = "fixed";
    backLink.style.bottom = "150px";
    backLink.style.zIndex = "9999";
    backLink.style.fontSize = "50px";
    backLink.style.textDecoration = "none";
    backLink.style.color = "gray";

    //loads project data and info
    loadMap.loadData(true);
};
//loads the gridlayers, satellite or map

/**
 * getPermission - Gets the permission of the user and loads the correct
 * function depending on permission
 *
 * @returns {void}
 */
let getPermission = async () => {
    let json = await API.get(
        `${configuration.apiURL}/obj/categories/icon/all?token=${token}`);

    for (let i = 0; i < json.length; i++) {
        let image = new Image();
        let iconSize;

        /**
         * - Save icon object with category and L.icon
         * - Leaflet icon @see {@link https://leafletjs.com/reference-1.4.0.html#icon}
         * - The icon size is changed to below W:75 & H:40 but keeps aspect ratio
         */
        image.onload = () => {
            if (json[i].Kategori != 'Förgrening') {
                iconSize = calculateAspectRatioFit(image.naturalWidth,
                    image.naturalHeight, 75, 40);
            } else {
                iconSize = { width: 20, height: 20 };
            }

            let icon = {
                category: json[i].Kategori,
                icon: L.icon({
                    iconAnchor: [iconSize.width / 2, iconSize.height / 2],
                    iconSize: [iconSize.width, iconSize.height],
                    iconUrl: json[i].Bild,
                    popupAnchor: [0, -(iconSize.height / 2)]
                })
            };

            icons.push(icon);
        };
        image.src = json[i].Bild;
    }

    //fetches the users permission from database to decide which load to use
    let response = await API.get(configuration.apiURL + "/proj/permission/" + id +
        "?token=" + token);

    if (response.permission == "r") {
        //if user has permission r(read) load onLoadRead()
        onLoadRead();
        edit.notificationRead();
    } else {
        onLoadWrite();
        edit.notificationWrite();
    }
};

getPermission();

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

let link = document.getElementById("showMateriallist");

link.href = "materiallist.html?id=" + id;
