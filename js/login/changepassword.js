/* global configuration, API */

"use strict";

const errorHolder       = document.getElementById('error-holder');
const formElement       = document.getElementById('form');
const oldpass           = document.getElementById('oldpass');
const newpass           = document.getElementById('newpass');
const confirm           = document.getElementById('confirmpass');
const username          = document.getElementById('uname');
const sendButton        = document.getElementById('change-bt');

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
* preChangePasswordCheck - Checks that we have the necessary components to change password.
* @return {bool} states if we're ready for password check or not.
*/
const preChangePasswordCheck = () => {
    if (
        localStorage.getItem("username") != undefined &&
         localStorage.getItem("token") != undefined
    ) {
        // All values are good, fill out hidden username in form.
        username.value = localStorage.getItem("username");
        return true;
    }
    //Check has failed, we're not ready to change password
    sendButton.classList = "disabled";
    oldpass.disabled = true;
    newpass.disabled = true;
    confirm.disabled = true;
    sendButton.disabled = true;
    return false;
};


/**
* clearForm - Clears the form Elements
*/
// const clearForm = () => {
//     username.value = "";
//     oldpass.value = "";
//     newpass.value = "";
//     confirm.value = "";
// };

/**
* changePassword - Sends a request to the server to change the users password.
* @return {bool} success / failure
*/
const changePassword = async () => {
    let data = new URLSearchParams(new FormData(formElement));

    errorHolder.innerHTML = "";

    if (
        username.value == undefined || username.value == null || username.value == "" ||
        oldpass.value == undefined || oldpass.value == null || oldpass.value == "" ||
        newpass.value == undefined || newpass.value == null || newpass.value == "" ||
        confirm.value == undefined || confirm.value == null || confirm.value == ""
    ) {
        sendErrorResponse("Alla fält måste vara ifyllda");
        return false;
    }

    if (newpass.value !== confirm.value) {
        sendErrorResponse("Det nya lösenordet matchar inte");
        return false;
    }

    data = await API.post(configuration.apiURL +
        "/acc/changepassword", 'application/x-www-form-urlencoded',
    data);

    if (data.error != undefined && data.error == false) {
        //All is good and we got a good response. Notify the user.
        sendErrorResponse("Ditt lösenord har uppdaterats", "ok-msg");
        return true;
    }
    //Something with the request went wrong
    sendErrorResponse("Ett fel uppstod, kontrollera att du angev rätt lösenord");
    return false;
};


preChangePasswordCheck();

sendButton.addEventListener("click", () => {
    changePassword();
});

confirm.addEventListener("keyup", (key) => {
    if (key.keyCode == 13) {
        changePassword();
    }
});
