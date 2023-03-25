const express = require('express');
const app = express();
const axios= require('axios');
// to manage user session
const dialogflowSessionClient = require('./botlib/dialogflow_session_client.js');
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
process.env.GOOGLE_APPLICATION_CREDENTIALS;

const projectId = '<project-id>';
const phoneNumber = "<phone-number>";

const accountSid = '<account-sid>';
const authToken = '<auth-token>';

const client = require('twilio')(accountSid, authToken);
const sessionClient = new dialogflowSessionClient(projectId);
const sheetEndpoint = 'https://sheet.best/api/sheets/<sheet-id>';

port_num = 5000;
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
    const dialogflowResponse = (await sessionClient.detectIntent(text, sendTo, body)).fulfillmentText;
    const intentName = (await sessionClient.detectIntent(text, sendTo, body)).intent.displayName;
    const result = (await sessionClient.detectIntent(text, sendTo, body));

    console.log("User response => " + JSON.stringify(text, null, 2));
    // const response1= await sessionClient.detectIntent(text)
    // const result1 = response1[0].queryResult;
    console.log("Dialogflow Respopnse: ",dialogflowResponse)
    // console.log("result: ",result)
    console.log(result.parameters.fields)
    
    // if(intentName === 'await-name'){
    //     var name = result.queryText;
    //     console.log(result.parameters.fields.name.structValue.fields.name.stringValue)
    // }
    if (intentName === 'await-address') {
        const name = result.parameters.fields.name.structValue.fields.name.stringValue;
        const email = result.parameters.fields.email.stringValue;
        const address = result.parameters.fields.address.stringValue;
        console.log(name)
        console.log(email)
        console.log(address)
        // write the data to the Google Sheet
        const data = {
          Name: name,
          Email: email,
          Address: address,
        };
        try {
          await axios.post(sheetEndpoint, data);
          console.log('Data written to Google Sheet');
        } catch (error) {
          console.log(`Error writing to Google Sheet: ${error.message}`);
        }
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