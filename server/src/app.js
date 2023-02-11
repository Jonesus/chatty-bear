const express = require("express")
require('dotenv').config()

/*Initiate Express app*/
const app = express();

/*Apply middleware with separate requirements in prod and dev in mind*/
//Middleware appicable identically in all environments
app.use(express.urlencoded({ extended: true })); //parses incoming requests with urlencoded payloads
app.use(express.json()); //parses incoming request bodies and makes it available under the req.body property.

/*Define routes*/
app.use("/api/openai", require("./api/openai"));

module.exports = app;