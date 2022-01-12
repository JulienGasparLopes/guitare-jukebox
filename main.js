const redirectURI = 'http://localhost';
const scopes = 'channel:read:redemptions';

import express from 'express';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';

const {clientId, clientSecret, userId} = JSON.parse(
  await readFile(
    new URL('./secrets.json', import.meta.url)
  )
);

const app = new express();

app.use(express.static('public'));

app.get('/', function(request, response){
    response.sendFile('index.html');
});

let url = "https://id.twitch.tv/oauth2/authorize" +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectURI}` +
    "&response_type=code" +
    `&scope=${scopes}`

console.log(url)

const code = "m1ttbnxnygzlgn5mdxuh7a48xu3p3e";

url = "https://id.twitch.tv/oauth2/token" +
    `?client_id=${clientId}` +
    `&client_secret=${clientSecret}` +
    `&code=${code}` +
    `&grant_type=authorization_code` +
    `&redirect_uri=${redirectURI}`

// let url = "https://id.twitch.tv/oauth2/token" +
//     `?client_id=${clientId}` +
//     `&client_secret=${clientSecret}` +
//     "&grant_type=client_credentials" +
//     `&scope=${scopes}`

    

// url = url = 'https://api.twitch.tv/kraken/oauth2/authorize' +
// '?response_type=token' +
// '&client_id=' + clientId + 
// '&redirect_uri=' + redirectURI +
// // '&state=' + sessionStorage.twitchOAuthState +
// '&scope=' + scopes;

const tokenObject = await fetch(
    url, 
    {
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
    }
).then(async resp => await resp.json());

console.log("TOKEN : ", tokenObject)

// Source: https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
const nonce = length => {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

import WebSocket from 'ws';
const ws = new WebSocket('wss://pubsub-edge.twitch.tv');

ws.on('open', function open() {
    const message = {
        type: 'LISTEN',
        nonce: nonce(15),
        data: {
            topics: [`channel-points-channel-v1.${userId}`],
            auth_token: tokenObject.access_token
        }
    };
    console.log("Sending :", JSON.stringify(message))
    ws.send(JSON.stringify(message));
    console.log("open WebSocket")
});

ws.on('message', function message(data) {
    console.log('received: %s', data);
});


// ws.onopen = function(event) {
//     $('.ws-output').append('INFO: Socket Opened\n');
//     heartbeat();
//     heartbeatHandle = setInterval(heartbeat, heartbeatInterval);
//     listen(`channel-points-channel-v1.${userId}`)
// };

// ws.onerror = function(error) {
//     $('.ws-output').append('ERR:  ' + JSON.stringify(error) + '\n');
// };

// ws.onmessage = function(event) {
//     message = JSON.parse(event.data);
//     $('.ws-output').append('RECV: ' + JSON.stringify(message) + '\n');
//     if (message.type == 'RECONNECT') {
//         $('.ws-output').append('INFO: Reconnecting...\n');
//         setTimeout(connect, reconnectInterval);
//     }
// };

// ws.onclose = function() {
//     $('.ws-output').append('INFO: Socket Closed\n');
//     clearInterval(heartbeatHandle);
//     $('.ws-output').append('INFO: Reconnecting...\n');
//     setTimeout(connect, reconnectInterval);
// };

app.listen(80, () => {
    console.log("Serveur à l'écoute")
})
