/*global configuration API */

"use strict";

const adminContent = document.getElementById("adminContent");
const navLinks = document.getElementsByClassName('nav-link');
const token = localStorage.getItem("token");
const errorHolder = document.getElementById("errorHolder");

/**
* createElement - Function to quickly create elements with id and class attributes
* @param {string} idAttribute id for the element
* @param {string} classAttribute class for the element
* @return {element} Returns html element
*/
const createElement = (type, idAttribute = "", classAttribute = "") => {
    let newElement = document.createElement(type);

    if (idAttribute != "") {
        newElement.id = idAttribute;
    }
    if (classAttribute != "") {
        newElement.className = classAttribute;
    }
    return newElement;
};

/**
* appendElementToApp - Function to append new elements to either default or custom element.
* @param {element} elementToAppend - Element that gets apended
* @param {element} appendTo - element where the new elements will be appended to.
* Has a default value of adminContent.
*/
const appendElementToApp = (elementToAppend, appendTo = adminContent) => {
    appendTo.appendChild(elementToAppend);
};

/**
* sendErrorResponse, shows an error to the user based on parameter
* @param {string} errorToDisplay what the error box should say
* @param {string} type sets the class to that type of error so css can include color
* @return void
*/
const sendErrorResponse = (errorToDisplay, type="error-msg") => {
    let errorMsg = document.createElement("div");

    //add class and content to the error message box
    errorMsg.classList += type;
    errorMsg.innerText = errorToDisplay;
    errorMsg.addEventListener("click", () => {
        errorHolder.innerHTML = "";
    });
    //Clear error holder and insert a new error
    errorHolder.innerHTML = "";
    errorHolder.appendChild(errorMsg);
};

/**
* displayInstructions - Default screen on the admin page and it displays information
* about the different menu options
*/
const displayInstructions = () => {
    let infoTarget =  createElement("div", "main", "main-content");
    let infoTitle = createElement("h2", "slim-title");
    let infoText = createElement("div", "", "info-text");

    // Clear content element before we start appending new content
    adminContent.innerHTML = "";
    errorHolder.innerHTML = "";

    infoTitle.innerText = "Hej Administratör!";
    infoText.innerHTML = `<p>Det här är administationssidan. Här kan du
    <ul>
        <li>Aktivera / Avaktivera globala produkter</li>
        <li>Permanent radera globala produkter</li>
        <li>Administrera förfrågningar för nya globala produkter</li>
        <li>Skapa konton för nya användare</li>
        <li>Ta bort användare från systemet</li>
    </ul><p>
    <h2 class="slim-title">Globala produkter</h2><p>
    Globala produkter är produkter som är tillgängliga för alla användare att placera
    ut på kartan när de jobbar på ett projekt. Om produkten är inaktiv så kan den inte
    placeras ut på kartan av användare i deras projekt. Däremot så finns den kvar i
    systemet och kan aktiveras med bara
    ett knapptryck.</p>
    <h2 class="slim-title">Skapa ny användare</h2><p>
    Detta systemet är privat och begränsat till Baga och därför kan användare inte
    skapa egna konton, detta måste göras av en administratör. Klicka på 'Skapa ny användare'
    skriv in deras epostadress som de ska använda för att logga in. Användarna kan sedan gå
    in på sidan och klicka registrera. Registrering sker med en engångsnyckel som användaren
    får skickat till sin mail.
    </p>`;

    appendElementToApp(infoTitle, infoTarget);
    appendElementToApp(infoText, infoTarget);
    appendElementToApp(infoTarget);
};

/**
* showGlobalProductRequests- Displays the list of products awaiting global requests
*/
const showGlobalProductRequests = async () => {
    let pendingRequests = await API.get(configuration.apiURL +
        "/admin/obj/approve?token=" + token);
    let allGlobalItems = await API.get(configuration.apiURL +
        "/admin/obj/all?token=" + token);

    let mainContent = createElement("div", "main", "main-content");

    // Clear content element before we start appending new content
    adminContent.innerHTML = "";
    errorHolder.innerHTML = "";

    if (pendingRequests.error == true) {
        sendErrorResponse("Kunde inte läsa in produkter");
    }

    let requestedTitle = createElement("h2", "", "slim-title");

    requestedTitle.innerText = "Förfrågningar för globala produkter";
    appendElementToApp(requestedTitle, mainContent);

    if (pendingRequests.length == 0) {
        let message = createElement("div", "msg", "message");

        message.innerText = "Inga förfrågningar väntar på utvärdering";
        appendElementToApp(message, mainContent);
        appendElementToApp(mainContent);
    }

    //Just to be sure we don't get hit by an edgecase
    if (pendingRequests.length > 0) {
        for (var i = 0; i < pendingRequests.length; i++) {
            let pending = createElement("div", "", "pending-items");
            let image = createElement("img", "", "item-image");
            let wrapText = createElement("div", "", "item-text-wrap");
            let title = createElement("h4", "", "item-title");
            let category = createElement("h6", "", "item-category");
            let approve = createElement("a", "", "small-link item-approve");
            let deny = createElement("a", "", "small-link item-deny");

            image.src = pendingRequests[i].Bild;
            image.height = 50;
            title.innerText = pendingRequests[i].Modell;
            category.innerText = pendingRequests[i].Kategori;
            approve.innerText = "Godkänn";
            let tmpId = pendingRequests[i]._id;

            approve.addEventListener("click", async (event, id=tmpId) => {
                await API.post(configuration.apiURL +
                    "/admin/obj/approve/" +
                     id +
                    "/1?token=" +
                    token);
                showGlobalProductRequests();
            });
            deny.innerText = "Neka";
            deny.addEventListener("click", async (event, id=tmpId) => {
                await API.post(configuration.apiURL +
                    "/admin/obj/approve/" +
                    id +
                    "/0?token=" +
                    token);
                showGlobalProductRequests();
            });

            appendElementToApp(title, wrapText);
            appendElementToApp(category, wrapText);
            appendElementToApp(image, pending);
            appendElementToApp(wrapText, pending);
            appendElementToApp(approve, pending);
            appendElementToApp(deny, pending);
            appendElementToApp(pending, mainContent);
        }
        appendElementToApp(mainContent);
    }

    // If we have more than 0 global products, sort them into active and inactive
    // lists, then add them to the DOM.
    if (allGlobalItems.length > 0) {
        let activeProducts = [];
        let inactiveProducts = [];

        for (i = 0; i < allGlobalItems.length; i++) {
            if (allGlobalItems[i].isDisabled == 0 || allGlobalItems[i].isDisabled == undefined) {
                // Product is active
                activeProducts.push(allGlobalItems[i]);
            } else {
                //Product is NOT active
                inactiveProducts.push(allGlobalItems[i]);
            }
        }

        //Create a title for active global products
        let objTitle = createElement("h2", "", "slim-title");

        objTitle.innerText = "Aktiva globala produkter";
        appendElementToApp(objTitle, mainContent);
        // If we have active global products, show them
        if (activeProducts.length > 0) {
            for (i = 0; i < activeProducts.length; i++) {
                let tmpId = activeProducts[i]._id;
                let tmpObj = createElement("div", "", "pending-items");
                let tmpImage = createElement("img", "", "item-image");
                let tmpName = createElement("div", "", "item-name");
                let tmpCategory = createElement("div", "", "item-category");
                let tmpDisable = createElement("a", "", "small-link item-disable");

                tmpImage.src = activeProducts[i].Bild;
                tmpImage.height = 50;
                tmpName.innerText = activeProducts[i].Modell;
                tmpCategory.innerText = activeProducts[i].Kategori;
                tmpDisable.innerText = "Inaktivera produkt";
                tmpDisable.addEventListener("click", async (event, id=tmpId) => {
                    await API.post(configuration.apiURL +
                        "/admin/obj/disable/" +
                         id +
                        "/1?token=" +
                        token, "application/x-www-form-urlencoded");
                    showGlobalProductRequests();
                });

                appendElementToApp(tmpImage, tmpObj);
                appendElementToApp(tmpName, tmpObj);
                appendElementToApp(tmpCategory, tmpObj);
                appendElementToApp(tmpDisable, tmpObj);
                appendElementToApp(tmpObj, mainContent);
            }
        } else {
            //No products are active
            let noProducts = createElement("div", "msg", "message");

            noProducts.innerText = "Inga aktiva globala produkter";
            appendElementToApp(noProducts, mainContent);
        }

        //Create a title for active global products
        let inactiveTitle = createElement("h2", "", "slim-title");

        inactiveTitle.innerText = "Inaktiva globala produkter";
        appendElementToApp(inactiveTitle, mainContent);
        // If we have inactive global products, show them
        if (inactiveProducts.length > 0) {
            for (i = 0; i < inactiveProducts.length; i++) {
                let tmpId = inactiveProducts[i]._id;
                let tmpObj = createElement("div", "", "pending-items");
                let tmpImage = createElement("img", "", "item-image");
                let tmpName = createElement("div", "", "item-name");
                let tmpCategory = createElement("div", "", "item-category");
                let tmpEnable = createElement("a", "", "small-link item-disable");
                let tmpDelete = createElement("a", "", "small-link item-disable");

                tmpImage.src = inactiveProducts[i].Bild;
                tmpImage.height = 50;
                tmpName.innerText = inactiveProducts[i].Modell;
                tmpCategory.innerText = inactiveProducts[i].Kategori;
                tmpEnable.innerText = "Aktivera produkt";
                tmpEnable.addEventListener("click", async (event, id=tmpId) => {
                    await API.post(configuration.apiURL +
                        "/admin/obj/disable/" +
                         id +
                        "/0?token=" +
                        token, "application/x-www-form-urlencoded");
                    showGlobalProductRequests();
                });
                tmpDelete.innerText = "Radera permanent";
                tmpDelete.addEventListener("click", async (event, id=tmpId) => {
                    await API.post(configuration.apiURL +
                        "/admin/obj/delete/" +
                         id +
                        "/?token=" +
                        token, "application/x-www-form-urlencoded");
                    showGlobalProductRequests();
                });

                appendElementToApp(tmpImage, tmpObj);
                appendElementToApp(tmpName, tmpObj);
                appendElementToApp(tmpCategory, tmpObj);
                appendElementToApp(tmpEnable, tmpObj);
                appendElementToApp(tmpDelete, tmpObj);
                appendElementToApp(tmpObj, mainContent);
            }
        } else {
            //No products are active
            let noProducts = createElement("div", "msg", "message");

            noProducts.innerText = "Inga inaktiva globala produkter";
            appendElementToApp(noProducts, mainContent);
        }
    }
};

/**
* allUsers - Displays all users in the current system with an option to delete them
*/
const allUsers = async () => {
    let userContent = createElement("div", "", "userContent");
    let title = createElement("h2", "", "slim-title");
    let userBox = createElement("div", "", "user-in-list");
    let users = await API.get(configuration.apiURL + "/user/all?token=" + token);

    // Clear content element before we start appending new content
    adminContent.innerHTML = "";
    errorHolder.innerHTML = "";

    // HOW could this scenario possibly happen
    // if you can see this page, you have an account
    if (users.length <= 0 ) {
        let noUsers = createElement("h3");

        noUsers.innerText = "Inga användare hittades";
        appendElementToApp(noUsers);
        return false;
    }

    title.innerText = "Alla användare i systemet";

    for (var i = 0; i < users.length; i++) {
        let userRow = createElement("div", "", "userRow");
        let tmpUsername = createElement("div", "", "username");
        let tmpRemoveWrap = createElement("div", "", "remove-wrap");
        let tmpRemovalLink = createElement("a", "", "remove");
        let tmpUserId = users[i].id;

        tmpUsername.innerText = users[i].username;
        if (i == 0) {
            tmpRemovalLink.innerHTML = "<i class='orgadm'>Ursprungsadmin går inte att ta bort</i>";
        } else {
            tmpRemovalLink.classList.add("small-link");
            tmpRemovalLink.innerText = "Ta bort användare permanent";
            tmpRemovalLink.href = "#";
            tmpRemovalLink.addEventListener("click", async (target, delID = tmpUserId) => {
                await API.post(
                    configuration.apiURL +
                    "/admin/remove/user/" +
                     delID +
                     "?token=" +
                     token);
                allUsers();
            });
        }
        appendElementToApp(tmpUsername, userRow);
        appendElementToApp(tmpRemovalLink, tmpRemoveWrap);
        appendElementToApp(tmpRemoveWrap, userRow);
        appendElementToApp(userRow, userBox);
    }

    appendElementToApp(title, userContent);
    appendElementToApp(userBox, userContent);
    appendElementToApp(userContent);
};

/**
* createNewUser - displays the form to create a new user
*/
const createNewUser = () => {
    let userForm = createElement("form", "", "new-user-form");
    let newUserTitle = createElement("h2", "", "slim-title");
    let newEmail = createElement("input", "newEmail", "text-input email-create-user");
    let checkboxWrap = createElement("span", "", "checkbox-wrap");
    let newIsAdmin = createElement("input", "isAdminChecked", "input-checkbox");
    let newIsAdminLbl = createElement("label", "isAdminLabel", "checkbox-label");
    let buttonWrapCreateUser = createElement("div", "", "button-wrap");
    let createUser = createElement("input", "btCreateUser", "button bt-create-user");

    // Clear content element before we start appending new content
    adminContent.innerHTML = "";
    errorHolder.innerHTML = "";

    //Assign values and data to our elements
    newUserTitle.innerText = "Skapa ny användare";
    newEmail.type="email";
    newEmail.placeholder = "Epostaddress";
    newIsAdmin.type="checkbox";
    newIsAdminLbl.innerText = "Användaren ska ha Administrativa rättigheter";
    createUser.type = "button";
    createUser.value = "Skapa användare";

    createUser.addEventListener("click", async () => {
        if (newEmail.value == "" || newEmail.value == undefined) {
            sendErrorResponse("Vänligen ange en e-postaddress");
            return false;
        }
        let newUserData = {};

        newUserData.username = document.getElementById("newEmail").value;
        newUserData.isAdmin = document.getElementById("isAdminChecked").checked ? 1 : 0;

        let newAcc = await API.post(
            configuration.apiURL +
            "/admin/createaccount/?token=" +
            token,
            "application/json",
            JSON.stringify(newUserData));

        // Clear form as well
        newEmail.value = "";

        if (newAcc.error == true) {
            sendErrorResponse("Användaren kunde inte skapas.");
            console.log("ERROR AT:", newAcc);
            return false;
        }
        if (newAcc.error == false) {
            sendErrorResponse("Kontot har skapats och ett mail har skickats till användaren.",
                "ok-msg");
            return true;
        }
    });

    appendElementToApp(newUserTitle, userForm);
    appendElementToApp(newEmail, userForm);
    appendElementToApp(createElement("br"), userForm);
    appendElementToApp(createElement("br"), userForm);
    appendElementToApp(newIsAdmin, checkboxWrap);
    appendElementToApp(newIsAdminLbl, checkboxWrap);
    appendElementToApp(checkboxWrap, userForm);
    appendElementToApp(createElement("br"), userForm);
    appendElementToApp(createElement("br"), userForm);
    appendElementToApp(createUser, buttonWrapCreateUser);
    appendElementToApp(buttonWrapCreateUser, userForm);
    appendElementToApp(userForm);
};

/**
* navSelector - handles what happens when an element is clicked and what should be displayed
* @param {element} tabElement the html DOM element of the link clicked
*/
const navSelector = (tabElement) => {
    // Remove all other selected tags from navbar
    for (let i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove("admin-active");
    }
    // Highlight selected button
    tabElement.target.classList.add("admin-active");

    switch (tabElement.target.name) {
        case "global":
            showGlobalProductRequests();
            break;
        case "projects":
            break;
        case "all-users":
            allUsers();
            break;
        case "new-user":
            createNewUser();
            break;
        case "default":
        default:
            displayInstructions();
            break;
    }
};

// Create clickable nav links
for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener("click", (e) => {
        navSelector(e);
    });
}

navSelector({target: {name: "default", classList: {add: () => {}}}});
