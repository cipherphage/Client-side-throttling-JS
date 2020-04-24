# Client-side Throttling with JavaScript

## This is a weird example to try/test client-side throttling

## It is a good exercise in contemplating throttling as well as user experience

## This is roughly how I define throttling: 
Once the limit of the number of requests X is reached, limit the number of requests to Y during time period Z. This definition could be extended to the following: once the limit of the number of requests X is reached <em>in time period A</em>, limit the number of requests to Y during time period Z.

## Notes about the code in practice:
 - In the code (`client-throttle.js`) I have X = 10 requests, Y = 0 requests, Z = 30 minutes.  These values are more like what you see for password inputs where you want to limit the attempts over time so that a password can't be brute forced.
 - There are many other possible combinations of X, Y and Z that could be used in combination with user feedback such as error messages, informational text about expected usage, only making requests once keystrokes have stopped for a set time period, etc.
 - I have added the X and Z values as constants (`reqLimit` and `throttlePeriod`, respectively) so that they may be easily changed.  I use `localStorage` to track the value for Z so that it can be arbitrarily long and won't change if a user refreshes the page.  Although, of course, if the user deletes their browser's data for this page then it will be reset.  Another caveat is that a user may not allow this site to use `localStorage`.  We would need a fallback for that case, such as holding the value in memory, but then refreshing the page will reset the value. 
 - The bullet point above highlights one of the obvious issues with throttling on the client-side: there is no way to prevent someone from bypassing this kind of throttling.  To truly limit requests to your API endpoint you must implement server-side throttling.
 - No matter which combination of X, Y, and Z we use we need to consider the user experience and how we want to communicate this information so that the user understands what is expected of them.  I provide informational text to the user both before and after throttling as well as block the input after throttling starts.  

## Suggestions on how to make this webpage better:
 - Don't make a request on every keystroke if you want to set a low value to the number of requests allowed, otherwise the user will likely hit the limit of requests as they are typing.  That is not a good user experience.
 - Provide a submit button and only make a request on the clicking event of the button.  If the request limit is low then this will be a better user experience.
 - If you want to keep the dynamic search (i.e., a request on every keystroke), then consider making the request limit much higher and implement overlapping throttles (see below).
 - Dynamically display the number of requests left to the user. This helps set the user's expectation.
 - Dynamically display the amount of time left to the user once throttling begins. This helps set the user's expectation.
 - Right now, the code does not begin the timer until the request limit has been reached.  This offers some degree of efficiency in the JavaScript because we are able to remove the event listener while the throttle timer is running and then clear the throttle timer once the time is up and add a new event listener.  However, depending on the use case, a more logical way to implement the throttling might be to check for the number of requests over a rolling time period.  That way you only need the values of Y and Z.  For example, only allow up to 10 requests in any 30 minute time period.
 - Overlapping throttles are common: one throttle might be set to prevent an abusive number of requests (e.g., in a DDoS) over short time periods (e.g., 30 seconds), while another throttle might be in place to simply limit the number of requests over longer time periods (e.g., set a quota of 1000 requests per day).

## Running the code:
To test it, I'd recommend changing the `throttlePeriod` constant to 1 minute.  Also, please note that using `localStorage` in a broswer requires a valid domain name so you will need to serve the static files, for example, on `localhost`.  Here is a list of one-line servers: https://gist.github.com/willurd/5720255  I used this Golang one because it was convenient for me: https://github.com/kidoman/serve 