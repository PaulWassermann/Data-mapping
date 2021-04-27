app.component('bad-data-vizualisation', {
    props: {
        map: {
            required: true
        },

        data: {
            type: Array,
            required: true
        },

        badData: {
            type: Array,
            required: true
        }
    },

    template: 
    /*html*/
    `
    <div class="bad-data-vizualisation">
        <div class="bad-data-title">
            <h3>Lignes du fichier présentant un défaut</h3>
        </div>
        <div v-if="badData.length" class="bad-data-list">
            <ul>
                <li v-for="(data, index) in badData" :key="index">
                    <p 
                        v-if="data.clickable === true" 
                        class="clickable-p"
                        @click="showPopup(data)">Ligne {{ data.index }}: {{ data.error }}</p>
                    <p v-else>Ligne {{ data.index }}: {{ data.error }}</p>
                </li>
            </ul>
        </div>
        <div v-else>
            <p>Aucun défaut n'a été détecté dans le jeu de données.</p>
        </div>
    </div>
    `
    ,
    data() {
        return {
            currentLocation: null
        }
    },

    methods: {
        // This function is called after the user clicks one of the clickable paragraphs, flies to the position of the location 
        // and toggles the popup conditionnally
        showPopup(location) {
            let _this = this;

            let dataIndex = _this.getDataIndex(location);

            if(this.currentLocation && this.data[dataIndex].markerIsDisplayed === true && this.currentLocation.marker.getPopup().isOpen() === true) {
                this.currentLocation.marker.togglePopup();
            }
            
            this.currentLocation = location;


            if(this.data[dataIndex].markerIsDisplayed === true && this.currentLocation.marker.getPopup().isOpen() === false) {
                this.currentLocation.marker.togglePopup();
            }

            if(this.data[dataIndex].markerIsDisplayed) {
                this.map.flyTo({
                    center: [this.currentLocation.longitude, this.currentLocation.latitude],
                    zoom: 6.5
                })
            }
        },

        getDataIndex(location) {
            let indexValue = 0;

            this.data.forEach((locationIterable, index) => {
                if(locationIterable.node == location.node) {
                    indexValue = index;
                }
            })

            return indexValue
        }
    },

    computed: {
        onClickClass() {
            return {
                clicked: this.clicked,
                'background-color': '#ECA562'
            }
        }
    }
})