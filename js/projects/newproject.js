/* global configuration, API*/
//Gets the users token
let token = localStorage.getItem("token");
let deleteButtonNumber = 0;
let usernameObj = {};
let usernameArray = [];
let userIdArray = [];
let optionArray = ["Läsbehörighet", "Skrivbehörighet"];
let optionArrayValue = ["r", "w"];
/**
 * getAllUsers - Fetches all users from the database and creates a
 * username object, username and userID array.
 *
 * @returns {json}
 */
let getAllUsers = async () => {
    let json = await API.get(configuration.apiURL + "/user/all?token=" + token);

    for (var i = 0; i < json.length; i++) {
        usernameObj[json[i].id] = json[i].username;
        usernameArray.push(json[i].username);
        userIdArray.push(json[i].id);
    }
};

/**
 * createNewProject - Creates a new project and send it to the database using fetch.
 *
 * @returns {void}
 */
let createNewProject = async () => {
    //Get all values from the form
    let projectName = document.getElementById("projectName").value;
    let accessUser = document.getElementsByClassName("accessSelect");
    let accessCompetence = document.getElementsByClassName("accessCompetence");
    let peopleperhouse = document.getElementById("peopleperhouse").value;
    let litreperperson = document.getElementById("litreperperson").value;
    let accessData = "";
    let data = "";

    //Loops through the amount of Users added in the newproject.html view and
    //prepares to send them to the database.
    for (var i = 0; i < accessUser.length; i++) {
        accessData += `&access[${i}][userID]=${accessUser[i].value}`;
        accessData += `&access[${i}][permission]=${accessCompetence[i].value}`;
        accessData += `&access[${i}][username]=${usernameObj[accessUser[i].value]}`;
        accessData += `&access[${i}]`;
    }

    //Adds the accessData with the rest of the data which needs to be sent to the database
    data = `name=${projectName}`;
    data += `&version=1.0${accessData}`;
    data += `&default[peoplePerHouse]=${peopleperhouse}`;
    data += `&default[litrePerPerson]=${litreperperson}`;

    //Url to call API/Backend
    await API.post(configuration.apiURL + "/proj/insert" + "?token=" + token,
        'application/x-www-form-urlencoded', data);

    location.href = "home.html";
};

/**
 * addRemoveButtons - Adds the buttons which remove users from newproject.html
 *
 * @returns {void}
 */
let addRemoveButtons = () => {
    //Creates an a tag with a div wrapped around it which forms a button
    let deleteDiv = document.createElement("div");

    deleteDiv.setAttribute("class", "button-wrap removeDiv");
    let deleteATag = document.createElement("a");

    deleteATag.setAttribute("class", "button buttonNumber");
    //Gives the button a value so it knows which user to remove when clicked
    deleteATag.setAttribute("value", deleteButtonNumber);
    deleteATag.innerHTML = "Ta bort";
    deleteDiv.appendChild(deleteATag);
    //Appends button to existing div
    var newField = document.getElementById("newField");

    newField.appendChild(deleteDiv);

    deleteButtonNumber = deleteButtonNumber + 1;

    //Adds an eventListener to each button which removes the two select elements
    //from newproject.html in turn also removes them from being added to db
    deleteDiv.addEventListener("click", (event) => {
        //sets the button numbers again when button is clicked so correct user
        //is removed
        setButtonNumber();
        //gets the value of the button
        let which = event.target.attributes[1].nodeValue;
        //gets the html elements
        let selectAccess = document.getElementsByClassName("accessSelect");
        let selectCompetence = document.getElementsByClassName("accessCompetence");
        let removeDiv = document.getElementsByClassName("removeDiv");
        //removes the select elements and the button itself

        removeDiv[which].remove();
        selectAccess[which].remove();
        selectCompetence[which].remove();
    });
};

/**
 * setButtonNumber - sets the button number for the remove buttons
 *
 * @returns {void}
 */
let setButtonNumber = () => {
    //gets all buttons
    let buttonNumber = document.getElementsByClassName("buttonNumber");

    //loops all buttons and adds a number to its value
    for (var i = 0; i < buttonNumber.length; i++) {
        buttonNumber[i].setAttribute("value", i);
    }
};

//Gets the HTML element for the button to add users
let button = document.getElementById("addButton");

//adds eventListener to add users(behörigheter) button
button.addEventListener("click", () => {
    //All this code adds the select elements and the button to remove them.
    var selectUser = document.createElement("select");

    selectUser.setAttribute("class", "accessSelect select-input");

    var newField = document.getElementById("newField");

    newField.appendChild(selectUser);

    //Adds options to the select
    for (var i = 0; i < usernameArray.length; i++) {
        var option = document.createElement("option");

        option.setAttribute("value", userIdArray[i]);
        option.text = usernameArray[i];
        selectUser.appendChild(option);
    }

    var selectCompetence = document.createElement("select");

    selectCompetence.setAttribute("class", "accessCompetence select-input");

    newField.appendChild(selectCompetence);

    for (i = 0; i < optionArray.length; i++) {
        option = document.createElement("option");

        option.setAttribute("value", optionArrayValue[i]);
        option.setAttribute("id", optionArray[i]);
        option.text = optionArray[i];
        selectCompetence.appendChild(option);
    }
    addRemoveButtons();
});

//gets the create project button
let createProjectButton = document.getElementById("createProjectButton");

//eventListener to create project button which calls createNewProject()
createProjectButton.addEventListener("click", () => {
    createNewProject();
});

addEventListener("DOMContentLoaded", () => {
    getAllUsers();
});
