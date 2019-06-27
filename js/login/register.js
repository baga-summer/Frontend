/* global configuration, API */

"use strict";

const errorHolder       = document.getElementById('error-holder');
const formElement       = document.getElementById('register-form');
const inputElements     = document.getElementsByClassName('text-input');
const registerButton    = document.getElementById('register-bt');
const pass              = document.getElementById('pass');
const confirm           = document.getElementById('confirmpass');

/**
* validateFieldList - validates that input fields in our form isn't empty
* @param {array} fields - a list of input fields to be tested
*/
const validateFieldList = (fields) => {
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].value == undefined || fields[i].value == "") {
            return false;
        }
    }
    return true;
};

/**
* Check that the two password fields match
*/
const checkPasswordsMatch = (pass1, pass2) => {
    if (pass1.value === pass2.value) {
        return true;
    }
    return false;
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
* sendResetRequest - funtion to send the request to the API
*/
const sendResetRequest = async () => {
    if (!validateFieldList(inputElements)) {
        sendErrorResponse("Vänligen fyll i samtliga fält.");
        pass.value = "";
        confirm.value = "";
        return false;
    }

    if (!checkPasswordsMatch(pass, confirm)) {
        sendErrorResponse("Lösenorden matchar inte, de måste vara samma.");
        pass.value = "";
        confirm.value = "";
        return false;
    }

    let data = new URLSearchParams(new FormData(formElement));

    let res = await API.post(configuration.apiURL +
        "/acc/passwordreset", 'application/x-www-form-urlencoded',
    data);

    if (res.error != undefined && res.error == false) {
        //All is good and we got a good response. Notify the user.
        sendErrorResponse("Ditt lösenord har uppdaterats!", "ok-msg");
        for (var i = 0; i < inputElements.length; i++) {
            inputElements[i].value = "";
        }
        return true;
    }
    //Something with the request went wrong
    sendErrorResponse("Uppdatering av lösenord misslyckades! " +
    "Kontrollera att din kod är korrekt och att du är ansluten till internet.");
    pass.value = "";
    confirm.value = "";
    return false;
};

registerButton.addEventListener("click", sendResetRequest);
