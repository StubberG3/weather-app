const app = {
    init: () => {
        app.setEvents();
        app.fetchWeather(app.default);
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
    fetchWeather: (zipResults) => {
        let key = `${process.env.OPENWEATHERMAP_API_KEY}`;
        let lat = zipResults.latitude;
        let lon = zipResults.longitude;
        let lang = 'en';
        let units = 'metric';
        let url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${key}&appid=${key}&units=${units}&lang=${lang}`;
        //fetch the weather
        fetch(url)
            .then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            })
            .then((weatherResults) => {
                console.log('OpenWeatherMap: ', weatherResults);
                app.showWeather(weatherResults, zipResults);
            })
            .catch((error) => {
                console.log(error);
            });
        // fetch the map
        let zoom = 13;
        let map = L.map('map', {
            center: L.latLng(lat, lon),
        }).setView([lat, lon], zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        // add marker
        var marker = L.marker([lat, lon]).addTo(map);
        var circle = L.circle([lat, lon], {
            color: app.colors["primary-color"],
            fillColor: app.colors["primary-color"],
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map);
        var popup = L.popup();
        function onMapClick(e) {
            popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(map);
        }
        map.on('click', onMapClick);
        window.setTimeout(function() {
            map.invalidateSize();
        }, 1000);
    },
    fetchWeatherComplete: () => {
        $('#loading').hide();
        $('.forecast-list').show();
    },
    fetchZip: (e) => {
        let zip = $(e.target).val();
        if (zip.length !== 5) {
            console.log('yeet');
            return;
        }

        let key = `${process.env.ZIPCODESTACK_API_KEY}`;
        let url = `https://api.zipcodestack.com/v1/search?codes=${zip}&country=us&apikey=${key}`;

        //fetch by zip
        fetch(url)
            .then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            })
            .then((data) => {
                console.log('ZipCodeStack: ', data);
                let results = data.results[zip][0];
                app.fetchWeather(results);
            })
            .catch((error) => {
                console.log('Error: ', error);
                $('#loading').hide();
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
        navigator.geolocation.getCurrentPosition(app.onGetLocationSuccess, app.onGetLocationError, opts);
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
            $('.carousel.carousel-slider').carousel({
                fullWidth: true,
                numVisible: 5,
                indicators: true,
                noWrap: false
            });
            document.addEventListener('click', app.toggleForecast);
            document.addEventListener('blur', app.fetchZip);
        });
    },
    showWeather: (weatherResp, zipResp) => {
        let scale = app.getTempScale();
        /*
         * Today's Forecast
         */
        (function showToday() {
            let current = weatherResp.current;
            let today = document.querySelector('.today');
            $('#today-date').text(
                new Date(current.dt * 1000).toLocaleDateString("en-US", {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            );
            $('#city-state').text(`${zipResp.city}, ${zipResp.state}`);
            today.innerHTML = `<div class="row no-margin">
                <div class="col s12">
                    <div class="row valign-wrapper no-margin">
                        <img
                            src="http://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png"
                            class="card-image"
                            style="position: relative; right: 40px;"
                            alt="${app.toTitleCase(current.weather[0].description)}"
                        />
                        <div style="position: relative; right: 65px;">
                            <h2 class="no-margin">
                                <span style="font-weight: 500;">${app.getLongTemp(current.temp, scale)}</span>
                            </h2>
                            <h6 class="no-margin">
                                <span style="font-weight: 400;">${app.toTitleCase(current.weather[0].main)}</span>
                            </h6>
                        </div>
                    </div>
                </div>
                <blockquote class="col s12 no-margin" style="position: relative; bottom: 20px; left: 10px;">
                    <h6><span style="font-weight: 500;">Feels like ${app.getLongTemp(current.feels_like, scale)}.
                        ${app.toTitleCase(current.weather[0].description)}.
                        ${app.getLongWindSpeed(current.wind_speed)}.
                    </span></h6>
                </blockquote>
            </div>`;
        })();

        /*
         * Hourly Forecast
         */
        (function showHourly() {
            let hourly = weatherResp.hourly;
            const hourlyTemps = hourly.map( (hour, idx) => {
                return app.convertCtoF(hour.temp, scale);
            });
            const hourlyWindSpeed = hourly.map( (hour, idx) => {
                return hour.wind_speed;
            });
            const hourlyHours = hourly.map( (hour, idx) => {
                return new Date(hour.dt * 1000)
                    .toLocaleString("en-US",
                        {
                            hour: 'numeric'
                        }
                    )
            })

            const data = {
                labels: hourlyHours,
                datasets: [{
                    label: 'Temperature by Hour',
                    data: hourlyTemps,
                    fill: true,
                    backgroundColor: app.colors["primary-color-light-2"],
                    borderColor: app.colors["primary-color"],
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
            }

            const ctx = document.getElementById("hourly-chart");
            const chart = new Chart(ctx, {
                type: 'line',
                data: data,
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
                                callback: function(value, index, ticks) {
                                    return `${value} °${scale}`;
                                }
                            }
                        }
                    }
                }
            });

            $('#chart-switch-input').click((e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                let isChecked = $(e.target).prop('checked');
                chart.data = isChecked ? data2 : data;
                chart.options.scales.y.ticks = {
                    callback: function (value, index, ticks) {
                        return isChecked ? value : `${value} °${scale}`;
                    }
                };
                chart.update();
                $('.chart-switch-desc').toggleClass('active');
            });
        })();

        /*
         * Weekly Forecast
         */
        (function showWeekly() {
            let weekly = document.querySelector('.weekly');
            weekly.innerHTML = weatherResp.daily
                .map((day, idx) => {
                    let dt = new Date(day.dt * 1000); //timestamp * 1000
                    return `<li data-weekly-item="${idx}">
                        <div class="collapsible-header row valign-wrapper no-margin">
                            <div class="col s3 day">
                                <span class="hide-on-med-and-up">
                                    ${dt.toLocaleDateString("en-US",
                                            {
                                                weekday: 'short'
                                            }
                                        )
                                    }
                                </span>
                                <span class="hide-on-small-only">
                                    ${idx === 0 ? 'Today' :
                                        dt.toLocaleDateString("en-US",
                                            {
                                                weekday: 'long'
                                            }
                                        )
                                    }
                                </span>
                            </div>
                            <div class="col s4 temperature">
                                <span class="temp-primary temp-max">${app.getLongTemp(day.temp.max, scale)}</span>
                                /
                                <span class="temp-min">${app.getLongTemp(day.temp.min, scale)}</span>
                            </div>
                            <div class="col s5 weather valign-wrapper">
                                <img
                                    src="http://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png"
                                    alt="${app.toTitleCase(day.weather[0].description)}"
                                />
                                <span class="hide-on-med-and-up">${day.weather[0].main}</span>
                                <span class="hide-on-small-only">${app.toTitleCase(day.weather[0].description)}</span>
                            </div>
                            <i class="fa-solid fa-chevron-down right primary-color-text"></i>
                        </div>
                        <div class="collapsible-body">
                            ${day.humidity}% Humidity</span>
                        </div>
                    </li>`;
                })
                .join(' ');
        })();

        app.fetchWeatherComplete();
    },
    toTitleCase: (str) => {
        return str.replace(/(^|\s)\S/g, function(t) { return t.toUpperCase() });
    }
};

app.init();