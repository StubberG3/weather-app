'use strict';

let chart = {};
let marker = {};
let circle = {};
let popup = {};
let map = {};
const app = {
    init: () => {
        app.setEvents();
        app.fetchMap();
    },
    colors: {
        'primary-color': '#4e406a',
        'primary-color-light': '#9687b7',
        'primary-color-light-2': '#8d7db0'
    },
    convertCtoF: (temp, scale) => {
        return scale === 'F' ? parseInt(temp * 9 / 5 + 32) : temp;
    },
    default: {
        city: 'Philadelphia',
        state: 'PA',
        zip: 19019, // philly
        latitude: 39.952583,
        longitude: -75.165222
    },
    disableMap: () => {
        if (map) {
            map._handlers.forEach(function(handler) {
                handler.disable();
            });
        }
    },
    enableMap: () => {
        if (map) {
            map._handlers.forEach(function(handler) {
                handler.enable();
            });
        }
    },
    fetchMap: (lat = app.default.latitude, lon = app.default.longitude) => {
        // fetch the map
        let zoom = 13;
        map = L.map('map', {
            center: L.latLng(lat, lon),
        }).setView([lat, lon], zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: `&copy;
            <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>`,
        }).addTo(map);
        // add marker
        marker = L.marker([lat, lon]).addTo(map);
        circle = L.circle([lat, lon], {
            color: app.colors['primary-color'],
            fillColor: app.colors['primary-color'],
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map);
        popup = L.popup();
        function onMapClick(e) {
            console.log(e.latlng);
            popup
                .setLatLng(e.latlng)
                .setContent(`You clicked the map at coordinates: (${lat}, ${lon})`)
                .openOn(map);
        }
        map.on('click', onMapClick);
        window.setTimeout(function() {
            map.invalidateSize();
        }, 1000);
        app.fetchWeather();
    },
    onFetchWeatherSuccess (jqXHR, status) {
        console.log(jqXHR, status);
        if (jqXHR.error) {
            alert('Error retrieving data. Try another zip?');
            $('#loading').hide();
            return;
        }
        app.showWeather(jqXHR.zipResults, jqXHR.weatherResults);
        let lat = jqXHR.weatherResults.lat;
        let lon = jqXHR.weatherResults.lon;
        if ($('#zip-input').val().length === 5) {
            map.panTo([lat, lon], 19);
            marker.setLatLng([lat, lon]);
            circle.setLatLng([lat, lon]);
            popup
                .setLatLng([lat, lon])
                .setContent(`Weather at coordinates: (${lat}, ${lon})`)
                .openOn(map);
        }
        if ($('#zip-submit').val()) {
            $('#zip-submit').removeClass('disabled');
        }
        app.enableMap();
        $('#loading').hide();
    },
    onFetchWeatherError (jqXHR, err, errThrown) {
        let message;
        const statusErrorMap = {
            '400' : "Server understood the request, but request content was invalid.",
            '401' : "Unauthorized access.",
            '403' : "Forbidden resource can't be accessed.",
            '404' : "Not found.",
            '500' : "Internal server error.",
            '503' : "Service unavailable."
        };
        if (jqXHR.status) {
            message = statusErrorMap[jqXHR.status];
            if (!message) {
                message = "Unknown Error.";
            } else if (err == 'parsererror'){
                message = "Error.\nParsing JSON Request failed.";
            } else if (err == 'timeout'){
                message = "Request Time out.";
            } else if (err == 'abort'){
                message = "Request was aborted by the server";
            } else {
                message = "Unknown Error \n.";
            }
        }
        console.log(message);
    },
    fetchWeather: (zip = app.default.zip) => {
        let data = {
            zip: zip
        };

        $.ajax({
            type: "POST",
            url: '/pages/weather.html',
            data: data,
            success: app.onFetchWeatherSuccess,
            error: app.onFetchWeatherError,
            dataType: 'json'
        });
    },
    getLocation: (ev) => {
        $('#loading').show();
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        let opts = {
            enableHighAccuracy: true,
            timeout: 1000 * 10, //10 seconds
            maximumAge: 1000 * 60 * 5, //5 minutes
        };
        navigator
            .geolocation
            .getCurrentPosition(
                app.onGetLocationSuccess, app.onGetLocationError, opts
            );
        $('#loading').hide();
    },
    getTempScale: () => {
        return $('#temp-scale input').prop('checked') ? 'C' : 'F';
    },
    getLongTemp: (temp, scale) => {
        return `${app.convertCtoF(temp, scale)}&deg; ${scale}`;
    },
    getLongWindSpeed: (windSpeed) => {
        let desc ='';
        if (windSpeed < 5) {
            desc = 'Calm Wind';
        } else if (windSpeed < 19) {
            desc = 'Breezy';
        } else if (windSpeed < 29) {
            desc = 'Windy';
        } else {
            desc = 'Very Windy';
        }
        return desc;
    },
    onGetLocationError: (err) => {
        //geolocation failed
        console.error(err);
    },
    onGetLocationSuccess: (position) => {
        //got position
        document.getElementById('latitude').value =
            position.coords.latitude.toFixed(2);
        document.getElementById('longitude').value =
            position.coords.longitude.toFixed(2);
    },
    setEvents: () => {
        document.addEventListener('DOMContentLoaded', function () {
            M.Sidenav.init(document.querySelectorAll('.sidenav'));
            M.Collapsible.init(document.querySelectorAll('.collapsible'));
            $('#zip-input').on('keyup', app.validateZip);
            $('#zip-submit').click(app.submitZip);
            $('#wahay').click(function() {
                if (!this.msg) {
                    this.msg = 'Wahay!';
                    this.called = 0;
                } else {
                    this.msg += 'Wahay!';
                    this.called++;
                }

                if (this.called === 3) {
                    alert('STAHP');
                } else if (this.called > 3) {
                    alert('STAHP...WHHAAAAAAAAAHAYYYYYYY!!!!');
                } else {
                    alert(this.msg);
                }
            });
        });
    },
    validateZip: (e) => {
        let $zip = $(e.target);
        let $zipSubmit = $('#zip-submit');
        let zip = $zip.val();
        if (zip.length !== 5) {
            $zipSubmit.addClass('disabled');
        } else {
            $('#zip-input-message').text('');
            $zipSubmit.removeClass('disabled');
            return false;
        };
    },
    submitZip: (e) => {
        e.preventDefault();
        let zip = $('#zip-input').val();
        if (zip.length !== 5) {
            $('#zip-input-message').text('Zip must be 5 digits');
            return;
        }
        $('#zip-submit').addClass('disabled');
        app.disableMap();
        $('#loading').show();
        app.fetchWeather(zip);
    },
    showWeather: (zipResp, weatherResp) => {
        let scale = app.getTempScale();
        /*
         * Today's Forecast
         */
        (function showToday() {
            let current = weatherResp.current;
            let today = document.querySelector('.today');
            $('#today-date').text(
                new Date(current.dt * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            );
            $('#city-state').text(`${zipResp.city}, ${zipResp.state}`);
            today.innerHTML = `<div class='row no-margin'>
                <div class='col s12'>
                    <div class='row valign-wrapper no-margin'>
                        <img
                            src='http://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png'
                            class='card-image'
                            style='position: relative; right: 30px;'
                            alt='${app.toTitleCase(current.weather[0].description)}'
                        />
                        <div style='position: relative; right: 45px;'>
                            <h2 class='no-margin'>
                                <span style='font-weight: 500;'>
                                ${app.getLongTemp(current.temp, scale)}</span>
                            </h2>
                            <h6 class='no-margin'>
                                <span style='font-weight: 400;'>
                                ${app.toTitleCase(
                                    current.weather[0].main)}</span>
                            </h6>
                        </div>
                    </div>
                </div>
                <blockquote class='col s12 no-margin'
                style='position: relative; bottom: 20px; left: 10px;'>
                    <h6><span style='font-weight: 500;'>
                    Feels like ${app.getLongTemp(current.feels_like, scale)}.
                        ${app.toTitleCase(current.weather[0].description)}.
                        ${app.getLongWindSpeed(current.wind_speed)}.
                    </span></h6>
                </blockquote>
            </div>`;
        })();

        /*
         * Hourly Forecast
         */
        let hourly = weatherResp.hourly;
        const hourlyTemps = hourly.map( (hour) => {
            return app.convertCtoF(hour.temp, scale);
        });
        const hourlyWindSpeed = hourly.map( (hour) => {
            return hour.wind_speed;
        });
        const hourlyHours = hourly.map( (hour) => {
            return new Date(hour.dt * 1000)
                .toLocaleString('en-US',
                    {
                        hour: 'numeric'
                    }
                );
        });

        const data = {
            labels: hourlyHours,
            datasets: [{
                label: 'Temperature by Hour',
                data: hourlyTemps,
                fill: true,
                backgroundColor: app.colors['primary-color-light-2'],
                borderColor: app.colors['primary-color'],
                tension: 0.1
            }]
        };

        const data2 = {
            labels: hourlyHours,
            datasets: [{
                label: 'Wind Speed by Hour',
                data: hourlyWindSpeed,
                fill: true,
                backgroundColor: 'orange',
                borderColor: '#f57c00',
                tension: 0.1
            }]
        };

        const ctx = document.getElementById('hourly-chart');
        let currData = $('#chart-switch-input').prop('checked') ? data2 : data;

        if (!$('#zip-input').val()) {
            chart = new Chart(ctx, {
                type: 'line',
                data: currData,
                options: {
                    animations: {
                        radius: {
                            duration: 400,
                            easing: 'linear',
                            loop: (context) => context.active
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                // Include a degree sign in the ticks
                                callback: function(value) {
                                    return `${value} °${scale}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chart.data = currData;
            chart.options.scales.y.ticks = {
                callback: function (value) {
                    return $('#chart-switch-input').prop('checked') ? value : `${value} °${scale}`;
                }
            };
            chart.update();
        }

        $('#chart-switch-input').click((e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            let isChecked = $(e.target).prop('checked');
            chart.data = isChecked ? data2 : data;
            chart.options.scales.y.ticks = {
                callback: function (value) {
                    return isChecked ? value : `${value} °${scale}`;
                }
            };
            chart.update();
            $('.chart-switch-desc').toggleClass('active');
        });

        /*
         * Weekly Forecast
         */
        (function showWeekly() {
            let weekly = document.querySelector('.weekly');
            weekly.innerHTML = weatherResp.daily
                .map((day, idx) => {
                    let dt = new Date(day.dt * 1000); //timestamp * 1000
                    return `<li data-weekly-item='${idx}'>
                        <div class='collapsible-header row valign-wrapper no-margin'>
                            <div class='col s12 center-align day hide-on-med-and-up' style="margin-left: 20px;">
                                <span>
                                    ${dt.toLocaleDateString('en-US',
                                            {
                                                weekday: 'long'
                                            }
                                        )
                                    }
                                </span>
                                <br>
                                <span class='temp-primary temp-max'>
                                ${app.getLongTemp(day.temp.max, scale)}</span>
                                /
                                <span class='temp-min'>
                                ${app.getLongTemp(day.temp.min, scale)}</span>
                                <br>
                                <img
                                style="width: 50px; height: 50px;"
                                src='http://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png'
                                alt='${app.toTitleCase(day.weather[0].description)}'
                                />
                                <em style="bottom: 15px;
                                position: relative;
                            ">${day.weather[0].main}</em>
                            </div>
                            <div class='col s3 day hide-on-small-only'>
                                <span class='hide-on-med-and-up'>
                                    ${dt.toLocaleDateString('en-US',
                                            {
                                                weekday: 'short'
                                            }
                                        )
                                    }
                                </span>
                                <span class='hide-on-small-only'>
                                    ${idx === 0 ? 'Today' :
                                        dt.toLocaleDateString('en-US',
                                            {
                                                weekday: 'long'
                                            }
                                        )
                                    }
                                </span>
                            </div>
                            <div class='col s4 temperature hide-on-small-only'>
                                <span class='temp-primary temp-max'>
                                ${app.getLongTemp(day.temp.max, scale)}</span>
                                /
                                <span class='temp-min'>
                                ${app.getLongTemp(day.temp.min, scale)}</span>
                            </div>
                            <div class='col s5 weather valign-wrapper hide-on-small-only'>
                                <img
                                    src='http://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png'
                                    alt='${app.toTitleCase(day.weather[0].description)}'
                                />
                                <span class='hide-on-med-and-up'>
                                    ${day.weather[0].main}</span>
                                <span class='hide-on-small-only'>
                                    ${app.toTitleCase(
                                        day.weather[0].description)}</span>
                            </div>
                            <i class='fa-solid fa-chevron-down right primary-color-text'></i>
                        </div>
                        <div class='collapsible-body center-align'>
                            <span>${day.humidity}% Humidity</span> <b class="primary-color-text">|</b>
                            <span>${day.uvi} UV Index</span> <b class="primary-color-text">|</b>
                            <span>${day.wind_speed} Wind Speed (${app.getLongWindSpeed(day.wind_speed)})</span>
                        </div>
                    </li>`;
                })
                .join(' ');
        })();
    },
    toTitleCase: (str) => {
        return str.replace(/(^|\s)\S/g, function(t) { return t.toUpperCase(); });
    }
};

app.init();