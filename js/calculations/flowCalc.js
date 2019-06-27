/* eslint-disable no-unused-vars */
/* global configuration, calculations, API */

/**
 * showStyling - Displays the boxes.
 *
 * @returns {void}
 */
function showStyling() {
    // document.getElementById("pressure1").style.display = "block";
    // document.getElementById("pressure2").style.display = "block";
    document.getElementById("flow").style.display = "block";
    document.getElementById("flow-wrap").style.display = "flex";
    document.getElementById("submit").style.display = "block";
    // document.getElementById("pressure1").previousElementSibling.innerText = "PN 6.3";
    // document.getElementById("pressure2").previousElementSibling.innerText = "PN 10";
}

/**
 * uncheckButtons - Unchecks the radio buttons.
 *
 * @returns {void}
 */
// function uncheckButtons() {
//     document.getElementById("pressure1").checked = false;
//     document.getElementById("pressure2").checked = false;
// }
// uncheckButtons();

// Changes material to the selected one
document.getElementById("material").addEventListener("change", () => {
    if (document.getElementById("material").value === "PEM") {
        PEMPipe();
        document.getElementById("selectDim").style.display = "block";
    }
    if (document.getElementById("material").value === "PE") {
        PEPipe();
        document.getElementById("selectDim").style.display = "block";
    }
    if (document.getElementById("material").value === "stainless") {
        stainlessPipe();
        document.getElementById("selectDim").style.display = "block";
    }
});
showStyling();

/**
 * PEMPipe - Creates the dimensions for the PEM material.
 *
 * @returns {void}
 */
function PEMPipe() {
    let dimPEM = [{
        "innerdim": "35.2 mm",
        "outerdim": "40 mm"
    }, {
        "innerdim": "44 mm",
        "outerdim": "50 mm"
    }, {
        "innerdim": "55.4 mm",
        "outerdim": "63 mm"
    }, {
        "innerdim": "66 mm",
        "outerdim": "75 mm"
    }, {
        "innerdim": "79.2 mm",
        "outerdim": "90 mm"
    }];
    let select = document.getElementById("selectDim");

    for (let i = select.childNodes.length - 1; i >= 0; i--) {
        select.removeChild(select.childNodes[i]);
    }

    for (let i = 0; i < dimPEM.length; i++) {
        let option = document.createElement("option");

        option.text = dimPEM[i].outerdim;
        select.add(option);
    }
}

/**
 * PEPipe - Creates the dimensions for the PE material.
 *
 * @returns {void}
 */
function PEPipe() {
    let dimPE = [{
        "innerdim": "96.8 mm",
        "outerdim": "110 mm"
    }, {
        "innerdim": "141 mm",
        "outerdim": "160 mm"
    }, {
        "innerdim": "158.6 mm",
        "outerdim": "180 mm"
    }, {
        "innerdim": "176.2 mm",
        "outerdim": "200 mm"
    }, {
        "innerdim": "198.2 mm",
        "outerdim": "225 mm"
    }, {
        "innerdim": "220.4 mm",
        "outerdim": "250 mm"
    }, {
        "innerdim": "277.6 mm",
        "outerdim": "315 mm"
    }, {
        "innerdim": "352.6 mm",
        "outerdim": "400 mm"
    }, {
        "innerdim": "396.6 mm",
        "outerdim": "450 mm"
    }, {
        "innerdim": "440.6 mm",
        "outerdim": "500 mm"
    }];
    let select = document.getElementById("selectDim");

    for (let i = select.childNodes.length - 1; i >= 0; i--) {
        select.removeChild(select.childNodes[i]);
    }

    for (let i = 0; i < dimPE.length; i++) {
        let option = document.createElement("option");

        option.text = dimPE[i].outerdim;
        select.add(option);
    }
}

/**
 * stainlessPipe - Creates the dimensions for the stainless material.
 *
 * @returns {void}
 */
function stainlessPipe() {
    let dimStainless = [{
        "innerdim": "38.4 mm",
        "outerdim": "42.4 mm",
        "inches": '1.25 "'
    }, {
        "innerdim": "44.3 mm",
        "outerdim": "48.3 mm",
        "inches": '1.5 "'
    }, {
        "innerdim": "56.3 mm",
        "outerdim": "60.3 mm",
        "inches": '2 "'
    }, {
        "innerdim": "72.1 mm",
        "outerdim": "76.1 mm",
        "inches": '2.5 "'
    }, {
        "innerdim": "80 mm"
    }, {
        "innerdim": "100 mm"
    }, {
        "innerdim": "150 mm"
    }];
    let select = document.getElementById("selectDim");

    for (let i = select.childNodes.length - 1; i >= 0; i--) {
        select.removeChild(select.childNodes[i]);
    }

    for (let i = 0; i < dimStainless.length; i++) {
        if (dimStainless[i].outerdim != undefined) {
            let option = document.createElement("option");

            option.text = dimStainless[i].outerdim;
            select.add(option);
        }
    }
    for (let i = 0; i < dimStainless.length; i++) {
        if (dimStainless[i].inches != undefined) {
            let option = document.createElement("option");

            option.text = dimStainless[i].inches;
            select.add(option);
        }
    }
}

/**
 * enterPressed - Do the calculations when enter is pressed.
 *
 * @param {key} Enter
 * @param {event} Event
 *
 * @returns {void}
 */
function enterPressed(enter, event) {
    if (event.keyCode == 13) {
        calcAll();
        enter.blur();
    }
}

// Used for selecting unit.
var selectedUnit = document.getElementById("selectUnit");

// Used for selecting pumps.
var selectedPumps = document.getElementById("pump-suggestions");

/**
 * calcAll - Calculates everything.
 *
 * @returns {void}
 */
function calcAll() {
    let height = parseFloat(document.getElementById("height").value);
    let length = parseFloat(document.getElementById("length").value);
    let selectedDim = parseFloat(document.getElementById("selectDim").value);
    let wantedFlow = parseFloat(document.getElementById("flow").value);
    let mu = parseFloat(document.getElementById("mu").value);

    checkValidLogin();

    selectedDim = changeDim(selectedDim);
    wantedFlow = checkUnit(wantedFlow);

    let lostPress = calculations.calcPressure(wantedFlow, mu, selectedDim, length);

    lostPress *= 9.81;
    let velocity = calculations.calcVelocity(wantedFlow, selectedDim);
    let totalPress = calculations.totalPressure(lostPress, height);

    getPumps(totalPress, selectedDim);

    let roundVel = velocity.toFixed(2);
    let roundPress = lostPress.toFixed(2);
    let roundTotal = totalPress.toFixed(2);

    if (roundTotal == "NaN" || roundTotal < 0 ||
        roundPress == "NaN" || roundPress < 0 ||
        roundVel == "NaN" || roundVel < 0) {
        if (roundTotal == "NaN" || roundTotal < 0) {
            document.getElementById("totalPressure").innerText = "-";
        }
        if (roundPress == "NaN" || roundPress < 0) {
            document.getElementById("pressureLoss").innerText = "-";
        }
        if (roundVel == "NaN" || roundVel < 0) {
            document.getElementById("flowSpeed").innerText = "-";
        }
        if (height == "NaN") {
            document.getElementById("staticPressure").innerText = "0";
        } else {
            document.getElementById("staticPressure").innerText = height;
        }

        alert("Ger ej ett dugligt värde");
    } else {
        document.getElementById("staticPressure").innerText = height;
        document.getElementById("flowSpeed").innerText = roundVel;
        document.getElementById("pressureLoss").innerText = roundPress;
        document.getElementById("totalPressure").innerText = roundTotal;
    }

    resetPumps();
}

/**
 * getPumps - Fetches all the pumps from the database.
 *
 * @param {number} Height
 * @param {number} Dimension
 *
 * @returns {void}
 */
const getPumps = async (height, selectedDim) => {
    let json = await API.get(configuration.apiURL +
        "/obj/type/Pump?token=" + localStorage.getItem("token"));

    recommendPump(json, height, selectedDim);
};

/**
 * checkUnit - Changes to the right unit.
 *
 *  @param {number} Flow
 *
 * @returns {number} Wanted flow
 */
function checkUnit(wantedFlow) {
    switch (selectedUnit.value) {
        case "lps":
            wantedFlow /= 1000;
            break;
        case "lpm":
            wantedFlow /= 1000 * 60;
            break;
        case "m3ph":
            wantedFlow /= 3600;
            break;
        default:
            break;
    }

    return wantedFlow;
}

/**
 * convertUnit - Converts units.
 *
 *  @param {number} Flow
 *''
 * @returns {number} Wanted flow
 */
function convertUnit(wantedFlow) {
    switch (selectedUnit.value) {
        case "lpm":
            wantedFlow *= 60;
            break;
        case "m3ph":
            wantedFlow *= 3.6;
            break;
        default:
            break;
    }

    return wantedFlow;
}

/**
 * recommendPump - Recommends pumps according to calculations.
 *
 * @param {object} Pumps
 * @param {number} Height
 * @param {number} Dimension
 *
 * @returns {void}
 */
function recommendPump(pumps, height, selectedDim) {
    checkValidLogin();
    let found = false;
    let mps = 0;
    let parent;
    let div;

    for (let i = 0; i < pumps.length; i++) {
        for (let k = 0; k < pumps[i].Pumpkurva.length; k++) {
            if (pumps[i].Pumpkurva[k].y == height) {
                mps = checkUnit(calculations.calcVelocity(pumps[i].Pumpkurva[k].x));
                if (mps >= 0.6 && mps <= 3) {
                    div = document.createElement("div");
                    div.className = "obj-container";
                    div.innerHTML =
                        `<div class="obj">
							<img src="${pumps[i].Bild}"/>
							</div>
							<div class="obj-desc">${pumps[i].Modell}</div>
							<img class="pumpCurve" src="${pumps[i].Bildkurva}"/>
							<div class="obj-desc">${mps.toFixed(2)} m/s</div>`;

                    parent = document.getElementById('pump-suggestions');
                    parent.appendChild(div);

                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            if (height < pumps[i].Pumpkurva[0].y && height >
                pumps[i].Pumpkurva[pumps[i].Pumpkurva.length - 1].y) {
                mps = convertUnit(checkUnit(calculations.calcVelocity(
                    calculations.estPumpValue(height, pumps[i].Pumpkurva),
                    selectedDim)));
                if (mps >= 0.6 && mps <= 3) {
                    div = document.createElement("div");
                    div.className = "obj-container";
                    div.innerHTML =
                        `<div class="obj">
							<img src="${pumps[i].Bild}"/>
							</div>
							<div class="obj-desc">${pumps[i].Modell}</div>
							<img class="pumpCurve" src="${pumps[i].Bildkurva}"/>
							<div class="obj-desc">${mps.toFixed(2)} m/s</div>`;

                    parent = document.getElementById('pump-suggestions');
                    parent.appendChild(div);
                }
            }
            found = false;
        }
    }
}

/**
 * resetPumps - Resets the pump suggestions.
 *
 * @returns {void}
 */
function resetPumps() {
    for (let i = selectedPumps.childNodes.length - 1; i >= 0; i--) {
        selectedPumps.removeChild(selectedPumps.childNodes[i]);
    }
}

/**
 * changeDim - Changes the outer dimension to inner dimension.
 *
 *  @param {number} Dimension
 *
 * @returns {number} Innerdimension
 */
function changeDim(selectedDim) {
    selectedDim = "";

    if (document.getElementById("material").value == "PEM") {
        selectedDim += "P";
    } else if (document.getElementById("material").value == "PE") {
        selectedDim += "PE";
    } else {
        selectedDim += "L";
    }
    if (document.getElementById("material").value == "stainless") {
        selectedDim += "IN";
    } else {
        selectedDim += "O";
    }
    selectedDim += parseFloat(document.getElementById("selectDim").value);

    let innerdim = {
        "PO40": 35.2,
        "PO50": 44,
        "PO63": 55.4,
        "PO75": 66.0,
        "PO90": 79.2,
        "PEO110": 96.8,
        "PEO160": 141,
        "PEO180": 158.6,
        "PEO200": 176.2,
        "PEO225": 198.2,
        "PEO250": 220.4,
        "PEO315": 227.6,
        "PEO400": 352.6,
        "PEO450": 396.6,
        "PEO500": 440.6,
        "LO42.4": 38.4,
        "LIN1.25": 38.4,
        "LO48.3": 44.3,
        "LIN1.5": 44.3,
        "LO60.3": 56.3,
        "LIN2": 56.3,
        "LO76.1": 72.1,
        "LIN2.5": 72.1
    };

    return innerdim[selectedDim];
}


/**
 * checkValidLogin - makes sure that the user is logged in to see the page
 */
const checkValidLogin = async () => {
    let token = localStorage.getItem("token");

    if (!token) {
        localStorage.token = "";
        window.location = "index.html";
        return false;
    }

    let req = await API.get(configuration.apiURL + "/user/validate?token=" + token);

    if (req.error) {
        if (req.error == true) {
            localStorage.token = "";
            window.location = "index.html";
            console.log("request error");
            console.log(req);
            return false;
        } else {
            return true;
        }
    }
};

checkValidLogin();
