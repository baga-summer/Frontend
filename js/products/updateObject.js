/*global configuration, Chart, API*/
let token = localStorage.getItem('token');
let id = new URL(window.location.href).searchParams.get('id');
let base64Image;
let myLineChart;

/**
 * loadObject - Fetch object attributes and display them in right place on page
 *
 * @returns {void}
 */
let loadObject = async () => {
    let json = await API.get(`${configuration.apiURL}/obj/id/${id}?token=${token}`);
    let main = document.getElementsByClassName('main-wrap')[0];
    let pumps;

    for (let key in json[0]) {
        switch (key) {
            case 'Modell':
                main.innerHTML +=
                    `<label for="${key}">${key}</label><br>
                        <input class="text-input" id=${key} type="text" value="${json[0][key]}">
                            <br><br>`;
                break;
            case 'Kategori':
                main.innerHTML +=
                    `<label for="${key}">${key}</label><br>
        <input class="text-input" type="text" id="${key}" value=${json[0][key]} disabled><br><br>`;
                break;

            case 'Pump':
                pumps = await API.get(`${configuration.apiURL}/obj/type/Pump?token=${token}`);

                pumpChoice(json[0].Pump, json[0]["Antal pumpar"], pumps);
                break;
            case 'Bildkurva':
                main.innerHTML +=
                    `<div><label for="${key}">Pumpkurva</label><br>
							 <img id=${key} src="${json[0][key]}"/>
							 <a id="newPumpCurve"
							 class="removeButton">Skapa en ny pumpkurva</a><br><br></div>`;
                break;
            case 'Pumpkurva':
                break;
            case 'Bild':
                main.innerHTML +=
                    `<label for="${key}">Produktbild</label><br>
								 <img id="currentImage" src="${json[0][key]}"/>
					  	 		<input id="imageFile" type="file" name="pic" accept=".png">`;

                base64Image = json[0][key];
                break;

            case 'Antal pumpar':
            case '_id':
            case 'creatorID':
            case 'isDisabled':
            case 'approved':
                break;

            default:
                main.innerHTML +=
                    `<div class="oldInputDiv"><label for="${key}">${key}</label><br>
                <input id=${key} class="oldInput text-input" type="text" value="${json[0][key]}">
                    <a class="removeButton button small-button danger-bt">Ta bort fält</a></div>`;
                break;
        }
    }

    main.innerHTML +=
        `<div class="button-wrap">
						<a id="newFieldButton" class="button small-button">Lägg till nytt fält</a>
					</div>
					<div id="sendButton" class="button-wrap">
					<br><br>
					<a id="send" class="button">Uppdatera</a>
				</div>`;

    let buttons = document.getElementsByClassName('removeButton');

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', () => {
            let parent = buttons[i].parentElement;

            parent.parentElement.removeChild(parent);
        });
    }

    if (document.getElementById('newPumpCurve')) {
        document.getElementById('newPumpCurve').addEventListener('click', () => {
            newPumpCurve();
        });
    }

    document.getElementById('imageFile').addEventListener('change', () => {
        encodeImageFileAsURL(document.getElementById('imageFile'));
    });

    document.getElementById('newFieldButton').addEventListener('click', () => {
        newField(main);
    });

    document.getElementById('send').addEventListener('click', () => {
        saveObject(json);
    });
};

loadObject();

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
 * pumpChoice - Adds a select HTML element with all current pumps as options
 *
 * @param {type} currentPump Objects current picked pump
 * @param {type} nr          Current nr of pumps
 * @param {type} pumps       Object data with all pumps
 *
 * @returns {void}
 */
let pumpChoice = (currentPump, nr, pumps) => {
    let div = document.createElement('div');

    div.id = "newPump";

    div.innerHTML =
        `<br><label>Pump</label><br>
		<select class="select-input" id="pumpSelect">
            <option selected>${currentPump}</option>
        </select><br>
		<label>Antal pumpar</label><br>
		<input class="number-input" id="nrOfPumps" type="number" value="${nr}">`;

    document.getElementById('Kategori').after(div);
    let select = document.getElementById('pumpSelect');

    for (let i = 0; i < pumps.length; i++) {
        if (currentPump != pumps[i].Modell) {
            let option = document.createElement('option');

            option.text = pumps[i].Modell;
            select.add(option);
        }
    }
};

/**
 * newPumpCurve - Adds a new pump curve with input fields for user input and updates graph after
 * 				- each input
 *
 * @returns {void}
 */
let newPumpCurve = () => {
    let div = document.createElement('div');

    div.id = "pumpCurve";
    div.innerHTML =
        `<label>Pumpkurva</label><br>
	<input class="newKey" id="height" type="number" step="0.1" placeholder="Höjd (m)">
	<input class="newInput" id="velocity" type="number" step="0.1" placeholder="Flöde (l/s)">
	<a class="button2">Lägg till</a>
	<canvas id="myChart"></canvas>`;

    document.getElementById('Kategori').after(div);

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
        myLineChart.data.datasets[0].data.push({
            x: velocity.value,
            y: height.value
        });

        velocity.value = "";
        height.value = "";
        height.focus();

        myLineChart.update();
    });
};


/**
 * saveObject - Collects all relative data and puts it into one json object and POST it to
 * 			  - API to update current object
 *
 * @param {type} json Old json data from current object
 *
 * @returns {void}
 */
let saveObject = async (json) => {
    let data = {};
    let newFields = document.getElementsByClassName('newField');

    for (let key in json[0]) {
        switch (key) {
            case 'Bild':
                data[key] = base64Image;
                break;
            case 'isDisabled':
            case 'approved':
            case 'creatorID':
                data[key] = json[0][key];
                break;

            case 'Pump':
                data.Pump = document.getElementById('pumpSelect').value;
                data["Antal pumpar"] = document.getElementById('nrOfPumps').value;
                break;
            case 'Bildkurva':
                if (document.getElementById(key)) {
                    data[key] = document.getElementById(key).src;
                    data.Pumpkurva = json[0].Pumpkurva;
                } else {
                    data.Bildkurva = myLineChart.toBase64Image();
                    data.Pumpkurva = myLineChart.data.datasets[0].data;
                }
                break;
            case 'Pumpkurva':
            case '_id':
                break;

            default:
                if (document.getElementById(key)) {
                    data[key] = document.getElementById(key).value;
                }
        }
    }

    for (let i = 0; i < newFields.length; i++) {
        data[newFields[i].children[0].value] = newFields[i].children[1].value;
    }


    await API.post(`${configuration.apiURL}/obj/update/${id}?token=${token}`, 'application/json',
        JSON.stringify(data));

    document.location.href = "listProducts.html";
};


/**
 * encodeImageFileAsURL - Convert image to basic64 format by using FileReader
 * 						- @see {@link https://developer.mozilla.org/sv-SE/docs/Web/API/FileReader}
 * 						- This is done to be able to save image inside database
 *
 * @param {input type="file"} element Input field that contains uploaded image from user
 *
 * @returns {void}
 */
let encodeImageFileAsURL = (element) => {
    let file = element.files[0];
    let reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
        base64Image = reader.result;
        document.getElementById('currentImage').src = reader.result;
    };
};
