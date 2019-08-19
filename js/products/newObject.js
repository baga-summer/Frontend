/*global configuration, Chart, API */
let token = localStorage.getItem('token');
let base64Image = undefined;
let base64Icon = undefined;
let myLineChart;

/**
 * loadrequiredFields - Load basic required input fields for all new object.
 * 					  - Add event listener for new fields, new category and send.
 * 					  - old token and redirect to login page.
 * 					  - Other errors are put in console
 *
 * @returns {void}
 */
let loadrequiredFields = async () => {
    let json = await API.get(
        `${configuration.apiURL}/obj/categories?token=${token}`);
    let main = document.getElementsByClassName('main-wrap')[0];

    main.innerHTML +=
        `<label>Kategori</label><br>
				<select class="select-input" id="Kategori">
                <option disabled selected></option></select><br>`;

    let select = document.getElementById("Kategori");

    for (let i = 0; i < json.length; i++) {
        let option = document.createElement('option');

        option.id = json[i];
        option.text = json[i];
        select.add(option);
    }

    let option = document.createElement('option');

    option.text = "Ny kategori";
    select.add(option);


    main.innerHTML +=
        `<br><label>Modell</label><br>
			 <input class="text-input" id="Modell" type="text"><br><br>
			 <label>Produktbild</label><br>
			 <img id="currentImage"/>
  	 		<input id="imageFile" type="file" name="pic" accept=".png">
			<div class="button-wrap">
				<a id="newFieldButton" class="button small-button">Lägg till nytt fält</a>
			</div>
				<div id="sendButton" class="button-wrap">
					<br><br>
					<a id="send" class="button">Skapa</a>
				</div>`;

    document.getElementById('imageFile').addEventListener('change', () => {
        encodeImageFileAsURL(
            document.getElementById('imageFile'),
            0,
            document.getElementById('currentImage')
        );
    });

    document.getElementById('newFieldButton').addEventListener('click', () => {
        newField(main);
    });

    document.getElementById('send').addEventListener('click', () => {
        createObject(json);
    });

    document.getElementById('Kategori').addEventListener('change', async (event) => {
        let value = event.target.value;
        let newInput = document.getElementById('newCategoryInput');
        let pumpCurve = document.getElementById('pumpCurve');
        let newPumpDiv = document.getElementById('newPump');

        if (value == "Pumpstationer") {
            let json = await API.get(
                `${configuration.apiURL}/obj/type/Pump?token=${token}`);

            newPump(json);
        } else if (newPumpDiv) {
            newPumpDiv.parentElement.removeChild(newPumpDiv);
        }

        if (value == "Ny kategori") {
            newCategory(value);
        } else if (newInput) {
            let parent = newInput.parentElement;

            parent.parentElement.removeChild(parent);
        }

        if (value == "Pump") {
            newPumpCurve();
        } else if (pumpCurve) {
            pumpCurve.parentElement.removeChild(pumpCurve);
        }
    });
};

loadrequiredFields();


/**
 * newPump - Adds a select HTML element with all current pumps as options
 *
 * @param {Object} pumps object data with all pumps
 *
 * @returns {void}
 */
let newPump = (pumps) => {
    let div = document.createElement('div');

    div.id = "newPump";

    div.innerHTML =
        `<br><label>Pump</label>
		<select class="select-input" id="pumpSelect">
            <option disabled selected></option>
        </select>
		<label>Antal pumpar</label><br>
		<input class="number-input" id="nrOfPumps" type="number">`;

    document.getElementById('Modell').after(div);
    let select = document.getElementById('pumpSelect');

    for (let i = 0; i < pumps.length; i++) {
        let option = document.createElement('option');

        option.text = pumps[i].Modell;
        select.add(option);
    }
};

/**
 * newCategory - Adds input field for the creation of a new category
 *
 * @returns {void}
 */
let newCategory = () => {
    let div = document.createElement('div');

    div.innerHTML =
        `<br><label>Den nya kategorin </label><br>
		<input class="text-input" id="newCategoryInput" type="text">
		 <label>Kategoriikon</label><br>
		<img id="currentIcon"/>
	   <input id="iconFile" type="file" name="pic" accept=".png">`;
    document.getElementById('Kategori').after(div);

    document.getElementById('iconFile').addEventListener('change', () => {
        encodeImageFileAsURL(
            document.getElementById('iconFile'),
            1,
            document.getElementById('currentIcon')
        );
    });
};


/**
 * newPumpCurve - Adds a new pump curve (HTML canvas) with input fields for user input and
 * 				- updates graph after each input
 *
 * @returns {void}
 */
let newPumpCurve = () => {
    let div = document.createElement('div');

    div.id = "pumpCurve";
    div.innerHTML =
        `<br><label>Pumpkurva</label><br>
	<input class="number-input newKey" id="height" type="number" step="0.1" placeholder="Höjd (m)">
        <input class="number-input newInput" id="velocity"
            type="number" step="0.1" placeholder="Flöde (l/s)">
	<a class="button2 button small-button">Lägg till</a>
        <br>
	<input class="number-input newKey" id="heightID" type="string"
            placeholder="Kolumn namn för höjd">
        <input class="number-input newInput" id="velocityID"
            type="string" placeholder="Kolumn namn för hastighet">
        <label for="upload" class="custom-file-upload">
            Ladda upp
        </label>
        <input class="button2" id="upload" type=file name="files[]" accept=".xls">


    <br><br>
	<canvas id="myChart"></canvas>`;

    document.getElementById('Modell').after(div);
    document.getElementById('upload').addEventListener('change', handleFileSelect, false);

    let ctx = document.getElementById('myChart').getContext('2d');

    myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "höjd",
                fill: false,
                borderColor: 'rgb(255, 99, 132)',
                data: [],
            }]
        },

        options: {
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: (tooltipItem) => {
                        return tooltipItem.yLabel;
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    scaleLabel: {
                        display: true,
                        labelString: "l/s"
                    },
                    ticks: {
                        beginAtZero: true,
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "meter"
                    },
                    ticks: {
                        beginAtZero: true,
                    }
                }],
            }
        }
    });

    let velocity = document.getElementById('velocity');
    let height = document.getElementById('height');
    let button = document.getElementsByClassName('button2');

    button = button[0];

    velocity.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            button.click();
        }
    });


    button.addEventListener('click', () => {
        if (velocity.value != "" && height.value != "") {
            let duplicate = false;
            let dupPos = -1;

            for (let i = 0; i < myLineChart.data.datasets[0].data.length; i++) {
                if (myLineChart.data.datasets[0].data[i].x == velocity.value) {
                    duplicate = true;
                    dupPos = i;
                    break;
                }
            }
            if (!duplicate) {
                myLineChart.data.datasets[0].data.push({
                    x: velocity.value,
                    y: height.value
                });
            } else {
                myLineChart.data.datasets[0].data[dupPos].y = height.value;
            }

            myLineChart.data.datasets[0].data = myLineChart.data.datasets[0].data.sort(compare);
            velocity.value = "";
            height.value = "";
            height.focus();

            myLineChart.update();
        }
    });

    button.addEventListener('click', () => {
        console.log("etst");
    });
};


/**
 * Function for applying an excel document of the user's choosing.
 * No parameters are needed and the only thing returned is an indication of
 * success or failure.
 *
 * @returns void
 */
function uploadCurve() {
    myLineChart.data.datasets[0].data = [];
    myLineChart.update();
    this.parseExcel = function(file) {
        let reader = new FileReader();

        reader.onload = function(e) {
            let data = e.target.result;
            let workbook = XLSX.read(data, {
                type: 'binary'
            });

            workbook.SheetNames.forEach(function(sheetName) {
                let XLrowObject =
                        XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                let jsonObject = JSON.stringify(XLrowObject);
                let obj = JSON.parse(jsonObject);
                // modify the for loop to support various excel documents if all
                // are not written in the same manner.
                let heightName = document.getElementById("heightID").value;
                let velocityName = document.getElementById("velocityID").value;

                if (obj[1].hasOwnProperty(heightName) && obj[1].hasOwnProperty(velocityName)) {
                    for (let i = 0; i < obj.length; i++) {
                        myLineChart.data.datasets[0].data.push({
                            x: obj[i][heightName],
                            y: (obj[i][velocityName])
                        });
                        myLineChart.update();
                    }
                } else {
                    for (var i = 8; i < obj.length &&
                            !isNaN(obj[i].__EMPTY); i++) {
                        myLineChart.data.datasets[0].data.push({
                            x: obj[i].__EMPTY,
                            y: (obj[i].__EMPTY_1 / 60)
                        });
                        myLineChart.update();
                    }
                }
                jQuery( '#xlx_json' ).val( jsonObject );
            });
        };
        reader.onerror = function(ex) {
            console.log(ex);
        };

        reader.readAsBinaryString(file);
    };
}

/**
 * Function to tall on excel translation
 *
 * @param {FILE} file to be translated
 * @returns {void}
 */
function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object
    let xl2json = new uploadCurve();

    xl2json.parseExcel(files[0]);
}

/**
 * Help function for array numeric sort
 *
 * @param {JSON} a, first value to compare
 * @param {JSON} b, second value to compare
 * @returns {Number} if value is bigger, smaller or equal
 */
const compare = (a, b) => {
    if (parseFloat(a.x) < parseFloat(b.x)) {
        return -1;
    }
    if (parseFloat(a.x) > parseFloat(b.x)) {
        return 1;
    }
    return 0;
};

/**
 * newField - Adds two new input fields everytime is called where the user can
 * 			- input title and data of attribute of the new object
 *
 * @returns {void}
 */
let newField = () => {
    let div = document.createElement('div');

    div.className = 'newField';
    div.innerHTML =
        `<input class="newKey text-input" type="text" placeholder="Titel">
		<input class="newInput text-input" type="text" placeholder="Värde">
		<a class="removeButton button small-button danger-bt">Ta bort fält</a>`;

    document.getElementById('sendButton').before(div);

    let button = document.getElementsByClassName('removeButton');

    button = button[button.length - 1];

    button.addEventListener('click', () => {
        button.parentElement.parentElement.removeChild(div);
    });
};

/**
 * createObject - Calls when user pressed send button
 * 				- Collects all attributes and put them in json format
 * 				- POST result to API and redirect to listProducts.html if no errors were found
 *
 * @returns {void}
 */
let createObject = async () => {
    let data = {};
    let newCategory = document.getElementById('newCategoryInput');
    let pumpCurve = document.getElementById('pumpCurve');
    let newFields = document.getElementsByClassName('newField');
    let newPumpDiv = document.getElementById('newPump');

    data.Modell = document.getElementById('Modell').value;

    if (newCategory) {
        data.Kategori = newCategory.value;

        let icon = { Kategori: newCategory.value, Bild: base64Icon };

        await API.post(`${configuration.apiURL}/obj/categories/icon/insert?token=${token}`,
            'application/json', JSON.stringify(icon));
    } else {
        data.Kategori = document.getElementById('Kategori').value;
    }

    if (newPumpDiv) {
        data.Pump = document.getElementById('pumpSelect').value;
        data["Antal pumpar"] = document.getElementById('nrOfPumps').value;
    }

    if (pumpCurve) {
        data.Bildkurva = myLineChart.toBase64Image();
        data.Pumpkurva = myLineChart.data.datasets[0].data;
    }

    data.Bild = base64Image;
    data.isDisabled = 0;
    data.approved = 0;

    for (let i = 0; i < newFields.length; i++) {
        data[newFields[i].children[0].value] = newFields[i].children[1].value;
    }

    await API.post(`${configuration.apiURL}/obj/insert?token=${token}`, 'application/json',
        JSON.stringify(data));

    document.location.href = "listProducts.html";
};


/**
 * encodeImageFileAsURL - Convert image to basic64 format by using FileReader
 * 						- @see {@link https://developer.mozilla.org/sv-SE/docs/Web/API/FileReader}
 * 						- This is done to be able to save image inside database
 *
 * @param {input type="file"} element Input field that contains uploaded image from user
 * @param {number} id Dictates if base64Image or base64Icon should get overwritten
 * @param {img} image This image element shows the user which image they have selected
 *
 * @returns {void}
 */
let encodeImageFileAsURL = (element, id, image) => {
    let file = element.files[0];
    let reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
        if (id == 0) {
            base64Image = reader.result;
        } else {
            base64Icon = reader.result;
        }
        image.src = reader.result;
    };
};
