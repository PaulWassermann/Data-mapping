app.component('vizualisation-options', {
    props: {
        maxIndicator1: {
            type: Number,
            required: true
        }
    },

    template:
    /*html*/
    `
    <form class="vizualisation-options" @submit.prevent="onSubmit">
        <div>
            <h3 class="filter-title">Options de filtrage des données</h3>
        </div>
        <div class="option">
            <label for="displayMarkers" style="margin-right: 10px;">Afficher les marqueurs: </label>
            <input type="checkbox" id="displayMarkers" name="displayMarkers" v-model="displayMarkers">
        </div>
        <div class="option">
            <label for="isEDFHighlighted" style="margin-right: 10px;">Mettre en évidence les sites EDF: </label>
            <input type="checkbox" id="isEDFHighlighted" name="isEDFHighlighted" v-model="isEDFHighlighted">
        </div>
        <div class="option">
            <label for="indicator1-fork">Afficher uniquement les sites pour lesquels l'indicateur 1 est compris entre
                <input 
                    type="number" 
                    id="indicator1-fork-low" 
                    name="indicator1-fork-low" 
                    min="0" 
                    :max=indicator1ForkHigh
                    v-model.number="indicator1ForkLow">
                 (minimum 0) et
                <input 
                    type="number" 
                    id="indicator1-fork-high" 
                    name="indicator1-fork-high" 
                    :min=indicator1ForkLow 
                    :max=maxIndicator1
                    v-model.number="indicator1ForkHigh">
                 (maximum {{ maxIndicator1 }})
            </label>
        </div>
        <div class="option">
            <label for="indicator2" style="margin-right: 10px;">Afficher uniquement les sites EDF: </label>
            <input type="checkbox" id="indicator2" name="indicator2" v-model="indicator2">
        </div>
        <div class="option">
            <label for="indicator3-fork">Afficher uniquement les sites pour lesquels l'indicateur 3 est compris entre
                <input 
                    type="number" 
                    id="indicator3-fork-low" 
                    name="indicator3-fork-low" 
                    min="0" 
                    :max=indicator3ForkHigh
                    v-model.number="indicator3ForkLow">
                (minimum 0%) et
                <input 
                    type="number" 
                    id="indicator3-fork-high" 
                    name="indicator3-fork-high" 
                    :min=indicator3ForkLow 
                    :max="100"
                    v-model.number="indicator3ForkHigh">
                (maximum 100%)
            </label>
        </div>
        <div class="option">
            <label for="heatmap" style="margin-right: 10px;">Afficher les données sous forme de carte thermique: </label>
            <input type="checkbox" id="heatmap" name="heatmap" v-model="heatMap">
        </div>
        <input class="refresh-button" type="submit" value="Rafraîchir la carte"> 
    </form>
    `
    ,
    data() {
        return{
            displayMarkers: true,
            isEDFHighlighted: true,
            indicator1ForkLow: 0,
            indicator1ForkHigh: 0,
            indicator2: false,
            indicator3ForkLow: 0,
            indicator3ForkHigh: 100,
            heatMap: false

        }
    },

    mounted() {
        setTimeout(() => this.indicator1ForkHigh = this.maxIndicator1, 500);
    },

    methods: {
        onSubmit() {

            if(this.displayMarkers === false) {
                this.isEDFHighlighted = false;
            }

            this.$emit('map-refresh', { 
                displayMarkers: this.displayMarkers,
                isEDFHighlighted: this.isEDFHighlighted, 
                indicator1ForkLow: this.indicator1ForkLow, 
                indicator1ForkHigh: this.indicator1ForkHigh,
                indicator2: this.indicator2,
                indicator3ForkLow: this.indicator3ForkLow,
                indicator3ForkHigh: this.indicator3ForkHigh,
                heatMap: this.heatMap 
            })
        }
    },
})