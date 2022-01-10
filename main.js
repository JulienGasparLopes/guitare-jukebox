var redirectURI = 'http://localhost';
var scope = 'channel:read:redemptions';

const { applicationKey, userId } = require("./secrets.json")
console.log(applicationKey, userId)

var ws;
const express = require('express');
const app = new express();

app.use(express.static('public'));

app.get('/', function(request, response){
    response.sendFile('index.html');
});

app.listen(80, () => {
    console.log("Serveur à l'écoute")
})
