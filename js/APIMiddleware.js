/**
  * Take a string and replace with html special characters
  *
  * @param {String} String to modify
  * @return {String} modified string
  */
const escapeHtml = (str) => {
    if (str==='' || typeof str !== "string") {return str;}

    var map = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        "`": '&#96;',
        "#": '&#35;'
    };

    return str.replace(/[<>"'`#]/g, function(m) { return map[m]; });
};

/**
  * Loops through JSON objects to find all strings to then escape html characters
  *
  * @param {JSON} Json to check for strings in
  * @return {JSON} Sanitized Json object
  */
const sanitize = (json) => {
    //if param is string
    if (typeof json === "string") {
        json = escapeHtml(json);
    }

    //if param is object
    if (typeof json === "object") {
        for (let value in json) {
            json[value] = sanitize(json[value]);
            escapeHtml(value);
        }
    }

    return json;
};

/**
 * API - contains get and post methods to specified url that uses fetch calls.
 * 		 This replaces repeated fetch code with a simple function call instead.
 * 		 API methods needs to be reached across several files
 *
 * @returns {json} always returns response.json() data from backend
 */
const API = {
    get: async (url) => {
        return await fetch(url)
            .then(response => response.json())
            .then((json) => {
                if (json.info == "token failed to validate") {
                    localStorage.removeItem('token');
                    document.location.href = "index.html";
                    return false;
                }
                return sanitize(json);
            });
    },

    post: async (url, contentType, data) => {
        return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": contentType, },
            body: data,
        })
            .then(response => response.json())
            .then((json) => {
                if (json.info == "token failed to validate") {
                    localStorage.removeItem('token');
                    document.location.href = "index.html";
                    return false;
                }
                return sanitize(json);
            }).catch((error) => {
                let errors = [error, "error"];

                return errors;
            });
    }
};

API;
