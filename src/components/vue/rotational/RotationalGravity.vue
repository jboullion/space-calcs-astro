<template></template>
<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS
// 1. When adjusting the ship length the dial sometimes becomes offset by about half it's length.

// ? NOTE: Optional Improvements!

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { computed, onBeforeMount, onMounted, ref } from "vue";
import type { Location, StationType } from "./constants";
import { locations, types, conversion, defaultThree } from "./constants";

const loading = ref(true);
const needsUpdate = ref(false);
const showCalcDetails = ref(true);
const models = {
  spaceman: null as GLTF | null,
};

const textures = {
  space: new THREE.Texture(),
  earth: new THREE.Texture(),
  mars: new THREE.Texture(),
  moon: new THREE.Texture(),
  earthNormal: new THREE.Texture(),
  earthClouds: new THREE.Texture(),
};

const planet = ref({
  mesh: new THREE.Mesh(),
  clouds: null,
  axis: new THREE.Vector3(0, 1, 0),
  speed: 0,
  radius: 6357000,
  geometry: null as THREE.CircleGeometry | THREE.SphereGeometry | null,
  material: new THREE.Material(),
});

const three = {
  canvas: null as HTMLElement | HTMLCanvasElement | null,
  renderer: null as THREE.WebGLRenderer | null,
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(),
  controls: null as OrbitControls | null,
  station: new THREE.Mesh(),
  spaceman: new THREE.Group(),
  group: new THREE.Group(),
  // stats: null, // used for debugging
  // gui: null, // used for debugging
  // raycaster: null,
  // mouse: null,
  minMovement: null as THREE.Vector3 | null,
  maxMovement: null as THREE.Vector3 | null,
};

const ruler = ref({
  lineCylinder: new THREE.Mesh(),
  lineMaterial: new THREE.Material(),
  point: 0,
  dial: new THREE.Mesh(),
  dialMaterial: new THREE.Material(),
});
const coriolis = ref({
  // start: 0,
  // end: 0,
  tracing: false,
  tickTime: 0,
  mass: 0,
  velocity: 10, // m/s
  startingVelocity: 10,
  ball: new THREE.Mesh(),
  ballGroup: [] as THREE.Mesh[],
  applyGravity: false,
  interval: 0,
  geometry: new THREE.SphereGeometry(),
  material: new THREE.Material(),
});
const help = ref({
  tooltipModal: null,
  tooltipTitle: null,
  tooltipDescription: "",
});
const formData = ref({
  location: locations[0],
  type: types[0],
  isSpace: true,
  //gravityOption: null,
  gravity: 1,
  radius: 12,
  rpm: 10,
  angularVelocity: 0, // aka rpm
  tangentialVelocity: 0,
  centripetalAcceleration: 0,
  shipLength: 30,
  shipWidth: 9,
  hollow: true,
  showEnvironment: true,
  seeInside: true,
  showGravityRule: true,
  pause: false,
  showLocalAxis: true,
});

const forces = ref({
  vector: 0,
  vectorMesh: new THREE.Mesh(),
});
const funnel = ref({
  angleOfIncidence: 0,
  oppositeAngle: 0,
  netCentripetalForce: 0,
  baseWidth: 0,
  baseHeight: 0,
  innerRadius: 0,
  outerRadius: 0,
});

const animation = ref({
  FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
  prevTick: 0, // track the last tick timestamp
  rotationSpeed: 0.1, // This tells threeJS how fast to move and is based on the rpm
  radians: 6, // there are 6 radians in a circle. This helps us to calculate full rotations
});

/**
 *
 * SETUP
 *
 */
onBeforeMount(() => {
  //three = defaultThree;

  // Default selected options
  //formData.value.gravityOption = this.gravityOptions[0];

  // formData.value.gravity = formData.value.location.g;
  formData.value.radius = formData.value.type.defaults.radius;
  formData.value.rpm = formData.value.type.defaults.rpm;
  formData.value.shipLength = formData.value.type.defaults.length; //angularVelocity;

  updateRadius();
});

onMounted(() => {
  loadModels();
});

/**
 *
 *
 * COMPUTED
 *
 *
 */

const structureLengthName = computed(() => {
  return formData.value.type.shape === "funnel"
    ? "Platform Width"
    : "Structure Length";
});

const rotationSpeed = computed(() => {
  return rpmToUpdateSpeed(formData.value.rpm); //(formData.value.rpm / (this.animation.FPS * 60)) * this.animation.radians;
});

const earthRotationSpeed = computed(() => {
  // NOTE: this is the REAL speed of earth, so 1 rotation takes 24 hours REAL TIME
  return rpmToUpdateSpeed(1 / 1440); //(formData.value.rpm / (this.animation.FPS * 60)) * this.animation.radians;
});

const stationWidth = computed(() => {
  return formData.value.radius * 2;
});

const availableTypes = computed(() => {
  return types.filter(
    (t) =>
      t.useInSpace == formData.value.isSpace ||
      t.useOnGround != formData.value.isSpace
  );
});

const pointGravity = computed(() => {
  return calcGravityFromRadius(ruler.value.point);
});

const pointCentripetalAcceleration = computed(() => {
  // this.tangentialVelocity * this.tangentialVelocity / formData.value.radius;
  return gTom2s(pointGravity.value);
});

const pointTangentialVelocity = computed(() => {
  return Math.sqrt(pointCentripetalAcceleration.value * ruler.value.point);
});

const centripetalAcceleration = computed(() => {
  // this.tangentialVelocity * this.tangentialVelocity / formData.value.radius;
  return gTom2s(formData.value.gravity);
});

const tangentialVelocity = computed(() => {
  // velocity = Math.sqrt (centripetalAcceleration * radius) ;
  // velocity = rpm * radius;
  return Math.sqrt(centripetalAcceleration.value * formData.value.radius);
});

// calculate the coriolis force applied to an object
const coriolisForce = (mass: number, velocity: number) => {
  // F = 2 * m * v * w

  return 2 * mass * velocity * (formData.value.rpm / 60);
};

const radsPerSec = computed(() => {
  return rpmToRadians(formData.value.rpm);
});

const angularComfort = computed(() => {
  if (formData.value.type.shape != "can") {
    // Angular comfort in a bola or cylinder relates to how different your head and feet experience motion.
    // If laying on your back, in a can, this effect is less noticable
    if (formData.value.rpm <= 2) return "alert-success";
    else if (formData.value.rpm <= 6) return "alert-warning";
    else return "alert-danger";
  }

  // ! TODO: These values are not currently based on anything! collect better data and update values!
  // ? NOTE: "Can" is only temporary gravity usage while lying on back. Can be treated kind of like lying on your back.
  if (formData.value.rpm <= 8) return "alert-success";
  else if (formData.value.rpm <= 12) return "alert-warning";
  else return "alert-danger";
});

const velocityComfort = computed(() => {
  // A low tangential velocity ratio can cause significant coriolis effects which distort apparent gravity
  if (pointTangentialVelocity.value <= 6) return "alert-danger";
  else if (pointTangentialVelocity.value <= 10) return "alert-warning";
  else return "alert-success";
});

const gravityComfort = computed(() => {
  // if (formData.value.type.shape != 'can' ){
  if (pointGravity.value < 0.1) return "alert-danger";
  else if (pointGravity.value < 0.3) return "alert-warning";
  else if (pointGravity.value < 1.1) return "alert-success";
  else if (pointGravity.value < 1.5) return "alert-warning";
  else return "alert-danger";
  // } else {
  //   if (formData.value.gravity < 0.1)
  //     return 'alert-danger';
  //   else if (formData.value.gravity < 0.3)
  //     return 'alert-warning';
  //   else if (formData.value.gravity < 1.5)
  //     return 'alert-success';
  //   else if (formData.value.gravity < 2)
  //     return 'alert-warning';
  //   else
  //     return 'alert-danger';
  // }
});

const worldGravity = computed(() => {
  return formData.value.isSpace ? 0 : formData.value.location.g;
});

/**
 *
 *
 * METHODS
 *
 *
 */

function toggleClass(on: boolean) {
  return on ? "fa-toggle-on" : "fa-toggle-off";
}

async function loadModels() {
  const loader = new GLTFLoader();

  // TODO: DON'T USE SPACEMAN MODEL!? It is an awesome model, but pretty big. Just use a 6ft cylinder...or nothing
  models.spaceman = await loader.loadAsync(
    "/wp-content/themes/nexus-aurora/assets/models/lowres_spacex_suit.glb"
  );

  const textureLoader = new THREE.TextureLoader();
  //textures.space = await textureLoader.load('/wp-content/themes/nexus-aurora/assets/images/2k_stars.jpg');
  textures.earth = textureLoader.load(
    "/wp-content/themes/nexus-aurora/assets/images/2k_earth_daymap.jpg"
  );
  textures.mars = textureLoader.load(
    "/wp-content/themes/nexus-aurora/assets/images/2k_mars.jpg"
  );
  textures.moon = textureLoader.load(
    "/wp-content/themes/nexus-aurora/assets/images/2k_moon.jpg"
  );
  // textures.earthClouds = await textureLoader.load('/wp-content/themes/nexus-aurora/assets/images/2k_earth_clouds.jpg');
  // textures.earthNormal = await textureLoader.load('/wp-content/themes/nexus-aurora/assets/images/2k_earth_normal_map.jpg');

  loading.value = false;
  setupScene();
}

function displayPlanet() {
  planet.value.axis = new THREE.Vector3(0, 1, 0);
  planet.value.speed = 0.0001; // This is not a REAL speed. Sped up for appearance

  //if(formData.value.location.name === "Space")
  switch (formData.value.location.name) {
    case "Earth":
      planet.value.material = new THREE.MeshLambertMaterial({
        map: textures.earth,
      });
      break;
    case "Mars":
      planet.value.material = new THREE.MeshLambertMaterial({
        map: textures.mars,
      });
      break;
    case "Moon":
      planet.value.material = new THREE.MeshLambertMaterial({
        map: textures.moon,
      });
      break;
  }

  let planetPositionY = -(formData.value.radius / 4) - 2;
  if (formData.value.isSpace) {
    planet.value.geometry = new THREE.SphereGeometry(
      formData.value.location.geomtry.radius,
      64,
      64
    );
    planetPositionY =
      -formData.value.location.geomtry.radius -
      Math.max(stationWidth.value * 2, 1000);
  } else {
    planet.value.geometry = new THREE.CircleGeometry(
      stationWidth.value * 10,
      32
    );
  }

  planet.value.material.transparent = true;

  planet.value.mesh = new THREE.Mesh(
    planet.value.geometry,
    planet.value.material
  );
  planet.value.mesh.position.set(0, planetPositionY, 0);

  // Apply a random rotation. TODO: Might make this a more random rotation to see different sides of the planet each reload
  planet.value.mesh.rotateZ(0);
  planet.value.mesh.rotateX(-Math.PI / 2);
  three.scene.add(planet.value.mesh);
  //}
}

function launchBall() {
  if (!three.spaceman) return;

  coriolis.value.startingVelocity = coriolis.value.velocity;

  stopTrace();

  const color = new THREE.Color(
    Math.max(Math.random(), 0.5),
    Math.max(Math.random(), 0.5),
    Math.max(Math.random(), 0.5)
  );

  coriolis.value.geometry = new THREE.SphereGeometry(
    Math.max(formData.value.radius / 100, 0.5),
    4,
    4
  );
  coriolis.value.material = new THREE.MeshBasicMaterial({ color: color });

  coriolis.value.ball = new THREE.Mesh(
    coriolis.value.geometry,
    coriolis.value.material
  );

  // var target = new THREE.Vector3();
  // three.spaceman.getWorldPosition( target );
  const ballHeight = formData.value.type.shape === "can" ? 3 : 0;
  coriolis.value.ball.position.set(
    three.spaceman.position.x,
    three.spaceman.position.y,
    three.spaceman.position.z + ballHeight
  );
  three.group.add(coriolis.value.ball);

  //coriolis.value.ballGroup = [];//new THREE.Group();

  coriolis.value.tracing = true;
  coriolis.value.tickTime = formData.value.type.shape === "can" ? 100 : 500;
  // Updating in the animate loop would be more accurate, but this is simple and accomplishes the same goal
  coriolis.value.interval = setInterval(traceBall, coriolis.value.tickTime);
}

function traceBall() {
  // TODO: Could use InstanceMesh to get better performance? https://threejs.org/docs/#api/en/objects/InstancedMesh

  // Updating in the animate loop would be more accurate, but this is simple and accomplishes the same goal
  if (coriolis.value.applyGravity) {
    // TODO: Can we update this using our force vector? Perhaps rotate the ball in it's own local reference frame?
    // TODO: This doesn't seem right. Test out gravity stuff
    // if( formData.value.type.shape === 'funnel' ){
    //   coriolis.value.velocity -= funnel.value.netCentripetalForce * ( coriolis.value.tickTime / 1000 );
    // }else{
    coriolis.value.velocity -=
      centripetalAcceleration.value * (coriolis.value.tickTime / 1000);
    //}
  }

  var target = new THREE.Vector3();
  coriolis.value.ball.getWorldPosition(target);

  if (
    coriolis.value.ballGroup.length > 80 ||
    Math.abs(target.y) > formData.value.radius ||
    Math.abs(target.x) > formData.value.radius ||
    Math.abs(target.z) > formData.value.radius
  ) {
    stopTrace();
    return;
  }
  const ball = new THREE.Mesh(coriolis.value.geometry, coriolis.value.material);
  ball.position.set(target.x, target.y, target.z);
  coriolis.value.ballGroup.push(ball);

  three.scene.add(ball);
}

function clearBalls() {
  if (coriolis.value.ballGroup.length) {
    for (let b = 0; b < coriolis.value.ballGroup.length; b++) {
      three.scene.remove(coriolis.value.ballGroup[b]);
    }

    coriolis.value.ballGroup = [];
  }
}

function stopTrace() {
  if (coriolis.value.interval) {
    clearInterval(coriolis.value.interval);
  }
  // TODO: Try to allow users to see the balls between scenes
  // HOLD: Try and clear station and spaceman on change. not entire scene.

  if (coriolis.value.ball) {
    three.group.remove(coriolis.value.ball);
  }

  coriolis.value.tracing = false;
  coriolis.value.velocity = coriolis.value.startingVelocity;
}

function setupThreeJS() {
  three.scene = new THREE.Scene();
  three.group = new THREE.Group();

  // Renderer
  three.renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
  }); // { alpha: true }
  three.canvas = document.getElementById("rotational-canvas");

  if (!three.canvas) return;

  three.canvas.appendChild(three.renderer.domElement);

  const width = three.canvas.getBoundingClientRect().width;
  const height = 400;

  three.renderer.setSize(width, height);

  // Camera
  const cameraDistance = stationWidth.value * 1.8;
  three.camera = new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    planet.value.radius * 2
  );

  three.camera.position.z = cameraDistance;
  // three.controls.enableZoom = false;

  // Controls
  three.controls = new OrbitControls(three.camera, three.renderer.domElement);

  // Lights
  three.scene.add(new THREE.AmbientLight(0x404040));
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  three.scene.add(light);

  // Stats
  // three.stats = Stats()
  // three.stats.dom.style.position = 'absolute';
  // three.canvas.appendChild(three.stats.dom);

  // // GUI
  // three.gui = new dat.GUI( { autoPlace: false } );
  // three.canvas.appendChild(three.gui.domElement);
}

function setupAxesHelper() {
  const axesHelper = new THREE.AxesHelper(formData.value.radius / 10); // 500 is size
  //axesHelper.position.set(three.spaceman.position.x, three.spaceman.position.y, three.spaceman.position.z,)
  //three.group.add(axesHelper);
  three.scene.add(axesHelper);
}

function calcForceVector() {
  // ? NOTE: We are currently ignoring mass
  //Fc = apparentWeight = mass * apparentGravity;
  //W = weight = mass * worldGravity.value;

  // our arc is -Math.PI/2 -> 0 (-90 -> 0 degrees) (-1.5 -> 0 rotations)
  // What percent of -1.5 (-Math.PI/2) is percentApparent

  // TODO: THIS IS NOT QUITE ACCURATE!!
  // ? NOTE: angleOfIncidence should be something like Math.cos() * (this.gTom2s(worldGravity) / this.gTom2s(intendedGravity))
  // rotate -45 degrees so our "balance" point is at -0.75 or -Math.PI/4

  const apparentGravity = formData.value.gravity;

  forces.value.vector = 0;
  if (apparentGravity == 0) {
    forces.value.vector = Math.PI / 4;
  } else if (worldGravity.value < apparentGravity) {
    let percentApparent =
      getPercentageChange(apparentGravity, worldGravity.value) / 100;
    forces.value.vector = -(Math.PI / 4) * Math.min(percentApparent, 1);
  } else if (worldGravity.value > apparentGravity) {
    let percentApparent =
      getPercentageChange(worldGravity.value, apparentGravity) / 100;
    forces.value.vector = (Math.PI / 4) * Math.min(percentApparent, 1);
  }

  forces.value.vector -= Math.PI / 4;
}

function setupForceVector() {
  const vectorGeometry = new THREE.CylinderGeometry(1, 0.1, 3, 3);
  const vectorColor = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  forces.value.vectorMesh = new THREE.Mesh(vectorGeometry, vectorColor);

  if (
    formData.value.type.shape === "funnel" ||
    formData.value.type.shape === "can"
  ) {
    calcForceVector();

    if (formData.value.type.shape === "funnel") {
      forces.value.vectorMesh.rotation.set(0, 0, forces.value.vector);
    } else {
      forces.value.vectorMesh.rotation.set(
        forces.value.vector + Math.PI / 2,
        0,
        0
      );
    }

    forces.value.vectorMesh.position.set(
      three.spaceman.position.x - 1.5,
      three.spaceman.position.y - 1.5,
      three.spaceman.position.z
    );
  } else {
    forces.value.vectorMesh.position.set(
      three.spaceman.position.x,
      three.spaceman.position.y - 2,
      three.spaceman.position.z
    );
  }

  three.group.add(forces.value.vectorMesh);

  // const rulerFolder = three.gui.addFolder('Ruler');
  // rulerFolder.add(forces.value.vectorMesh.rotation, 'x', -Math.PI, Math.PI );
  // rulerFolder.add(forces.value.vectorMesh.rotation, 'y', -Math.PI, Math.PI);
  // rulerFolder.add(forces.value.vectorMesh.rotation, 'z', -Math.PI, Math.PI);
  // rulerFolder.open();
}

function calcGravityFromRadius(radius: number) {
  return m2sTog(Math.pow(rpmToRadians(formData.value.rpm), 2) * radius);
}

function getPercentageChange(oldNumber: number, newNumber: number) {
  var decreaseValue = oldNumber - newNumber;

  return (decreaseValue / oldNumber) * 100;
}

function getRandomInt(max: number) {
  return Math.round(Math.random() * max);
}

function setupRuler() {
  // Setup Ruler
  const lineRadius = formData.value.radius / 30;
  const linegeometry = new THREE.CylinderGeometry(
    lineRadius,
    0.1,
    formData.value.radius,
    2
  );
  ruler.value.lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
  });

  ruler.value.lineCylinder = new THREE.Mesh(
    linegeometry,
    ruler.value.lineMaterial
  );

  //ruler.value.lineCylinder.position.z = 1;

  // Setup measurement point
  ruler.value.point = formData.value.radius;

  const geometry = new THREE.CylinderGeometry(lineRadius, 0.01, lineRadius, 2);
  ruler.value.dialMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
  });

  ruler.value.dial = new THREE.Mesh(geometry, ruler.value.dialMaterial);

  // if (!formData.value.showGravityRule) {
  //   ruler.value.lineMaterial.opacity = 0;
  //   ruler.value.dialMaterial.opacity = 0;
  // }

  // Adjust ruler for different structures
  if (
    formData.value.type.shape === "can" ||
    formData.value.type.shape === "funnel"
  ) {
    ruler.value.lineCylinder.rotation.z = Math.PI / 2;
    ruler.value.lineCylinder.position.x = -(formData.value.radius / 2);
    ruler.value.lineCylinder.position.y = 1;

    ruler.value.dial.rotation.z -= Math.PI / 2;
    ruler.value.dial.position.x = -ruler.value.point + lineRadius + 2;
    ruler.value.dial.position.y = 1.1;
  } else {
    ruler.value.lineCylinder.rotation.z = Math.PI;
    ruler.value.lineCylinder.rotation.y -= Math.PI / 2;
    ruler.value.lineCylinder.position.y = -(formData.value.radius / 2);
    ruler.value.lineCylinder.position.z = 0.5;

    ruler.value.dial.rotation.y = Math.PI / 2;
    ruler.value.dial.position.y = -ruler.value.point + 2;
    ruler.value.dial.position.z = 0.6;
  }

  three.scene.add(ruler.value.dial);
  three.scene.add(ruler.value.lineCylinder);
}

function buildCanStation(material: THREE.Material) {
  var extrudeSettings = {
    depth: types[1].defaults.length,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 6,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, formData.value.radius, 0, Math.PI * 2, false);

  if (formData.value.hollow) {
    var holePath = new THREE.Path();
    holePath.absarc(0, 0, formData.value.radius - 2, 0, Math.PI * 2, true);
    arcShape.holes.push(holePath);
  }

  var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  three.station = new THREE.Mesh(geometry, material);

  three.group.add(three.station);
  three.group.rotation.x = -Math.PI / 2;
}

function buildCylinderStation(material: THREE.Material) {
  var extrudeSettings = {
    depth: formData.value.shipLength,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 24,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, formData.value.radius, 0, Math.PI * 2, false);

  if (formData.value.hollow) {
    var holePath = new THREE.Path();
    holePath.absarc(
      0,
      0,
      formData.value.radius - formData.value.radius / 5,
      0,
      Math.PI * 2,
      true
    );
    arcShape.holes.push(holePath);
  }

  var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  three.station = new THREE.Mesh(geometry, material);

  three.group.add(three.station);
}

function buildBolaStation(material: THREE.Material) {
  const tetherLength = stationWidth.value - formData.value.shipLength * 2;
  const tetherGeometry = new THREE.CylinderGeometry(1, 1, tetherLength, 32);
  const tether = new THREE.Mesh(tetherGeometry, material);

  const shipGeometry = new THREE.CylinderGeometry(
    formData.value.shipWidth,
    formData.value.shipWidth,
    formData.value.shipLength,
    32
  );
  // var topShipmaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, side: THREE.BackSide } );
  // var bottomShipmaterial = new THREE.MeshPhongMaterial( { color: 0xff00ff, side: THREE.BackSide } );
  var topShip = new THREE.Mesh(shipGeometry, material);
  var bottomShip = new THREE.Mesh(shipGeometry, material);

  topShip.position.set(
    0,
    formData.value.radius - formData.value.shipLength / 2,
    0
  );
  bottomShip.position.set(
    0,
    -(formData.value.radius - formData.value.shipLength / 2),
    0
  );

  three.group.add(topShip);
  three.group.add(bottomShip);
  three.group.add(tether);
}

function buildFunnelStation(material: THREE.Material) {
  // #NOTE: How to calculate funnel: https://www.linkedin.com/pulse/creating-artificial-gravity-mars-shen-ge-cssgb/

  let funnelGeometry = null;
  if (!formData.value.gravity) {
    const circleRadius = formData.value.radius + formData.value.shipLength / 2;
    funnelGeometry = new THREE.CircleGeometry(circleRadius, 32);
  } else {
    funnel.value.angleOfIncidence = parseFloat(forces.value.vector.toFixed(2)); //-this.radiansToDegrees(forces.value.vector).toFixed(2);
    funnel.value.oppositeAngle = parseFloat(
      (Math.PI / 2 - funnel.value.angleOfIncidence).toFixed(2)
    );
    funnel.value.netCentripetalForce = -(
      gTom2s(worldGravity.value) * Math.tan(forces.value.vector)
    ).toFixed(3);
    const hypotenuseSide = formData.value.shipLength;

    const bRads = Math.sin(funnel.value.oppositeAngle) / Math.sin(Math.PI / 2);
    const bDegs = radiansToDegrees(
      Math.sin(funnel.value.oppositeAngle) / Math.sin(90)
    );

    const cRads =
      Math.sin(funnel.value.angleOfIncidence) / Math.sin(Math.PI / 2);
    const cDegs = radiansToDegrees(
      Math.sin(funnel.value.angleOfIncidence) / Math.sin(90)
    );

    funnel.value.baseWidth = parseFloat(
      Math.abs(hypotenuseSide * Math.abs(bRads)).toFixed(2)
    );
    funnel.value.baseHeight = parseFloat(
      Math.abs(hypotenuseSide * Math.abs(cRads)).toFixed(2)
    );

    funnel.value.outerRadius =
      formData.value.radius + funnel.value.baseWidth / 2;
    funnel.value.innerRadius =
      formData.value.radius - funnel.value.baseWidth / 2;

    funnelGeometry = new THREE.CylinderGeometry(
      funnel.value.outerRadius,
      funnel.value.innerRadius,
      funnel.value.baseHeight,
      32
    );
  }

  three.station = new THREE.Mesh(funnelGeometry, material);

  three.group.add(three.station);
}

function setupStation() {
  var materialType = formData.value.seeInside
    ? THREE.BackSide
    : THREE.FrontSide; // DoubleSide
  var stationMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    side: materialType,
  });

  if (formData.value.showEnvironment) {
    displayPlanet();
  }

  // ? NOTE: Not currently used
  if (formData.value.showLocalAxis) {
    setupAxesHelper();
  }

  // Build station
  if (formData.value.type.shape === "can") {
    buildCanStation(stationMaterial);
  } else if (formData.value.type.shape === "cylinder") {
    buildCylinderStation(stationMaterial);
  } else if (formData.value.type.shape === "bola") {
    buildBolaStation(stationMaterial);
  } else if (formData.value.type.shape === "funnel") {
    buildFunnelStation(stationMaterial);
  }

  if (formData.value.showGravityRule) {
    setupRuler();
  }
}

function setupScene() {
  if (loading.value) return;

  needsUpdate.value = false;

  if (three.scene && three.canvas) {
    //three.scene.dispose();
    removeAllChildNodes(three.canvas);
    // NEW TODO: Might need to update defaultThree OR figure out how not to need this
    //three.value = defaultThree;
  }

  stopTrace();

  // TODO: Ideally we wouldn't have to setup ThreeJS on each scene. Just update station + spaceman
  setupThreeJS();

  setupSpaceman();

  setupStation();

  if (!animation.value.prevTick) {
    animate();
  }
}

function setupSpaceman() {
  if (!models.spaceman) return;

  if (!formData.value.isSpace) {
    setupForceVector();
  }

  let spacemanPosition = -formData.value.radius;

  three.spaceman = models.spaceman.scene;
  three.spaceman.scale.set(0.04, 0.04, 0.04); // scales to ~2 meters
  three.spaceman.rotation.set(0, 0, 0);

  // Build shape
  if (formData.value.type.shape === "can") {
    spacemanPosition += 0.5;
    three.spaceman.rotation.x = Math.PI / 2;
    three.spaceman.rotation.y = 1.8;
    three.spaceman.position.set(1, spacemanPosition, 0); // 6, if solid shape set Z to height of the extrusion

    if (forces.value.vectorMesh) {
      forces.value.vectorMesh.position.set(
        three.spaceman.position.x - 1.5,
        three.spaceman.position.y - 1.5,
        three.spaceman.position.z
      );
    }
  } else if (formData.value.type.shape === "cylinder") {
    three.spaceman.rotation.y = -Math.PI / 2;
    three.spaceman.position.set(
      0,
      spacemanPosition,
      formData.value.shipLength / 2
    );

    // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
    if (formData.value.radius > 30) {
      const ringGeometry = new THREE.RingGeometry(
        3,
        formData.value.radius / 20,
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xba3700,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      ringMesh.position.set(
        0,
        spacemanPosition + 2,
        formData.value.shipLength / 2
      );

      three.group.add(ringMesh);
    }
  } else if (formData.value.type.shape === "bola") {
    three.spaceman.rotation.y = -Math.PI / 2;
    three.spaceman.position.set(0, spacemanPosition, 0);

    // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
    if (stationWidth.value > 30) {
      const ringGeometry = new THREE.RingGeometry(
        3,
        Math.max(formData.value.shipWidth - 2, 4),
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xba3700,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      ringMesh.position.set(0, spacemanPosition + 2, 0);

      three.group.add(ringMesh);
    }
  } else if (formData.value.type.shape === "funnel") {
    spacemanPosition += 1;

    three.spaceman.rotation.z = forces.value.vector; //Math.PI / 2;
    //three.spaceman.rotation.y = 1.8;
    three.spaceman.position.set(spacemanPosition, 0, 0); // 6, if solid shape set Z to height of the extrusion

    //three.group.rotation.x = -Math.PI / 2.5;

    // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
    if (formData.value.radius > 30) {
      const ringGeometry = new THREE.RingGeometry(
        formData.value.shipLength,
        formData.value.shipLength * 1.3,
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xba3700,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      ringMesh.rotation.z = forces.value.vector;

      ringMesh.position.set(spacemanPosition + 2, 0, 0);

      three.group.add(ringMesh);
    }

    if (forces.value.vectorMesh) {
      forces.value.vectorMesh.position.set(three.spaceman.position.x, -2, 0);
    }
  }
  // // Gui folder
  // const spacemanFolder = three.gui.addFolder('Spaceman');
  // spacemanFolder.add(three.spaceman.position, 'x', 0, stationWidth.value).name("px");
  // spacemanFolder.add(three.spaceman.position, 'y', -stationWidth.value * 2, stationWidth.value * 2).name("py");
  // spacemanFolder.add(three.spaceman.position, 'z', 0, stationWidth.value).name("pz");

  // spacemanFolder.add(three.spaceman.rotation, 'x', -Math.PI / 2, 0).name("rx");
  // spacemanFolder.add(three.spaceman.rotation, 'y', -Math.PI / 2, 0).name("ry");
  // spacemanFolder.add(three.spaceman.rotation, 'z', -Math.PI / 2, 0).name("rz");
  // spacemanFolder.open();

  three.group.add(three.spaceman);
  three.scene.add(three.group);
}

function animate() {
  if (!three.renderer) return;

  requestAnimationFrame(animate);

  //three.controls.update();

  var cameraZoomDistance = planet.value.radius; //stationWidth.value * 10;
  var minMovement = new THREE.Vector3(
    -cameraZoomDistance,
    -cameraZoomDistance,
    -cameraZoomDistance
  );
  var maxMovement = new THREE.Vector3(
    cameraZoomDistance,
    cameraZoomDistance,
    cameraZoomDistance
  );
  three.camera.position.clamp(minMovement, maxMovement);

  three.renderer.render(three.scene, three.camera);

  if (formData.value.pause) return;

  // clamp to fixed framerate
  const now = Math.round(
    (animation.value.FPS * window.performance.now()) / 1000
  );
  if (now == animation.value.prevTick) return;
  animation.value.prevTick = now;

  // three.group.rotation.z += this.rotationSpeed;
  if (formData.value.type.shape !== "funnel") {
    three.group.rotation.z += rotationSpeed.value;
  } else {
    three.group.rotation.y += rotationSpeed.value;
  }

  if (coriolis.value.tracing && coriolis.value.ball) {
    if (formData.value.type.shape !== "funnel") {
      coriolis.value.ball.position.y += velocityToUpdateSpeed(
        coriolis.value.velocity
      );
    } else {
      coriolis.value.ball.position.x += velocityToUpdateSpeed(
        coriolis.value.velocity
      );
      if (coriolis.value.applyGravity) {
        coriolis.value.ball.position.y -= velocityToUpdateSpeed(
          gTom2s(worldGravity.value)
        );
      }
    }
  }

  if (formData.value.showEnvironment && formData.value.isSpace) {
    planet.value.mesh.rotateOnAxis(planet.value.axis, -planet.value.speed);
    // planet.value.clouds.rotateOnAxis(planet.value.axis, planet.value.speed );
  }

  // three.stats.update();
}

function removeAllChildNodes(parent: HTMLElement) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 *
 *
 * Conversion Functions
 *
 *
 */
function gTom2s(g: number) {
  return g * conversion.g;
}
function m2sTog(m2s: number) {
  return m2s / conversion.g;
}
function mTofeet(m: number) {
  return m * conversion.foot;
}
function mToKm(m: number) {
  return m * 1000;
}
function mToMiles(m: number) {
  return m * conversion.foot * 5280;
}
function mpsToKph(m: number) {
  return m * 0.277777778; // 1000 / 3600
}
function mpsToMph(m: number) {
  return m * ((conversion.foot * 5280) / 3600);
}
function rpmToRadians(rpm: number) {
  return rpm * (Math.PI / 30);
}
function rpmToDegrees(rpm: number) {
  return radiansToDegrees(rpmToRadians(rpm));
}
function radiansToDegrees(radians: number) {
  return radians / (Math.PI / 180);
}
function radiansPerSecToRpm(radians: number) {
  return radians / 0.10471975511965977; //(Math.PI / 30)
}
function rpmToUpdateSpeed(rpm: number) {
  return (rpm / (animation.value.FPS * 60)) * animation.value.radians;
}
function velocityToUpdateSpeed(velocity: number) {
  return velocity / animation.value.FPS;
}
function relativeDifference(a: number, b: number) {
  return Math.abs((a - b) / ((a + b) / 2)); // 100 *
}

/**
 *
 * Form Actions
 *
 */
function updateShipLength() {
  formData.value.shipLength = Math.min(
    Math.max(formData.value.shipLength, conversion.minLength),
    conversion.maxLength
  );

  // Ship length doesn't affect anything else so we can run it without "needs update"
  setupScene();
}
function updateRadius() {
  formData.value.radius = Math.min(
    Math.max(formData.value.radius, conversion.minLength),
    conversion.maxLength
  );

  needsUpdate.value = true;

  formData.value.gravity = calcGravityFromRadius(formData.value.radius);
}
function updateRPM() {
  formData.value.gravity = calcGravityFromRadius(formData.value.radius);
}
function updateGravity() {
  formData.value.rpm = parseFloat(
    radiansPerSecToRpm(
      Math.sqrt(gTom2s(formData.value.gravity) / formData.value.radius)
    ).toFixed(4)
  );
}

/*
  watch: {
    loading: {
      handler(newLoading) {
        if (newLoading) {
          this.setupScene();
        }
      },
    },
    "ruler.value.point": {
      handler(newPoint, oldPoint) {
        if (newPoint < 0) ruler.value.point = 0;
        if (newPoint > formData.value.radius) ruler.value.point = oldPoint;

        const lineRadius = formData.value.radius / 30;

        if (
          formData.value.type.shape === "can" ||
          formData.value.type.shape === "funnel"
        ) {
          ruler.value.dial.position.x = -newPoint + lineRadius / 2;
          ruler.value.dial.position.x = -newPoint + lineRadius / 2;
        } else {
          ruler.value.dial.position.y = -newPoint + lineRadius / 2;
        }
      },
    },
    "formData.pause": {
      handler(newRuler) {
        if (coriolis.value.tracing && coriolis.value.ball) {
          this.stopTrace();
        }
      },
    },
    "formData.showGravityRule": {
      handler(newRuler) {
        ruler.value.lineMaterial.opacity = newRuler ? 1 : 0;
        ruler.value.dialMaterial.opacity = newRuler ? 1 : 0;
        this.needsUpdate = true;
      },
    },
    "formData.hollow": {
      handler(newHallow) {
        // TODO: are we able to update the geometry without reloading scene / mesh?
        this.needsUpdate = true;
      },
    },
    "formData.showEnvironment": {
      handler(newShowEnvironment) {
        planet.value.material.opacity = newShowEnvironment ? 1 : 0;
      },
    },
    "formData.seeInside": {
      handler(newSeeInside) {
        three.station.material.side = newSeeInside
          ? THREE.BackSide
          : THREE.FrontSide;

        // Since bola is made of multiple shapes we need can't just apply the update to the station
        if (formData.value.type.shape === "bola") {
          this.buildBolaStation(three.station.material);
        }
      },
    },
    // "formData.radius": {
    //   handler(newRadius, oldRadius) {
    //     if (newRadius < 1) formData.value.radius = 1;
    //     if (newRadius > 1000000) {
    //       formData.value.radius = oldRadius;
    //     }
    //     // TODO: Are we able to update the geometry?
    //     this.needsUpdate = true;
    //   },
    // },
    "formData.rpm": {
      handler(newRPM, oldRPM) {
        if (newRPM < 0) formData.value.rpm = 0;
        if (newRPM > 1000) {
          formData.value.rpm = oldRPM;
        }
      },
    },
    "formData.gravity": {
      handler(newGravity) {
        if (forces.value.vectorMesh) {
          this.calcForceVector();

          if (formData.value.type.shape === "funnel") {
            forces.value.vectorMesh.rotation.set(0, 0, forces.value.vector);
          } else {
            forces.value.vectorMesh.rotation.set(
              forces.value.vector + Math.PI / 2,
              0,
              0
            );
          }
        }
      },
    },
    // "formData.shipLength": {
    //   handler(newLength, oldLength) {
    //     if (newLength < 1) formData.value.shipLength = 1;
    //     if (newLength > 100000) {
    //       formData.value.shipLength = oldLength;
    //     }
    //     // TODO: Can we just update the geometry?
    //     this.needsUpdate = true;
    //   },
    // },
    "formData.isSpace": {
      handler(isSpace) {
        if (isSpace) {
          formData.value.type = this.types[0];
        } else {
          formData.value.type = this.types[3];
        }
      },
    },
    "formData.location": {
      handler(newLocation) {
        if (formData.value.isSpace) {
          formData.value.type = this.types[0];
        } else {
          formData.value.type = this.types[3];
        }

        if (planet.value.material) {
          switch (newLocation.name) {
            case "Earth":
              planet.value.material.map = textures.earth;
              break;
            case "Mars":
              planet.value.material.map = textures.mars;
              break;
            case "Moon":
              planet.value.material.map = textures.moon;
              break;
          }
        }
      },
    },
    "formData.type": {
      handler(newType) {
        // if(newType.shape == 'funnel'){
        //   formData.value.radius = formData.value.location.funnelDimentions.radius;
        //   formData.value.rpm = formData.value.location.funnelDimentions.rpm;
        // }else{
        formData.value.radius = newType.defaults.radius;
        formData.value.rpm = newType.defaults.rpm;
        formData.value.shipLength = newType.defaults.length;
        //}

        this.updateRadius();
      },
    },
    formData: {
      handler(newVal) {
        // Updating scene here to only update onces per watch.
        if (this.needsUpdate) {
          //this.$nextTick(() => {
          this.setupScene();
          //});
        }
      },
      deep: true,
    },
  },
});

*/
</script>

<style></style>
