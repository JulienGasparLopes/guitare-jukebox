const redirectURI = "http://localhost";
const scopes = "channel:read:redemptions";

import express from "express";
import fetch from "node-fetch";
import { readFile } from "fs/promises";
import WebSocket from "ws";
import { exec } from "child_process";

const PRIVATE_PORT = 5001;
const PUBLIC_PORT = 80;

const main = async () => {
  const { clientId, clientSecret, userId, mongoUser, mongoPassword, mongoClusted } = JSON.parse(
    await readFile(new URL("../secrets.json", import.meta.url))
  );

  const privateAdminApp = new express();
  privateAdminApp.use(express.static("./private"));

  privateAdminApp.get("/", function (request, response) {
    const authCode = request.query.code;
    if (authCode) {
      console.log("Code retrieved, stopping private server, starting public server ...");
      openPublicServer(authCode);
      privateListener.close();
    }
    response.sendFile("authorize.html", { root: "./private" });
  });

  privateAdminApp.get("/clientId", function (request, response) {
    response.header("Access-Control-Allow-Origin", "*");
    response.json({ clientId });
  });

  const privateListener = privateAdminApp.listen(PRIVATE_PORT, () => {
    console.log("Private server open, waiting for Admin connection");
  });

  const openPublicServer = (authCode) => {
    const ws = new WebSocket("wss://pubsub-edge.twitch.tv");

    // Source: https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
    function nonce(length) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }

    ws.on("open", async () => {
      const url =
        "https://id.twitch.tv/oauth2/token" +
        `?client_id=${clientId}` +
        `&client_secret=${clientSecret}` +
        `&code=${authCode}` +
        `&grant_type=authorization_code` +
        `&redirect_uri=${redirectURI}`;

      const tokenObject = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then(async (resp) => await resp.json());

      const message = {
        type: "LISTEN",
        nonce: nonce(15),
        data: {
          topics: [`channel-points-channel-v1.${userId}`],
          auth_token: tokenObject.access_token,
        },
      };
      ws.send(JSON.stringify(message));
      console.log("Waiting for events to occur");
    });

    ws.on("message", function message(data) {
      const messageDict = JSON.parse(String(data));
      console.log(messageDict);
      if (messageDict?.type == "MESSAGE" && messageDict?.data?.topic == `channel-points-channel-v1.${userId}`) {
        const parsedMessage = JSON.parse(messageDict.data.message);
        const redemptionInfo = parsedMessage.data.redemption;

        const userName = redemptionInfo.user.display_name;
        const userInput = redemptionInfo.user_input;
        const redeemTitle = redemptionInfo.reward.title;
        const redeemCost = redemptionInfo.reward.cost;
        console.log(`${userName} redeemed ${redeemTitle} for a cost of ${redeemCost} with input ${userInput}`);
        if (title === "Poulpy Buzzer") {
          exec("afplay media/poulpy.mp3");
        }
      }
    });
  };
};

main();
