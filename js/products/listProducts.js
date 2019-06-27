/*global configuration, API*/
/*eslint no-unused-vars: 0*/
let token = localStorage.getItem('token');

/**
 * loadProducts - Makes API call to get all created products and displays on html page
 *
 * @returns {void}
 */
let loadProducts = async () => {
    let json = await API.get(`${configuration.apiURL}/obj/created?token=${token}`);
    let activeProducts = document.getElementById('activeProducts');
    let inactiveProducts = document.getElementById('inactiveProducts');

    if (json.length > 0) {
        for (let i = 0; i < json.length; i++) {
            if (json[i].isDisabled == 0) {
                let toggleGlobal = "";

                if (json[i].requestApprove == 0) {
                    toggleGlobal = `<a class="tablepart tablelink"
                    onclick="requestGlobal('${json[i]._id}');"
                    title="Begär produkten global">
                        <i class="material-icons">language</i>
                    </a>`;
                } else {
                    toggleGlobal = `<a class="tablepart tablelink"
                    onclick="withdrawRequest('${json[i]._id}');"
                    title="Avbryt begäran om global produkt">
                        <i class="material-icons">schedule</i>
                    </a>`;
                }

                activeProducts.innerHTML +=
                    `<div class="table">
			<h2 class="tablepart">${json[i].Modell}</h2>
			<h2 class="tablepart">${json[i].Kategori}</h2>
			<img class="tablepart" src="${json[i].Bild}"/>
			<a class="tablepart tablelink" href="updateObject.html?id=${json[i]._id}">
				<i class="material-icons">settings</i>
			</a>` + toggleGlobal + `
<a class="tablepart tablelink"
onclick="disable('${json[i]._id}', 1);">
				<i class="material-icons">clear</i>
			</a>
			</div>`;
            } else {
                inactiveProducts.innerHTML +=
                    `<div class="table">
			<h2 class="tablepart">${json[i].Modell}</h2>
			<h2 class="tablepart">${json[i].Kategori}</h2>
			<img class="tablepart" src="${json[i].Bild}"/>
			<a class="tablepart tablelink" href="updateObject.html?id=${json[i]._id}">
				<i class="material-icons">settings</i>
			</a>
<a class="tablepart tablelink"
onclick="disable('${json[i]._id}', 0);">
				<i class="material-icons">done</i>
			</a>

			<a class="tablepart tablelink"
onclick="remove('${json[i]._id}');">
				<i class="material-icons">delete</i>
			</a>
			</div>`;
            }
        }
        activeProducts.innerHTML += '<div class="last-product"></div>';
        inactiveProducts.innerHTML +=
            '<div style="opacity:0.5;" class="last-product"></div>';
    } else {
        activeProducts.innerHTML +=
            `<div class="product">
				<h2>Inga produkter skapade ännu</h2>
			</div>`;
    }
};

loadProducts();

/**
* requestGlobal - sets flag to request specified product as global
* @param {string} target - the ID of the object to request global status for
*/
let requestGlobal = async (target) => {
    let res = await API.post(configuration.apiURL +
        "/obj/approve/" +
        target +
        "/1?token=" +
        token,
    "application/x-www-form-urlencoded");

    location.reload();
};

/**
* withdrawRequest - withdraws request for global status
* @param {string} target - the ID of the object to withdraw the request of global status for
*/
let withdrawRequest = async (target) => {
    let res = await API.post(configuration.apiURL +
        "/obj/approve/" +
        target +
        "/0?token=" +
        token,
    "application/x-www-form-urlencoded");

    location.reload();
};

/**
 * disable - disable the selected product by calling backend API
 *
 * @param {string} id the id of the product to be disabled
 * @param {int} value this is the value for isDisabled (0=active, 1=inactive)
 *
 */
let disable = async (id, value) => {
    let data = `isDisabled=${value}`;

    await API.post(configuration.apiURL + "/obj/disable/" + id + "?token=" + token,
        "application/x-www-form-urlencoded", data);

    location.reload();
};


/**
 * remove - Removes the selected product by calling backend API
 *
 * @param {type} id The id of the item to delete
 *
 */
let remove = async (id) => {
    await API.post(configuration.apiURL + "/obj/delete/" + id + "?token=" + token,
        "application/x-www-form-urlencoded", {});
    location.reload();
};
