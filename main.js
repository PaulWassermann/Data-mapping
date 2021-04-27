// Creates the Vue app
const app = Vue.createApp({
    data() {
        return {
            isFileSelected: false,
            accessToken: 'pk.eyJ1IjoicGF1bHdhc3MiLCJhIjoiY2tudDBhZWJlMDk2ZTJ1bnh1ZnNwdm5rYSJ9.KXd9rA8gmnvO0hObxTFM2g',
            map: null,
            data: [],
            badData: [],
            maxIndicator1: 0,
            isHeatMapLayered: false
            }
        },
    // Actions to perform after the app is mounted to the DOM
    mounted() {
        mapboxgl.accessToken = this.accessToken;
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [2, 47],
            zoom: 4.7,
            });
    },
    methods: {

        /* UPLOADED FILE AND DATA RELATED METHODS */

        // Reads the uploaded file and stores its data in the data property
        readFile() {

            // This trick allows to access other methods of the app
            let _this = this;

            let file = document.getElementById('input').files[0];
            let filename = file.name.split('.')

            // Checking if the file is a .csv file
            if (filename[filename.length - 1] != 'csv') {
                alert('Vous devez sélectionner un fichier au format .csv!');
                document.getElementById('input').value = '';
                return 
            }

            // Retrieving data from the uploaded file
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy', 
                complete: function(results) {
                    _this.setData(results.data);
                    _this.refreshMap({ firstRefresh: true, isEDFHighlighted: true });  
                },
                error: function(error, file) {
                    alert('Un problème est survenu lors de la lecture du fichier' + file.name + '. Assurez-vous qu\'il n\'est pas corrompu.');
                    console.log(error);
                }
            });

            // Finally, we specify that a file has been selected so the app can display new elements for the user to use
            this.isFileSelected = true;
        },

        // Sets the data property to a new set of data while leaving out corrupted data
        setData(data) {
            let _this = this;
            let keys = Object.keys(data[0]);

            data.forEach((location, index) => {

                // If the data is deemed good, we format it and add it to the data property
                if (!_this.isDataIncomplete(location)){

                    this.data.push({
                        node: location[keys[0]],
                        longitude: location[keys[1]].replace(',', '.'),
                        latitude: location[keys[2]].replace(',', '.'),
                        indicator1: parseFloat(location[keys[3]]),
                        indicator2: parseFloat(location[keys[4]]),
                        indicator3: parseFloat(location[keys[5]]),
                    })

                    // We retrieve the max value for the first indicator on the fly
                    if(parseFloat(location[keys[3]]) > this.maxIndicator1) {
                        this.maxIndicator1 = parseFloat(location[keys[3]]);
                    }
                }

                // If the data is incomplete, we add it to the badteData property to then notify the user this specific line of the file
                // can't be processed
                else {
                    _this.updateBadData(location, index + 2, 'une ou plusieurs données sont manquantes', false)
                }
            })
        },

        // Add the region information to each location of the data property, assuming it is available 
        // (filtering takes place in the JoinedData component)
        addRegions(dataRegion) {
            for(let key in dataRegion) {
                this.data[key] = key;
            }
        },

        // Add an element to the badData property
        updateBadData(location, index, error, clickable=true) {
            this.badData.push({ 
                ...location,
                index, 
                error,
                clickable
            });
        },

        // Checks if the line of the uploaded csv file passed as an argument is complete
        isDataIncomplete(item) {

            if(item === null || item === undefined) {
                return true
            }

            for(let key in item) {
                if(item[key] == '') {
                    return true
                }
            }
        },


        /* MAP RELATED METHODS */

        // This function conditionnally refreshes the map
        refreshMap({ 
            firstRefresh=false, 
            displayMarkers,
            isEDFHighlighted, 
            indicator1ForkLow, 
            indicator1ForkHigh, 
            indicator2,
            indicator3ForkLow, 
            indicator3ForkHigh,
            heatMap
         }) {
            let _this = this

            if(firstRefresh === true) {
                _this.createMarkers();
                _this.displayMarkers({ firstRefresh: true })
                if(isEDFHighlighted !== undefined){
                    _this.changeEDFColor(isEDFHighlighted);
                }
            }

            else {
                if(isEDFHighlighted !== undefined){
                    _this.changeEDFColor(isEDFHighlighted);
                }

                _this.displayMarkers({ indicator1ForkLow, indicator1ForkHigh, indicator2, indicator3ForkLow, indicator3ForkHigh });

                if(heatMap === true && this.isHeatMapLayered === false) {
                    _this.addHeatMapLayer()
                    if(!displayMarkers) {
                        _this.removeMarkers();
                    }
                }

                else if(heatMap === true && this.isHeatMapLayered === true) {
                    _this.removeHeatMapLayer();
                    _this.addHeatMapLayer();
                    if(!displayMarkers) {
                        _this.removeMarkers();
                    }
                }

                else if(heatMap === false && this.isHeatMapLayered === true) {
                    _this.removeHeatMapLayer();
                    if(!displayMarkers) {
                        _this.removeMarkers();
                    }
                }

                if(!displayMarkers) {
                    _this.removeMarkers();
                }
            }
        },

        // This function conditionnally displays markers on the map
        displayMarkers({ firstRefresh=false, indicator1ForkLow, indicator1ForkHigh, indicator2, indicator3ForkLow, indicator3ForkHigh }) {
            let _this = this;

            if(firstRefresh === true) {     
                this.data.forEach((location) => {
                    _this.displayMarker(location);
                    })
                }

            else {
                this.data.forEach((location) => {
                    _this.displayMarker(location);
                    _this.filterIndicator1(location, indicator1ForkLow, indicator1ForkHigh);

                    if(indicator2 === true) {
                        _this.filterIndicator2(location);
                        }
                    
                    _this.filterIndicator3(location, indicator3ForkLow, indicator3ForkHigh)
                    })
            }

        },

        // This function displays one marker on the map and sets the location's markerIsDisplayed to true
        displayMarker(location) {
            location.marker.addTo(this.map);
            location.markerIsDisplayed = true;
        },

        removeMarkers() {
            let _this = this;

            this.data.forEach(location => {
                if(location.markerIsDisplayed === true) {
                    _this.removeMarker(location);
                }
            })
        },

        // This function removes one marker off the map and sets the location's markerIsDisplayed to false
        removeMarker(location) {
            location.marker.remove();
            location.markerIsDisplayed = false;
        },

        // This function loops through the data property and add a marker for each object
        createMarkers(color='#3FB1CE', addPopup=true) {
            let _this = this
            this.data.forEach((location) => {
                _this.createMarker(location, color, addPopup);
            })
        },

        // This function creates one marker, and adds it as a property of the object passed as an argument
        createMarker(location, color='#3FB1CE', addPopup=true) {
            let _this = this;

            if(addPopup) {
                popup = new mapboxgl.Popup({})
                .setHTML('<p><strong>Node:</strong> ' + location.node + 
                '</br><strong>Coordonnées:</strong> ' + _this.getCoordinates(location) +
                '</br><strong>Indicateur 1:</strong> ' + location.indicator1 +
                '</br><strong>Indicateur 2:</strong> ' + location.indicator2+
                '</br><strong>Indicateur 3:</strong> ' + location.indicator3 + '%' + '</p>')
            }

            if(location.marker) {
                location.marker.remove();
            }

            location.marker = new mapboxgl.Marker({ color: color, scale: 0.5})
            .setLngLat([location.longitude, location.latitude])
            .setPopup(popup)

            location.markerIsDisplayed = false;
        },

        // This function changes the color of EDF facilities' markers
        changeEDFColor(isEDFHighlighted) {
            let _this = this
            this.data.forEach((location) => {
                if(location.indicator2 == 1) {
                    if(isEDFHighlighted == true) {
                        _this.createMarker(location, '#BB0000');
                        _this.displayMarker(location);
                    }
                    else {
                        _this.createMarker(location);
                        _this.displayMarker(location);
                    }
                }
            })
        },

        // This function removes the location marker from the map if its first indicator value does not meet the conditions set by the user 
        filterIndicator1(location, min, max) {
            let _this = this;

            if((location.indicator1 < min || max < location.indicator1) && location.markerIsDisplayed === true) {
                _this.removeMarker(location);
            }
        },

        // This function removes the location marker if its second indicator is 0 
        filterIndicator2(location) {
            let _this = this;

            if(location.indicator2 == 0 && location.markerIsDisplayed === true) {
                _this.removeMarker(location);
            }
        },

        // This function removes the location marker from the map if its third indicator value does not meet the conditions set by the user 
        filterIndicator3(location, min, max) {
            let _this = this;

            if((location.indicator3 < min || max < location.indicator3) && location.markerIsDisplayed === true) {
                _this.removeMarker(location);
            }
        },

        // This function creates and add a heatmap layer to the map
        addHeatMapLayer() {

            let coordinates = this.data.filter(location => location.markerIsDisplayed === true)
                                    .map(location => [location.longitude, location.latitude])

            this.map.addSource('my-data', {
                "type": "geojson",
                "data": {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPoint",
                        "coordinates": coordinates
                    }
                }
            });

            this.map.addLayer({
                id: 'heatmap',
                source: 'my-data',
                type: 'heatmap',
                paint: {
                    'heatmap-radius': {
                        stops: [
                          [10, 15]
                        ]
                    }
                }
            })

            this.isHeatMapLayered = true;
        },

        // This function removes the heatmap layer from the map
        removeHeatMapLayer() {
            this.map.removeLayer('heatmap');
            this.map.removeSource('my-data');
            this.isHeatMapLayered = false;
        },

        // This function returns a formatted string containing the information about the geographical position of the location
        getCoordinates(location) {
            let intLng = Math.floor(location.longitude);
            let decLng = Math.round((location.longitude - intLng) * 100);
            let intLat = Math.floor(location.latitude);
            let decLat = Math.round((location.latitude - intLat) * 100);
            let horCard = location.latitude < 0 ? 'S' : 'N';
            let vertCard = location.longitude < 0 ? 'O' : 'E';
            return intLng + '°' + decLng + '\' ' + vertCard + ', ' + intLat + '°' + decLat + '\' ' + horCard
        },


        /* MISCELLANEOUS */
        
        scrollDown(value) {
            setTimeout(() => window.scrollTo(0, value), 3000)
            
        }
    }
});
