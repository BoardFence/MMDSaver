import * as THREE from '../build/three.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OutlineEffect } from './jsm/effects/OutlineEffect.js';
import { MMDLoader } from './jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from './jsm/animation/MMDAnimationHelper.js';


// Animation

var container;

var mesh, camera, scene, renderer, effect;
var helper, ikHelper, physicsHelper;

var clock = new THREE.Clock();

Ammo().then(function (AmmoLib) {

    Ammo = AmmoLib;

    init();
    animate();

});


function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 30;

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    var gridHelper = new THREE.PolarGridHelper(30, 10);
    gridHelper.position.y = - 10;
    scene.add(gridHelper);

    var ambient = new THREE.AmbientLight(0x666666);	// 環境光
    scene.add(ambient);

    var directionalLight = new THREE.DirectionalLight(0x887766);
    directionalLight.position.set(- 1, 1, 1).normalize();
    scene.add(directionalLight);

    // renderer

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    effect = new OutlineEffect(renderer);

    // model

    function onProgress(xhr) {

        if (xhr.lengthComputable) {

            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');

        }

    }

    helper = new MMDAnimationHelper({
        afterglow: 2.0
    });

    var loader = new MMDLoader();

    var controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    var phongMaterials;
    var originalMaterials;

    function makePhongMaterials(materials) {

        var array = [];

        for (var i = 0, il = materials.length; i < il; i++) {

            var m = new THREE.MeshPhongMaterial();
            m.copy(materials[i]);
            m.needsUpdate = true;

            array.push(m);

        }

        phongMaterials = array;

    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    helper.update(clock.getDelta());
    effect.render(scene, camera);

}

function refreshModel(modelFile, modelExtension) {

    var modelFileAndMisc = { modelFile, modelExtension }

    var vmdFiles = ['vmds/wavefile_v2.vmd'];

    scene.remove(mesh)

    var loader = new MMDLoader();

    loader.loadWithAnimation(modelFileAndMisc, vmdFiles, function (mmd) {

        mesh = mmd.mesh;
        mesh.position.y = - 10;
        scene.add(mesh);
        console.log("added model to scene.")

        helper.add(mesh, {
            animation: mmd.animation,
            physics: true
        });

        ikHelper = helper.objects.get(mesh).ikSolver.createHelper();
        ikHelper.visible = false;
        scene.add(ikHelper);

        physicsHelper = helper.objects.get(mesh).physics.createHelper();
        physicsHelper.visible = false;
        scene.add(physicsHelper);

    }, onProgress, onError);

    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    var onError = function (xhr) {
        console.log("refresh error.")
    };

}


// IndexedDB

var idbReq = indexedDB.open("test");

idbReq.onupgradeneeded = function (event) { // initialize IndexedDB
    console.log("update database");

    if (event.oldVersion < 1 || (event.oldVersion & 0x7fffffffffffffff) < 1) {
        console.log("create database");
        event.target.result.createObjectStore("model", { keyPath: "model_id" });
        event.target.result.createObjectStore("modelExtension", { keyPath: "model_id" });
    }
}

idbReq.onsuccess = function (event) {   // try to get model from IndexedDB
    console.log("opened DB");
    var db = event.target.result;
    var transaction = db.transaction("model", "readonly");
    var modelStore = transaction.objectStore("model");
    var getReq = modelStore.get("1");

    getReq.onsuccess = function (event) {
        if (event.target.result == null) {
        } else {    // When model already exists in IndexedDB.
            try {
                var blob = new Blob([event.target.result.model], { type: 'application/octet-stream' });
                refreshModel(blob, event.target.result.modelExtension) 
            } catch (e) {
                console.log(e.message);
            }
        }
    }
    getReq.onerror = function (event) {
        console.log("db is opened, but failed data load");
    }
}


// Event form

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function handleFileSelect(evt) {

    var idbReq = indexedDB.open("test");

    idbReq.onsuccess = function (event) {   
        console.log("opened DB");
        var db = event.target.result;

        var files = evt.target.files;
        var f = files[0];
        var modelExtension = String(f.name).split('.').pop() // pmd or pmx

        var reader = new FileReader();

        reader.onload = function (e) {  // save uploaded model on IndexedDB
            try {
                var transaction = db.transaction("model", "readwrite");
                var modelStore = transaction.objectStore("model");
                var arraybuffer = e.target.result;

                modelStore.put({ model_id: "1", model: arraybuffer, modelExtension: modelExtension });

                console.log("updated IndexedDB");

                showModel(transaction); // try to show model in IndexedDB

            } catch (e) {
                console.log(e.message);
            }

        };

        reader.readAsArrayBuffer(f);

        function showModel(transaction) {
            var modelStore = transaction.objectStore("model");
            var getReq = modelStore.get("1");  

            getReq.onsuccess = function (event) {
                if (event.target.result == null) {
                } else {
                    try {
                        var blob = new Blob([event.target.result.model], { type: 'application/octet-stream' }); // arraybuffer → blob
                        refreshModel(blob, event.target.result.modelExtension)   
                    } catch (e) {
                        console.log(e.message);
                    }
                }
            }
            getReq.onerror = function (event) {
                console.log("db is opened, but failed data load");
            }
        }

    }
}
