const express = require('express');
const app = express();
// to manage user session
const dialogflowSessionClient = require('./botlib/dialogflow_session_client.js');
require('dotenv').config();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
process.env.GOOGLE_APPLICATION_CREDENTIALS;

const projectId = 'test-uvlf';
const phoneNumber = "+17863058558";

const accountSid = 'AC43c8333da0a50fa0c7733c5ddbbcacca';
const authToken = '6771b8fd02259808a9c3a0a5701056dc';

const client = require('twilio')(accountSid, authToken);
const sessionClient = new dialogflowSessionClient(projectId);

const sheetBestApiUrl = 'https://sheet.best/api/sheets/SPREADSHEET_ID';

const port_num = 5000;
// start the server
// const listener = app.listen(process.env.PORT, function() {
const listener = app.listen(port_num, function() {
    console.log('Your Twilio integration server is listening on port ' +
        listener.address().port);
});

app.post('/', async function(req, res) {
    // get the body of the msg
    const body = req.body;
    // get original text by the user
    const text = body.Body;
    // get user mobile number
    const sendTo = body.From;
    // detect the intent and pass the query
    const intent = await sessionClient.detectIntent(text, sendTo, body);
    const dialogflowResponse = intent.fulfillmentText;

    console.log("User response => " + JSON.stringify(text, null, 2));

    if (intent.intent.displayName === 'abc') {
        const name = intent.parameters.fields.name.stringValue;
        const email = intent.parameters.fields.email.stringValue;
        const address = intent.parameters.fields.address.stringValue;

        // Write to Google spreadsheet using sheet.best API
        const data = { name, email, address };
        const response = await fetch(sheetBestApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        console.log('Data written to Google spreadsheet => ' + JSON.stringify(data, null, 2));
    }

    try {
        await client.messages.create({
            body: dialogflowResponse,
            from: phoneNumber,
            to: sendTo
        }).then(message => console.log("*** message sent successfully to => " + sendTo + "  *****"+ message.sid));
    } catch (error) {
        console.log("error => " + JSON.stringify(error, null, 2))
    }
    console.log("Dialogflow responce => " + JSON.stringify(dialogflowResponse, null, 2));
    // terminate the user request successfully
    res.end();
});


process.on('SIGTERM', () => {
    listener.close(() => {
        console.log('Closing http server.');
        process.exit(0);
    });

});
