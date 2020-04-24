 /* 
 * Note: I will use the following format for the JSON object returned from the server (on success):
 * { url: <string>, exists: <true|false>, file: <true|false>, folder: <true|false>, error: <string> }
 */

 window.onload = () => {
  /* 
  * Validate URL per the URL spec (https://owasp.org/www-community/OWASP_Validation_Regex_Repository)
  * Note: this can be simplified if we only want to handle a subset of valid URLs, such as by using
  * this regex for domain names (a non-vetted suggestion from OWASP): ^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$
  * or simply checking the URL path and dropping the rest of the string (e.g., to check URL paths only on the current domain)
  */
  const urlRegex = new RegExp("^((((https?|ftps?|gopher|telnet|nntp):\/\/)|(mailto:|news:))(%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@&=+$,A-Za-z0-9])+)([).!';/?:,][[:blank:|:blank:]])?$");
  // our api url
  const apiUrl = "example.com/checkUrl";  // our api url
  const timerCheck = 60 * 1000;  // # of milliseconds to wait for each check of localStorage (1 minute)
  const reqLimit = 10;  // # of allowed requests before throttling
  const throttlePeriod = 30 * 60 * 1000;  // # of milliseconds to wait (30 minutes)
  const infoText = "The number of searches is limited to 10 every 30 minutes.";  // information text for the user

  // request counter
  let reqCount = 0;
  // timer interval id
  let intervalID;
  // our html elements
  let infoElem = document.getElementById('info');
  let urlInput = document.getElementById('urltextbox');
  let urlInputErr = document.getElementById('urlerror');
  let urlResultsTitle = document.getElementById('urlResultsTitle');
  let urlResults = document.getElementById('urlResults');

  // add informational text
  infoElem.textContent = infoText;

  // update error message on UI
  let updateUrlError = (msg) => {
    urlInputErr.textContent = msg;
  }

  // update url results on UI
  let updateUrlResults = (jresp) => {
    let resultsText = jresp.error ? 
      `API Error: ${jresp.error} ... URL: ${jresp.url}` :
      `Exists: ${jresp.exists},  File: ${jresp.file},  Folder: ${jresp.folder},  URL: ${jresp.url}`;
    urlResults.textContent = resultsText;
    urlResultsTitle.hidden = false;
    urlResults.hidden = false;
  }

  // validate the URL
  let validateURL = (url) => {
    // check if URL passes regex
    if (!urlRegex.test(url)) {
      updateUrlError("Error: URL is invalid.");
      return false;
    }
    // check length of URL string before anything else (len <= 2000)
    if (url.length > 2000) {
      updateUrlError("Error: URL is too long.");
      return false;
    }
    // clear error message if no error
    updateUrlError("");
    return true;
  }

  // use fetch api to make request
  let fetchReq = (jbody) => {
    async function postData(apiUrl = '', data = {}) {
      // Default options are marked with *
      const response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        body: data
      });
      return await response;
    }

    postData(apiUrl, jbody)
      .then((resp) => {
        if (!resp.ok) {
          updateUrlError(`Error: ${resp.statusText}`)
        }
        return response.json()
      })
      .then((jresp) => {
        updateUrlResults(jresp);
      })
      .catch((error) => {
        updateUrlError('Error:', error);
      });
  };

  // use XMLHttpRequest and ES5 if you need to fallback for older browsers
  var oldReq = function(jbody) {
    // create XML HTTP request
    var req = new XMLHttpRequest();
    req.responseType = 'json';

    // handle various non-http errors
    req.onerror = function () {
      updateUrlError('Error: ' + req.status);
    };
    req.ontimeout = function () {
      updateUrlError('Timeout: ' + req.status);
    };
    req.onabort = function () {
      updateUrlError('Aborted: ' + req.status);
    };

    // onload assumes req.responseText is json
    req.onload = function () {
      if (req.status != 200) {
        // handle http error
        return updateUrlError('HTTP Error: ' + req.status);
      }
      let jresp = JSON.parse(req.response);
      updateUrlResults(jresp);
    };

    // asynchronous is true
    req.open('POST', apiUrl, true);
    // send the request
    req.send(jbody);
  };

  // check localStorage to see if throttle period is finished
  let throttleTimer = () => {
    let throttleExpiration = localStorage.getItem('throttleExpiration');
    // if throttleExpiration was removed from local storage this will still work
    if (throttleExpiration < Date.now()) {
      // reset all the throttle things
      localStorage.removeItem('throttleExpiration');
      reqCount = 0;
      urlInput.disabled = false;
      updateUrlError("");
      clearInterval(intervalID);
      // re-add event listener for changes in user input
      urlInput.addEventListener("keyup", urlInputAction);
    }
  };

  // handle throttle
  let throttleHandler = (throttleExpiration, url) => {
    // remove the unnecessary listener (will add it back later)
    urlInput.removeEventListener('keyup', urlInputAction);
    // create date object
    let expiration = new Date(parseInt(throttleExpiration));
    updateUrlError("You've reached the maximum number of searches allowed.");
    updateUrlResults({ 
      url: url, 
      exists: false, 
      file: false, 
      folder: false, 
      error: `Wait period ends at ${expiration.toTimeString()} on ${expiration.toDateString()}.`
    });
    // set interval to check the throttle expiration once per minute
    intervalID = setInterval(throttleTimer, timerCheck);
  };

  let urlInputAction = (e) => {
    let url = e.target.value;
    if (validateURL(url)) {
      // get throttle expiration date from local storage
      let throttleExpiration = localStorage.getItem('throttleExpiration');
      // check throttle expiration in case old value is left in local storage
      if (throttleExpiration < Date.now()) {
        // remove old expiration
        localStorage.removeItem('throttleExpiration');
      }
      // increase request count
      reqCount++;
      // format url into json for server
      let jbody = JSON.stringify({
        url: url
      });

      // test with mock response
      // check for request count
      if ((reqCount > reqLimit) && !throttleExpiration) {
        throttleExpiration = Date.now() + throttlePeriod;
        localStorage.setItem('throttleExpiration', throttleExpiration);
        throttleHandler(throttleExpiration, url);
        urlInput.disabled = true;

      // check for existing throttle expiration
      } else if (throttleExpiration && (throttleExpiration > Date.now())) {
        throttleHandler(throttleExpiration, url);
        urlInput.disabled = true;

      // otherwise, make the mock request
      } else {
        if (window.fetch) {
          updateUrlResults({ url: url, exists: true, file: true, folder: false, error: ""});
        } else {
          oldReq(jbody);
        }
      }

      // otherwise make post request to server
      // } else {
      //   if (window.fetch) {
      //     fetchReq(jbody);
      //   } else {
      //     oldReq(jbody);
      //   }
      // }
      
    }
  };

  // event listener for changes in user input
  urlInput.addEventListener("keyup", urlInputAction);

};