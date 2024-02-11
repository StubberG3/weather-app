const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const port = process.env.PORT || 8080;
const public = path.join(__dirname, '/public');
const app = express();

app.use(express.static(public));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(public, '/pages', 'index.html'));
    } catch (err) {
        console.log('app.get: ', err);
    }
});

var jsonParser = bodyParser.json();

app.post('/pages/weather.html', jsonParser, function (req, res) {
    const body = req.body;
    console.log('BODY', body);

    const loc = {
        city: 'Philadelphia',
        state: 'PA',
        zip: 19019, // philly
        latitude: 39.952583,
        longitude: -75.165222
    };
    let lat = loc.latitude;
    let lon = loc.longitude;
    let lang = 'en';
    let units = 'metric';
    let zip = req.body.zip;
    let callName = req.body.callName;
    if (callName === 'fetchZip') {
        console.log('TODO: Another call needed...');
    }
    let apiKey = process.env.OPENWEATHERMAP_API_KEY;

    let url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${apiKey}&appid=${apiKey}&units=${units}&lang=${lang}`;

    const fetchData = (async () => {
        try {
            const response = await axios.get(url);
            res.send(response.data);
            // console.log(response.data);
            // console.log(response.status);
            // console.log(response.statusText);
            // console.log(response.headers);
            // console.log(response.config);
        } catch (error) {
          // Handle error
            console.error('Fetch error: ', error);
        }
    });

    fetchData();
});

const server = app.listen(port, (err) => {
    try {
        console.log(`Server listening on port ${port}...`);
    } catch (err) {
        console.log(`Error: ${err}`);
    }
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;