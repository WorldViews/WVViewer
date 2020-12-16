
"use strict";

class LeafletTours {

    constructor() {
        this.tours = {};
        this.coordSystems = {};
    }

    loadCoordSys(rec) {
        var cs = rec.coordSys;
        console.log("coordSys", cs);
        this.coordSystems[cs] = rec;
    }

    async loadTrail(rec) {
        var id = rec.id;
        var url = rec.dataUrl;
        console.log("loadTrail", id, rec, url);
        var tour = await WV.loadJSON(url);
        console.log("tour", id, tour);
        this.tours[id] = tour;
    }

    async loadTours() {
        var url = "../static/data/tours_data.json";
        this.tours = await WV.loadJSON(url);
        var inst = this;
        window.TOURS = this.tours;
        console.log("tours", this.tours);
        this.tours.records.forEach(rec => {
            if (rec.recType == "CoordinateSystem") {
                inst.loadCoordSys(rec);
            }
            else {
                inst.loadTrail(rec);
            }
        })
    }
}