
"use strict";

var MAPBOX_TOKEN = "pk.eyJ1IjoiZG9ua2ltYmVyIiwiYSI6Ijc0NzFjYWUwM2E4NzgyNDc4M2Y1NTI3OTJlNWMyYjc5In0.xBSRvdl0XIy8SXDOIxRoCA";

/*
TOUR_URL_BASE = "./data/";
SITE_NAME = "arboretum";
MAP_IMAGE_SERVER = "./images/";

PROPS = {
    tours: [
        "devils_slide_1_vslam"
    ],
    view: { x: 40, y: 42, width: 470 },
    //graphicsURL: "./data/reach_and_teach_graphics.json",
    images: [
        //    {   url: "images/arboretum_1.jpg",
        //        x: -320, y: -240, width: 640, height: 480  }
    ]
}
*/
//videoId = "Vp_f_rWnZdg"

//var display = new Display(null, "videoPlayer", { videoId });
//var pano = new PanoProxy(display);
//var prevTourName = null;
//MAP_IMAGE_SERVER = "http://server/PanoJS/images/";

class LeafletTours {

    constructor() {
        this.tours = {};
        //this.coordSystems = {};
        this.map = null;
        var videoId = "Vp_f_rWnZdg"
        this.display = new Display(this, "videoPlayer", { videoId });
        //var pano = new PanoProxy(display);
        this.initMap();
        this.startWatcher();
    }

    startWatcher() {
        var inst = this;
        this.watcherHandle = setInterval(() => inst.update(), 1000);
    }

    update() {
        var t = this.display.getPlayTime();
        console.log("update t", t);
    }

    initMap() {
        var lat = 36.98284;
        var lon = -122.06107;
        //alert("latlon "+lat+" "+lon);
        var mymap = L.map('map').setView([lat, lon], 9);
        this.map = mymap;

        //var mymap = L.map('mapid').setView([51.505, -0.09], 13);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1
        }).addTo(mymap);

        //L.marker([lat, lon]).addTo(mymap)
        //    .bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();

        L.circle([lat, lon + .2], 500, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(mymap).bindPopup("I am a circle.");

        L.polygon([
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047]
        ]).addTo(mymap).bindPopup("I am a polygon.");


        var popup = L.popup();

        function onMapClick(e) {
            popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(mymap);
        }
        //mymap.on('click', onMapClick);

        /*
            tourCanvas.noticeCurrentTour = function (tour) {
                console.log("**** notice tour: " + tour.name);
                if (tour.name == prevTourName) {
                    console.log("same tour");
                    return;
                }
                prevTourName = tour.name;
                var vidName = tour.videoName;
                if (!vidName)
                    vidName = tour.name;
                var url = "./video/Hiller/" + vidName + ".mp4";
                console.log("vidName: " + vidName);
                pano.setVideoURL(url);
                if (tour.youtubeId) {
                    var id = tour.youtubeId;
                    console.log("youtubeId "+id);
                    display.playVideo(id);
                }
            }
        */
    }

    handleMarkerClick(rec) {
        alert("Clicked on marker for " + rec.coordSys);
    }

    handleTrailMarkerClick(rec, csys) {
        console.log("Clicked on trail marker for ", rec.coordSys);
        var videoId = rec.youtubeId;
        console.log("videoId", videoId);
        this.display.playVideo(videoId);
        this.map.setView([csys.lat, csys.lon], 12);
    }

    handleTrailClick(e, rec, csys) {
        console.log("handleTrailClick", e, rec, csys);
        var videoId = rec.youtubeId;
        console.log("videoId", videoId);
        this.display.playVideo(videoId);
        //this.map.setView([csys.lat, csys.lon], 12);
    }

    addMarker(opts) {
        console.log("addMarker", opts);
        let inst = this;
        var marker = L.marker([opts.lat, opts.lon]).addTo(this.map);
        marker.on('click', e => this.handleMarkerClick(opts));
    }

    addTrail(trail) {
        var rec = trail.rec;
        var cs = rec.coordSys;
        //console.log("addTrail", rec, trail, cs);
        var csys = WV.coordinateSystems[cs];
        //var csys = this.coordSystems[cs];
        var lat, lon;
        var pathLatLon;
        if (cs == "GEO") {
            var rec0 = trail.recs[0];
            lat = rec0.pos[0];
            lon = rec0.pos[1];
            pathLatLon = trail.recs.map(rec => [rec.pos[0], rec.pos[1]]);
            //return;
        }
        else if (!csys) {
            console.log(".......... no csys");
            return;
        }
        else {
            lat = csys.lat;
            lon = csys.lon;
            pathLatLon = trail.recs.map( rec => csys.xyzToLla(rec.pos));
        }
        var marker = L.marker([lat, lon]).addTo(this.map);
        marker.on('click', e => this.handleTrailMarkerClick(rec, csys));
        // create a red polyline from an array of LatLng points

        if (pathLatLon) {
            var polyline = L.polyline(pathLatLon, { color: 'red' }).addTo(this.map);
            polyline.on('click', e => this.handleTrailClick(e, rec, csys));
        }
    }

    loadCoordSys(rec) {
        var cs = rec.coordSys;
        console.log("coordSys", cs);
        //this.coordSystems[cs] = rec;
        WV.addCoordinateSystem(cs, rec);
        this.addMarker(rec);
    }

    async loadTrail(rec) {
        var id = rec.id;
        var url = rec.dataUrl;
        //console.log("loadTrail", id, rec, url);
        if (!url) {
            console.log("**** ignoring trail with no dataUrl");
            return;
        }
        var tour = await WV.loadJSON(url);
        tour.rec = rec;
        //console.log("tour", id, tour);
        this.tours[id] = tour;
        this.addTrail(tour);
    }

    async loadTours() {
        var url = "../static/data/tours_data.json";
        var TOURS_DATA = await WV.loadJSON(url);
        var inst = this;
        window.TOURS_DATA = TOURS_DATA;
        window.TOURS = this.tours;
        console.log("tours", TOURS_DATA);
        TOURS_DATA.records.forEach(rec => {
            switch (rec.recType) {
                case "CoordinateSystem":
                    inst.loadCoordSys(rec);
                    break;
                case "IndoorMap":
                    console.log("*** ignore indoor map");
                    break;
                default:
                    inst.loadTrail(rec);
            }
        })
    }
}