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

    let defaultZip = '19019'; // philly
    let zip = !body.zip ? defaultZip : body.zip;
    let zipApiKey = process.env.ZIPCODESTACK_API_KEY;
    let weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    let city = '';
    let state = '';

    axios
        .get(`https://api.zipcodestack.com/v1/search?codes=${zip}&country=us&apikey=${zipApiKey}`)
        .then(response => {
            let data = response['data']['results'][zip][0];
            console.log(data);
            let lat = data.latitude;
            let lon = data.longitude;
            city = data.city;
            state = data.state;
            let units = 'metric';
            let lang = 'en';
            return axios.get(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${weatherApiKey}&appid=${weatherApiKey}&units=${units}&lang=${lang}`);
        })
        .then(response => {
            res.send({
                zipResults: {
                    city: city,
                    state: state
                },
                weatherResults: response.data,
            });
        });
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