export let popup = {
    marker: (attributes, objectData) => {
        let info = "";
        let info2 = "";
        let info3 = "";
        let similarAttributes = [
            "Kategori",
            "Modell",
            "id",
            "M ö.h",
        ];

        let calculationInfo = [
            "Totaltryck",
            "Flödeshastighet",
            "Antal personer som högst",
            "Flöde",
        ];

        for (let key in attributes) {
            if (similarAttributes.includes(key)) {
                let i = similarAttributes.indexOf(key);

                info +=
                    `<tr><td>${similarAttributes[i]}: ${attributes[key]}</td></tr>`;
            } else if (calculationInfo.includes(key)) {
                info2 += `<tr><td>${key}: ${attributes[key]}</td></tr>`;
            } else {
                info3 += `<tr><td>${key}: ${attributes[key]}</td></tr>`;
            }
        }

        let selectInfo = "";
        let option = "";
        let select = document.createElement("select");

        select.classList = "select-input";
        select.id = "pumpingStation";
        if (attributes.Kategori == "Pumpstationer") {
            for (let i = 0; i < objectData.length; i++) {
                if (objectData[i].Kategori == "Pumpstationer") {
                    if (objectData[i].Modell == attributes.Modell) {
                        option = document.createElement("option");
                        option.text = objectData[i].Modell;
                        select.add(option, select[0]);
                    } else {
                        option = document.createElement("option");
                        option.text = objectData[i].Modell;
                        select.add(option, select[-1]);
                    }
                }
            }

            let div = document.createElement("div");

            div.innerHTML = `<span>Byt pumpstation</span> `;
            div.appendChild(select);
            div.appendChild(document.createElement("br"));
            div.appendChild(document.createElement("br"));
            selectInfo = div.innerHTML;
        }

        return `<ul class='accordion2'>
        ${selectInfo}
    <li>
        <label for='cp-1'>Info</label>
        <input type='radio' name='a' id='cp-1' checked='checked'>
        <div class='content'>
			<table>
		        ${info}
			</table>
		</div>
    </li>
	<li>
        <label for='cp-2'>Beräkningsinfo</label>
        <input type='radio' name='a' id='cp-2'>
        <div class='content'>
			<table>
                ${info2}
            </table>
		</div>
    </li>
    <li>
        <label for='cp-3'>Övrig info</label>
        <input type='radio' name='a' id='cp-3'>
        <div class='content'>
			<table>
                ${info3}
            </table>
		</div>
    </li>`;
    },

    house: (address, type, nop, flow, color) => {
        return `<b id="address">${address}</b><br>
		<div class="housePopup">
	    Typ:<br> <input type="text" class="text-input" id="houseType" value="${type}"><br>
		Färg: <br><input type="color" id="houseColor" value="${color}"><br>

	    Personer per hushåll:
		<br><input type="number" class="number-input" id="per" value="${nop}"><br>
	    Flöde per person/dygn:
		<input class="number-input" disabled type="number" id="cons" value="${flow}"><br><br>
	    <input type="button" class="updateValuesInHouse button" value="Ändra">
	    </div>`;
    },

    pipe: (tilt) => {
        return `<label>Material</label><br>
				<select class="materialPopup select-input">
					<option>PEM</option>
					<option>PE</option>
					<option>Rostfria</option>
				</select>
				<br><label>Statisk höjd</label><br>
				<input class="number-input" type="number" step="0.1" id="tilt"
                name="tilt" value=${tilt}><br><br>
				<input class="button small-button" type="button"
                id="pipeSpecifications" value="Skicka">`;
    },

    branch: `<b>Förgrening<br>`,

    changeCoord: (latlng) => {
        return `
    <li>
        <label for='cp-4'>Ändra koordinater</label>
        <input type='radio' name='a' id='cp-4'>
        <div class='content'>
			<b> Latitud </b>
			<input class="text-input" type="text" id='latitud' value=${latlng.lat}>
        	<b> Longitud </b>
			<input class="text-input" type="text" id='longitud' value=${latlng.lng}>
		</div>
    </li>
</ul><br>
<input type="button" class="sendCoords button small-button" value="Ändra" >`;
    }
};
