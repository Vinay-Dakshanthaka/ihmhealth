const express = require("express");
const app = express();
const axios = require("axios");
const { exec } = require("child_process"); // Added child_process module for opening URLs
const bodyParser = require("body-parser");
const cors = require("cors"); 
const http = require("http");
var querystring = require("querystring");
const crypto = require("crypto");
require('dotenv').config();

app.use(bodyParser.json()); // Parse JSON request bodies
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

const corsOptions = {
    origin: ['https://ihmhealth.in'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  
// Enable CORS 
app.use(cors(corsOptions));

// app.use(cors()); 


const algorithm = "aes-128-cbc";
var authKey = process.env.AUTH_KEY;
var authIV = process.env.AUTH_IV;

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(authKey), authIV);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("base64");
}

function decrypt(text) {
  let decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(authKey),
    authIV
  );
  let decrypted = decipher.update(Buffer.from(text, "base64"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function randomStr(len, arr) {
  var ans = "";
  for (var i = len; i > 0; i--) {
    ans += arr[Math.floor(Math.random() * arr.length)];
  }
  return ans;
}

app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});

app.use(express.static(__dirname));

app.post("/initPgReq", (req, res) => {
  try {
      // Extract the necessary data from the request body
      console.log("start :")
      const { payerName, payerEmail, payerMobile, amount, clientCode, payerAddress } = req.body;
    console.log("body :", req.body)
      // Other constant values
      const clientTxnId = randomStr(20, "12345abcde");
      const transUserName = process.env.TRANS_USERNAME;
      const transUserPassword = process.env.TRANS_USER_PASSWORD;
      const callbackUrl = "https://api.ihmhealth.in/getPgRes";
      // const callbackUrl = "http://localhost:3000/getPgRes";
      const channelId = "W";
      // const spURL = "https://stage-securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1"; //for testing 
      const spURL = "https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
      const mcc = "5666";
      const transData = new Date(); 

      // Construct the string for request...
      // const stringForRequest = `payerName=${payerName}&payerEmail=${payerEmail}&payerAddress=${payerAddress}&payerMobile=${payerMobile}&clientTxnId=${clientTxnId}&amount=${amount}&clientCode=${clientCode}&transUserName=${transUserName}&transUserPassword=${transUserPassword}&callbackUrl=${callbackUrl}&channelId=${channelId}&mcc=${mcc}&transData=${transData}`;
      // Construct the string for request...
      const stringForRequest = `payerName=${payerName}&payerEmail=${payerEmail}&payerAddress=${JSON.stringify(payerAddress)}&payerMobile=${payerMobile}&clientTxnId=${clientTxnId}&amount=${amount}&clientCode=${clientCode}&transUserName=${transUserName}&transUserPassword=${transUserPassword}&callbackUrl=${callbackUrl}&channelId=${channelId}&mcc=${mcc}&transData=${transData}`;

      // Encrypt the stringForRequest
      const encryptedStringForRequest = encrypt(stringForRequest);
      console.log("client transaction Id :",clientTxnId)

      console.log("encrypted data :", encryptedStringForRequest)
      // Send the data to the frontend
      res.json({
          spURL: spURL,
          encData: encryptedStringForRequest,
          clientCode: clientCode
      });
  } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send("Internal Server Error");
  }
});

app.post("/getPgRes", async (req, res) => {
  try {
    let body = "";
    req.on("data", function (data) {
      body += data;
    });
    req.on("end", async function () {
      console.log("sabpaisa response :: " + body);
      
      // Decrypt the received encrypted response
      var decryptedResponse = decrypt(decodeURIComponent(body.split("&")[1].split("=")[1]));
      console.log("decryptedResponse :: " + decryptedResponse);

      // Redirect the user to the checkout page with the decrypted response as a query parameter
      res.redirect(`https://ihmhealth.in/checkout.html?decryptedResponse=${encodeURIComponent(decryptedResponse)}`);
      // res.redirect(`http://127.0.0.1:5500/public_html/checkout.html?decryptedResponse=${encodeURIComponent(decryptedResponse)}`);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
