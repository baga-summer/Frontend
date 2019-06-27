/* global configuration, API */

"use strict";

// HTML Elements
const formElement = document.getElementById('reset-form');
const sendBt = document.getElementById('send-bt');
const emailField = document.getElementById('email');
const errorHolder = document.getElementById('error-holder');

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
* sendReset, sends the reset form to the server.
* Informs the user if the request has been sent or not.
* Does not reveal weather or not the email is valid
*/
const sendReset = async () => {
    let data = new URLSearchParams(new FormData(formElement));
    // Get email from form
    let email = emailField.value;

    errorHolder.innerHTML = "";

    if (email == undefined || email == null || email == "") {
        sendErrorResponse("Du måste fylla i en gilitg Epost");
        return false;
    }

    data = await API.post(configuration.apiURL +
        "/acc/requestreset", 'application/x-www-form-urlencoded',
    data);

    if (data.error != undefined && data.error == false) {
        //All is good and we got a good response. Notify the user.
        sendErrorResponse("Om mailaddressen är gilitg så har ett mail skickats", "ok-msg");
        return true;
    }
    //Something with the request went wrong
    sendErrorResponse("Ett fel uppstod när servern försökte kontaktas. " +
    "Kontrolera internetanslutning och serverstatus och försök igen.");

    emailField.value = "";
};

//Send the form when the user press the send button
sendBt.addEventListener("click", () => {
    sendReset();
});
// This will send the form when the user presses enter in the email field
emailField.addEventListener("keydown", (key) => {
    if (key.keyCode == 13) {
        sendReset();
    }
});
