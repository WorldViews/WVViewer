
import * as THREE from '../modules/three/three.module.js';
import Stats from '../modules/libs/stats.module.js';
import { PLYLoader } from '../modules/three/loaders/PLYLoader.js';
import { GUI } from '../modules/libs/dat.gui.module.js';
import { TrackballControls } from '../modules/three/controls/TrackballControls.js';
import { OrbitControls, MapControls } from '../modules/three/controls/OrbitControls.js';
import { FlyControls } from '../modules/three/controls/FlyControls.js';


class WVViewer3D {
    constructor(opts) {
        opts = opts || {};
        var plyURL = opts.plyURL;
        var recURL = opts.recURL;
        if (!plyURL)
            plyURL = getParameterByName("plyURL", "./models/reconstruction_72.ply");
        if (plyURL == "null")
            plyURL = null;
        if (!recURL)
            recURL = getParameterByName("recURL", null);

        var inst = this;
        this.params = {
            controllerType: "Trackball",
            pointSize: 0.02,
            goHome: () => inst.goHome(),
            saveView: () => inst.saveView()
        }
        this.views = {};
        this.controllerTypes = ["Trackball", "Orbit", "Fly", "Map", "None"];
        this.init();
        if (plyURL)
            this.loadPLY(plyURL);
        if (recURL)
            this.loadRec(recURL);
    }

    start() {
        this.animate();
    }

    init() {
        var inst = this;
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        this.camera = new THREE.PerspectiveCamera(35,
            window.innerWidth / window.innerHeight, .1, 1000);
        this.camera.position.set(3, 1.0, 3);

        //var cameraTarget = new THREE.Vector3(0, - 0.3, 0);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000033);
        //scene.fog = new THREE.Fog(0x72645b, 2, 15);

        // Ground

        var plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(40, 40),
            new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 })
        );
        plane.rotation.x = - Math.PI / 2;
        plane.position.y = - 0.5;
        //scene.add(plane);
        //plane.receiveShadow = true;

        // Lights
        //scene.add(new THREE.HemisphereLight(0x443333, 0x111122));

        // renderer
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer = renderer;
        //renderer.shadowMap.enabled = true;

        this.container.appendChild(renderer.domElement);

        this.createControls();

        // resize
        window.addEventListener('resize', e => inst.onWindowResize(e), false);

        this.saveView("home");
        // put these in global name space for easier debugging.
        window.VIEWS = this.views;
        window.THREE = THREE;
        window.CAMERA = this.camera;
        window.SCENE = this.scene;
        var axes = new THREE.AxesHelper();
        this.scene.add(axes);
        this.setupGUI();
        //window.MESH = points; // not available until points loaded
    }

    setupGUI() {
        // stats
        this.stats = new Stats();
        this.container.appendChild(this.stats.dom);
        var params = this.params;
        var gui = new GUI();
        this.gui = gui;
        var inst = this;
        gui.add(params, 'controllerType', this.controllerTypes).name('Controller').onChange(value => {
            inst.createControls();
        });
        gui.add(params, 'pointSize', 0.001, .2).name('point size').onChange(function (value) {
            inst.points.material =
                new THREE.PointsMaterial({ vertexColors: true, size: params.pointSize });
        });
        gui.add(params, "goHome").name("Go Home");
        gui.add(params, "saveView").name("Set Home");

    }

    // PLY file
    loadPLY(plyURL) {
        if (!plyURL)
            return;
        this.plyURL = plyURL;
        var inst = this;
        var loader = new PLYLoader();

        loader.setPropertyNameMapping({
            diffuse_red: 'red',
            diffuse_green: 'green',
            diffuse_blue: 'blue'
        });

        loader.load(plyURL, function (geometry) {
            var material = new THREE.PointsMaterial({
                vertexColors: true,
                size: inst.params.pointSize
            });
            var points = new THREE.Points(geometry, material);
            inst.points = points;
            points.scale.multiplyScalar(1.0);
            points.rotation.x = 3.9;
            points.position.y = .8;
            inst.scene.add(points);
            window.MESH = points;
        });
    }

    async loadRec(recURL) {
        this.recURL = recURL;
        let recs = await loadJSON(recURL);
        console.log("got rec", recs);
        window.RECS = recs;
        var rec = recs[0];
        window.REC = rec;
        this.initRecPoints(rec);
        this.initRecCamPath(rec);
    }

    // setup up point cloud for points in reconstruction rec
    initRecPoints(rec) {
        var inst = this;
        var points = rec.points;
        //var iv = Object.keys(points);
        const geometry = new THREE.BufferGeometry();
        //const positionNumComponents = iv.length;
        const positions = [];
        const colors = [];
        var iv = Object.keys(points);
        var k = 0;
        for (const i in points) {
            var pt = points[i];
            var coord = pt.coordinates;
            var color = pt.color;
            //var pos = [coord[0], coord[1], coord[2]];
            positions.push(coord[0], coord[1], coord[2]);
            colors.push(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0)
            if (k++ < 10) {
                console.log("pt", pt);
                //console.log("coord", pt.coordinates);
                //console.log("pos", pos);
            }
        }
        geometry.setAttribute('position',
            new THREE.BufferAttribute(new Float32Array(positions), 3)
        );
        geometry.setAttribute('color',
            new THREE.BufferAttribute(new Float32Array(colors), 3)
        );
        window.GEOM = geometry;
        //var material = new THREE.PointsMaterial({ vertexColors: true, size: params.pointSize });
        var material = new THREE.PointsMaterial({
            vertexColors: true,
            size: inst.params.pointSize
        });
        this.points = new THREE.Points(geometry, material);
        this.points.scale.multiplyScalar(1.0);
        //points.rotation.x = 3.9;
        //points.position.y = .8;
        window.MESH = this.points;
        this.scene.add(this.points);
    }

    // setup camera path line for shots in rec
    initRecCamPath(rec) {
        var shots = rec.shots;
        var srecs = [];
        var t0 = 0;
        for (var id in shots) {
            var shot = shots[id];
            var pos = shot.translation;
            var name = shot.orig_filename;
            // break apart something like "store__frame_1120.jpg"
            var parts = name.split("_");
            var part = parts[parts.length - 1];
            var parts = part.split(".");
            var frameNum = parts[0];
            var frameNum = Number(frameNum);
            var t = t0 + frameNum / 29.97;
            srecs.push({ pos, name, frameNum, t });
        };
        srecs.sort((s1, s2) => s1.t - s2.t);
        console.log("srecs", srecs);

        var lineGeometry = new THREE.BufferGeometry();
        var cpoints = [];
        for (var i = 0; i < srecs.length; i++) {
            var srec = srecs[i];
            var pos = srec.pos;
            //cpoints.push(pos[0], pos[1], pos[2]);
            cpoints.push(pos[1], pos[0], pos[2]);
        }
        console.log("cpoints", cpoints);
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cpoints, 3));
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        var camPathObj = new THREE.Line(lineGeometry, lineMaterial);
        //object = new THREE.LineSegments(lineGeometry, lineMaterial);
        //camPathObj.rotation.x = 3.9;
        //camPathObj.position.y = .8;
        var r90 = Math.PI / 2;
        camPathObj.rotation.x = r90;
        camPathObj.rotation.z = r90;
        this.scene.add(camPathObj);
        window.PATH = camPathObj;
    }

    createControls() {
        //controls = new TrackballControls(camera, renderer.domElement);
        var controllerType = this.params.controllerType;
        var camera = this.camera;
        var renderer = this.renderer;
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        var controls = null;
        if (controllerType == "Trackball") {
            console.log("creating TrackballControls");
            controls = new TrackballControls(camera, renderer.domElement);
            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.keys = [65, 83, 68];
        }
        else if (controllerType == "Orbit") {
            console.log("creating OrbitControls");
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 1;
            controls.maxDistance = 2000;
            controls.maxPolarAngle = Math.PI / 2;
        }
        else if (controllerType == "Fly") {
            console.log("creating FlyControls");
            controls = new FlyControls(camera, renderer.domElement);
            controls.movementSpeed = 1000;
            controls.domElement = renderer.domElement;
            controls.rollSpeed = Math.PI / 24;
            controls.autoForward = false;
            controls.dragToLook = false;
        }
        else if (controllerType == "Map") {
            controls = new MapControls(camera, renderer.domElement);
            //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
            controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 1;
            controls.maxDistance = 2000;
            controls.maxPolarAngle = Math.PI / 2;
        }
        else if (controllerType == "None") {
            // we won't create new controller...
        }
        else { //should never happen
            alert("Unknown controller type " + controllerType);
        };
        this.controls = controls;
    }

    animate() {
        var inst = this;
        requestAnimationFrame(() => inst.animate());
        if (this.controls)
            this.controls.update();
        if (inst.stats)
            inst.stats.update();
        inst.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    saveView(viewName) {
        viewName = viewName || "home";
        var position = this.camera.position.clone();
        var rotation = this.camera.rotation.clone();
        var view = { position, rotation };
        this.views[viewName] = view;
        console.log("saved view", viewName, view);
    }

    setView(viewName) {
        viewName = viewName || "home";
        var view = this.views[viewName];
        console.log("setView", viewName, view);
        var pos = view.position;
        var rot = view.rotation;
        this.camera.position.copy(pos);
        this.camera.rotation.copy(rot);
        this.createControls();
    }

    goHome() {
        console.log("Go Home");
        this.setView("home");
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
}

export {WVViewer3D};



