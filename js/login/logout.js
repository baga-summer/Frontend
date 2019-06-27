/*global configuration, API*/

/**
 * logout - Destroys local storage token and redirect user to login page
 *
 * @returns {void}
 */
let logout = () => {
    let logout = document.getElementById('logout');

    logout.addEventListener('click', () => {
        localStorage.removeItem('token');
        document.location.href = "index.html";
    });
};

/**
* setUsername - Sets the username for logged in user in the navbar
*/
let setUsername = () => {
    let userName = document.getElementById('userName');

    userName.innerHTML = localStorage.getItem("username");
    userName.style = "display: flex; align-items:center;";
};

/**
* checkAdminSetNav - adds admin button in nav bar IFF user is admin
*/
let checkAdminSetNav = async () => {
    let data = await API.get(configuration.apiURL +
        "/admin/user" + "?token=" + localStorage.getItem('token'));

    if (data.user.isAdmin == true) {
        let target = document.getElementById('extraLinks');
        let element = document.createElement("a");

        element.classList += "admin-active";
        element.href = "admin.html";
        element.innerText = "Admin";
        target.appendChild(element);
        return true;
    }
    return false;
};


addEventListener("DOMContentLoaded", () => {
    setUsername();
    logout();
    checkAdminSetNav();
});
