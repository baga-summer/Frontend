// Changes material to the selected one
export let pipes = {
    listen: (elem) => {
        elem.addEventListener("change", () => {
            let data;

            pipes.clear();
            if (elem.value === "PEM") {
                data = pipes.PEM();
            } else if (elem.value === "PE") {
                data = pipes.PE();
            } else if (elem.value === "Rostfria") {
                data = pipes.stainless();
            }
            let newNode = document.createElement('div');

            newNode.innerHTML = "<br><label>Ytterdiameter </label><br>";
            newNode.id = "Ytterdiameter";

            let select = document.createElement('select');

            select.className = "dimension select-input";
            let option;

            for (let i = 0; i < data.length; i++) {
                if (data[i].outerdim != null) {
                    option = document.createElement("option");
                    option.text = data[i].outerdim;
                    option.value =
                        `${data[i].innerdim},${data[i].outerdim},${data[i].strokeWeight}`;

                    if (data[i].inches != null) {
                        option.text += ` (${data[i].inches} tum)`;
                    }
                    select.add(option);
                }
            }
            newNode.appendChild(select);
            let referenceNode = elem;

            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        });
        elem.value = "PEM";
        elem.dispatchEvent(new Event('change'));
    },

    /**
     * PEMPipe - Creates the dimensions for the PEM material
     *
     * @returns {void}
     */
    PEM: () => {
        return [{
            "innerdim": "35.2 mm",
            "outerdim": "40 mm",
            "strokeWeight": "2"
        }, {
            "innerdim": "44 mm",
            "outerdim": "50 mm",
            "strokeWeight": "3"
        }, {
            "innerdim": "55.4 mm",
            "outerdim": "63 mm",
            "strokeWeight": "4"
        }, {
            "innerdim": "66 mm",
            "outerdim": "75 mm",
            "strokeWeight": "5",
        }, {
            "innerdim": "79.2 mm",
            "outerdim": "90 mm",
            "strokeWeight": "6"
        }];
    },

    /**
     * PEPipe - Creates the dimensions for the PE material
     *
     * @returns {void}
     */
    PE: () => {
        return [{
            "innerdim": "96.8 mm",
            "outerdim": "110 mm",
            "strokeWeight": "7"
        }, {
            "innerdim": "141 mm",
            "outerdim": "160 mm",
            "strokeWeight": "8"
        }, {
            "innerdim": "158.6 mm",
            "outerdim": "180 mm",
            "strokeWeight": "9"
        }, {
            "innerdim": "176.2 mm",
            "outerdim": "200 mm",
            "strokeWeight": "10"
        }, {
            "innerdim": "198.2 mm",
            "outerdim": "225 mm",
            "strokeWeight": "11"
        }, {
            "innerdim": "220.4 mm",
            "outerdim": "250 mm",
            "strokeWeight": "12"
        }, {
            "innerdim": "277.6 mm",
            "outerdim": "315 mm",
            "strokeWeight": "13"
        }, {
            "innerdim": "352.6 mm",
            "outerdim": "400 mm",
            "strokeWeight": "14"
        }, {
            "innerdim": "396.6 mm",
            "outerdim": "450 mm",
            "strokeWeight": "15"
        }, {
            "innerdim": "440.6 mm",
            "outerdim": "500 mm",
            "strokeWeight": "16"
        }];
    },

    /**
     * stainlessPipe - Creates the dimensions for the stainless material
     *
     * @returns {void}
     */
    stainless: () => {
        return [{
            "innerdim": "38.4 mm",
            "outerdim": "42.4 mm",
            "inches": '1.25 "',
            "strokeWeight": "2"
        }, {
            "innerdim": "44.3 mm",
            "outerdim": "48.3 mm",
            "inches": '1.5 "',
            "strokeWeight": "2"
        }, {
            "innerdim": "56.3 mm",
            "outerdim": "60.3 mm",
            "inches": '2 "',
            "strokeWeight": "3"
        }, {
            "innerdim": "72.1 mm",
            "outerdim": "76.1 mm",
            "inches": '2.5 "',
            "strokeWeight": "4"
        }, {
            "innerdim": "80 mm"
        }, {
            "innerdim": "100 mm"
        }, {
            "innerdim": "150 mm"
        }];
    },

    clear: () => {
        if (document.getElementById('Ytterdiameter')) {
            document.getElementById('Ytterdiameter').remove();
        }
    },
};
