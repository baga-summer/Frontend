/* global configuration, API */

"use strict";

// HTML Elements
const loginBt = document.getElementById('login-bt');
const formElement = document.getElementById('login-form');
const passwordField = document.getElementById('password');
const emailField = document.getElementById('email');
const errorHolder = document.getElementById('error-holder');

/**
* sendLogin, Reads the form and sends a POST request for login to the server
* if the login is sucessfull it will save a token to localStorage and redirect to home.html
* otherwise it'll show an error to the user.
*/
const sendLogin = async () => {
    // Get the form data from the html-form
    let data = new URLSearchParams(new FormData(formElement));

    data = await API.post(configuration.apiURL + "/acc/login", 'application/x-www-form-urlencoded',
        data);
    //Preform an api call with the form data

    //Here is the API response, check if it returned an error, if it did

    //Clear the password field no matter the outcome
    passwordField.value = "";
    // give the user an error otherwise set their token in a cookie or something
    if (data.error) {
        let errorMsg = document.createElement("div");

        //add class and content to the error message box
        errorMsg.classList += "error-msg";
        errorMsg.innerText ="Inloggning misslyckades!" +
            " Kontrollera användarnamn och lösenord.";
        //Clear error holder and insert a new error
        errorHolder.innerHTML = "";
        errorHolder.appendChild(errorMsg);
    } else {
        // There was no error and we have now logged in, save token in storage
        // Using localStorage at the request of the frontend devs
        // if statement to check if the browser supports storage
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);

            //redirect to main page
            window.location = "home.html";
        } else {
            // Sorry! No Web Storage support..
            let errorMsg = document.createElement("div");

            //add class and content to the error message box
            errorMsg.classList += "error-msg";
            errorMsg.innerText ="Inloggningen kan ej fortgå!" +
                " Din webbläsare stödjer inte web storage.";
            //Clear error holder and insert a new error
            errorHolder.innerHTML = "";
            errorHolder.appendChild(errorMsg);
        }
    }
};

// Check if the user is already logged in
if (localStorage.getItem("token")) {
    window.location = "home.html";
}

//If the user has been previously logged in, auto-fill email feild
if (localStorage.getItem("username")) {
    emailField.value = localStorage.getItem("username");
}

// This will fire the sendLogin function when the user clicks on the login button
loginBt.addEventListener("click", () => {
    sendLogin();
});

// This will send login when the user presses enter in the password field
passwordField.addEventListener("keydown", (key) => {
    if (key.keyCode == 13) {
        sendLogin();
    }
});
