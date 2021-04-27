app.component('joined-data', {
    props: {
        accessToken: {
            type: String,
            required: true
        },

        map: {
            required: true
        },

        data: {
            type: Array,
            required: true
        }
    },

    template:
    /*html*/
    `
    <div class="joined-data">
        <div v-if="displayTimer" class="timer">
            <p>Temps restant avant extraction complète des données: <span class="remaining-time">{{ remainingTime }}</span></p>
            <p>
            L'API de Mapbox Geocoding limitant le nombre de requêtes à 600 par minute, la récupération d'informations géographiques à partir
            des deux coordonnées de longitude et de latitude peut prendre un certain temps. Veuillez patienter.
            </p>
        </div>
        <div v-else>
            <table>
                <tr>
                    <th>Département</th>
                    <th>Nombre de points</th>
                    <th>Valeur moyenne (indicateur 1)</th>
                    <th>Valeur moyenne (indicateur 3)</th>
                </tr>
                <tr v-for="regionInfo in joinedData" id="clickable" @click="navigate(regionInfo)">
                    <td>{{ regionInfo.region }}</td>
                    <td>{{ regionInfo.population }}</td>
                    <td>{{ regionInfo.meanIndicator1 }}</td>
                    <td>{{ regionInfo.meanIndicator3 }}%</td>
                </tr>
            </table>
        </div>
    </div>
    `
    ,

    data() {
        return {
            dataRegion: {},
            remainingTime: '0',
            joinedData: []
        }
    },

    mounted() {
        let _this = this;
    
        // We set a first timeout so the value of the data property has time to update before the component is mounted
        setTimeout(() => {

            let length = this.data.length
            let chunkSize = 550;
            let minutes = 0;

            // Every second, we decrease the remaining time by 1 second
            remainingSeconds = Math.floor(length / chunkSize) * 60 + 3;
            _this.formatRemainingTime(remainingSeconds);

            var intervalID = setInterval(() => {
                if(remainingSeconds === 0){
                    clearInterval(intervalID)
                }
                remainingSeconds -= 1;
                _this.formatRemainingTime(remainingSeconds);
            }, 1000);

            // Due to the Mapbox Geocoding API limitations, we can only make 600 get requests per minute (but we do 580 just in case)
            this.data.forEach((location, index) => {
                minutes = Math.floor(index / chunkSize) * 1000 * 60 + 1000;
                setTimeout(() => _this.setRegion(location, index), minutes);
            })
            setTimeout(() => {
                _this.constructJoinedData();
                this.$emit('update-data', this.dataRegion);
            }, minutes + 1000);
        }, 1000)
    },

    methods: {

        // This function aggregates the data from each region
        constructJoinedData() {
            let _this = this;

            const sortObject = obj => Object.keys(obj).sort().reduce((res, key) => (res[key] = obj[key], res), {});
            this.dataRegion = sortObject(this.dataRegion);
            

            for(let key in this.dataRegion) {

                let tempObject = {};

                tempObject = _this.computeAgregatedData(this.dataRegion[key]);
                

                this.joinedData.push({
                    region: key,
                    ...tempObject
                })
            }
        },

        computeAgregatedData(data) {
            let agregatedData = {
                population: 0,
                meanIndicator1: 0,
                meanIndicator3: 0,
                meanLongitude: 0,
                meanLatitude: 0
            };

            data.forEach((location) => {
                agregatedData.population += 1;
                agregatedData.meanIndicator1 += location.indicator1;
                agregatedData.meanIndicator3 += location.indicator3;
                agregatedData.meanLongitude += parseFloat(location.longitude);
                agregatedData.meanLatitude += parseFloat(location.latitude);

            })

            agregatedData.meanIndicator1 /=  agregatedData.population;
            agregatedData.meanIndicator1 = Math.round(agregatedData.meanIndicator1 * 100) / 100;

            agregatedData.meanIndicator3 /= agregatedData.population;
            agregatedData.meanIndicator3 = Math.round(agregatedData.meanIndicator3 * 100) / 100;

            agregatedData.meanLongitude /= agregatedData.population;
            agregatedData.meanLongitude = Math.round(agregatedData.meanLongitude * 100) / 100;

            agregatedData.meanLatitude /= agregatedData.population;
            agregatedData.meanLatitude = Math.round(agregatedData.meanLatitude * 100) / 100;

            return agregatedData;
        },

        // This function sets the region property of a location thanks to the Mapbox Geocoding API
        // !!! Stay cautious with this function as Mapbox Geocoding API requests can be billable passed a specific amount !!! 
        // Furthermore, requests are limited to 600 per minute, which explains the workaround in the mounted hook
        setRegion(location, index) {

            // We retrieve the region in which the location exists with a GET request
            axios.get('https://api.mapbox.com/geocoding/v5/mapbox.places/' 
            + location.longitude 
            + ',' + location.latitude + '.json?types=region&access_token=pk.eyJ1IjoicGF1bHdhc3MiLCJhIjoiY2tuc3p6cXRqMDloYzJ1bjM5NTRuYmI2dSJ9.mFspcmr5O4fRFqZl5jyB3A')
            .then(({data}) => {
                if(data['features']['0']) {
                    if(this.dataRegion[data['features']['0']['text']] === undefined){
                        this.dataRegion[data['features']['0']['text']] = []
                    }
                    this.dataRegion[data['features']['0']['text']].push(location);
                }
                else {
                    this.$emit('add-to-bad-data', location, index, 'ce point est offshore');
                }
            },
            (error) => console.log(error));
        },

        navigate(regionInfo) {
            window.scrollTo(0, 400);
            this.map.flyTo({center: [regionInfo.meanLongitude, regionInfo.meanLatitude], zoom: 6.5});
        },

        formatRemainingTime(remainingSeconds) {
            let minutes = Math.floor(remainingSeconds / 60) > 0 ? Math.floor(remainingSeconds / 60) : '';
            let minutesStr = minutes == '' ? '' : 'minute';
            let minutesPlural = (minutes != '' && Math.floor(remainingSeconds / 60) > 1) ? 's' : '';
            let seconds = remainingSeconds % 60 > 0 ? remainingSeconds % 60 : '';
            let secondsStr = seconds == '' ? '' : 'seconde';
            let secondsPlural = (seconds != '' && remainingSeconds % 60 > 1) ? 's' : '';

            this.remainingTime =  minutes + ' ' + minutesStr + minutesPlural + ' ' + seconds + ' ' + secondsStr + secondsPlural;
        },

    },

    computed: {
        displayTimer() {
            return this.remainingTime != '   '
        }
    }
})