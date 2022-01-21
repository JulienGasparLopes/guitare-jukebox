const REDIRECT_URL = "http://localhost:5001";
const SCOPES = "channel:read:redemptions";

// Source: https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
function nonce(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function parseFragment(hash) {
  var hashMatch = function (expr) {
    var match = hash.match(expr);
    return match ? match[1] : null;
  };
  var state = hashMatch(/state=(\w+)/);
  if (sessionStorage.twitchOAuthState == state) sessionStorage.twitchOAuthToken = hashMatch(/access_token=(\w+)/);
  return;
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");
console.log("Code :", code);

if (!code) {
  fetch("http://localhost:5001/clientId").then(async (resp) => {
    const parsedResponse = await resp.json();
    const clientId = parsedResponse.clientId;

    if (document.location.hash.match(/access_token=(\w+)/)) parseFragment(document.location.hash);
    sessionStorage.twitchOAuthState = nonce(15);

    const url =
      "https://id.twitch.tv/oauth2/authorize" +
      `?client_id=${clientId}` +
      `&redirect_uri=${REDIRECT_URL}` +
      "&response_type=code" +
      `&scope=${SCOPES}`;

    window.location.replace(url);
  });
} else {
  window.close();
}
