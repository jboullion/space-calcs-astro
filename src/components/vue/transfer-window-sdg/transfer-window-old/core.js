/*
Copyright Minerva Lang Predavec, 2019
transfercalculator.com
*/

/*
Hi there!
I'm Minerva, the creator of this program. Feel free to use this in your own stuff, or make changes, but make sure to credit my website.

If you want to run this with other stellar systems, just mess with the planetData.js file
If you want to change any html file, you're going to have to change all of them. Sorry, but it's the only way to split them up.
If you want to change how the program runs, this file is the main code engine. It's complex, but kudos to you if you manage to improve it!
If you've got any good ideas for changes, just email me minerva@transfercalculator.com

Have fun messing around with this!
*/

// Trans rights are human rights!

window.onload = init; // Initialize startup when it has loaded all scripts in

// STARTUP FUNCTIONS

function init() {
	// Run startup sequence

	// Check if the user is on a phone - if not don't proceed (I've tested it, it doesn't work on a phone)
	if (!managePhone()) {
		// Start boot screen messages
		if (!lowRes) {
			lastLoadingTime = new Date();
			message =
				bootMessages[
					Math.floor(Math.random() * loadingMessages.length)
				];
			loadingTimer = setInterval(function () {
				runLoadingText();
			}, 100);
		}

		// Determine which page type it is and resolve
		executePageType();

		// Create a duplicate of the initial planets array for comparison
		originalPlanets = JSON.parse(JSON.stringify(planets));
		importFirebaseData();

		// Start up user input of date and time pickers
		startTimeDatePickers();

		// Sort the list of planets by semi-major axis
		sortPlanetData(true);

		// Boot ThreeJS Graphics engine up, with cameras, etc. also
		startThreeJS();

		// Create the ship mesh
		createShipSurface('sketch');

		// If it's not rendering at the true scale, fix the pixel sizes for UI consistency
		if (renderer.context.canvas.width > WIDTH) {
			correctPixelSizes();
		}

		// Create the sun - it has no orbit so it must be rendered specially
		renderPlanet('sun');

		// Correct any planetary data, and set defaults in the planets array
		correctPlanetParams();

		// Start the Interstellar transfer interface
		startStarInterface();

		// Start Listener for porkchop transfers and easter egg triggers
		startEasterListener();
		startPorkchopListener();

		// Create vernal equinox guides, asteroid belts, and planetary rings, and planetary surfaces
		createGuides();
		createBelts();
		if (!lowRes) {
			createRings();
		}
		createPlanets();

		// Fill dropdowns for selecting
		updateDropdowns();

		// Create the initial light particles and lines, ready to be moved
		createLightParticles();
		createLightLagLines();

		// Correct all loading screens if running in 3D mode
		if (stereoDisp) {
			fixLoadingScreens();
		}

		// Load in everything in HD mode
		if (highDef) {
			loadAllMeshes();
		}

		// Add a listener for the window resize
		window.addEventListener('resize', onWindowResize, false);

		// Stop the small loader time - it's triggered by changing the center and it looks bad to have two timers
		if (smallLoadingTimer) {
			endSmallLoading();
		}

		// Don't display the Show Real Solar System button if in low res mode - it doesn't really work
		if (lowRes) {
			document.getElementById('visibleControl').style.display = 'none';
		}

		// Start the time interval tracking system
		//checkTime = new Date();
		//checkTimeSection = Math.ceil(checkTimeInterval / (1000 / timeScale)) * (1000 / timeScale);
		//checkTimeRemaining = 0;

		// Ten seconds after, load in the music files
		setTimeout(function () {
			//document.getElementById("soundDiv").innerHTML += '<audio id="KSP" src="music/KSP.mp3" autostart="false" currentTime="0"></audio>';
			//document.getElementById("soundDiv").innerHTML += '<audio id="ASZ" src="music/ASZ.mp3" autostart="false" currentTime="20"></audio>';
		}, 10000);
	}
}

function startSimulation() {
	// Start system update funciton timer
	executionTimer = setInterval(function () {
		// Don't update the simulation if calculating - it slows it down
		if (!calculatingTransfer && false) {
			updateSim();
		}
	}, 1000 / timeScale);
}

// Firebase Initialisation and Loading

function importFirebaseData() {
	// Import the data from firebase and finish startup

	if (typeof firebase === 'undefined') {
		// Firebase not available
		// Wait a bit to ensure full system running
		setTimeout(function () {
			// Log the course of action
			console.log(
				'Firebase unavailable. Generating now: ' +
					round((new Date().getTime() - now.getTime()) / 1000, 2) +
					's',
			);

			for (var name in planets) {
				if (name != 'sun') {
					// Generate parameters
					generateOrbitalCoords(name);
					generateOrbitalTimes(name);
				}
			}

			// Finish the parts which require parameters
			finishInitialisation();
		}, 5000);
	} else {
		// Firebase Available

		// Only start generating after ten seconds
		setTimeout(function () {
			if (!orbitalPositions['earth']) {
				// If Firebase takes too long, just generate it anyway

				// Log the course of action
				console.log(
					'No firebase return, Generating now: ' +
						round(
							(new Date().getTime() - now.getTime()) / 1000,
							2,
						) +
						's',
				);

				for (var name in planets) {
					if (name != 'sun') {
						// Generate parameters
						generateOrbitalCoords(name);
						generateOrbitalTimes(name);
					}
				}

				// Finish the parts which require parameters
				finishInitialisation();
			}
		}, 10000);

		// Start a call for all the database
		firebase
			.database()
			.ref('/')
			.once('value')
			.then(function (snapshot) {
				// Log when the firebase return arrives
				console.log(
					'Firebase Return: ' +
						round(
							(new Date().getTime() - now.getTime()) / 1000,
							2,
						) +
						's',
				);

				// If the parameters are not already loaded/generated
				if (!orbitalPositions['earth']) {
					// Import the main data
					var tempParams = snapshot.val()['parameters'];
					var tempTimes = snapshot.val()['times'];
					var tempPosits = snapshot.val()['positions'];

					// Iterate through all the planets
					for (var name in tempParams) {
						// Check if the parameters are the same
						var same = true;
						for (var key in tempParams[name]) {
							if (
								tempParams[name][key] !=
									originalPlanets[name][key] &&
								key != 'mapClass' &&
								key != 'viewingClass' &&
								key != 'axialTilt'
							) {
								same = false;
							}
						}

						// Check if parameters the same
						if (
							!same ||
							tempTimes[name].length != orbitResolution * 360
						) {
							// If they are different, generate from first principles

							// Log if there is a detected discrepancy
							if (!same) {
								console.log(
									'WARNING: Parameter discontinuity detected at ' +
										capitalise(name),
								);
							} else if (
								tempTimes[name].length !=
								orbitResolution * 360
							) {
								console.log(
									'WARNING: Resolution discontinuity detected at ' +
										capitalise(name),
								);
							}

							// Generate parameters
							generateOrbitalCoords(name);
							generateOrbitalTimes(name);
						} else {
							// If they are the same, just use the Firebase ones
							orbitalTimes[name] = tempTimes[name];
							orbitalPositions[name] = tempPosits[name];
						}
					}

					// Finish the parts which require parameters
					finishInitialisation();
				}
			});
	}
}

function finishInitialisation() {
	// Draw the orbits once positions loaded
	drawOrbits();

	// Set the time
	setNowTime();

	// Manage the planets display controls
	updatePlanetsDisplay();
	changeCenter();

	// Display the needed planets
	showPlanetaryMarkers();

	// Try to start the program
	finishStartUp();
}

function finishStartUp() {
	// Bring it to full functionality - if everything is loaded

	// Make sure both the parameters are present AND the ship is loaded
	if (Object.keys(orbitalTimes).length !== 0 && shipSurfaceMesh) {
		setTimeout(function () {
			// Delay slightly to let it load fully

			// Check for any instructions in the URL
			executeURLInstr();

			// Start the time progression function
			updateSim();
			startSimulation();

			// Allow the user to see the controls
			extendInstrumentPanels();

			// Start Threejs
			animate();

			// Hide loading screen
			document.getElementById('bootScreen').style.display = 'none';

			// Stop loading text
			clearInterval(loadingTimer);

			// Log the total loading time
			console.log(
				'SYSTEM ONLINE: ' +
					round((new Date().getTime() - now.getTime()) / 1000, 2) +
					's',
			);

			startPostLoading();
		}, 100);
	} else if (Object.keys(orbitalTimes).length !== 0) {
		// Log the orbital data loading time
		console.log(
			'ORBITAL DATA INITIALISED: ' +
				round((new Date().getTime() - now.getTime()) / 1000, 2) +
				's',
		);
	} else if (shipSurfaceMesh) {
		// Log the ship mesh loading time
		console.log(
			'SHIP MESH INITIALISED: ' +
				round((new Date().getTime() - now.getTime()) / 1000, 2) +
				's',
		);
	}
}

function startPostLoading() {
	document.getElementById('loadingImg').src = 'assets/UI/loading.png';
	document.getElementById('loadingImgAux').src = 'assets/UI/loading.png';

	document.getElementById('soundDiv').innerHTML =
		'<audio id="KSP" src="music/KSP.mp3" autostart="false" currentTime="0"></audio><audio id="ASZ" src="music/ASZ.mp3" autostart="false" currentTime="20"></audio>';

	if (shipSurfaceMesh.name != 'rocinante' && !lowRes && !shipLoading) {
		createShip();
	}

	// Place the starfield if high res version
	if (!lowRes) {
		createStarField();
	}
}

function updateFirebaseData(fireCheck) {
	// Check to make 100% sure that this is intentional. Condition deliberately structured to make it nigh on impossible to determine
	console.log('WARNING: FIREBASE UPDATE SEQUENCE ACTIVATED');
	var checkSec1 = Number(fireCheck.substr(2, 7)) + 1;
	var checkSec2 = fireCheck.substr(0, 2);
	if (
		(checkSec1 % 673) +
			(checkSec1 % 2) +
			(checkSec1 % 9) +
			(checkSec1 % 61) ==
			4 &&
		checkSec2 == 'CA' &&
		window.location.href.indexOf('orbital_mechanics') > -1 &&
		firebase
	) {
		// Check passed, now start the data
		console.log('CHECK PASSED. INITIALISING FIREBASE UPDATE SQUENCE');
		var mainData = {};

		// Make sure that up-to-date data is collected
		for (var name in planets) {
			if (name != 'sun') {
				// Generate parameters
				generateOrbitalCoords(name);
				generateOrbitalTimes(name);
			}
		}

		// Get the abridged version of the parameters into the data
		var tempParams = {};
		for (var name in originalPlanets) {
			var tempPlanet = {};
			for (var key in originalPlanets[name]) {
				if (
					key != 'mapClass' &&
					key != 'viewingClass' &&
					key != 'axialTilt'
				) {
					tempPlanet[key] = originalPlanets[name][key];
				}
			}
			tempParams[name] = tempPlanet;
		}

		// Get the orbital positions into the data
		var tempPositions = {};
		for (var name in originalPlanets) {
			tempPositions[name] = orbitalPositions[name];
		}

		// Get the orbital times into the data
		var tempTimes = {};
		for (var name in originalPlanets) {
			tempTimes[name] = orbitalTimes[name];
		}

		// Set temporary data into upload data
		mainData['parameters'] = tempParams;
		mainData['positions'] = tempPositions;
		mainData['times'] = tempTimes;

		// Final upload
		firebase.database().ref('/').set(mainData);

		console.log('FIREBASE UPDATE SEQUENCE COMPLETE');
	}
}

// Listener Initialisation

function startPorkchopListener() {
	// Start listener on the porkchop plot - for logging courses
	document.getElementById('porkchop').addEventListener(
		'click',
		function (evt) {
			logCourse(evt.clientX, evt.clientY);
		},
		false,
	);
}

function startEasterListener() {
	// Start listener for easter egg triggers

	// Keys that the program tracks
	var allowedKeys = {
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		65: 'a',
		66: 'b',
		68: 'd',
		69: 'e',
		71: 'g',
		75: 'k',
		76: 'l',
		77: 'm',
		78: 'n',
		79: 'o',
		80: 'p',
		82: 'r',
		83: 's',
		84: 't',
	};

	// The three different codes for the three activations
	var konamiCode = [
		'up',
		'up',
		'down',
		'down',
		'left',
		'right',
		'left',
		'right',
		'b',
		'a',
	];
	var kerbalCode = ['k', 'e', 'r', 'b', 'a', 'l'];
	var starCode = ['s', 't', 'a', 'r', 'm', 'a', 'n'];
	var nauvooCode = ['g', 'o', 'd', 's', 'p', 'e', 'e', 'd'];

	// Variable to track position along each
	var konamiCodePosition = 0;
	var kerbalCodePosition = 0;
	var starCodePosition = 0;
	var nauvooCodePosition = 0;

	// add keydown event listener
	document.addEventListener('keydown', function (e) {
		// Get the value of the key
		var key = allowedKeys[e.keyCode];

		// Check if the next key in the Konami Code is the one that was pressed
		var requiredKey = konamiCode[konamiCodePosition];
		if (key == requiredKey) {
			// Move the position by one
			konamiCodePosition++;

			// Upon the last key, activate Easter Eggs (if not already activated)
			if (
				konamiCodePosition == konamiCode.length &&
				eggEnabled == false
			) {
				// Run easter egg systems
				swal(
					'You found the Easter Egg!',
					'This is actually an intented Easter Egg, not like Konami...',
					'success',
				);
				egg();

				// Reset the code
				konamiCodePosition = 0;
			}
		} else {
			// Else reset - it wasn't it
			konamiCodePosition = 0;
		}

		// Check if the next key in kerbal is the one that was pressed
		var requiredKeyKerbal = kerbalCode[kerbalCodePosition];
		if (key == requiredKeyKerbal) {
			// Move the position by one
			kerbalCodePosition++;

			// Upon the last key, activate Easter Eggs (if not already activated)
			if (
				kerbalCodePosition == kerbalCode.length &&
				eggEnabled == false
			) {
				// Run easter egg systems
				swal(
					'You found the Easter Egg!',
					'Unfortunately, there is no Kerbol system in this.',
					'success',
				);
				playSound('KSP');
				egg();

				// Reset the code
				kerbalCodePosition = 0;
			}
		} else {
			// Else reset - it wasn't it
			kerbalCodePosition = 0;
		}

		// Check if the next key in starman is the one that was pressed
		var starKeyKerbal = starCode[starCodePosition];
		if (key == starKeyKerbal) {
			/// Move the position by one
			starCodePosition++;

			// Upon the last key, activate Easter Eggs (if not already activated)
			if (starCodePosition == starCode.length && eggEnabled == false) {
				// Run easter egg systems
				swal(
					'You found the Easter Egg!',
					'His Tesla Roadster is under minor bodies, still blasting Life on Mars',
					'success',
				);
				egg();

				// Reset the code
				starCodePosition = 0;
			}
		} else {
			// Else reset - it wasn't it
			starCodePosition = 0;
		}

		// Check if the next key in starman is the one that was pressed
		var nauvooKey = nauvooCode[nauvooCodePosition];
		if (key == nauvooKey) {
			/// Move the position by one
			nauvooCodePosition++;

			// Upon the last key, activate Easter Eggs (if not already activated)
			if (nauvooCodePosition == nauvooCode.length && eggEnabled == true) {
				// Run easter egg systems
				changeTimeScale();
				swal({
					title: 'Prepare for launch',
					text: 'Good luck, and Godspeed',
					type: 'success',
				}).then((result) => {
					if (result.value) {
						launchNauvoo();
					}
				});

				// Reset the code
				nauvooCodePosition = 0;
			}
		} else {
			// Else reset - it wasn't it
			nauvooCodePosition = 0;
		}
	});
}

function startTooltip() {
	// Start the tooltip detector

	// Start the Threejs mouse move projector
	projector = new THREE.Projector();
	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	document
		.getElementById('shipToolTipContent')
		.addEventListener('mousedown', onTooltipClick, false);
}

function onPointerRestricted() {
	// Run this function that's essential for VR
	var pointerLockElement = renderer.domElement;
	if (
		pointerLockElement &&
		typeof pointerLockElement.requestPointerLock === 'function'
	) {
		pointerLockElement.requestPointerLock();
	}
}

function onPointerUnrestricted() {
	// Run this function that's essential for VR
	var currentPointerLockElement = document.pointerLockElement;
	var expectedPointerLockElement = renderer.domElement;
	if (
		currentPointerLockElement &&
		currentPointerLockElement === expectedPointerLockElement &&
		typeof document.exitPointerLock === 'function'
	) {
		document.exitPointerLock();
	}
}

// Data and Complex Initialisation

function executeURLInstr() {
	// Execute instructions contained in the URL for examples

	// Save the URL for parsing
	var URL = window.location.href;

	if (URL.indexOf('?e=') > -1) {
		// Check there is anything to parse

		// General "look at this planet" section
		for (var name in planets) {
			if (URL.lastIndexOf(name) > URL.indexOf('?e=') && name != 'sun') {
				// CHeck all planets (except the sun)

				// Find the values for what to populate the dropdowns with
				var center = name;
				var moonName = name;
				if (planets[name].center != 'sun') {
					center = planets[name].center;
				} else {
					moonName = 'planet';
				}

				// Set the time scale based on the period - say for phobos
				var period = findPeriod(planets[name]['a'], center);
				if (period < convertTime('D', 'Y')) {
					document.getElementById('inputTimeScale').value = 0.1;
					changeTimeScale();
				} else if (period < convertTime('D', 'Y') * 10) {
					document.getElementById('inputTimeScale').value = 1;
					changeTimeScale();
				} else {
					document.getElementById('inputTimeScale').value = 10;
					changeTimeScale();
				}

				// Set center and moon controls
				document.getElementById('centerSelect').value = center;
				changeCenter();
				document.getElementById('moonSelect').value = moonName;
				changeMoon();

				// Set camera to look at the planet fom the sun side, at a declination of thirty degrees
				var size = 6;
				var cameraVec = addVec(
					setMagnitude(
						currentPositions[name],
						-1 * planets[name]['r'] * size,
					),
					[0, 0, (1 * planets[name]['r'] * size) / 2],
				);

				if (URL.lastIndexOf('Termin') > URL.indexOf('?e=')) {
					// If looking at the terminator, move the camera to look at it from the side
					cameraVec = addVec(
						multiplyVec(1 / 2, [
							-cameraVec[1],
							cameraVec[0],
							cameraVec[2],
						]),
						multiplyVec(1 / 20, cameraVec),
					);
					document.getElementById('inputTimeScale').value = 3;
					changeTimeScale();
				}

				// Set camera position
				camera.position.copy(
					threeVector(multiplyVec(totalScale, cameraVec)),
				);
			}
		}

		// Specific scripts
		if (URL.indexOf('egg') > URL.indexOf('?e=')) {
			// If eggs should be turned on, turn them on

			console.log('Turning on Easter Eggs');

			swal('Easter Eggs Enabled!', 'Have fun exploring!', 'success');

			egg();
		}
		if (URL.indexOf('tour') > URL.indexOf('?e=')) {
			// Start the tour of the Solar System

			console.log('Starting Solar System Tour');

			startSystemTour();
		}
		if (URL.indexOf('jupiterShadow') > URL.indexOf('?e=')) {
			// Look at the shadow of Io on Jupiter from Io

			console.log('Showing the shadows of Jupiter');

			// Set the center and name for pouring into dropdowns
			var name = 'io';
			var center = 'jupiter';

			// Set the rate of time passing - must be slow to see shadow
			document.getElementById('inputTimeScale').value = 0.1;
			changeTimeScale();

			// Set the camera to generally look at Io
			document.getElementById('centerSelect').value = center;
			changeCenter();
			document.getElementById('moonSelect').value = name;
			changeMoon();

			// Set the time to show it - predetermined to show this
			currentTime.setTime(1536616675040);

			// Set the camera position - predetermined to show this
			camera.position.copy(
				threeVector(
					multiplyVec(
						totalScale,
						[
							0.00007027538734538652, 0.00013350090234620637,
							-0.0000038122306606214185,
						],
					),
				),
			);
		}
		if (URL.indexOf('saturnShadow') > URL.indexOf('?e=')) {
			// Showing off the shadow of the rings of Saturn

			console.log('Showing the rings of Saturn');

			// Set the center and name for pouring into dropdowns
			var name = 'saturn';
			var center = 'saturn';

			// Set the rate of time passing
			document.getElementById('inputTimeScale').value = 1;
			changeTimeScale();

			// Set the camera to generally look at Saturn
			document.getElementById('centerSelect').value = center;
			changeCenter();

			// Set the time to show it - predetermined to show this
			currentTime.setTime(1536616675040);

			// Set the camera position - predetermined to show this
			camera.position.copy(
				threeVector(
					multiplyVec(
						totalScale,
						[
							0.002107537387441072, 0.0013708102883818185,
							0.0005713832910721611,
						],
					),
				),
			);
		}
		if (URL.indexOf('EMTrans') > URL.indexOf('?e=')) {
			// Looking at an Earth-Mars Transfer

			console.log('Showing an Earth-Mars Transfer');
			// Set target parameters
			document.getElementById('fromTarget').value = 'Earth';
			document.getElementById('toTarget').value = 'Mars';

			// Calculate interplanetary transfer
			calculateIPTransfer();
		}
		if (URL.indexOf('IGTrans') > URL.indexOf('?e=')) {
			console.log('Showing an Io-Ganymede Transfer');

			// Set transfer type
			document.getElementById('transferType').value = 'ILTransfer';
			changeTransferType();

			// Set transfer center
			document.getElementById('ILCenter').value = 'Jupiter';
			changeILCenter();

			// Set target parameters
			document.getElementById('fromILTarget').value = 'Io';
			document.getElementById('toILTarget').value = 'Ganymede';

			// Set time and timescale to make sure it looks right
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 1;
			changeTimeScale();

			// Calculate the IL Transfer
			calculateILTransfer();

			// Set the camera position to see it nicely
			camera.position.copy(
				threeVector(
					multiplyVec(
						totalScale,
						[
							0.007310935589102119, 0.002088179982759897,
							0.007727425436799634,
						],
					),
				),
			);
		}
		if (URL.indexOf('ISTrans') > URL.indexOf('?e=')) {
			console.log('Showing an Interstellar Transfer');

			// Set transfer type
			document.getElementById('transferType').value = 'ISTransfer';
			changeTransferType();

			// Set time and timescale to make sure it looks right
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 0.1;
			changeTimeScale();

			// Calculate IS Transfer
			calculateISTransfer();

			// Look at the ship
			document.getElementById('centerSelect').value = 'ship';
			changeCenter();

			var tempTimer = setInterval(function () {
				// Set the camera to look at the ship - after a delay to make sure it parses right
				if (magnitude(lastShipLocation) != 0) {
					camera.position.copy(
						threeVector(
							multiplyVec(
								totalScale,
								addVec(lastShipLocation, [0.0001, 0.0001, 0]),
							),
						),
					);
					clearInterval(tempTimer);
				}
			}, 100);
		}
		if (URL.indexOf('ISLorentzTrans') > URL.indexOf('?e=')) {
			console.log('Showing an Lorentzian Interstellar Transfer');

			// Set transfer type
			document.getElementById('transferType').value = 'ISTransfer';
			changeTransferType();

			// Set time and timescale to make sure it looks right
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 0.1;
			changeTimeScale();

			// Set accel to be high - must be to demonstrate Lorentzian length contraction
			document.getElementById('ISAccel').value = 100000;

			// Calculate IS Transfer
			calculateISTransfer();

			// Look at the ship
			document.getElementById('centerSelect').value = 'ship';
			changeCenter();

			var tempTimer = setInterval(function () {
				// Set the camera to look at the ship - after a delay to make sure it parses right
				if (magnitude(lastShipLocation) != 0) {
					camera.position.copy(
						threeVector(
							multiplyVec(
								totalScale,
								addVec(lastShipLocation, [0.0001, 0.0001, 0]),
							),
						),
					);
					clearInterval(tempTimer);
				}
			}, 100);
		}
		if (URL.indexOf('EpsteinTrans') > URL.indexOf('?e=')) {
			// Demonstrate and Epstein transfer

			console.log('Showing an Epstein Transfer');

			// Turn on Easter Eggs - to show the Epstein transfer
			egg();

			// Change transfer type
			document.getElementById('transferType').value = 'EpsteinTransfer';
			changeTransferType();

			// Set the current time and time scale
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 1;
			changeTimeScale();

			// Set target parameters
			document.getElementById('fromEpsteinTarget').value = 'earth';
			document.getElementById('toEpsteinTarget').value = 'mars';

			// Start the Epstein transfer
			collectEpsteinData();

			// Look at the ship
			document.getElementById('centerSelect').value = 'ship';
			changeCenter();

			var tempTimer = setInterval(function () {
				// Set the camera position
				if (EpsteinArray) {
					camera.position.copy(
						threeVector(
							multiplyVec(
								totalScale,
								addVec(EpsteinArray, [0.0000015, 0.0000015, 1]),
							),
						),
					);
					clearInterval(tempTimer);
				}
			}, 100);
		}
		if (URL.indexOf('propDelay') > URL.indexOf('?e=')) {
			// Look at the propagation delay

			console.log('Showing the Propagation Delay');

			// Set "transfer" type
			document.getElementById('transferType').value = 'lightLag';
			changeTransferType();

			// Set current time and timescale
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 0.5;
			changeTimeScale();

			// Set the camera to be centered on Earth
			document.getElementById('centerSelect').value = 'earth';
			changeCenter();

			// Choose to look at Earth for thet prop. delay
			document.getElementById('lightChoice').value = 'earth';

			// Set camera position
			camera.position.copy(
				threeVector(multiplyVec(totalScale, [0, 0, 3])),
			);
		}
		if (URL.indexOf('propDelayJupiter') > URL.indexOf('?e=')) {
			// Look at the propagation delay

			console.log('Showing the Propagation Delay');

			// Set "transfer" type
			document.getElementById('transferType').value = 'lightLag';
			changeTransferType();

			// Set current time and timescale
			currentTime.setTime(1528091070000);
			document.getElementById('inputTimeScale').value = 0.5;
			changeTimeScale();

			// Set the camera to be centered on Earth
			document.getElementById('centerSelect').value = 'jupiter';
			changeCenter();

			// Choose to look at Earth for thet prop. delay
			document.getElementById('lightChoice').value = 'jupiter';
			document.getElementById('lightMoonChoice').value = 'io';

			// Set camera position
			camera.position.copy(
				threeVector(multiplyVec(totalScale, [0, 0, 0.01])),
			);
		}
	}
}

function sortPlanetData(first) {
	// Sort planets array
	// Sorting rules
	// 1. IF center = sun THEN by a
	// 2. IF center != sun THEN by a of center
	// 3. FOR same center THEN by a of moon

	// Note that first is whether it runs for the first time - afterwards it is being run with the ship and should not change the currentPositions order

	// Intitialise variables
	var newPlanetData = {};
	var newCurrentPositions = {};
	var planetKeys = Object.keys(planets);

	// Run the sorting function
	planetKeys.sort(function (x, y) {
		var centerX = planets[x]['center'];
		var centerY = planets[y]['center'];
		var aX = planets[x]['a'];
		var aY = planets[y]['a'];

		if (centerX == 'sun' && centerY != 'sun') {
			// Prioritise planet over moon (X)
			return -1;
		} else if (centerX != 'sun' && centerY == 'sun') {
			// Prioritise planet over moon (Y)
			return 1;
		} else if (centerX == 'sun' && centerY == 'sun') {
			// If both around the sun, sort by semi-major axis
			return aX - aY;
		} else {
			// IF BOTH MOONS
			if (centerX == centerY) {
				// Sort by semi-major axis if same center
				return aX - aY;
			} else {
				// Otherwise, sort by semi-major axis of center
				return planets[centerX]['a'] - planets[centerY]['a'];
			}
		}
	});

	// Fix the order of the planet data to match what's defined by the sorting function
	for (var index in planetKeys) {
		var key = planetKeys[index];
		newPlanetData[key] = planets[key];
		if (!first) {
			newCurrentPositions[key] = currentPositions[key];
		}
	}

	// Set new planet data and positions
	if (!first) {
		currentPositions = newCurrentPositions;
	}
	planets = newPlanetData;
}

function correctPlanetParams() {
	// Run calculations for planetary parameters such as Sphere of Influence

	for (var planet in planets) {
		// Iterate through all planets

		// If no gravParam specified, calculate from the mass
		if (!planets[planet]['gravParam']) {
			planets[planet]['gravParam'] =
				planets[planet]['mass'] * gravitationalConstant;
		}

		// Calculate SOI - just trust the calculation, or look it up
		var center = planets[planet]['center'];
		var centParam = findGravParam(center);
		var planParam = planets[planet]['gravParam'];
		var planA = planets[planet]['a'];
		planets[planet]['SOI'] =
			planA * Math.pow(planParam / (3 * centParam), 1 / 3);

		// Set axial tilt to straight up if not specified
		if (!planets[planet]['axialTilt']) {
			planets[planet]['axialTilt'] = [0, 0, 1];
		}

		// Keep track of the angular momentum unit vector for each orbit
		if (planet == 'the moon' || planet == 'luna') {
			planets[planet]['center'] = 'sun';
		}
		planets[planet]['orbitalAxis'] = calculateAxialTilt(planet);
		if (planet == 'the moon' || planet == 'luna') {
			planets[planet]['center'] = 'earth';
		}

		// If no rotational epoch specified, set to zero
		if (!planets[planet]['rotEpoch']) {
			planets[planet]['rotEpoch'] = 0;
		}

		// If no axial tilt specified for a moon, match parent planet (it usually does)
		if (planets[planet]['center'] != 'sun') {
			if (planets[planets[planet]['center']]['axialTilt']) {
				planets[planet]['axialTilt'] =
					planets[planets[planet]['center']]['axialTilt'];
			}
		}

		// Correct argument of periapsis to longitude of the periapsis (if applicable)
		if (planets[planet]['aoPE']) {
			planets[planet]['loPE'] =
				planets[planet]['aoPE'] + planets[planet]['loAN'];
		}

		// Correct mean longitude to real longitude at epoch (by modifying the epoch)
		if (!planets[planet]['rL']) {
			if (planets[planet]['L']) {
				planets[planet]['M'] =
					planets[planet]['L'] - planets[planet]['loPE'];
			}
			var shift =
				findPeriod(planets[planet]['a'], planets[planet]['center']) *
				convertTime('Y', 'MS') *
				(planets[planet]['M'] / 360);
			var newEpoch = EPOCH.getTime();
			if (planets[planet]['epoch']) {
				newEpoch = planets[planet]['epoch'].getTime();
			}
			newEpoch = new Date(newEpoch - shift);
			planets[planet]['epoch'] = newEpoch;
			planets[planet]['rL'] = planets[planet]['loPE'];
		}

		// Attach a list of each planet's moons to that planet
		var tempMoonsList = {};

		// Find what the center of each moon is
		for (var name in planets) {
			var tempCenter = planets[name]['center'];
			if (!tempMoonsList[tempCenter]) {
				tempMoonsList[tempCenter] = {};
			}
			tempMoonsList[tempCenter][name] = name;
		}

		// Assign the section from the JSON to the requisite planet in the planets array
		for (var center in tempMoonsList) {
			if (center != 'sun') {
				planets[center]['moons'] = tempMoonsList[center];
			}
		}

		// If its in WebVR, compensate for the modified default rotation
		if (webVR && planets[planet]['rotEpoch']) {
			planets[planet]['rotEpoch'] += Math.PI / 2;
		}
	}
}

// UI Initialisation

function managePhone() {
	// Deal with users trying to use a phone

	// Test to see if the user is on a phone
	userOnPhone =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	// If they are
	if (userOnPhone && false) {
		// Give them a funner error message and then redirect them back
		swal({
			title: "I'm giving it all she's got captain!",
			text: "Sorry, a phone won't be able to run this properly. Please try again on a computer.",
			type: 'error',
		}).then((result) => {
			window.location = 'https://transfercalculator.com/';
		});

		// Hide it to make it look better
		document.getElementById('innerBody').style.display = 'none';
	}
}

function runLoadingText() {
	// Update the boot screen messages

	// Calculate the number of seconds (inside a 4s interval)
	var seconds =
		((new Date().getTime() - lastLoadingTime.getTime()) / 1000) % 4;

	if (
		seconds < 1 ||
		new Date().getTime() - lastLoadingTime.getTime() > 4000
	) {
		// Update the message after 4 seconds
		if (messageUpdated == false) {
			message =
				bootMessages[
					Math.floor(Math.random() * loadingMessages.length)
				];
			messageUpdated = true;
			lastLoadingTime = new Date();
		}
	} else {
		messageUpdated = false;
	}

	// Otherwise, keep adding dots
	document.getElementById('bootText').innerHTML =
		message + '.'.repeat(Math.floor(seconds));
	if (stereoDisp) {
		document.getElementById('bootTextAux').innerHTML =
			message + '.'.repeat(Math.floor(seconds));
	}
}

function startTimeDatePickers() {
	// Initialise time and date pickers - to see what all the init data means, go look at the initial webpage
	$('#timepicker').timepicker({
		// Start the timepicker
		timeFormat: 'HH:mm',
		interval: 60,
		minTime: '0',
		maxTime: '11:59pm',
		defaultTime: '12',
		startTime: '00:00',
		dynamic: false,
		dropdown: true,
		scrollbar: true,
	});

	$('#datepicker').datepicker({
		// Start the datepicker
		autoClose: true,
	});
}

function startStarInterface() {
	// Update which stars are visible in the star dropdown

	// Initialise printer
	var printer = '';

	// Iterate through stars and place into printer
	for (var name in stars) {
		printer +=
			"<option value='" +
			stars[name]['distance'] +
			"'>" +
			name +
			'</option>';
	}

	// Push printer to dropdown and select the first option
	document.getElementById('starTarget').innerHTML = printer;
	document.getElementById('starTarget').value =
		stars[Object.keys(stars)[0]]['distance'];
	document.getElementById('ISDist').value =
		stars[Object.keys(stars)[0]]['distance'];
}

function correctPixelSizes() {
	// If it's not rendering at the true scale, fix the pixel sizes for UI consistency
	pixelRatio = renderer.context.canvas.width / WIDTH;
}

// Graphics Initialisation

function startThreeJS() {
	// Initialise all ThreeJS systems, such as the scene, lights and cameras

	// Start camera and move it to the position
	camera = new THREE.PerspectiveCamera(
		70,
		WIDTH / HEIGHT,
		(2 * totalScale) / Math.pow(10, 8),
		2 * starFieldDist * totalScale,
	);
	initialCamera = [
		0,
		-0.0001,
		(2 * totalScale) / Math.tan(DtoR(camera.fov / 2)),
	];
	camera.position.copy(threeVector(initialCamera));

	// Set the camera up. THIS CODE IS CRITICAL. It defines the major axis of the controls (z+ as up, not y+)
	camera.up.set(0, 0, 1);

	// If running stereo display
	if (stereoDisp) {
		// Init both cameras
		cameraLeft = new THREE.PerspectiveCamera(
			camera.fov / 2,
			WIDTH / HEIGHT,
			camera.near,
			camera.far,
		);
		cameraRight = new THREE.PerspectiveCamera(
			camera.fov / 2,
			WIDTH / HEIGHT,
			camera.near,
			camera.far,
		);

		// Set up directions of both
		cameraLeft.up.set(0, 0, 1);
		cameraRight.up.set(0, 0, 1);
	}

	// Create ThreeJS scene
	scene = new THREE.Scene();

	// Create an ambient light to see what I'm doing - set to black (no light) by default
	ambientLight = new THREE.AmbientLight(white);
	scene.add(ambientLight);
	ambientLight.visible = false;

	// Create an point light to see what I'm doing - set to black (no light) by default
	pointLight = new THREE.PointLight(white, 1, 100 * totalScale);
	scene.add(pointLight);
	pointLight.visible = false;

	// Create a spotlight - the main source of light
	spotLight = new THREE.SpotLight(white);
	scene.add(spotLight);

	// Manage spotlight shadowing
	spotLight.castShadow = !lowRes;
	var size = 1.1 * planets['jupiter']['r'] * totalScale; // Jupiter is the largest planet, * 1.1 for safety
	spotLight.shadow.camera = new THREE.OrthographicCamera(
		-size,
		size,
		size,
		-size,
		0.01 * totalScale,
		1 * totalScale,
	);

	// Create a large shadow map
	spotLight.shadow.mapSize.width = 4096; // default
	spotLight.shadow.mapSize.height = 4096; // default

	// Set intensity of spotlight and decay characteristics
	spotLight.intensity = 1.2;
	spotLight.decay = 1;
	spotLight.distance = 100 * 2 * totalScale;

	// Initialise primary ThreeJS Object
	// root = new THREE.Object3D();

	// Boot up renderer and set main attributes
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setClearColor(black); // Dark background
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled = true; // Shadows allowed
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	if (webVR) {
		renderer.vr.enabled = true;

		// Start essential VR listeners
		window.addEventListener(
			'vrdisplaypointerrestricted',
			onPointerRestricted,
			false,
		);
		window.addEventListener(
			'vrdisplaypointerunrestricted',
			onPointerUnrestricted,
			false,
		);

		// Add the webvr button
		document.body.appendChild(WEBVR.createButton(renderer));
	} else {
	}

	// Set orbit controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.minDistance = scene.scale.x * 0.1;
	controls.maxDistance = 100 * totalScale;

	// Set controls parameters
	controls.enableDamping = true;
	controls.rotateSpeed = 0.4;
	controls.enableKeys = false;
	controls.enablePan = false;
	controls.enableRotate = true;
	controls.zoomSpeed = 1;

	// Set ThreeJS into correct container
	var graphicsContainer = document.getElementById('graphicsContainer');
	graphicsContainer.appendChild(renderer.domElement);

	// Start the tooltip listener
	startTooltip();
}

function createStarField() {
	// Create the star field
	var geometry = new THREE.SphereGeometry(
		starFieldDist * totalScale,
		geoRes,
		geoRes,
	); // 1000000 AU out is close enough to infinity for this
	var material = new THREE.MeshBasicMaterial({
		color: 0x888888,
		map: textureLoader.load('assets/special/starfield.jpg'),
		side: THREE.DoubleSide,
	});
	starField = new THREE.Mesh(geometry, material);

	// Find primary axis and set alignment
	var axis = threeVector([0, 1, 0]).normalize();
	var alignVec = new THREE.Vector3(0, 0, 1).clone().normalize();
	starField.quaternion.setFromUnitVectors(axis, alignVec);

	// Add the starfield to the program
	scene.add(starField);

	createStarMarkers();
}

function showPlanetaryMarkers() {
	// Control which planetary markers are shown

	// Wait until a small bit after startup to make sure it's all there
	setTimeout(function () {
		for (var name in planets) {
			// Iterate through all planets

			if (name != 'sun') {
				// Don't do the sun because it's special

				// While we're here, solve the rotation
				fixPlanetRotation(name);

				// Make the markers of only the PLANETS that SHOULD BE SHOWN visible
				if (planets[name]['center'] == 'sun' && shouldShow(name)) {
					planets[name].markerMesh.material.opacity = 0.3;
				}
			}
		}
	}, 100);
}

function createStarMarkers() {
	// Create markers at the starfield that allow for a tooltip to mark the star

	// Clear previous stars
	for (var name in displayStars) {
		scene.remove(displayStars[name]);
	}

	// Iterate through all stars
	for (var name in stars) {
		var star = stars[name];

		// Calculate Right Ascension and Declination in degrees
		var RA =
			(180 * star['RA'][0]) / 12 +
			(180 * star['RA'][1]) / (12 * 60) +
			(180 * star['RA'][2]) / (12 * 60 * 60);
		var DE =
			(180 * star['DE'][0]) / 180 +
			(180 * star['DE'][1]) / (180 * 60) +
			(180 * star['DE'][2]) / (180 * 60 * 60);

		// Calculate vector from Sol to the star
		var starVector = calculateVectorFromRADE(RA, DE);

		// Create the marker (it's transparent)
		var geometry = sphereGeo;
		var markerMaterial = new THREE.MeshBasicMaterial({
			color: white,
			opacity: 0,
			side: THREE.DoubleSide,
			transparent: true,
		});
		var marker = new THREE.Mesh(geometry, markerMaterial);

		// Set the marker data
		var position = setMagnitude(
			starVector,
			starFieldDist * totalScale * 0.9,
		);
		marker.position.copy(threeVector(position));

		// Set the size - this controls how much of the star field is taken up by the markers
		var size = 10000;
		marker.scale.set(size, size, size);
		marker.name = name;

		// Actually add the marker to the scene
		displayStars[name] = marker;
		scene.add(marker);
	}
}

function createShipSurface(type) {
	// Establish the surface of the ship - different types are kept in storage

	if (type == 'sketch' || lowRes) {
		// This is the default and boring two cones and a cylinder - same as the marker

		// Recieve geometry
		var geometry = shipGeometry(0.0000001);
		shipLoading = true;

		// Create mesh
		shipSurfaceMesh = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({
				color: shipColour,
				side: THREE.DoubleSide,
				opacity: 0,
				transparent: true,
			}),
		);

		// Set attributes
		shipSurfaceMesh.name = 'ship';
		shipSurfaceMesh.position.set(0, 0, 0);
		shipSurfaceMesh.visible = false;
		shipSurfaceMesh.size = 1;

		// Add to scene
		scene.add(shipSurfaceMesh);

		shipAxis = new THREE.Vector3(0, 1, 0); // This is the primary axis used for rotation of the ship

		// Finish loading in
		console.log(
			'Sketch loaded at: ' +
				round((new Date().getTime() - now.getTime()) / 1000, 2) +
				's',
		);
		shipLoading = false;
		finishStartUp();
	} else if (type == 'APOLLOCSM') {
		// This is the Apollo Command Service Module - textured flat grey

		// Initialise loader
		var loader = new THREE.OBJLoader();

		shipLoading = true;

		// Call loader with timeout to allow for the rest of the program to laod
		setTimeout(function () {
			loader.load('models/special/APOLLOCSM.obj', function (object) {
				console.log('Loading Apollo CSM');

				// Create material
				var settings = {
					// Make it shiny, and grey
					color: 0x888a7c,
				};
				var material;

				if (userOnPhone) {
					material = new THREE.MeshLambertMaterial(settings);
				} else {
					settings.specular = white;
					material = new THREE.MeshPhongMaterial(settings);
				}

				// Create geometry
				var geometry = new THREE.Geometry();

				// Iterate through all children and merge
				for (var index in object.children) {
					setTimeout(
						function (index) {
							// Select child and extract geometry
							var child = object.children[index];
							var newGeometry =
								new THREE.Geometry().fromBufferGeometry(
									child.geometry,
								);

							// Parse the new mesh
							var newMesh = new THREE.Mesh(newGeometry);
							newMesh.updateMatrix();

							// Add the new geometry
							geometry.merge(newMesh.geometry, newMesh.matrix);
						},
						0,
						index,
					);
				}
				setTimeout(function () {
					// Run this after it's finished with parsing the geometry

					// Finish geometry computation
					geometry.computeFaceNormals();
					geometry.mergeVertices();

					// Create new mesh
					shipSurfaceMesh = new THREE.Mesh(geometry, material);

					// Set ship attributes
					shipSurfaceMesh.position.set(0, 0, 0);
					shipSurfaceMesh.visible = false;
					shipSurfaceMesh.size = 6 * Math.pow(10, -6); // Size and scale relate how big it looks to how much clearance the camera gives it
					shipSurfaceMesh.scale.set(10, 10, 10);

					// Add mesh to program
					scene.add(shipSurfaceMesh);

					// Set primary rotation axis for alignment
					shipAxis = new THREE.Vector3(0, 1, 0);

					// Finish starting up
					console.log('Apollo CSM Loaded');
					shipLoading = false;
					finishStartUp(); // This interrupt is so it doesn't freeze on loading AFTER the user is in
				}, 0);
			});
		}, 0);
	} else if (type == 'MCRNTACHI' || type == 'MCRNTACHI HD') {
		// This is the Rocinante (as the MCRN Tachi), from The Expanse. If you've seen it, you know this. Otherwise, you should watch The Expanse!

		// Start loader
		var loader = new THREE.GLTFLoader();
		shipLoading = true;

		// Choose which to load depending on the mode the program is running in
		var stringAdd = '';
		if (type == 'MCRNTACHI HD') {
			stringAdd = 'HD ';
		}
		console.log('Loading ' + stringAdd + 'Rocinante');

		// Run the loader on the model
		loader.load(
			baseURL + 'models/glTF/' + type + '/scene.gltf',
			function (loadedScene) {
				// Set timeout to avoid computational freezing
				setTimeout(function () {
					// Remove something more mesh-like (it's still a container) from the initial scene
					shipSurfaceMesh = loadedScene.scene.children[0];

					// Iterate through all children of the container and set shadow rules
					shipSurfaceMesh.traverse(function (child) {
						// Go through all the children and apply shadow rules
						if (child instanceof THREE.Mesh) {
							// Set shadow rules
							child.castShadow = true;
							child.receiveShadow = true;
							//child.material.normalScale.set(-1, 1)
							child.material.metalness = 1;
						}
					});

					// Set shadow rules for the container
					shipSurfaceMesh.castShadow = true;
					shipSurfaceMesh.receiveShadow = true;

					// Set ship attributes
					shipSurfaceMesh.position.set(0, 0, 0);
					shipSurfaceMesh.visible = false;
					shipSurfaceMesh.size = 1048 / totalScale; // Size and scale relate how big it appears, and how much cleraance the camera gives
					var scale = 6.685 * Math.pow(10, -8) * totalScale;
					shipSurfaceMesh.scale.set(scale, scale, scale);

					// Set parameters for Expanse logos
					shipSurfaceMesh.traverse(function (node) {
						node.name = 'rocinante';
						node.logo = 'rocinante';
						node.company = 'Bertanas Gas';
						node.trackMouse = true;
						node.keepColour = true;

						node.castShadow = true;
						node.receiveShadow = true;
					});

					// Add mesh to program
					scene.add(shipSurfaceMesh);

					// Set primary axis for aligning the ship
					shipAxis = new THREE.Vector3(0, 1, 0);

					// Finish loading in
					console.log(
						stringAdd +
							'Roci Loaded. Good luck, and Godspeed: ' +
							round(
								(new Date().getTime() - now.getTime()) / 1000,
								2,
							) +
							's',
					);

					shipLoading = false;
					//finishStartUp(); // This interrupt is so it doesn't freeze loading this in afterwards
				}, 0);
			},
		);
	}
}

function fixPlanetRotation(name) {
	// Start up the planet rotation and align axes

	if (name != 'sun' && name != 'ship') {
		// Don't do anything if it is the sun or the ship, they are special

		if (planets[name]['axialTilt']) {
			// If the planet has an axial tilt, rotate it to align it to spin around that

			// Find basic axis from which it rotates
			var axis = new THREE.Vector3(0, 1, 0).normalize();
			if (planets[name]['mapClass']['model']) {
				axis = new THREE.Vector3(0, 0, 1).normalize();
			}

			// Match the alignment vector to the axial tilt
			var alignVec = threeVector(planets[name]['axialTilt'])
				.clone()
				.normalize();

			// Align the planet
			planets[name]['surfaceMesh'].quaternion.setFromUnitVectors(
				axis,
				alignVec,
			);

			// If it has an atmosphere, align that too
			if (planets[name]['atmoMesh']) {
				// Fix the atmosphere as well
				planets[name]['atmoMesh'].quaternion.setFromUnitVectors(
					axis,
					alignVec,
				);
			}
		}
		if (planets[name]['rotEpoch']) {
			// Rotate planets by their rotational epoch to start off

			// Find the time since epoch
			var milliseconds = currentTime.getTime() - EPOCH.getTime(); // Milliseconds between EPOCH and current time
			var days = milliseconds * convertTime('MS', 'D', 1); // Days since EPOCH
			var percent = days / planets[name]['rotation'];

			// Find basic rotaional axis
			axis = new THREE.Vector3(0, 1, 0).normalize();
			if (planets[name]['mapClass']['model']) {
				axis = new THREE.Vector3(0, 0, 1).normalize();
			}

			// Rotate by the needed amount, in a similar way to planetary epoch
			var rotation =
				(2 * Math.PI * percent + planets[name]['rotEpoch']) %
				(2 * Math.PI);

			planets[name]['surfaceMesh'].rotateOnAxis(axis, rotation);
		}
	}
}

// Type-Specific Initialisation

function executePageType() {
	// Figure out the page type and modify variables accordingly

	var URL = window.location.href;

	if (URL.indexOf('3DSBS.html') > -1) {
		// Resolve URL systems - use this to determine mode
		console.log('Running in SBS mode');
		stereoDisp = true;
	}
	if (URL.indexOf('lowRes.html') > -1) {
		console.log('Running in low res mode');
		lowRes = true;
		renderingLensFlares = false;
	}
	if (URL.indexOf('HD.html') > -1) {
		console.log('Running in HD mode. Expect longer loading times');
		highDef = true;
	}
	if (URL.indexOf('webVR.html') > -1) {
		console.log('Running in webVR mode');
		webVR = true;

		orbitOpacity = false;

		var script = document.createElement('script');
		script.src = 'scripts/threejs/WebVR.js';

		renderingLensFlares = false;
		document.getElementById('visibleControl').style.display = 'none';

		document.getElementById('webVRScalingControl').style.display = 'block';
		document.getElementById('VRPosResetDiv').style.display = 'block';

		$('.toolTipTable').css('display', 'none');

		/*document.getElementById("visibleControls").style.display = "none"

		for (var name in planets) {
			var planet = planets[name]
			if (planet.viewingClass) {
				var viewingClass = planet.viewingClass
				if (viewingClass.minorBody || viewingClass.minorSatellite || viewingClass.expanse || viewingClass.easterEgg) {
					console.log("Deleting unseen planet " + name)
					delete planets[name]
				}
			}
		}*/
	}

	if (URL.indexOf('profathena') > -1) {
		console.log('Running in debug mode. Unit checking enabled');
		production = false;
	} else {
		console.log('Running in production mode. Unit checking disabled');
		production = true;
	}
}

function createShip() {
	// Make the ship surface - parameter defines which one
	// Load the lower-def one if not in high def
	if (highDef) {
		createShipSurface('MCRNTACHI HD');
	} else {
		createShipSurface('MCRNTACHI');
	}
}

function fixLoadingScreens() {
	// This corrects the positions of the loading screens - if it's in 3D mode

	// Add a thing that halves the width of all interface modules
	$('.sideBar').addClass('halfWidth');

	// This is a setting that determines how much the 3D display "pops" out of the screen
	var disparity = '24.5%';

	// Move the original (left) interface modules into the correct position
	document.getElementById('bootScreen').style.left = '-' + disparity;
	document.getElementById('loadingScreen').style.left = '-' + disparity;
	document.getElementById('smallLoadingScreen').style.left =
		'calc(' + disparity + ' - 125px)';
	document.getElementById('caption').style.left = '-' + disparity;

	// Move the auxillary (right) interface modules into the correct position
	document.getElementById('bootScreenAux').style.right = '-' + disparity;
	document.getElementById('loadingScreenAux').style.right = '-' + disparity;
	document.getElementById('smallLoadingScreenAux').style.right =
		'calc(' + disparity + ' - 125px)';
	document.getElementById('captionAux').style.right = '-' + disparity;
}

function loadAllMeshes() {
	// If running in HD mode, load everything as the program starts

	// Go through every planet
	for (var name in planets) {
		// If it's a model, load that. Otherwise, load the surface
		if (planets[name]['mapClass']['model']) {
			loadModel(name);
		} else {
			loadSurface(name);
		}
	}
}

// Full System Rendering

function createRings() {
	// Create planetary rings - these are specific, but are added and managed in a standard way

	// Create Saturn ring
	if (planets['saturn']) {
		// Set inner and outer ring radii in AU
		var innerRingRadius = 0.000447867337;
		var outerRingRadius = 0.00094921137;

		// Create ring geometry and materials
		var geometry = new THREE.RingGeometry(
			innerRingRadius * totalScale,
			outerRingRadius * totalScale,
			geoRes,
			geoRes,
			0,
			Math.PI * 2,
			true,
		);
		var material = new THREE.MeshBasicMaterial({
			map: textureLoader.load(
				baseURL + 'assets/special/saturnringmap.jpg',
			),
			color: 0x777777,
			wireframe: false,
			side: THREE.DoubleSide,
			opacity: 0,
			transparent: true,
			alphaMap: textureLoader.load(
				baseURL + 'assets/special/satringtrans.png',
			),
		});

		var settings = {
			map: textureLoader.load(
				baseURL + 'assets/special/saturnringmap.jpg',
			),
			color: white,
			wireframe: false,
			side: THREE.DoubleSide,
			opacity: 1,
			transparent: true,
			alphaMap: textureLoader.load(
				baseURL + 'assets/special/satringtrans.png',
			),
		};
		var shadowMaterial;

		if (userOnPhone) {
			shadowMaterial = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			shadowMaterial = new THREE.MeshPhongMaterial(settings);
		}

		// Create the actual rings
		var saturnRing = new THREE.Mesh(geometry, material);
		var saturnRingShadow = new THREE.Mesh(geometry, shadowMaterial);

		// Set the ring's rotation axis
		var axis = new THREE.Vector3(0, 0, 1).normalize();

		// Set shadow properties - no shadow casting because TJS does not consider transparency of a material with shadows (ring shadows are solid blocks)
		saturnRing.castShadow = false;
		saturnRing.receiveShadow = true;
		saturnRingShadow.castShadow = false;
		saturnRingShadow.receiveShadow = true;

		// Create a group
		var group = new THREE.Group();
		group.add(saturnRing);
		group.add(saturnRingShadow);

		// Set rotation properties
		var alignVec = threeVector(planets['saturn']['axialTilt'])
			.clone()
			.normalize();
		saturnRing.quaternion.setFromUnitVectors(axis, alignVec);
		saturnRingShadow.quaternion.setFromUnitVectors(axis, alignVec);

		// Add the actual rings
		planets['saturn']['ringMesh'] = group;
		scene.add(group);
	}

	// Create Uranus ring
	if (planets['uranus']) {
		// Set inner and outer ring radii in AU
		var innerRingRadius = 0.00025430175;
		var outerRingRadius = 0.000339069;

		// Create the geometry
		geometry = new THREE.RingGeometry(
			innerRingRadius * totalScale,
			outerRingRadius * totalScale,
			geoRes,
			geoRes,
			0,
			Math.PI * 2,
			true,
		);

		// Create the materials
		material = new THREE.MeshBasicMaterial({
			map: textureLoader.load(
				baseURL + 'assets/special/uranusringmap.jpg',
			),
			color: 0x777777,
			wireframe: false,
			side: THREE.DoubleSide,
			opacity: 1,
			transparent: true,
			alphaMap: textureLoader.load(
				baseURL + 'assets/special/uranusringtrans.jpg',
			),
		});

		var settings = {
			map: textureLoader.load(
				baseURL + 'assets/special/uranusringmap.jpg',
			),
			color: white,
			wireframe: false,
			side: THREE.DoubleSide,
			opacity: 1,
			transparent: true,
			alphaMap: textureLoader.load(
				baseURL + 'assets/special/uranusringtrans.jpg',
			),
		};
		var shadowMaterial;

		if (userOnPhone) {
			shadowMaterial = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			shadowMaterial = new THREE.MeshPhongMaterial(settings);
		}

		// Create the meshes
		var uranusRing = new THREE.Mesh(geometry, material);
		var uranusRingShadow = new THREE.Mesh(geometry, shadowMaterial);

		// Create a group
		group = new THREE.Group();
		group.add(uranusRing);
		group.add(uranusRingShadow);

		// Set shadow properties
		uranusRingShadow.castShadow = false;
		uranusRingShadow.receiveShadow = true;

		// Add the group to the program
		planets['uranus']['ringMesh'] = group;
		scene.add(group);

		// Set rings rotation
		alignVec = threeVector(planets['uranus']['axialTilt'])
			.clone()
			.normalize();
		uranusRing.quaternion.setFromUnitVectors(axis, alignVec);
		uranusRingShadow.quaternion.setFromUnitVectors(axis, alignVec);
	}

	// Create the "deimos ring", which only shows up if the Expanse is toggled
	if (planets['deimos'] && !webVRDisp) {
		// Create geometry and mesh
		geometry = new THREE.RingGeometry(
			planets['deimos']['a'] * 0.95 * totalScale,
			planets['deimos']['a'] * 1.05 * totalScale,
			geoRes,
		);
		var deimosRing = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({
				wireframe: false,
				side: THREE.DoubleSide,
				transparent: true,
				color: 0x888888,
				opacity: 0.1,
			}),
		);

		// Calculate the axial tilt, and rotate the deimos ring to match the orbit of Deimos
		var axialTilt = planets['deimos']['orbitalAxis'];
		axis = new THREE.Vector3(0, 0, 1).normalize();
		alignVec = threeVector(axialTilt).clone().normalize();
		deimosRing.quaternion.setFromUnitVectors(axis, alignVec);

		// Conrol visibility - not until The Expanse
		deimosRing.visible = false;

		// Name it for identification
		deimosRing.name = 'Deimos Rubble';

		// Set tooltip tracking
		deimosRing.trackMouse = true;

		// Add the ring to the scene
		scene.add(deimosRing);
		planets['mars']['ringMesh'] = deimosRing;
	}

	// Create the Monolith on Iapetus, which is categorised as a ring
	if (planets['iapetus'] && !webVRDisp) {
		// Define the scale in relation to Iapetus
		var monScale = 0.1 * planets['iapetus']['r'];

		// Create geometry and mesh
		var scaling = threeVector([
			1 * monScale * totalScale,
			4 * totalScale * monScale,
			9 * totalScale * monScale,
		]);
		geometry = new THREE.BoxGeometry(scaling.x, scaling.y, scaling.z);
		var theMonolith = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({
				color: 0x0a0a0a,
				side: THREE.DoubleSide,
			}),
		);

		// Move the monolith to the correct position
		var translateAmount = threeVector([
			axialTilt[0],
			axialTilt[1],
			(planets['iapetus']['r'] + (8.5 * monScale) / 2) * totalScale,
		]);
		geometry.translate(
			translateAmount.x,
			translateAmount.y,
			translateAmount.z,
		);

		// Add the monlith
		scene.add(theMonolith);
		planets['iapetus']['ringMesh'] = theMonolith;
	}
}

function createBelts() {
	// Create asteroid belts

	// Create asteroid belt
	var geometry = new THREE.RingGeometry(
		2.1 * totalScale,
		3.2 * totalScale,
		geoRes,
	);
	belt = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: 0x555555,
			wireframe: false,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.3,
		}),
	);

	// Add asteroid belt
	belt.position.set(0, 0, 0);
	scene.add(belt);

	// Create kupier belt
	geometry = new THREE.RingGeometry(30 * totalScale, 50 * totalScale, geoRes);
	kuiper = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: 0x333333,
			wireframe: false,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.3,
		}),
	);

	// Add Kuiper belt
	kuiper.position.set(0, 0, 0);
	scene.add(kuiper);

	// Set shadow properties
	belt.castShadow = false;
	kuiper.castShadow = false;

	// Hide the belts until shown through guide
	belt.visible = false;
	kuiper.visible = false;

	// Set the tooltip tracking of the two belts
	belt.trackMouse = true;
	kuiper.trackMouse = true;

	// Name them
	belt.name = 'Asteroid Belt';
	kuiper.name = 'Kuiper Belt';

	// Set the correct rotations
	var axis = camera.up;
	var alignVec = threeVector([0, 0, 1]).normalize();
	belt.quaternion.setFromUnitVectors(axis, alignVec);
	kuiper.quaternion.setFromUnitVectors(axis, alignVec);
}

function createGuides() {
	// Create Vernal equinox line
	// Create initial geometry
	var geometry = new THREE.Geometry();

	// Set correct points and render correctly
	geometry.vertices.push(
		new THREE.Vector3(0 * totalScale, 0, 0),
		new THREE.Vector3(100 * totalScale, 0, 0),
	);

	// Create material
	var material = new THREE.LineDashedMaterial({
		color: white,
		dashSize: 1 * totalScale,
		gapSize: 1 * totalScale,
	});

	// Create and add vernal line
	vernalLine = new THREE.Line(geometry, material);
	scene.add(vernalLine);
	vernalLine.computeLineDistances();

	// Set tooltip systems
	vernalLine.name = 'Vernal Equinox';
	vernalLine.trackMouse = true;

	// Make it invisible unless guides turned on
	vernalLine.visible = false;
}

function createPlanets() {
	// Create all planetary surfaces

	for (var name in planets) {
		if (name != 'sun') {
			// The sun is special, so don't do it

			// Make the planet and move it
			renderPlanet(name);
		}
	}

	// Render the night side of Earth
	if (!lowRes) {
		renderEarthNight();
	}
}

// Orbital Rendering

function drawOrbits() {
	// Draw orbital lines for each planet

	// Iterate through all planets
	for (var name in planets) {
		if (name != 'sun') {
			// The sun is special, so don't do it

			// Create the orbit
			var fullOrbit = new THREE.Group();

			// If orbit opacity is on, and not in low res
			if (!lowRes && orbitOpacity) {
				// Split the orbit into 360 * orbitOpacityRes segments for individual opacity control
				var opacity = baseOrbitOpacity;
				for (var i = 0; i < 360 * orbitOpacityRes; i++) {
					var degree = i / orbitOpacityRes;
					var nextDegree = (i + 1) / orbitOpacityRes;
					var planetOrbit = createOrbit(name, degree, nextDegree);
					var orbitMaterial = new THREE.LineBasicMaterial({
						color: planets[name]['trackColour'],
						transparent: true,
						opacity: opacity,
					});
					var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
					scene.add(orbitPath);
					orbitPath.scale.set(totalScale, totalScale, totalScale);
					fullOrbit.add(orbitPath);
				}
			} else {
				// Make one solid orbit for ease of computation
				opacity = 1;

				var planetOrbit = createOrbit(name, 0, 360);
				var orbitMaterial = new THREE.LineBasicMaterial({
					color: planets[name]['trackColour'],
					transparent: true,
					opacity: opacity,
				});
				var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
				scene.add(orbitPath);
				orbitPath.scale.set(totalScale, totalScale, totalScale);
				fullOrbit.add(orbitPath);
			}

			// Add the orbit as the orbit mesh
			scene.add(fullOrbit);
			planets[name]['orbitMesh'] = fullOrbit;

			// Find the center and central coordinates
			var center = planets[name]['center'];
			var centerCoords = currentPositions[center];

			// Find where the planet should be
			var planetLocation = findPlanetLocation(name, currentTime);
			currentPositions[name] = addVec(planetLocation, centerCoords);

			// Don't initially display the moon orbits - saves computation
			if (planets[name]['center'] != 'sun') {
				planets[name]['orbitMesh'].visible = false;
			}
		}
	}
}

function createOrbit(name, startDegree, endDegree) {
	// Create the ThreeJS geometry for the orbit track

	// Initialise variables
	var geometry = new THREE.Geometry();
	var vertexes = [];
	var degree = endDegree * orbitResolution;

	// Get the correct initial vertex
	if (degree < 360 * orbitResolution) {
		geometry.vertices.push(threeVector(orbitalPositions[name][degree]));
	} else {
		geometry.vertices.push(threeVector(orbitalPositions[name][0]));
	}

	// Iterate through all orbit points between given bounds and add it to the vertexes
	while (degree > startDegree * orbitResolution) {
		degree -= 1;
		var orbitalPosition = orbitalPositions[name][degree];

		geometry.vertices.push(threeVector(orbitalPosition));
	}

	// Return the geometry
	return geometry;
}

// Planetary Rendering

function renderEarthNight() {
	// Render the night side of Earth

	// Import parameters and geometry
	var r = planets['earth']['r'];
	var geometry = sphereGeo;

	// Set a material, darkened to match the night side
	var material = new THREE.MeshBasicMaterial({
		color: 0x595959,
		map: textureLoader.load('assets/special/earthmapNight.jpg'),
	});

	// Generate mesh and add to scene
	var mesh = new THREE.Mesh(geometry, material);
	nightEarth = mesh;
	scene.add(mesh);

	// Set the size to match Earth
	var size = (r * totalScale) / geoScale;
	mesh.scale.set(size, size, size);

	// Find basic axis from which it rotates
	var axis = new THREE.Vector3(0, 1, 0).normalize();

	// Match the alignment vector to the axial tilt
	var alignVec = threeVector(planets['earth']['axialTilt'])
		.clone()
		.normalize();

	// Align the planet
	nightEarth.quaternion.setFromUnitVectors(axis, alignVec);

	// Find the time
	var milliseconds = currentTime.getTime() - EPOCH.getTime(); // Milliseconds between EPOCH and current time
	var days = milliseconds * convertTime('MS', 'D', 1); // Days since EPOCH
	var percent = days / planets['earth']['rotation'];

	// Rotate by the needed amount, in a similar way to planetary epoch
	var rotation =
		(2 * Math.PI * percent + planets['earth']['rotEpoch']) % (2 * Math.PI);
	nightEarth.rotateOnAxis(axis, rotation);
}

function renderPlanet(name) {
	// Create the planetary surface and marker

	// Initialise ring mesh
	var ringMesh;

	// Add a special for the sun (it doesn't have its own planet data because it's special with no orbit)
	if (name == 'sun') {
		planets['sun'] = {
			r: 0.00464913034,
			center: 'sun',
			colour: 0xaaaaaa,
			transparent: true,
			opacity: 0.5,
			a: sunMarkerSize / markerScale,
			axialTilt: [0, 0, 1],
			mapClass: {},
		};
	}

	// Collect initial data
	var r = planets[name]['r'];
	var colour = planets[name]['colour'];
	var a = planets[name]['a'];
	var markerSize = a * markerScale;

	// Load spherical geometry for the planet - copied for efficienct
	var geometry = sphereGeo;

	// Set a dull default material
	var settings = {
		color: colour,
	};
	var material;

	if (userOnPhone) {
		material = new THREE.MeshLambertMaterial(settings);
	} else {
		settings.specular = black;
		settings.shininess = 0;
		material = new THREE.MeshPhongMaterial(settings);
	}

	// Create special geometry for The Sol Ring
	if (name == 'the ring') {
		// Create geometries
		ringMesh = theRingMesh();
	}

	if (name == 'tycho station') {
		// This is a complex and manually generated geometry - kept separate for ease of programming

		ringMesh = new THREE.Group();
		ringMesh.add(tychoMesh());
	}

	if (name == 'sun') {
		// Create a special surface mesh for the sun

		material = new THREE.MeshBasicMaterial({
			// This is for the sun
			color: white,
			opacity: 0.99999, // To allow pointlight and lens flare to shine through
			transparent: true,
			depthWrite: false,
		});

		// Don't texture it if it is low resolution
		if (!lowRes) {
			material.map = textureLoader.load('assets/maps/sun.jpg');
		} else {
			material.opacity = 1;
			material.transparent = false;
			material.depthWrite = true;
		}
	}

	// Place the planetary mesh in the scene
	if (name != 'the ring' && name != 'tycho station') {
		var mesh = new THREE.Mesh(geometry, material);

		placeSphere(name, mesh);
		var size = (r * totalScale) / geoScale;
		mesh.scale.set(size, size, size);
	} else {
		placeSphere(name, ringMesh);
	}

	// Add the atmosphere if we're not in low res
	if (!lowRes) {
		addAtmo(name);
	}

	// Create planetary lens flare - for the real solar system
	if (name != 'sun') {
		// The sun's is different

		// Initialise the flare
		var flareColor = new THREE.Color(colour);
		var textureFlare;
		if (stereoDisp) {
			textureFlare = textureLoader.load(
				'assets/flares/planetFlareSBS.png',
			);
		} else {
			textureFlare = textureLoader.load('assets/flares/planetFlare.png');
		}

		// Set the size
		var size = HEIGHT;
		if (planets[name]['center'] != 'sun') {
			size = 1;
		}

		if (renderingLensFlares) {
			// Actually create the lens flare

			var lensFlare;

			if (webVR && false) {
				var material = new THREE.SpriteMaterial({
					map: textureFlare,
					color: flareColor,
					blending: THREE.NormalBlending,
					depthTest: false,
				});
				lensFlare = new THREE.Sprite(material);
			} else {
				lensFlare = new THREE.Lensflare();
				lensFlare.addElement(
					new THREE.LensflareElement(
						textureFlare,
						1,
						0.0,
						flareColor,
						THREE.AdditiveBlending,
					),
				);
				lensFlare.castShadow = false;
			}

			// Place the lens flare in the scene
			planets[name]['lensFlare'] = lensFlare;
			scene.add(lensFlare);
			lensFlare.visible = false;
		}
	} else {
		// Don't load any more lens flares if it is in low res - there is no sun flare
		if (!lowRes) {
			if (stereoDisp) {
				textureFlare = textureLoader.load(
					'assets/flares/lensflareSBS.png',
				);
			} else {
				textureFlare = textureLoader.load(
					'assets/flares/lensflare.png',
				);
			}
		} else {
			textureFlare = textureLoader.load('assets/flares/planetFlare.png');
		}

		// Set the sun flare
		flareColor = new THREE.Color(white);

		// Create the sun flare and place it

		if (webVR && false) {
			var material = new THREE.SpriteMaterial({
				map: textureFlare,
				color: 0xffffff,
				blending: THREE.NormalBlending,
				depthTest: false,
			});
			sunFlare = new THREE.Sprite(material);
		} else {
			sunFlare = new THREE.Lensflare();
			sunFlare.addElement(
				new THREE.LensflareElement(
					textureFlare,
					1,
					0.0,
					flareColor,
					THREE.AdditiveBlending,
				),
			);
			sunFlare.castShadow = false;
		}

		scene.add(sunFlare);

		// Hide the flare if it's low res
		if (lowRes) {
			sunFlare.visible = false;
		}
	}

	// Create the marker geometry
	geometry = sphereGeo;

	// Set the sun's effective semi-major axis for makers
	if (name == 'sun') {
		planets['sun']['a'] = 0.00001;
	}

	// Create the marker material
	var markerMaterial = new THREE.MeshBasicMaterial({
		color: colour,
		opacity: 0.3,
		transparent: true,
		depthWrite: false,
	});

	// Make the sun's marker invisible
	if (name == 'sun') {
		markerMaterial.opacity = 0;
	}

	// Create the marker
	var marker = new THREE.Mesh(geometry, markerMaterial);

	// Set the marker data
	marker.position.set(0, 0, 0);
	marker.rotation.set(0, 0, 0);

	// Add Expanse logo tags
	if (name == 'eros' || name == 'ceres' || name == 'ganymede') {
		marker.logo = name;
		marker.company = name + ' station';
		marker.name = name + ' station';
	} else if (name == 'tycho station') {
		marker.logo = 'tycho station';
		marker.company = 'tycho manufacturing and engineering';
		marker.name = 'tycho station';
	} else if (name == 'mars') {
		marker.logo = 'mars';
		marker.company = 'Martian Congressional Republic';
		marker.name = 'mars';
	} else if (name == 'earth') {
		marker.logo = 'earth';
		marker.company = 'United Nations';
		marker.name = 'earth';
	}

	// Set the marker name
	if (name == 'sun') {
		marker.name = 'Sol';
	} else {
		marker.name = name;
	}

	// Actually add the marker to the scene
	planets[name]['markerMesh'] = marker;
	if (planets[name]['center'] != 'sun') {
		marker.visible = false;
	}
	scene.add(marker);

	// Scale the marker, as it is not a geometry of the right size
	var size = (totalScale * markerSize) / geoScale;
	//size = totalScale * planets[name]["SOI"] / geoScale
	marker.scale.set(size, size, size);

	// Hide the surface and orbit meshes if needed
	if (name == 'sun') {
		planets[name]['surfaceMesh'].visible = true;
	}

	// Control marker opacity for the sun
	if (name == 'sun') {
		planets[name].markerMesh.material.opacity = 0;
	} else {
		planets[name].markerMesh.material.opacity = 0.3;
	}
}

function theRingMesh() {
	var r = planets['the ring']['r'];
	var ringGeo = new THREE.TorusGeometry(
		((r * 49) / 50) * totalScale,
		(r / 50) * totalScale,
		geoRes,
		geoRes,
	);
	var ringCoreGeo = new THREE.TorusGeometry(
		((r * 49) / 50) * totalScale,
		(r / 200) * totalScale,
		geoRes,
		geoRes,
	);
	var hideGeo = new THREE.RingGeometry(
		0.000001,
		((r * 48.2) / 50) * totalScale,
		geoRes,
	);

	// Create materials
	var settings = {
		specular: 0x050505,
		color: 0x086b72,
	};
	var bandMaterial;

	if (userOnPhone) {
		bandMaterial = new THREE.MeshLambertMaterial(settings);
	} else {
		bandMaterial = new THREE.MeshPhongMaterial(settings);
	}

	var settings = {
		specular: 0x050505,
		color: 0x333333,
	};
	var coreMaterial;

	if (userOnPhone) {
		coreMaterial = new THREE.MeshLambertMaterial(settings);
	} else {
		coreMaterial = new THREE.MeshPhongMaterial(settings);
	}

	var settings = {
		color: 0x086b72,
		specular: 0x111111,
		side: THREE.BackSide,
	};
	var hideMaterial;

	if (userOnPhone) {
		hideMaterial = new THREE.MeshLambertMaterial(settings);
	} else {
		hideMaterial = new THREE.MeshPhongMaterial(settings);
	}

	// Create meshes
	var bandMesh = new THREE.Mesh(ringGeo, bandMaterial);
	var coreMesh = new THREE.Mesh(ringCoreGeo, coreMaterial);
	var hideMesh = new THREE.Mesh(hideGeo, hideMaterial);

	// Bundle in group
	var ringMesh = new THREE.Group();

	ringMesh.add(bandMesh);
	ringMesh.add(hideMesh);
	ringMesh.add(coreMesh);

	ringMesh.traverse(function (child) {
		// Go through all the children and apply shadow rules
		if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
			// Set shadow rules
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});

	return ringMesh;
}

function tychoMesh() {
	// Generate the mesh for Tycho Station and the Nauvoo
	var name = 'tycho station';

	// Create geometries
	var tychoGeo = new THREE.SphereGeometry(
		250 * convertDistance('M', 'AU') * totalScale,
		geoRes,
		geoRes,
	);

	var nauvooGeo = new THREE.CylinderGeometry(
		250 * convertDistance('M', 'AU') * totalScale,
		250 * convertDistance('M', 'AU') * totalScale,
		1500 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooCommGeo = new THREE.CylinderGeometry(
		62.5 * convertDistance('M', 'AU') * totalScale,
		62.5 * convertDistance('M', 'AU') * totalScale,
		100 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooSpikeGeo = new THREE.CylinderGeometry(
		0 * convertDistance('M', 'AU') * totalScale,
		10 * convertDistance('M', 'AU') * totalScale,
		100 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooDocksGeo = new THREE.TorusGeometry(
		200 * convertDistance('M', 'AU') * totalScale,
		5 * convertDistance('M', 'AU') * totalScale,
		geoRes,
		geoRes,
	);
	var nauvooReactorGeo = new THREE.SphereGeometry(
		50 * convertDistance('M', 'AU') * totalScale,
		geoRes,
		geoRes,
	);
	var nauvooConnectGeo = new THREE.CylinderGeometry(
		10 * convertDistance('M', 'AU') * totalScale,
		10 * convertDistance('M', 'AU') * totalScale,
		250 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);

	var nauvooDriveGeo = new THREE.CylinderGeometry(
		25 * convertDistance('M', 'AU') * totalScale,
		25 * convertDistance('M', 'AU') * totalScale,
		100 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooDriveConnectGeo = new THREE.CylinderGeometry(
		5 * convertDistance('M', 'AU') * totalScale,
		5 * convertDistance('M', 'AU') * totalScale,
		350 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooHabGeo = new THREE.CylinderGeometry(
		270 * convertDistance('M', 'AU') * totalScale,
		270 * convertDistance('M', 'AU') * totalScale,
		350 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);

	var nauvooLiftGeo = new THREE.CylinderGeometry(
		25 * convertDistance('M', 'AU') * totalScale,
		25 * convertDistance('M', 'AU') * totalScale,
		1600 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var nauvooDocksConnectGeo = new THREE.CylinderGeometry(
		5 * convertDistance('M', 'AU') * totalScale,
		5 * convertDistance('M', 'AU') * totalScale,
		400 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);

	var tychoRingGeo = new THREE.CylinderGeometry(
		350 * convertDistance('M', 'AU') * totalScale,
		350 * convertDistance('M', 'AU') * totalScale,
		50 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var antennaGeo = new THREE.CylinderGeometry(
		0 * convertDistance('M', 'AU') * totalScale,
		25 * convertDistance('M', 'AU') * totalScale,
		500 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);
	var connectGeo = new THREE.CylinderGeometry(
		25 * convertDistance('M', 'AU') * totalScale,
		25 * convertDistance('M', 'AU') * totalScale,
		400 * convertDistance('M', 'AU') * totalScale,
		geoRes,
	);

	// Create Tycho material
	var settings = {
		color: planets[name]['colour'],
	};
	var tychoMaterial;

	if (userOnPhone) {
		tychoMaterial = new THREE.MeshLambertMaterial(settings);
	} else {
		settings.specular = black;
		settings.shininess = 5;
		tychoMaterial = new THREE.MeshPhongMaterial(settings);
	}

	// Create Tycho meshes
	var tychoMesh = new THREE.Mesh(tychoGeo, tychoMaterial);
	var tychoRingMesh = new THREE.Mesh(tychoRingGeo, tychoMaterial);
	var antennaMesh = new THREE.Mesh(antennaGeo, tychoMaterial);
	var connectMesh = new THREE.Mesh(connectGeo, tychoMaterial);

	// Create Nauvoo material
	var settings = {
		color: 0xcccccc,
	};
	var nauvooMaterial;

	if (userOnPhone) {
		nauvooMaterial = new THREE.MeshLambertMaterial(settings);
	} else {
		settings.specular = black;
		settings.shininess = 5;
		nauvooMaterial = new THREE.MeshPhongMaterial(settings);
	}

	// Create Nauvoo meshes
	var nauvooMesh = new THREE.Mesh(nauvooGeo, nauvooMaterial);
	var nauvooSpikeMesh = new THREE.Mesh(nauvooSpikeGeo, nauvooMaterial);
	var nauvooCommMesh = new THREE.Mesh(nauvooCommGeo, nauvooMaterial);
	var nauvooDocksMesh = new THREE.Mesh(nauvooDocksGeo, nauvooMaterial);
	var nauvooReactorMesh = new THREE.Mesh(nauvooReactorGeo, nauvooMaterial);
	var nauvooConnectMesh = new THREE.Mesh(nauvooConnectGeo, nauvooMaterial);

	// Create arrays
	var nauvooDrives = [];
	var nauvooDrivesConnect = [];
	var nauvooDocksConnect = [];
	var nauvooHabs = [];

	var nauvooLifts = [];

	// Fill arrays with needed number of meshes
	for (var i = 0; i < 8; i++) {
		nauvooDrives.push(new THREE.Mesh(nauvooDriveGeo, nauvooMaterial));
	}
	for (var i = 0; i < 4; i++) {
		nauvooDrivesConnect.push(
			new THREE.Mesh(nauvooDriveConnectGeo, nauvooMaterial),
		);
	}
	for (var i = 0; i < 4; i++) {
		nauvooDocksConnect.push(
			new THREE.Mesh(nauvooDocksConnectGeo, nauvooMaterial),
		);
	}
	for (var i = 0; i < 2; i++) {
		nauvooHabs.push(new THREE.Mesh(nauvooHabGeo, nauvooMaterial));
	}

	for (var i = 0; i < 2; i++) {
		nauvooLifts.push(new THREE.Mesh(nauvooLiftGeo, nauvooMaterial));
	}

	// Create new groups, keeping the Nauvoo and Tycho separate for movement
	var subGroup = new THREE.Group();

	var tychoGroup = new THREE.Group();
	var nauvooGroup = new THREE.Group();

	subGroup.rotation.set(
		5.847131682738216,
		3.0667165806460956,
		3.829487887805754,
	); // Randomly selected

	// Set position of Nauvoo meshes
	nauvooMesh.rotation.z = Math.PI / 2;
	nauvooMesh.position.x = -50 * convertDistance('M', 'AU') * totalScale;

	nauvooCommMesh.rotation.z = Math.PI / 2;
	nauvooCommMesh.position.x =
		-(800 + 50) * convertDistance('M', 'AU') * totalScale;

	nauvooSpikeMesh.rotation.z = Math.PI / 2;
	nauvooSpikeMesh.position.x =
		-(800 + 50 + 100) * convertDistance('M', 'AU') * totalScale;

	nauvooDocksMesh.rotation.y = Math.PI / 2;
	nauvooDocksMesh.scale.z = 5;
	nauvooDocksMesh.position.x =
		(700 + 80) * convertDistance('M', 'AU') * totalScale;

	nauvooReactorMesh.rotation.z = Math.PI / 2;
	nauvooReactorMesh.position.x =
		(700 + 200 + 50) * convertDistance('M', 'AU') * totalScale;

	nauvooConnectMesh.rotation.z = Math.PI / 2;
	nauvooConnectMesh.position.x =
		(700 + 125) * convertDistance('M', 'AU') * totalScale;

	for (var i = 0; i < 8; i++) {
		var angle = (i / 8) * Math.PI * 2;
		var biasMag = 175;
		var yBias = biasMag * Math.sin(angle);
		var zBias = biasMag * Math.cos(angle);

		nauvooDrives[i].rotation.z = Math.PI / 2;
		nauvooDrives[i].position.y =
			yBias * convertDistance('M', 'AU') * totalScale;
		nauvooDrives[i].position.x =
			(700 + 200 + 50) * convertDistance('M', 'AU') * totalScale;
		nauvooDrives[i].position.z =
			-zBias * convertDistance('M', 'AU') * totalScale;
	}

	for (var i = 0; i < 4; i++) {
		var angle = (i / 4) * Math.PI;

		nauvooDrivesConnect[i].rotation.x = angle;
		nauvooDrivesConnect[i].position.x =
			(700 + 200 + 50) * convertDistance('M', 'AU') * totalScale;
	}

	for (var i = 0; i < 2; i++) {
		var angle = (i / 2) * Math.PI;

		nauvooDocksConnect[i].rotation.x = angle;
		nauvooDocksConnect[i].position.x =
			(700 + 80) * convertDistance('M', 'AU') * totalScale;
	}

	for (var i = 0; i < 2; i++) {
		nauvooHabs[i].rotation.z = Math.PI / 2;
		nauvooHabs[i].position.x =
			(i * (150 + 350) - 500) * convertDistance('M', 'AU') * totalScale;
	}

	for (var i = 0; i < 2; i++) {
		var angle = (i / 2) * Math.PI * 2;
		var biasMag = 300;
		var yBias = biasMag * Math.sin(angle);
		var zBias = biasMag * Math.cos(angle);

		nauvooLifts[i].rotation.z = Math.PI / 2;
		nauvooLifts[i].position.y =
			yBias * convertDistance('M', 'AU') * totalScale;
		nauvooLifts[i].position.x =
			100 * convertDistance('M', 'AU') * totalScale;
		nauvooLifts[i].position.z =
			-zBias * convertDistance('M', 'AU') * totalScale;
	}

	// Set positions of Tycho meshes
	antennaMesh.position.y = 250 * convertDistance('M', 'AU') * totalScale;
	connectMesh.position.y = -250 * convertDistance('M', 'AU') * totalScale;

	// Add meshes to groups
	tychoGroup.add(tychoMesh);
	tychoGroup.add(tychoRingMesh);
	tychoGroup.add(antennaMesh);
	tychoGroup.add(connectMesh);

	nauvooGroup.add(nauvooMesh);
	nauvooGroup.add(nauvooCommMesh);
	nauvooGroup.add(nauvooSpikeMesh);
	nauvooGroup.add(nauvooDocksMesh);
	nauvooGroup.add(nauvooReactorMesh);
	nauvooGroup.add(nauvooConnectMesh);

	for (var i = 0; i < 8; i++) {
		nauvooGroup.add(nauvooDrives[i]);
	}
	for (var i = 0; i < 4; i++) {
		nauvooGroup.add(nauvooDrivesConnect[i]);
	}
	for (var i = 0; i < 2; i++) {
		nauvooGroup.add(nauvooDocksConnect[i]);
	}
	for (var i = 0; i < 2; i++) {
		nauvooGroup.add(nauvooHabs[i]);
	}
	for (var i = 0; i < 2; i++) {
		//subGroup.add(nauvooLifts[i]);
	}

	// Move the Nauvoo to the correct position
	nauvooGroup.position.y =
		-(250 + 400) * convertDistance('M', 'AU') * totalScale;

	nauvooGroup.traverse(function (node) {
		node.name = 'LDSS Nauvoo';
		node.logo = 'nauvoo';
		node.company = 'Church of the Latter Day Saints';
		node.trackMouse = true;
		node.keepColour = true;
	});

	tychoGroup.traverse(function (node) {
		node.name = 'Tycho Station';
		node.logo = 'tycho station';
		node.company = 'Tycho manufacturing and engineering';
		node.trackMouse = true;
		node.keepColour = true;
	});

	subGroup.add(tychoGroup);
	subGroup.add(nauvooGroup);

	subGroup.traverse(function (child) {
		// Go through all the children and apply shadow rules
		if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
			// Set shadow rules
			child.castShadow = false;
			child.receiveShadow = false;
		}
	});

	return subGroup;
}

function placeSphere(name, mesh) {
	// Place the sphere in the planets data and in the scene

	// Rename the mesh
	var sphere = mesh;

	// Deal with shadows - make them possible if it's not the sun
	if (name != 'sun') {
		sphere.castShadow = true;
		sphere.receiveShadow = true;
	}

	mesh.visible = false;

	// Place the mesh in the program
	planets[name]['surfaceMesh'] = sphere;
	scene.add(sphere);
}

function addAtmo(name) {
	// Add the atmosphere for the planet if needed

	// Find data and initialise variables
	var r = planets[name]['r'];
	var atmoMesh;

	if (name == 'earth') {
		// If the planet is Earth, add Earth's atmosphere

		// Add some height for the atmosphere so it doesn't clip through the surface
		var atmoHeight = 10 * convertDistance('KM', 'AU', 1);

		// Add some extra height if in 3D display
		if (stereoDisp) {
			atmoHeight = 10 * convertDistance('KM', 'AU', 1);
		}

		// Create the atmosphere mesh
		var geometry = sphereGeo;
		var settings = {
			//side: THREE.DoubleSide,
			opacity: 0.8,
			transparent: true,
		};
		var material;

		if (userOnPhone) {
			material = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			material = new THREE.MeshPhongMaterial(settings);
		}

		atmoMesh = new THREE.Mesh(geometry, material);
		var size = ((r + atmoHeight) * totalScale) / geoScale;
		atmoMesh.scale.set(size, size, size);
	}

	if (name == 'titan') {
		// If the planet is Titan, add Titan's atmosphere

		// Add some height for the atmosphere so it doesn't clip through the surface
		var atmoHeight = 10 * convertDistance('KM', 'AU', 1);

		// Add some extra height if in 3D display
		if (stereoDisp) {
			atmoHeight = 10 * convertDistance('KM', 'AU', 1);
		}

		// Create the atmosphere mesh
		geometry = sphereGeo;
		var settings = {
			//side: THREE.DoubleSide,
			opacity: 0.95,
			transparent: true,
		};
		var material;

		if (userOnPhone) {
			material = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			material = new THREE.MeshPhongMaterial(settings);
		}

		atmoMesh = new THREE.Mesh(geometry, material);
		var size = ((r + atmoHeight) * totalScale) / geoScale;
		atmoMesh.scale.set(size, size, size);
		atmoMesh.castShadow = false;
	}

	if (name == 'venus') {
		// If the planet is Venus, add Venus's atmosphere

		// Add some height for the atmosphere so it doesn't clip through the surface
		var atmoHeight = 50 * convertDistance('KM', 'AU', 1);

		// Add some extra height if in 3D display
		if (stereoDisp) {
			atmoHeight = 50 * convertDistance('KM', 'AU', 1);
		}

		// Create the atmosphere mesh
		geometry = sphereGeo;
		var settings = {
			opacity: 0.9,
			transparent: true,
		};
		var material;

		if (userOnPhone) {
			material = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			material = new THREE.MeshPhongMaterial(settings);
		}

		atmoMesh = new THREE.Mesh(geometry, material);
		var size = ((r + atmoHeight) * totalScale) / geoScale;
		atmoMesh.scale.set(size, size, size);
	}

	if (name == 'mars') {
		// If the planet is Mars, add mars's atmosphere

		// Add some height for the atmosphere so it doesn't clip through the surface
		var atmoHeight = 10 * convertDistance('KM', 'AU', 1);

		// Add some extra height if in 3D display
		if (stereoDisp) {
			atmoHeight = 10 * convertDistance('KM', 'AU', 1);
		}

		// Set the opacity to mimic dust storms
		marsOpacity =
			Math.random() * (marsOpacityUpper - marsOpacityLower) +
			marsOpacityLower;

		// Create the atmosphere mesh
		geometry = sphereGeo;

		var settings = {
			color: 0xe5b97c,
			opacity: marsOpacity,
			transparent: true,
		};
		var material;

		if (userOnPhone) {
			material = new THREE.MeshLambertMaterial(settings);
		} else {
			settings.specular = black;
			settings.shininess = 0;
			material = new THREE.MeshPhongMaterial(settings);
		}

		atmoMesh = new THREE.Mesh(geometry, material);
		var size = ((r + atmoHeight) * totalScale) / geoScale;

		atmoMesh.scale.set(size, size, size);
	}

	// Add the atmosphere to the scene, if one made
	if (atmoMesh) {
		// Add the atmosphere mesh
		planets[name]['atmoMesh'] = atmoMesh;
		scene.add(atmoMesh);
	}
}

// Tooltip Management Functions

function onDocumentMouseMove(event) {
	// When the mouse is moved, update the mouse position

	// Update the mouse known position
	if (stereoDisp) {
		mouse.x = event.clientX * 2;
	} else {
		mouse.x = event.clientX;
	}

	mouse.y = event.clientY;

	// Reset the cursor
	document.getElementById('innerBody').style.cursor = 'auto';
	// If on top of the ship, set the cursor to the clicking one
	if (intersectedObject) {
		if (
			intersectedObject.name == 'ship' ||
			intersectedObject.name == 'rocinante'
		) {
			document.getElementById('innerBody').style.cursor = 'pointer';
		}
	}
}

function onDocumentMouseDown(event) {
	// If the click is on the ship, show the ship tooltip
	if (intersectedObject) {
		if (
			intersectedObject.name == 'ship' ||
			intersectedObject.name == 'rocinante'
		) {
			showingShipTooltip = !showingShipTooltip;
		}
	}
}

function onTooltipClick(event) {
	// If clicking on the tooltip, show the ship tooltip
	showingShipTooltip = !showingShipTooltip;
}

function moveTooltip(position, id) {
	// Move the selected tooltip to the correct specified position

	var sizeReduction = document.getElementById(id + 'Content').clientWidth / 4;

	// Decide on the X position
	if (
		position.x < window.innerWidth / 2 - toolTipMargin ||
		(document.getElementById(id).style.left != '' &&
			position.x < window.innerWidth / 2 + toolTipMargin)
	) {
		// Mouse in left half of screen (or over the sun - to keep consistent)

		document.getElementById(id).style.left =
			position.x - toolTipCanvasMargin + 'px';
		if (stereoDisp) {
			document.getElementById(id).style.left =
				position.x - toolTipCanvasMargin - sizeReduction + 'px';
		}
		document.getElementById(id).style.right = '';
	} else {
		// Mouse in right half of screen (or over the sun - to keep consistent)

		document.getElementById(id).style.left = '';
		document.getElementById(id).style.right =
			window.innerWidth - position.x - toolTipCanvasMargin + 'px';
		if (stereoDisp) {
			document.getElementById(id).style.right =
				window.innerWidth -
				position.x -
				toolTipCanvasMargin +
				sizeReduction +
				'px';
		}
	}

	// Decide on the Y position
	if (
		position.y > window.innerHeight / 2 - toolTipMargin ||
		(document.getElementById(id).style.bottom != '' &&
			position.y > window.innerHeight / 2 + toolTipMargin)
	) {
		// Mouse in bottom half of screen (or over the sun - to keep consistent)

		document.getElementById(id).style.top = '';
		document.getElementById(id).style.bottom =
			window.innerHeight - position.y - toolTipCanvasMargin + 'px';
	} else {
		// Mouse in top half of screen (or over the sun - to keep consistent)

		document.getElementById(id).style.top =
			position.y - toolTipCanvasMargin + 'px';
		document.getElementById(id).style.bottom = '';
	}
}

function findTooltip() {
	// Detect if the mouse is on top of a marker, and turn on tooltip if yes - NOTE: Imported and modded code (mostly)
	// Any comments that begin with a lowercase ARE NOT MINE

	// find intersections

	// create a Ray with origin at the mouse position
	//   and direction into the scene (camera direction)
	var vector = new THREE.Vector3(
		(mouse.x / window.innerWidth) * 2 - 1,
		-(mouse.y / window.innerHeight) * 2 + 1,
		1,
	);
	var ray;
	if (stereoDisp) {
		vector.unproject(cameraLeft);
		ray = new THREE.Raycaster(
			camera.position,
			vector.sub(cameraLeft.position).normalize(),
		);
	} else {
		vector.unproject(camera);
		ray = new THREE.Raycaster(
			camera.position,
			vector.sub(camera.position).normalize(),
		);
	}

	// create an array containing all objects in the scene with which the ray intersects
	var intersects = ray.intersectObjects(scene.children, true);

	// INTERSECTED = the object in the scene currently closest to the camera
	//		and intersected by the Ray projected from the mouse position

	// if there is one (or more) intersections

	var index = 0;
	var found = false;
	while (index < intersects.length - 1 && found == false) {
		if (intersects[index].object.name != '') {
			found = true;
		} else {
			index++;
		}
	}

	if (found) {
		// if the closest object intersected is not the currently stored intersection object

		if (intersects[index].object != INTERSECTED) {
			// restore previous intersection object (if it exists) to its original color
			if (INTERSECTED && INTERSECTED.material.color)
				INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

			// store reference to closest object as current intersection object
			INTERSECTED = intersects[index].object;

			if (INTERSECTED.material.color) {
				// store color of closest object (for later restoration)
				INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
			}

			// As long as the program is actually running right now
			if (Object.keys(orbitalTimes).length !== 0 && shipSurfaceMesh) {
				// Set global intersected object
				intersectedObject = intersects[index].object;

				// As long as it's not the ship
				if (intersects[index].object.name != 'ship') {
					// Show the tooltip
					document.getElementById('toolTip').style.display = 'block';

					// set a new color for closest object
					var colour = {};
					INTERSECTED.material.color.getHSL(colour);

					var brighteningFactor = 2;

					if (!intersectedObject.keepColour) {
						colour.l = 1 - (1 - colour.l) / brighteningFactor;
					}

					INTERSECTED.material.color.setHSL(
						colour.h,
						colour.s,
						colour.l,
					);
				}
			}
		}
	} // there are no intersections
	else {
		// restore previous intersection object (if it exists) to its original color
		if (INTERSECTED) {
			INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
		}

		// Ensure that it has to be de-selected twice for it to disappear
		if (
			document.getElementById('toolTip').style.display == 'inline' ||
			document.getElementById('toolTip').style.display == 'none'
		) {
			document.getElementById('toolTip').style.display = 'none';
		} else {
			document.getElementById('toolTip').style.display = 'inline';
		}

		// remove previous intersection object reference
		//     by setting current intersection object to "nothing"
		INTERSECTED = null;
		intersectedObject = null;
	}

	// Don't update the controls if running the Nauvoo launch
	if (!(!nauvooLaunched && launchTimer)) {
		controls.update();
	}
}

function updateTooltipText() {
	// Update the text of the main tooltip
	// As long as there is a valid intersected object - that isn't the ship
	if (
		intersectedObject &&
		intersectedObject.name &&
		intersectedObject.name != 'ship'
	) {
		// Set display and content of tooltip
		var printer = '';

		// If it's one of the expanse logos (and it's running the Expanse)
		if (expanseShow && intersectedObject.logo) {
			// Display the name, logo and owner/administrator
			printer =
				"<div style='font-size: 1.7em;'>" +
				intersectedObject.name +
				'</div><br>';
			printer +=
				"<img src = 'assets/logos/" +
				intersectedObject.logo +
				".png' style = 'max-width:200px;max-height:200px'><br><br>";
			printer +=
				"<div style='font-size: 1.2em;'>" +
				intersectedObject.company +
				'</div>';
		} else {
			// Set the current name
			var name = intersectedObject.name;
			if (planets[name] || name == 'Sol') {
				// If it's a planet (or the Sun)

				// Set the initial colour (for the sun)
				var colour = '#ffff99';
				var smallHeadingColour = '#ffffcc';
				if (name != 'Sol') {
					// If it's an actual planet

					// Get the orbit to get the main colour
					var orbitMesh = planets[name].orbitMesh;
					if (orbitMesh.children[0]) {
						orbitMesh = orbitMesh.children[0];
					}

					// Get the colour of the orbit and map it to a main colour
					var threeColour = orbitMesh.material.color;
					colour = threeColourToRGB(threeColour);

					// Lighten the colour for the sub-headings
					var hsl = {};
					threeColour.getHSL(hsl);
					var brighteningFactor = 2;
					hsl.l = 1 - (1 - hsl.l) / brighteningFactor;

					// Set the new colour
					var smallThreeColour = new THREE.Color();
					smallThreeColour.setHSL(hsl.h, hsl.s, hsl.l);

					// Map this new colour to the sub-headings
					smallHeadingColour = threeColourToRGB(smallThreeColour);
				}

				// Create the style insert for each sub-heading
				var styleInsert = "class = 'toolTipHeader'";
				styleInsert = "style='color: " + smallHeadingColour + "'";

				// Start it off with the name of the astronomical body in question
				printer =
					"<div style='font-size: 1.5em; color: " +
					colour +
					";'>" +
					name +
					"</div><br><br><div style='font-size: 1.2em;'>";

				// Set the name to the sun, as it's called Sol
				if (name == 'Sol') {
					name = 'sun';
				}

				// As long as it's not the sun (that's handled separately)
				if (name != 'sun') {
					// Set the center
					var center = planets[name]['center'];

					// LIVE STATS

					// Find the main position
					var mainPosition = currentPositions[name];

					// Find the distance from the central body
					var distance = magnitude(
						subVec(mainPosition, currentPositions[center]),
					);

					// Set the title
					printer +=
						'<span ' +
						styleInsert +
						'>Distance from ' +
						center +
						'</span><br> ';

					// Display the distance - and if it's to small, display it in kilometers
					if (distance < 0.001) {
						printer +=
							round(distance * convertDistance('AU', 'KM'), 4) +
							' KM<br>';
					} else {
						printer += round(distance, 4) + ' AU<br>';
					}

					// Find the velocity
					var velocity =
						magnitude(findVelocity(name, currentTime)) *
						convertSpeed('AU/Y', 'KM/S');

					// Display the current velocity
					printer +=
						'<span ' +
						styleInsert +
						'>Current Velocity</span><br>' +
						round(velocity, 4) +
						' KM/S<br>';

					// Calculate and display the solar irradiance  of the selected planet
					printer +=
						'<span ' +
						styleInsert +
						'>Solar irradiance</span><br> ' +
						round(1367 / Math.pow(magnitude(mainPosition), 2), 2) +
						' W/m<sup>2</sup><br>';

					// SMALL BREAK FOR SPACING
					printer += '<br>';

					// NON-LIVE STATS

					// Display the semi-major axis
					if (center != 'sun') {
						// Put it in KM if it's a moon - it's too small otherwise
						printer +=
							'<span ' +
							styleInsert +
							'>Semi-major axis</span><br>' +
							round(
								planets[name]['a'] *
									convertDistance('AU', 'KM'),
								4,
							) +
							' KM<br>';
					} else {
						// Put it in AU if it's a planet
						printer +=
							'<span ' +
							styleInsert +
							'>Semi-major axis</span><br>' +
							round(planets[name]['a'], 4) +
							' AU<br>';
					}

					// If it has a radius that's actually useful, display that
					if (planets[name]['r'] && !planets[name]['satellite']) {
						// Create an insert
						var insert = '';
						if (planets[name].mapClass) {
							if (planets[name].mapClass.model) {
								// If it's a model - add a caveat that says effective radius, because it's not spherical
								insert = ' [effective]';
							}
						}
						// Display the radius
						printer +=
							'<span ' +
							styleInsert +
							'>Radius' +
							insert +
							'<br></span>' +
							round(
								planets[name]['r'] *
									convertDistance('AU', 'KM'),
								0,
							) +
							' KM<br>';
					}

					// If it has an effective mass and isn't a satellite, display the surface (or "surface" for gas giants) gravity
					if (
						planets[name]['gravParam'] &&
						!planets[name]['satellite']
					) {
						// Calculate and display surface gravity
						printer +=
							'<span ' +
							styleInsert +
							'>Surface gravity</span><br>' +
							round(
								findGravParam(name) /
									Math.pow(
										planets[name]['r'] *
											convertDistance('AU', 'M'),
										2,
									) /
									9.81,
								2,
							) +
							' g<br>';
					}
				} else {
					// Display the scripted sun ones
					printer +=
						'<span ' +
						styleInsert +
						'>Mass<br></span> 1.989 x 10<sup>30</sup> kg<br>';
					printer +=
						'<span ' +
						styleInsert +
						'>Surface Temperature<br></span> 5778 K<br>';

					printer +=
						'<span ' +
						styleInsert +
						'>Radius<br></span> 695508 km<br>';
					printer +=
						'<span ' +
						styleInsert +
						'>Age<br></span> 4.5 billion years<br>';
				}

				// Close off the div
				printer += '</div>';
			} else {
				// Not in the planets array
				var name = intersectedObject.name;
				printer = "<div style='font-size: 1.5em;'>" + name + '</div>';

				// If it's a star, display the lightyear distance
				if (stars[name]) {
					printer += "<br><br><div style='font-size: 1.2em;'>";
					printer +=
						'Distance: ' + stars[name]['distance'] + ' light years';
				}
			}
		}
		// Set the content to the printer variable
		document.getElementById('toolTipContent').innerHTML = printer;
	}
}

function updateTooltip() {
	// Update the graphics of the tooltip to move correctly

	// Get the positional data and initialise the position variable
	var data = toScreenPosition(intersectedObject, camera);
	if (stereoDisp) {
		data = toScreenPosition(intersectedObject, cameraLeft);
		data.x = data.x / 2;
	}
	var position = {};

	// Set the position
	position.x = Number(round(data.x, 0));
	position.y = Number(round(data.y, 0));

	// If it needs to track with the mouse, set the position to the mouse
	if (intersectedObject.trackMouse) {
		position.x = Number(round(mouse.x, 0));
		position.y = Number(round(mouse.y, 0));
		if (stereoDisp) {
			position.x = Number(round(position.x / 2, 0));
		}
	}

	// If there's an intersected object that isn't the ship, update the main tooltip
	if (
		intersectedObject &&
		intersectedObject.name &&
		intersectedObject.name != 'ship'
	) {
		moveTooltip(position, 'toolTip');
		updateTooltipGraphics(position, 'toolTip');
	}
}

function updateTooltipGraphics(position, id) {
	// Update the graphics of the specified tooltip

	// Set the height of the tooltip
	var toolHeight = document.getElementById(id + 'Content').clientHeight;
	var tooltipLineFlat = Math.pow(
		document.getElementById(id + 'Content').clientHeight * 10,
		0.5,
	);

	if (toolHeight < 200 && intersectedObject) {
		// If the image hasn't loaded yet, just format it like it has already
		if (expanseShow && intersectedObject.logo) {
			toolHeight = toolHeight + 200;
		}
	}

	// Add line for sci-fi coolness :)
	var canvasWidth =
		tooltipLineFlat +
		toolHeight * Math.tan(DtoR(tooltipLineAngle)) +
		toolTipCanvasMargin;
	var canvasHeight = toolHeight + toolTipCanvasMargin * 2;

	// Create variables that will be modified - it might be drawing on the left or the right side of the main image
	var c;
	var valueModifier;
	var subtractor;

	// Decide whether to use the left or right canvas
	var leftCanvas;
	if (
		position.x < window.innerWidth / 2 - toolTipMargin ||
		(document.getElementById(id).style.left != '' &&
			position.x < window.innerWidth / 2 + toolTipMargin)
	) {
		// Mouse in left half of screen  (or over the sun - to keep consistent)
		document.getElementById(id + 'CanvasLeft').width = canvasWidth;
		document.getElementById(id + 'CanvasLeft').height = canvasHeight;

		document.getElementById(id + 'CanvasRight').width = 0;
		document.getElementById(id + 'CanvasRight').height = 0;

		c = document.getElementById(id + 'CanvasLeft');

		valueModifier = 1;
		subtractor = 0;
		leftCanvas = true;
	} else {
		// Mouse in right half of screen

		document.getElementById(id + 'CanvasLeft').width = 0;
		document.getElementById(id + 'CanvasLeft').height = 0;

		document.getElementById(id + 'CanvasRight').width = canvasWidth;
		document.getElementById(id + 'CanvasRight').height = canvasHeight;

		c = document.getElementById(id + 'CanvasRight');

		valueModifier = -1;
		subtractor = canvasWidth;
		leftCanvas = false;
	}

	// Modify the final height depending on which vertical side it's on
	var finalHeight;
	var bottomCanvas;
	if (
		position.y > window.innerHeight / 2 - toolTipMargin ||
		(document.getElementById(id).style.bottom != '' &&
			position.y > window.innerHeight / 2 + toolTipMargin)
	) {
		// In bottom half of screen (or over the sun - to keep consistent)
		finalHeight = toolHeight;
		bottomCanvas = true;
	} else {
		// In top half of screen
		finalHeight = 0;
		bottomCanvas = false;
	}

	// Establish canvas
	var ctx = c.getContext('2d');

	// This next part gets complex. Clarifying what's happening
	// The subtractor is which bit it subtracts from. This basically chooses which side it's on
	// The value modifier determines which way it goes - left or right
	// The canvas margin adds a buffer so that the canvas draws past the mouse - this stops it from looking truncated
	// Basically, everything takes this format: subtractor + valueModifier * (how it should be drawn on the left panel)

	var flatY = toolTipCanvasMargin + toolHeight / 2;
	var flatTooltipX =
		toolTipCanvasMargin +
		tooltipLineFlat +
		toolHeight * Math.tan(DtoR(tooltipLineAngle));
	var flatBendX =
		toolTipCanvasMargin +
		(toolHeight / 2) * Math.tan(DtoR(tooltipLineAngle));

	// Figure out where everything needs to go
	var radius = 10;
	var circleX =
		flatBendX +
		(radius * Math.cos(DtoR(tooltipLineAngle)) +
			radius *
				Math.tan(DtoR(tooltipLineAngle)) *
				(1 - Math.sin(DtoR(tooltipLineAngle))));
	var circleY = flatY;
	var startAngle;
	var endAngle;
	if (bottomCanvas) {
		circleY = circleY + radius;
		startAngle = 270;
		endAngle = valueModifier * (90 + tooltipLineAngle) + 90;
	} else {
		circleY = circleY - radius;
		startAngle = 90;
		endAngle = valueModifier * (90 - tooltipLineAngle) + 90;
	}

	// Create the first parts of the line
	ctx.moveTo(subtractor + valueModifier * flatTooltipX, flatY);
	ctx.lineTo(subtractor + valueModifier * circleX, flatY);

	// Create an arc to smooth the sharp bend
	ctx.arc(
		subtractor + valueModifier * circleX,
		circleY,
		radius,
		DtoR(startAngle),
		DtoR(endAngle),
		(leftCanvas && bottomCanvas) || (!leftCanvas && !bottomCanvas),
	);

	// Create the angled part of the line
	ctx.lineTo(
		subtractor + valueModifier * (0 + toolTipCanvasMargin),
		toolTipCanvasMargin + finalHeight,
	);

	// Set parameters of the line and draw
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = '#cccccc';
	ctx.lineCap = 'round';
	ctx.stroke();

	// Draw a circle around the mosue pointer
	ctx.beginPath();
	ctx.fillStyle = '#cccccc';
	var endRadius = 4;
	ctx.arc(
		subtractor + valueModifier * (0 + toolTipCanvasMargin),
		toolTipCanvasMargin + finalHeight,
		endRadius,
		0,
		2 * Math.PI,
	);
	ctx.fill();
}

function updateShipTooltipText() {
	// Update the text of the ship tooltip

	// Get colour of main heading from the orbit colour
	var orbitMesh = planets['ship'].orbitMesh;
	if (!orbitMesh) {
		orbitMesh = EpsteinLine;
	} else if (orbitMesh.children[0]) {
		orbitMesh = orbitMesh.children[0];
	}

	// Set the main heading colour
	var threeColour = orbitMesh.material.color;
	var colour = threeColourToRGB(threeColour);

	// Brighten the colour of the main heading
	var hsl = {};
	threeColour.getHSL(hsl);
	var brighteningFactor = 1.4;
	hsl.l = 1 - (1 - hsl.l) / brighteningFactor;

	// Set the sub-heading colour
	var smallThreeColour = new THREE.Color();
	smallThreeColour.setHSL(hsl.h, hsl.s, hsl.l);
	var smallHeadingColour = threeColourToRGB(smallThreeColour);

	// Determine the style insert
	var styleInsert = "class = 'toolTipHeader'";
	styleInsert = "style='color: " + smallHeadingColour + "'";

	// Set the heading of the ship tooltip
	var printer =
		"<div style='font-size: 1.1em; color: " +
		colour +
		";'>Ship</div><br><div style='font-size: 0.9em;'>";

	// Set the center
	var center = planets['ship']['center'];

	// Display the velocity of the ship
	var velocity = 0;
	if (shipEndTime) {
		// If it's ballistic, use the existing function
		velocity =
			magnitude(findVelocity('ship', currentTime)) *
			convertSpeed('AU/Y', 'KM/S');
	} else if (ISEndTime) {
		// If it's interstellar, just use the computation functions
		// Collect data
		var a = ISTransferData['data']['accel'];
		var c = 299792458;
		var t =
			(currentTime.getTime() - ISStartTime.getTime()) *
			convertTime('MS', 'S');

		if (t > ISTransferData['data']['accelTime']) {
			// Move to coast mode if it is past accelerating
			t = ISTransferData['data']['accelTime'];
		}
		velocity = calculateISVelocity(a, t, c) * convertSpeed('M/S', 'KM/S');
	} else if (EpsteinEndTime) {
		// If it's Epstein, find where it is a short while afterwards, and then use distance/time

		var timeMargin = 3;
		var newTime = new Date(currentTime.getTime() + timeMargin);

		var firstPos = calculateEpsteinPosition(
			currentTime,
			EpsteinTransitData,
		);
		var secondPos = calculateEpsteinPosition(newTime, EpsteinTransitData);

		var velocity =
			(magnitude(subVec(secondPos, firstPos)) *
				convertDistance('AU', 'KM')) /
			(timeMargin * convertTime('MS', 'S'));
	}

	// Display the velocity
	printer +=
		'<span ' +
		styleInsert +
		'>Current Velocity</span><br>' +
		round(velocity, 4) +
		' KM/S<br>';
	if (ISEndTime) {
		// If it's interstellar, display the cee-fractional velocity
		printer +=
			round(velocity * convertSpeed('KM/S', 'C') * 100, 4) + ' % C <br>';
	}

	// Find the remaining time
	var timeInsert = '';
	var remainingTime;

	// Determine the remaining time (they're all just subtractions)
	if (shipEndTime) {
		remainingTime = shipEndTime.getTime() - currentTime.getTime();
	} else if (ISEndTime) {
		remainingTime = ISEndTime.getTime() - currentTime.getTime();
		timeInsert = ' (to heliopause)';
	} else if (EpsteinEndTime) {
		remainingTime = EpsteinEndTime.getTime() - currentTime.getTime();
	}

	// Sort appropriate units
	var units;
	if (remainingTime * convertTime('MS', 'Y') > 2) {
		units = 'years';
		remainingTime = remainingTime * convertTime('MS', 'Y');
	} else if (remainingTime * convertTime('MS', 'Mo') > 2) {
		units = 'months';
		remainingTime = remainingTime * convertTime('MS', 'Mo');
	} else if (remainingTime * convertTime('MS', 'D') > 2) {
		units = 'days';
		remainingTime = remainingTime * convertTime('MS', 'D');
	} else {
		units = 'hours';
		remainingTime = remainingTime * convertTime('MS', 'H');
	}

	// Display the remaining tme
	printer +=
		'<span ' +
		styleInsert +
		'>Remaining time' +
		timeInsert +
		'</span><br>' +
		round(remainingTime, 1) +
		' ' +
		units +
		'<br>';

	// Close off the div
	printer += '</div>';

	// Push the printer variable to the ship tooltip
	document.getElementById('shipToolTipContent').innerHTML = printer;
}

function updateShipTooltip() {
	// Update the position and graphics of the ship tooltip

	// Get the screen position and initialise the position variable
	var data = toScreenPosition(planets['ship'].surfaceMesh, camera);
	if (stereoDisp) {
		data = toScreenPosition(planets['ship'].surfaceMesh, cameraLeft);
		data.x = data.x / 2;
	}
	var position = {};

	// Set the position
	position.x = Number(round(data.x, 0));
	position.y = Number(round(data.y, 0));

	// Move the ship tooltip and update the position of the tooltip graphics
	moveTooltip(position, 'shipToolTip');
	updateTooltipGraphics(position, 'shipToolTip');
}

function toScreenPosition(obj, camera) {
	// Determine the position onscreen of the center of an object - NOTE: Imported and modded code
	// Any comments that begin with a lowercase ARE NOT MINE

	var vector = new THREE.Vector3();

	var widthHalf = 0.5 * WIDTH;
	var heightHalf = 0.5 * HEIGHT;

	obj.updateMatrixWorld();
	vector.setFromMatrixPosition(obj.matrixWorld);
	vector.project(camera);

	vector.x = vector.x * widthHalf + widthHalf;
	vector.y = -(vector.y * heightHalf) + heightHalf;

	return {
		x: vector.x,
		y: vector.y,
	};
}

// SIMULATION RUNNING FUNCTIONS

// Updating Functions

function updateSim() {
	if (!runningTour) {
		// Update all the tooltips
		updateAllTooltips();

		// Update main time
		addTime();
		updateDisplayTime();

		// Check how fast the simulation is running, and moderate to keep speed constant
		//checkTimeRatio();

		// Move planets, moons and orbit paths
		updateAllPlanets();
		updatePlanetRings();
		recenterOrbits();
		if (!lowRes && orbitOpacity) {
			manageOrbitOpacities();
		}

		// Hide the sun lens flare to prevent double showing
		manageSunFlare();

		// Update the ships
		updateAllShips();

		// Show Earth specially if doing an interstellar transfer
		if (ISEndTime) {
			if (cameraMode == 'shipCenter') {
				planets['earth'].surfaceMesh.visible = true;
				loadSurface('earth');
			}
		}

		// Manage the three different camera modes
		if (cameraMode == 'orbital') {
			// Check all functions above this, and camera function there
			// Check camera function all through change center

			moveCameraChase();
			controlSOIOrbitDisplay();
			manageCameraNear();
			lastPosition = currentPositions[centeredObject];
		} else if (cameraMode == 'ship') {
			// Update for ship view mode

			controlShipViewTarget();
			hideShipsAfterTrans();
		} else if (cameraMode == 'shipCenter') {
			// This is basically orbital, but centered on the ship because the ship is special

			manageShipCenter();
		}

		// Manage the ship's orbit and mesh display
		if (
			(cameraMode == 'orbital' || cameraMode == 'shipCenter') &&
			planets['ship']
		) {
			if (planets['ship'].surfaceMesh) {
				manageShipNear();
			}
		}

		// Update the delays
		manageTimedDelays();

		// Check what it should do with stuff from The Expanse
		manageExpanse();

		// Manage all lens flare sizes
		managePlanetSunFlares();

		if (!nauvooLaunched && launchTimer) {
			updateNauvoo();
		}

		// Update the cameras and loading screens if in stereo display
		if (stereoDisp) {
			moveSecondary3DCameras();
			updateLoadingScreens();
		}

		// Update the spotlight cameras
		updateSpotLight();

		if (nightEarth) {
			// If the night side of Earth rendered, manage its display
			manageEarthNight();
		}

		if (webVR) {
			updateSystemPosition();
		}
	}
}

// UI Updates

function updateDisplayTime() {
	// Update the time display
	var year = displayTime.getFullYear();
	var month = displayTime.getMonth() + 1;
	var day = displayTime.getDate();
	var hours = displayTime.getHours();
	if (hours < 10) {
		hours = '0' + hours;
	}
	var minutes = displayTime.getMinutes();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}

	// Display the current time
	var clockTime;
	if (timeIncrement > convertTime('D', 'S')) {
		// If it's moving faster than 1 day/sec, just show the date
		clockTime = day + ' / ' + month + ' / ' + year;
	} else {
		clockTime =
			hours + ' : ' + minutes + '  ' + day + ' / ' + month + ' / ' + year;
	}

	// Push the time display to the clock
	document.getElementById('timeDisplay').innerHTML = clockTime;
}

function updateLoadingScreens() {
	// This keeps the auxiallary screens mirrored to the primaries
	document.getElementById('bootScreenAux').style.display =
		document.getElementById('bootScreen').style.display;
	document.getElementById('smallLoadingScreenAux').style.display =
		document.getElementById('smallLoadingScreen').style.display;
	document.getElementById('captionAux').style.display =
		document.getElementById('caption').style.display;

	document.getElementById('captionAux').innerHTML =
		document.getElementById('caption').innerHTML;
}

function updateAllTooltips() {
	// Update all the tooltips

	findTooltip();

	// Update the text of the tooltip
	if (intersectedObject) {
		if (intersectedObject.name && intersectedObject.name != 'ship') {
			updateTooltipText();
			updateTooltip();
		}
	}

	// Manage the ship's tooltip
	// Update the ship tooltip if a ship is going

	if (
		(cameraMode == 'orbital' || cameraMode == 'shipCenter') &&
		planets['ship']
	) {
		// Depending on the flag, show or hide the ship tooltip
		if (showingShipTooltip) {
			// All distances kept in ThreeJS terms because it's all about the angles
			// Find initial vectors
			var cam = multiplyVec(
				1 / totalScale,
				reverseThreeVector(camera.position),
			);
			var tar = multiplyVec(
				1 / totalScale,
				reverseThreeVector(controls.target),
			);
			var cen = addVec(
				lastShipLocation,
				currentPositions[planets['ship'].center],
			);

			// Find side magnitudes
			var a = magnitude(subVec(cam, tar));
			var b = magnitude(subVec(tar, cen));
			var c = magnitude(subVec(cam, cen));

			// Find angle
			var angle = Math.acos(
				(Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) /
					(2 * a * b),
			);

			if (angle >= Math.PI / 2 || a >= b) {
				// If the camera is not looking at the ship, hide the tooltip
				document.getElementById('shipToolTip').style.display = 'block';
			} else {
				document.getElementById('shipToolTip').style.display = 'none';
			}
		} else {
			document.getElementById('shipToolTip').style.display = 'none';
		}

		updateShipTooltip();
		updateShipTooltipText();
	} else {
		// Hide the ship tooltip if there is no ship
		document.getElementById('shipToolTip').style.display = 'none';
	}
}

// Three.js Graphics Updates - These are essential for the basic camera movement

function moveSecondary3DCameras() {
	// Move and align the 3D cameras

	// Find normal state vectors
	var camVec = reverseThreeVector(camera.position); // Sun -> Primary Camera
	var bodyCamVec = subVec(
		multiplyVec(totalScale, currentPositions[centeredObject]),
		camVec,
	); // Chosen body -> Primary Camera

	// Find and moderate the size of the planet
	var centralSize = Math.pow(
		planets['earth']['r'] / planets[centeredObject]['r'],
		0.01,
	);

	if (cameraMode == 'shipCenter') {
		// If it's the ship, moderate it instead
		centralSize =
			(planets['earth']['r'] / planets['ship']['surfaceMesh'].scale.x) *
			Math.pow(10, -40);
	}

	// Set the camera separation
	cameraSep = (magnitude(bodyCamVec) / totalScale / 100) * centralSize;
	// Camera scales linearly to ensure that everything is correctly visible - moderated by central object size to convey scale
	// Bigger separation means it looks smaller

	// Calculate the "armature" vector the camera is on next to the main camera
	var armVec = [1 / bodyCamVec[0], -1 / bodyCamVec[1], 0]; // Ignoring Z direction due to orbit controls; Camera -> Right Camera
	armVec = setMagnitude(armVec, (cameraSep * totalScale) / 2); // Set the magnitude of the "armature" the cameras extend on
	if (bodyCamVec[0] * bodyCamVec[1] < 0) {
		// In quadrant 2 or 4, flip the direction to keep it consistent, as the maths reverses in those quadrants
		armVec = multiplyVec(-1, armVec);
	}
	if (isNaN(armVec[0])) {
		armVec = [(cameraSep * totalScale) / 2, 0, 0];
	}

	// Set the camera positions correctly
	cameraRight.position.copy(threeVector(addVec(camVec, armVec)));
	armVec = multiplyVec(-1, armVec); // Flip the armature for the other camera
	cameraLeft.position.copy(threeVector(addVec(camVec, armVec)));

	// Set the secondary camera orientation to match the primary
	cameraLeft.quaternion.copy(camera.quaternion);
	cameraRight.quaternion.copy(camera.quaternion);
}

function updateSpotLight() {
	// Update the position and angle of the spotlight

	// Find where the spotLight should point, and set the target
	var lineVector = reverseThreeVector(
		planets[centeredPlanet]['markerMesh'].position,
	);
	spotLight.target = planets[centeredPlanet]['markerMesh'];

	// If it is a ship and around the sun, point it at the ship
	if (cameraMode == 'shipCenter' && planets['ship']['center'] == 'sun') {
		lineVector = reverseThreeVector(
			planets['ship']['surfaceMesh'].position,
		);
		spotLight.target = planets['ship']['surfaceMesh'];
	}

	// If it's at the sun set it to point straight up
	if (magnitude(lineVector) == 0) {
		lineVector = [0, 0, 1];
	}

	// Determine the position of the spotlight and the shadow camera
	var bufferValue = 1.1;
	var distanceValue = planets[centeredPlanet].r * 2 * bufferValue;
	if (planets[centeredPlanet].moons) {
		var moonsList = Object.keys(planets[centeredPlanet].moons);
		var furthestMoon = moonsList[moonsList.length - 1];
		distanceValue = bufferValue * planets[furthestMoon].a;
	}

	if (cameraMode == 'shipCenter' && planets['ship']['center'] == 'sun') {
		// 2209 determined by program. Use the object size function to update
		distanceValue =
			(2209.789810047425 * shipSurfaceMesh.scale.z * bufferValue) /
			totalScale;
	}

	distanceValue = distanceValue * totalScale * 10;

	var cameraVecMag = magnitude(lineVector) - 2 * distanceValue;
	var lightVec = setMagnitude(lineVector, cameraVecMag);
	spotLight.position.copy(threeVector([0, 0, 0]));
	spotLight.shadow.camera.position.copy(threeVector(lightVec));

	spotLight.shadow.camera.near = scene.scale.x * distanceValue;
	spotLight.shadow.camera.far = 2 * magnitude(lightVec);

	// Resize the shadow camera
	var size = bufferValue * planets[centeredPlanet]['r'] * totalScale;
	if (cameraMode == 'shipCenter' && planets['ship']['center'] == 'sun') {
		size = 1000 * shipSurfaceMesh.scale.z * bufferValue;
	}
	spotLight.shadow.camera.right = size;
	spotLight.shadow.camera.top = size;
	spotLight.shadow.camera.bottom = -size;
	spotLight.shadow.camera.left = -size;
	spotLight.shadow.camera.updateProjectionMatrix();

	if (cameraMode == 'shipCenter' && planets['ship']['center'] == 'sun') {
		spotLight.shadow.camera.lookAt(
			planets['ship']['surfaceMesh'].position.x,
			planets['ship']['surfaceMesh'].position.y,
			planets['ship']['surfaceMesh'].position.z,
		);
	} else if (planets[centeredPlanet]['surfaceMesh']) {
		spotLight.shadow.camera.lookAt(
			planets[centeredPlanet]['surfaceMesh'].position.x,
			planets[centeredPlanet]['surfaceMesh'].position.y,
			planets[centeredPlanet]['surfaceMesh'].position.z,
		);
	}

	// Determine and set the angle of the spotlight
	var spotAngle = Math.PI * 2 - 1;
	spotLight.angle = spotAngle;
}

function manageCameraNear() {
	// Control near part of the camera to get as close as possible while preventing the sun from displaying twice due to glitch

	// Find camera position and distance
	var cam = reverseThreeVector(camera.position);
	var totalDist = magnitude(cam);

	// Potentially multiply if a model is scaled
	if (planets[centeredObject] && centeredObject) {
		// Potentially modify the radius of the planet in case of an irregularly shaped model
		var mod = 1.1;
		if (planets[centeredObject]['modelScale']) {
			mod = planets[centeredObject]['modelScale'];
		}

		// Set the controls so the user cannot clip inside the model
		controls.minDistance =
			scene.scale.x * (planets[centeredObject]['r'] * mod) * totalScale +
			camera.near;
	}
}

function moveCameraChase() {
	// Find the difference between where the central planet was and where it will be
	var differenceVector = multiplyVec(
		totalScale,
		subVec(currentPositions[centeredObject], lastPosition),
	);

	// Move the camera the same amount
	camera.position.add(threeVector(differenceVector));

	// Change controls center to selected object
	controls.target.copy(
		threeVector(multiplyVec(totalScale, currentPositions[centeredObject])),
	);
	if (!(!nauvooLaunched && launchTimer)) {
		controls.update();
	}
}

// Internal Program Updating Functions

// function checkTimeRatio() {
// 	// This system outputs the ratio of actual time to simulation "time"
// 	// It also acts to keep the system running at a constant rate regardless of computional power

// 	// If it should check the time
// 	if (checkTimeRemaining <= 0 && calculatingTransfer == false) {
// 		// Establish time differences and ratio
// 		var now = new Date();
// 		var timeDiff = now.getTime() - checkTime.getTime();
// 		checkTime = now;
// 		checkTimeRemaining = checkTimeSection;
// 		var timeRatio = timeDiff / checkTimeSection;

// 		// Regulate the time ratio to prevent excess
// 		if (timeRatio > 10) {
// 			timeRatio = 10;
// 		}

// 		// Take the geometric mean of the time ratios
// 		var logTimeRatio = Math.log10(timeRatio);
// 		var logLastTimeRatio = Math.log10(lastTimeRatio);
// 		var avgLog = (logTimeRatio + logLastTimeRatio) / 2;

// 		// Keep the time ratio as the geometric mean of the current and last time ratios
// 		var effectiveTimeRatio = Math.pow(10, avgLog);

// 		// If it has reached the scheduled interval, log the time ratio
// 		if (logTracker <= 0) {
// 			if (timeRatioLog) {
// 				console.log('Time Ratio: ' + round(effectiveTimeRatio, 5));
// 			}
// 			logTracker = logInterval;
// 		} else {
// 			logTracker -= checkTimeSection * effectiveTimeRatio;
// 		}

// 		// Adjust the rate at which time passes for the simulation to keep everything running at the correct speed
// 		timeRate = apparentTimeRate * effectiveTimeRatio;
// 		timeIncrement = timeRate * (1000 / timeScale);

// 		lastTimeRatio = timeRatio;
// 	} else {
// 		// Move it closer to the next time check
// 		checkTimeRemaining -= 1000 / timeScale;
// 	}
// }

function addTime() {
	// Add time to system

	// Move time forward
	currentTime = new Date(currentTime.getTime() + timeIncrement);
	displayTime = new Date(currentTime.getTime() + timeDiff);

	// Rotate the sun
	if (planets['sun']) {
		planets['sun']['surfaceMesh'].rotation.x = 0;
		planets['sun']['surfaceMesh'].rotation.y = 0;
		if (!isNaN(planets['sun']['surfaceMesh'].rotation.z)) {
			planets['sun']['surfaceMesh'].rotation.z =
				(2 * Math.PI * (timeIncrement * convertTime('MS', 'D'))) / 24 +
				planets['sun']['surfaceMesh'].rotation.z;
		} else {
			planets['sun']['surfaceMesh'].rotation.z = Math.PI;
		}
	}
}

function manageTimedDelays() {
	// After a certain amount of time that's in sync with the time updates, update the lightlag and tooltip

	// Set the time until the light lag updates
	if (lightLagTimes <= 0) {
		//lightLagTimes = 100 * (10 * timeScale) / 1000;
		lightLagTimes = lightLagTimeInterval / timeScale;
		if (document.getElementById('transferType').value == 'lightLag') {
			calculateLightLag();
		}
	}
	lightLagTimes--;
}

// Ship Graphics Updates

function updateAllShips() {
	// Update the ship position if applicable

	if (shipEndTime != false) {
		// If ballistic transfer, use ballistic update function
		updateShipPath();
	}

	if (EpsteinEndTime != false) {
		// If Epstien transfer, use Epstien update function
		updateEpsteinPath();
	}

	if (ISEndTime != false) {
		// If interstellar transfer, use interstellar update function
		updateISTransfer();
	}
}

function manageShipCenter() {
	// Find the distance the ship has moved
	var differenceVector = multiplyVec(
		totalScale,
		subVec(currentShipPosition, lastPosition),
	);

	// Move the camera to keep up
	camera.position.add(threeVector(differenceVector));

	// Change controls center to object
	controls.target.copy(
		threeVector(multiplyVec(totalScale, currentShipPosition)),
	);
	if (!(!nauvooLaunched && launchTimer)) {
		controls.update();
	}
	lastPosition = currentShipPosition;
}

function manageShipNear() {
	// Manage what happens when you get near to the ship

	// Find initial vectors
	var cam = reverseThreeVector(camera.position);
	var totalDist = magnitude(cam);

	// Find scaling factors
	var factor = 1; // Experimentally determined to allow for standing off the longest dimension
	var shipScale = planets['ship'].surfaceMesh.scale.x;

	if (shipAxis.x != 0) {
		// This is done to not be influenced by the Lorentz contraction (do note that this is invalid the moment the shipAxis is [1,0,0])
		shipScale = planets['ship'].surfaceMesh.scale.y;
	}

	// Set the ship standoff distance
	var shipDist = shipScale * planets['ship'].surfaceMesh.size;

	// Set the controls minimum distance
	if (cameraMode == 'shipCenter') {
		controls.minDistance =
			scene.scale.x * shipDist * totalScale + camera.near;
	}

	// Find out what the camera distance is
	var cameraDist = magnitude(
		subVec(
			reverseThreeVector(camera.position),
			reverseThreeVector(planets['ship']['markerMesh'].position),
		),
	);

	// Do not allow for zooming in beneath the ship marker if in low res
	if (lowRes && cameraMode == 'shipCenter') {
		controls.minDistance =
			scene.scale.x *
				planets['ship'].markerMesh.scale.x *
				factor *
				totalScale +
			1;
	}

	// Control whether the ship marker is visible
	if (cameraDist < planets['ship'].markerMesh.scale.x * factor * totalScale) {
		planets['ship']['markerMesh'].visible = false;
	} else {
		if (!cameraMode == 'shipCenter' && !webVR) {
			planets['ship']['markerMesh'].visible = true;
		}
		if (realSystem) {
			planets['ship'].markerMesh.opacity = 0;
		} else {
			planets['ship'].markerMesh.opacity = 1;
		}
	}

	// Control whether the ship orbit mesh is shown
	if (
		cameraDist <
			planets['ship'].markerMesh.scale.x *
				factor *
				totalScale *
				(3 / 8) &&
		cameraMode == 'shipCenter'
	) {
		if (EpsteinEndTime != false) {
			if (!webVR) {
				EpsteinLine.visible = false;
				flipMarker.visible = false;
			}
		} else {
			if (planets['ship']['orbitMesh']) {
				planets['ship']['orbitMesh'].visible = false;
			}
		}
	} else if (
		cameraDist <
			planets['ship'].markerMesh.scale.x *
				factor *
				totalScale *
				(3 / 4) &&
		cameraMode == 'shipCenter' &&
		!lowRes
	) {
		// If in the middle, fade the orbit out

		var opacity =
			(cameraDist -
				planets['ship'].markerMesh.scale.x *
					factor *
					totalScale *
					(3 / 8)) /
			(planets['ship'].markerMesh.scale.x *
				factor *
				totalScale *
				(3 / 8));
		if (EpsteinEndTime != false) {
			EpsteinLine.material.opacity = opacity;
			flipMarker.material.opacity = 0.3 * opacity;
		} else {
			if (planets['ship']['orbitMesh']) {
				planets['ship']['orbitMesh'].traverse(function (node) {
					if (node.material) {
						if (ISEndTime) {
							node.material.opacity = opacity;
						} else {
							node.material.opacity =
								node.material.opacity * opacity;
						}
					}
				});
			}
		}

		if (EpsteinEndTime != false && !webVR) {
			EpsteinLine.visible = !realSystem;
			flipMarker.visible = !realSystem;
		} else {
			if (
				planets['ship']['orbitMesh'] &&
				(ISEndTime != false || shipEndTime != false) &&
				!webVR
			) {
				planets['ship']['orbitMesh'].visible = !realSystem;
			}
		}
	} else {
		// Show the orbit mesh
		if (EpsteinEndTime != false && !webVR) {
			EpsteinLine.visible = !realSystem;
			flipMarker.visible = !realSystem;
			EpsteinLine.material.opacity = 1;
			flipMarker.material.opacity = 0.3 * 1;
		} else {
			if (
				planets['ship']['orbitMesh'] &&
				(ISEndTime != false || shipEndTime != false) &&
				!webVR
			) {
				planets['ship']['orbitMesh'].visible = !realSystem;
				planets['ship']['orbitMesh'].traverse(function (node) {
					if (node.material) {
						if (ISEndTime) {
							node.material.opacity = 1;
						} else {
							node.material.opacity = node.material.opacity * 1;
						}
					}
				});
			}
		}
	}
}

function hideShipsAfterTrans() {
	// Hide all ships once it's finished

	if (EpsteinEndTime) {
		// Hide the Epstien data
		EpsteinLine.visible = false;
		flipMarker.visible = false;
	}

	if (ISEndTime) {
		// Hide the IS transfer line
		planets['ship']['orbitMesh'].visible = false;
	}

	if (shipEndTime) {
		// Hide the actual orbit for ballistic transfers
		planets['ship']['orbitMesh'].visible = false;
	}

	// Hide the lens flare, marker and surface
	planets['ship']['lensFlare'].visible = false;
	planets['ship'].markerMesh.visible = false;
	planets['ship'].surfaceMesh.visible = false;
}

// WebVR Graphics Updates

function updateSystemPosition() {
	if (cameraMode == 'orbital' && centeredPlanet == 'sun') {
		defaultSystemPos = [0, 0, 0.75];
	} else {
		defaultSystemPos = [0, 0, 1.25];
	}

	var cameraCenter = multiplyVec(
		-1 * scene.scale.x,
		reverseThreeVector(controls.target),
	);

	var totalScenePosition = addVec(cameraZeroPos, defaultSystemPos);

	var finalScenePosition = addVec(cameraCenter, totalScenePosition);

	scene.position.copy(threeVector(finalScenePosition));
}

// Planetary Position and Rotation Updates

function updateAllPlanets() {
	// Rotate and move planets
	for (var name in planets) {
		// Start at 1 because the sun is at 0
		if (name != 'sun') {
			updatePlanet(name);
		}
	}
}

function updatePlanet(name) {
	// Move planet to correct position and rotation

	// Gather needed data
	var L = planets[name]['rL'];
	var center = planets[name]['center'];
	var centerCoords = currentPositions[center];

	// Only update planetary position if it needs to be
	var shipBool;
	if (
		name != 'ship' &&
		name != 'orbit1' &&
		name != 'orbit2' &&
		name != 'orbit'
	) {
		// This is to stop potentially invalid planets slipping in and throw new Error("Something bad happened.")ing errors
		shipBool = shouldUpdate(name);
	}

	if (shipBool) {
		// Find position relative to the center and to Sol
		var relCenterPos = findPlanetLocation(name, currentTime);
		var relSolPos = addVec(relCenterPos, centerCoords);

		// Update current positions
		currentPositions[name] = relSolPos;
		var position = threeVector(multiplyVec(totalScale, relSolPos));

		// Move all aspects to correct position
		if (planets[name]['surfaceMesh']) {
			planets[name]['surfaceMesh'].position.copy(position);
		}
		planets[name]['markerMesh'].position.copy(position);
		if (planets[name]['lensFlare']) {
			planets[name]['lensFlare'].position.copy(position);
		}
	}

	// Manage rotations
	if (planets[name]['rotation'] != null) {
		// Set rotation axis
		var axis = new THREE.Vector3(0, 1, 0).normalize();
		if (planets[name]['mapClass']['model']) {
			axis = new THREE.Vector3(0, 0, 1).normalize();
		}

		if (planets[name]['tidallyLocked']) {
			// Find positions
			var positionAtEpoch = [Math.cos(DtoR(L)), Math.sin(DtoR(L)), 0];
			var position = [
				currentPositions[name][0] - currentPositions[center][0],
				currentPositions[name][1] - currentPositions[center][1],
				0,
			];

			// Rotate the planet
			var rotation =
				DtoR(angleBetweenVectors(position, positionAtEpoch)) +
				planets[name]['rotEpoch'];
			if (axis.y != 0) {
				planets[name]['surfaceMesh'].rotation.set(
					planets[name]['surfaceMesh'].rotation.x,
					rotation,
					planets[name]['surfaceMesh'].rotation.z,
				);
			} else {
				planets[name]['surfaceMesh'].rotation.set(
					planets[name]['surfaceMesh'].rotation.x,
					planets[name]['surfaceMesh'].rotation.y,
					rotation,
				);
			}
		} else {
			// Find how much it needs it to rotate by
			var rotation =
				(2 * Math.PI * (timeIncrement * convertTime('MS', 'D'))) /
				planets[name]['rotation'];
			// Actually rotate the surface mesh
			planets[name]['surfaceMesh'].rotateOnAxis(axis, rotation);
		}
	}
}

function recenterOrbits() {
	// Recenter moon orbits when parent planet moves

	for (var planet in currentPositions) {
		// For each planet
		if (planet != 'sun' && planet != 'ship') {
			// Not the sun and the ship - they are special

			// Find the center and the center position
			var center = planets[planet]['center'];
			var centerCoords = currentPositions[center];

			// Move the orbit track to be centered correctly
			planets[planet]['orbitMesh'].position.copy(
				threeVector(multiplyVec(totalScale, centerCoords)),
			);
		}
	}
}

function updatePlanetRings() {
	// Move planet rings and atmospheres

	var atmoSpeed = 4 / 3; // Ratio of atmosphere speed to planet speed

	for (var planet in planets) {
		// Iterate through all the planets

		if (planets[planet]['ringMesh']) {
			// If there is a ring, keep it with the planet
			planets[planet]['ringMesh'].position.copy(
				threeVector(multiplyVec(totalScale, currentPositions[planet])),
			);
		}

		// Set the required axis
		var axis = new THREE.Vector3(0, 1, 0).normalize();

		// Derive the correct rotation increment
		var rotation =
			(2 * Math.PI * (timeIncrement * convertTime('MS', 'D'))) /
			planets[planet]['rotation'];

		if (planets[planet]['atmoMesh']) {
			// Keep atmosphere with planet and rotate correctly

			planets[planet]['atmoMesh'].position.copy(
				threeVector(multiplyVec(totalScale, currentPositions[planet])),
			);

			if (planets[planet]['axialTilt']) {
				// This ensures that it rotates correctly if the planet has an axal tilt

				planets[planet]['atmoMesh'].rotateOnAxis(
					axis,
					rotation * atmoSpeed,
				);
			}
		}

		if (planet == 'mars' && planets[planet]['atmoMesh']) {
			// Simulate Martian dust storms by varying opacity

			// Set the current opacity
			planets['mars']['atmoMesh'].material.opacity = marsOpacity;

			if (marsOpacityTicks <= 0) {
				// Once it reaches a target - select a new one
				//marsOpacityTarget = Math.random() * (marsOpacityUpper - marsOpacityLower) + marsOpacityLower;
				var marsOpacityArray = [];
				for (var value in marsOpacityValues) {
					marsOpacityValues[value] += marsOpacityPoints[value];
					for (
						var i = 0;
						i < Math.round(marsOpacityValues[value]);
						i++
					) {
						marsOpacityArray.push(value);
					}
				}
				marsOpacityTarget = Number(
					marsOpacityArray[
						Math.floor(Math.random() * marsOpacityArray.length)
					],
				);
				marsOpacityValues[marsOpacityTarget] = 0;
				marsOpacityTicks =
					Math.random() * 60 * convertTime('D', 'MS', 1);
				marsOpacityInterval = marsOpacityTicks;
				// Take between 0 and 60 days to change atmosphere to a randomly selected target inside the range
			}

			// Slowly change the opacity - updating long term variables
			marsOpacity +=
				(marsOpacityTarget - marsOpacity) /
				(marsOpacityInterval / timeIncrement);
			marsOpacityTicks -= timeIncrement;
		}
	}
}

// Graphics Updates

function manageOrbitOpacities() {
	// Manage the fading of the orbit lines
	for (var name in planets) {
		if (name != 'sun' && planets[name]['rL'] && planets[name].orbitMesh) {
			// As long as it is a real planet...
			if (planets[name].orbitMesh.visible) {
				// And the orbit is visible - save on calculations

				// Get the position of the planet relative to the central body
				var relPos;
				if (name == 'ship') {
					relPos = lastShipLocation;
				} else if (planets[name]['center'] != 'sun') {
					relPos = subVec(
						currentPositions[name],
						currentPositions[planets[name]['center']],
					);
				} else {
					relPos = currentPositions[name];
				}

				// Put the orbit opacities on the other side if time is negative
				var negativeComp = timeIncrement / Math.abs(timeIncrement);
				if (timeIncrement == 0) {
					negativeComp = 1;
				}

				// Find the non-inclined longitude (as that's how the program keeps track of it)
				var currentDegree = currentDegrees[name];

				var baseSpeed = 2 * Math.PI; // Speed of Earth in AU/year

				// If the center isn't the sun, use the speed of the middle moon as the base speed
				if (planets[name]['center'] != 'sun') {
					var innerName = Object.keys(
						planets[planets[name]['center']]['moons'],
					)[
						Math.floor(
							(Object.keys(
								planets[planets[name]['center']]['moons'],
							).length -
								1) /
								2,
						)
					];
					var innerPos = subVec(
						currentPositions[innerName],
						currentPositions[planets[name]['center']],
					);
					baseSpeed = Math.sqrt(
						M3S2toAU3Y2(
							findGravParam(planets[innerName]['center']),
						) *
							(2 / magnitude(innerPos) -
								1 / planets[innerName]['a']),
					);
				}

				// Calculate the number of degrees to lighten - proportional to the speed/base speed
				var degrees =
					rotationDegrees *
					Math.pow(
						Math.sqrt(
							M3S2toAU3Y2(
								findGravParam(planets[name]['center']),
							) *
								(2 / magnitude(relPos) -
									1 / planets[name]['a']),
						) / baseSpeed,
						1.25,
					);

				// Only rotate if the eccentricity is less than a defined value - prevents abberation due to eccentricty
				var rotationMode = planets[name]['e'] < orbitRotationLimit;

				// Manage the rotation of the planet for graphics - keeps the front of the opacity with the planet without increasing resolution
				if (rotationMode) {
					// Rotate it around the primary orbit axis (this stops abberation due to inclination)
					planets[name].orbitMesh.setRotationFromAxisAngle(
						threeVector(planets[name]['orbitalAxis']),
						DtoR(currentDegree % (1 / orbitOpacityRes)),
					);
				}

				for (var index in planets[name].orbitMesh.children) {
					// Iterate through each section of the orbit
					// Establish the current degree position
					var degree =
						index * (360 / planets[name].orbitMesh.children.length);
					if (rotationMode) {
						// This keeps it always behind for ease of rotation
						degree =
							degree +
							1 * (360 / planets[name].orbitMesh.children.length);
					} else {
						// This keeps it around the planet for a better look
						degree =
							degree +
							0.5 *
								(360 / planets[name].orbitMesh.children.length);
					}

					// Figure out what the shading value should be based on existing parameters
					var shadingValue = 0;
					if (
						(360 + (currentDegree - degree) * negativeComp) % 360 <
						degrees
					) {
						shadingValue =
							(degrees -
								((360 +
									(currentDegree - degree) * negativeComp) %
									360)) /
							degrees;
					}

					// If the value is invalid, set to zero
					if (shadingValue < 0) {
						shadingValue = 0;
					}

					// Moderate it so that shading 1->0 is an opacity of 1->base opacity
					var selectedOpacity =
						(1 - baseOrbitOpacity) * shadingValue +
						baseOrbitOpacity;

					// Set the opacity
					planets[name].orbitMesh.children[index].material.opacity =
						selectedOpacity;
				}
			}
		}
	}
}

function manageSunFlare() {
	// Hide the sunflare if the camera is on the other side. This prevents dual flares forming.

	// Find initial vectors
	var cam = multiplyVec(1 / totalScale, reverseThreeVector(camera.position));
	var tar = multiplyVec(1 / totalScale, reverseThreeVector(controls.target));

	// Don't show the flare if running in low res
	sunFlare.visible = !lowRes;

	if (centeredPlanet != 'sun' || cameraMode == 'shipCenter') {
		// All distances kept in ThreeJS terms because it's all about the angles
		var sun = currentPositions['sun'];

		// Find side magnitudes
		var a = magnitude(subVec(cam, tar));
		var b = magnitude(subVec(tar, sun));
		var c = magnitude(subVec(cam, sun));

		// Find angle between sides a and b - between the camera and the sun from the target
		var angle = Math.acos(
			(Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b),
		);

		if (angle > Math.PI / 2 || a >= b || webVR) {
			// If the camera is not looking at the sun, hide the flare
			sunFlare.visible = !lowRes;
		} else {
			sunFlare.visible = false;
		}
	}

	if (realSystem) {
		for (var name in planets) {
			if (name != 'sun' && name != centeredObject && shouldShow(name)) {
				// Find initial angles
				var cen = currentPositions[name];

				if (name == 'ship') {
					cen = currentShipPosition;
				}

				// Find side magnitudes
				var a = magnitude(subVec(cam, tar));
				var b = magnitude(subVec(tar, cen));
				var c = magnitude(subVec(cam, cen));

				// Find angle
				var angle = Math.acos(
					(Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) /
						(2 * a * b),
				);

				planets[name].lensFlare.visible = realSystem;

				if (angle >= Math.PI / 2 || a >= b) {
					// If the camera is not looking at the planet, hide the flare
					planets[name].lensFlare.visible = true;
				} else {
					planets[name].lensFlare.visible = false;
				}
			}
		}
	}
}

function manageEarthNight() {
	// Manage the night side of Earth

	// Get the actual Earth's position
	var earthPos = reverseThreeVector(planets['earth'].markerMesh.position);

	// Set how far it should be separated
	var sepDist = convertDistance('KM', 'AU') * 20 * totalScale;
	if (stereoDisp) {
		sepDist = convertDistance('KM', 'AU') * 20 * totalScale;
	}

	// Find out where to put the night Earth - on the opposide side of Earth from the sun
	var newEarthPos = setMagnitude(earthPos, magnitude(earthPos) + sepDist);
	nightEarth.position.copy(threeVector(newEarthPos));

	// Rotate it around its axis to match earth
	var axis = new THREE.Vector3(0, 1, 0).normalize();
	var rotation =
		(2 * Math.PI * (timeIncrement * convertTime('MS', 'D'))) /
		planets['earth']['rotation'];
	nightEarth.rotateOnAxis(axis, rotation);

	// Find the camera distances
	var cam = reverseThreeVector(camera.position);
	var target = multiplyVec(totalScale, currentPositions['earth']);
	var dist = magnitude(subVec(target, cam));

	// Hide the night side if you are a distance away - stop displaying if too far
	if (
		dist <
		camera.near * 2 + planets[centeredObject]['r'] * 7 * totalScale
	) {
		nightEarth.visible = true;
	} else {
		nightEarth.visible = false;
	}
}

function controlSOIOrbitDisplay() {
	// Control camera controls to hide planetary markers and orbit lines

	// Find the camera position
	var cam = reverseThreeVector(camera.position);

	if (webVR) {
		cam = subVec(
			reverseThreeVector(camera.position),
			multiplyVec(1 / scene.scale.x, reverseThreeVector(scene.position)),
		);
	}

	// If not looking at the sun or the ship - both are special and handled differently
	if (centeredObject != 'sun' && centeredObject != 'ship') {
		// Find the distance between the target (read as centered object) and the camera
		var target = multiplyVec(totalScale, currentPositions[centeredObject]);
		var dist = magnitude(subVec(target, cam));

		// Deal with scaled up models
		var multiplier = 1;
		if (planets[centeredPlanet]['modelScale']) {
			multiplier = planets[centeredObject]['modelScale'];
		}

		// Handle hiding orbit lines for the centered object
		if (
			dist < planets[centeredObject]['SOI'] * totalScale * (1 / 2) ||
			dist <
				camera.near * 2 +
					planets[centeredObject]['r'] * multiplier * 15 * totalScale
		) {
			// Hide the orbit line if it gets close
			planets[centeredObject]['orbitMesh'].visible = false;

			checkEasterEggs();
		} else if (
			dist < planets[centeredObject]['SOI'] * totalScale &&
			!lowRes
		) {
			// Fade it out as it approaches
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
			planets[centeredObject]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity =
						(node.material.opacity *
							(dist -
								(planets[centeredObject]['SOI'] * totalScale) /
									2)) /
						((planets[centeredObject]['SOI'] * totalScale) / 2);
				}
			});
		} else if (
			dist <
				camera.near * 2 +
					planets[centeredObject]['r'] *
						multiplier *
						30 *
						totalScale &&
			!lowRes
		) {
			// Show it if it's far away
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
			planets[centeredObject]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity =
						(node.material.opacity *
							(dist -
								camera.near * 2 -
								planets[centeredObject]['r'] *
									multiplier *
									15 *
									totalScale)) /
						(planets[centeredObject]['r'] *
							multiplier *
							15 *
							totalScale);
				}
			});
		} else {
			// Show the orbit line if it gets outside the boundary
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
		}

		// Find the planet's position
		var planet = multiplyVec(totalScale, currentPositions[centeredPlanet]);

		// Find the distance from the camera to the planet
		var planetDist = magnitude(subVec(planet, cam));

		// Deal with scaled up models
		multiplier = 1;
		if (planets[centeredPlanet]['modelScale']) {
			multiplier = planets[centeredPlanet]['modelScale'];
		}

		// Hide the orbit line if the camera is too close - for the central PLANET
		if (
			planetDist < planets[centeredPlanet]['SOI'] * totalScale ||
			planetDist <
				camera.near * 2 +
					planets[centeredPlanet]['r'] * multiplier * 15 * totalScale
		) {
			planets[centeredPlanet]['orbitMesh'].visible = false;
		} else if (
			planetDist < planets[centeredPlanet]['SOI'] * totalScale * 2 &&
			!lowRes
		) {
			// Fade it out as it approaches
			planets[centeredPlanet]['orbitMesh'].visible =
				!realSystem && !webVR;
			planets[centeredPlanet]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity =
						(node.material.opacity *
							(planetDist -
								planets[centeredPlanet]['SOI'] * totalScale)) /
						(planets[centeredPlanet]['SOI'] * totalScale);
				}
			});
		} else if (
			planetDist <
				camera.near * 2 +
					planets[centeredObject]['r'] *
						multiplier *
						30 *
						totalScale &&
			!lowRes
		) {
			// Hide the orbit line if it's too far out
			planets[centeredPlanet]['orbitMesh'].visible =
				!realSystem && !webVR;
			planets[centeredPlanet]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity =
						(node.material.opacity *
							(planetDist -
								camera.near * 2 -
								planets[centeredPlanet]['r'] *
									multiplier *
									15 *
									totalScale)) /
						(planets[centeredPlanet]['r'] *
							multiplier *
							15 *
							totalScale);
				}
			});
		} else {
			planets[centeredPlanet]['orbitMesh'].visible =
				!realSystem && !webVR;
		}
	}
}

function managePlanetSunFlares() {
	// Start the inital size and find position
	var size = HEIGHT / 3;
	var flare = [0, 0, 0];

	// Find camera position
	var cam = reverseThreeVector(camera.position);

	if (webVR) {
		cam = subVec(
			reverseThreeVector(camera.position),
			multiplyVec(1 / scene.scale.x, reverseThreeVector(scene.position)),
		);
	}

	// Calculate distance
	var dist = magnitude(subVec(flare, cam)) / totalScale;

	// Calculate scaling and apply size
	var pow = 1; // 0.9
	if (dist < 1) {
		pow = 0.4; // 0.5
	}
	var totalSize = (pixelRatio * size) / Math.pow(dist, pow);

	if (sunFlare.isSprite) {
		totalSize =
			(totalSize * (dist * totalScale) * DtoR(camera.fov)) / HEIGHT;
	}

	sunFlare.scale.set(totalSize, totalSize, totalSize);

	// Also manage the sun's marker distance - this is invisible, and only governs mousing over for the name
	var scaleFactor = 30;
	planets['sun']['markerMesh'].scale.copy(
		threeVector([
			dist / scaleFactor,
			dist / scaleFactor,
			dist / scaleFactor,
		]),
	);

	for (var name in planets) {
		// Iterate through all the planets
		if (name != 'sun') {
			// Excluding the sun because it is special and handled earlier

			if (planets[name]['lensFlare']) {
				// Don't do lens flares if not needed to

				// Set the default size
				size = HEIGHT * 0.015;

				if (planets[name]['center'] != 'sun') {
					// If it's a moon, make it look smaller
					size = size / 3;
				}

				// Find flare and camera position
				flare = reverseThreeVector(planets[name]['lensFlare'].position);

				// Find the distance
				dist = magnitude(subVec(flare, cam)) / totalScale;

				// Calculate distance from camera moderator
				var value = Math.pow(dist, 0.1);
				if (dist > 1) {
					value = Math.pow(dist, 0.5);
				}

				// Calculate distance from sun moderator - further from sun = less refelected light
				var sunDistvalue;
				if (name == 'ship') {
					sunDistvalue =
						planets['earth']['a'] / magnitude(lastShipLocation);
				} else {
					sunDistvalue =
						planets['earth']['a'] /
						magnitude(currentPositions[name]);
				}
				if (
					planets[name]['center'] != 'sun' &&
					planets[name]['center'] != undefined
				) {
					sunDistvalue =
						(planets['earth']['a'] /
							magnitude(
								currentPositions[planets[name]['center']],
							)) *
						2;
				}

				// Calculate size of planet moderator
				var planetSizevalue = 0.5;
				if (name != 'ship') {
					planetSizevalue =
						planets[name]['r'] / planets['earth']['r'];
				}

				// Moderate the moderator values with powers
				planetSizevalue = Math.pow(planetSizevalue, 0.25);
				sunDistvalue = Math.pow(sunDistvalue, 0.1);

				// Calculate the resultant size
				var resultantSize =
					(size * planetSizevalue * sunDistvalue) / value;

				var planetSize = HEIGHT * Math.atan(planets[name]['r'] / dist);

				// If the planet itself appears larger than the lens flare, hide it
				if (resultantSize < planetSize * 1.5) {
					resultantSize = 0;
				}

				if (planets[name].lensFlare.isSprite) {
					resultantSize =
						(resultantSize *
							(dist * totalScale) *
							DtoR(camera.fov)) /
						HEIGHT;
				}

				// Set the size
				planets[name].lensFlare.scale.set(
					pixelRatio * resultantSize,
					pixelRatio * resultantSize,
					pixelRatio * resultantSize,
				);
			}
		}
	}
}

function controlShipViewTarget() {
	// Find where the ship is and move the camera to it
	var shipPosition = new THREE.Vector3().copy(
		planets['ship']['markerMesh'].position,
	);
	camera.position.copy(shipPosition);

	// Look at whichever planet is closer
	if (ISEndTime == false && shipCameraTo && shipCameraFrom) {
		if (
			planets[shipCameraTo]['markerMesh'].position.distanceTo(
				planets['ship']['markerMesh'].position,
			) >
			planets[shipCameraFrom]['markerMesh'].position.distanceTo(
				planets['ship']['markerMesh'].position,
			)
		) {
			// Look at the planet it came from
			controls.target.copy(
				planets[shipCameraFrom]['markerMesh'].position,
			);
			planets[shipCameraFrom].markerMesh.material.opacity = 0;
			planets[shipCameraTo].markerMesh.material.opacity = 0.3;
		} else {
			// Look at the planet it is going to
			controls.target.copy(planets[shipCameraTo]['markerMesh'].position);
			planets[shipCameraFrom].markerMesh.material.opacity = 0.3;
			planets[shipCameraTo].markerMesh.material.opacity = 0;
		}
	} else {
		// Otherwise just look at Earth - IS transfer
		controls.target.copy(planets['earth']['markerMesh'].position);
	}

	// Update the controls
	if (!(!nauvooLaunched && launchTimer)) {
		controls.update();
	}
}

// Three.js Graphics Engine Management Functions

function animate() {
	// Request animation frame

	// Stock-standard ThreeJS handling animation
	animator = requestAnimationFrame(animate);
	render();

	// If it's not frozen by computation - try having it stop the loading timer
	if (smallLoadingTimer) {
		endSmallLoading();
	}
}

function resumeAnimation() {
	// Kickstart the animation again

	// Handle the UI buttons
	document.getElementById('animPause').innerHTML = 'Suspend Animation';
	document.getElementById('animPause').onclick = haltAnimation;

	// Resume graphics display - turn it away from straight black
	document.getElementById('graphicsContainer').style.display = 'block';

	// Re-initialise animation
	animate();
}

function haltAnimation() {
	// Stop the ThreeJS animation

	// Handle the UI buttons
	document.getElementById('animPause').innerHTML = 'Resume Animation';
	document.getElementById('animPause').onclick = resumeAnimation;

	// Turn the screen to black
	document.getElementById('graphicsContainer').style.display = 'none';

	// Stop asking for animation frames
	cancelAnimationFrame(animator);
}

function render() {
	// Start the renderer

	var delta = clock.getDelta() * 60;

	timeRatio = delta / 1;

	if (timeRatio > 10) {
		if (lastTimeRatio > 10) {
			timeRatio = 10;
		} else {
			timeRatio = 1;
		}
	}

	lastTimeRatio = timeRatio;

	timeRate = apparentTimeRate * timeRatio;
	timeIncrement = timeRate * (1000 / timeScale);

	if (logTracker < 0 && timeRatioLog) {
		logTracker = logInterval;
		console.log('Time Ratio: ' + round(timeRatio, 5));
	}
	logTracker -= (delta / 60) * convertTime('S', 'MS');

	if (stereoDisp) {
		// Split the screen in two, one for each camera if 3D

		// The width is half - for two cameras - while the height is normal
		var width = Math.round(WIDTH / 2),
			height = HEIGHT;

		// Render the scene
		renderer.setViewport(0, 0, width, height);
		renderer.setScissor(0, 0, width, height);
		renderer.setScissorTest(true);

		// Update the size of the left camera
		cameraLeft.aspect = (width * 2) / height;
		cameraLeft.updateProjectionMatrix();

		// Render the left camera
		renderer.render(scene, cameraLeft);

		// Set the size of the renderer to fill the screen, but be able to be split
		renderer.setViewport(width, 0, width, height);
		renderer.setScissor(width, 0, width, height);
		renderer.setScissorTest(true);

		// Update the size of the right camera
		cameraRight.aspect = (width * 2) / height;
		cameraRight.updateProjectionMatrix();

		// Render the right camera
		renderer.render(scene, cameraRight);
	} else {
		// Otherwise, render normally - just one scene with one camera
		renderer.render(scene, camera);
	}

	updateSim();
}

function onWindowResize() {
	// ThreeJS: deal with screen resize

	// Update aspect ratio and size of camera
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Set the width and height of the screen
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
}

// ORBITAL FUNCTIONS

// Orbital Vector Data Calculation Functions

function findPlanetLocation(name, time) {
	// Deliver a planet location given the current time

	// Get the data
	var a = planets[name]['a'];
	var L = planets[name]['rL'];
	var center = planets[name]['center'];

	// Find the excesss time since the epoch, less than the period for ease of computiation
	var period = findPeriod(a, center);
	var tempEpoch = EPOCH;
	if (planets[name]['epoch']) {
		// If a custom epoch, use that
		tempEpoch = planets[name]['epoch'];
	}
	var milliseconds = time - tempEpoch; // Milliseconds between EPOCH and current time
	var years = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH

	// Find the remainer of the time from epoch
	var remainder = years % period;
	while (remainder < 0) {
		// Find the remainder from epoch
		remainder += period;
	}

	// Start from the epoch position
	var nextDegree = Math.round(L * orbitResolution) % (360 * orbitResolution);

	// Find the point where it is different
	var diffPoint = orbitalTimes[name][0];

	// Set the boundaries
	var lowBound = 0;
	var midBound = nextDegree;
	var highBound = 360 * orbitResolution - 1;

	// Find which of the two sections the value is in - and set bounds
	if (remainder > diffPoint) {
		highBound = midBound;
	} else {
		lowBound = midBound;
	}

	// Initialise the degree
	var testDegree;

	// While it hasn't finalised the limits
	while (highBound - lowBound > 1) {
		// Find the degree to test and the value at that degree
		testDegree = Math.ceil((lowBound + highBound) / 2);
		var testValue = orbitalTimes[name][testDegree];

		// Figure out how to move the boundaries
		if (testValue > remainder) {
			highBound = testDegree;
		} else {
			lowBound = testDegree;
		}
	}

	// Set the degree afterwards to the highest bound
	nextDegree = highBound;

	// Find out the previous position
	var previousDegree =
		(nextDegree + 360 * orbitResolution - 1) % (360 * orbitResolution);
	var previousArray = orbitalPositions[name][previousDegree];

	// Move it between positions to ensure smooth animation - this is rather than jerking it from position to position
	var percentageAlong =
		(remainder - orbitalTimes[name][previousDegree]) /
		(orbitalTimes[name][nextDegree] - orbitalTimes[name][previousDegree]);
	if (isNaN(percentageAlong)) {
		// if an error is throw new Error("Something bad happened.")n, just pick halfway
		percentageAlong = 0.5;
	}

	// Save the current position
	if (name != 'sun') {
		currentDegrees[name] =
			(previousDegree + percentageAlong) / orbitResolution;
	}

	// Find the next position
	var nextArray = orbitalPositions[name][nextDegree];

	// Find the difference and moderate by the percentage along, and generate the new position vector
	var diffArray = subVec(nextArray, previousArray);
	diffArray = multiplyVec(percentageAlong, diffArray);

	// Resolve it into a new position vector
	var array = addVec(previousArray, diffArray);

	// Return current position vector
	return array;
}

function findPlanetDegree(name, position) {
	// This entire thing is reverse-deriving it by the same method used to generate the initial coords

	// Get initial data
	var e = planets[name]['e'];
	var i = planets[name]['i'];
	var a = planets[name]['a'];
	var loPE = planets[name]['loPE'];
	var loAN = planets[name]['loAN'];
	var center = planets[name]['center'];

	if (
		center != 'sun' &&
		name != 'luna' &&
		name != 'the moon' &&
		name != 'ship'
	) {
		if (planets[center]['axialTilt']) {
			if (!planets[name]['loANeff'] || !planets[name]['ieff']) {
				calculateEffectiveParams(name);
			}

			loAN = planets[name]['loANeff'];
			i = planets[name]['ieff'];
		}
	}

	// Eccentric degree is how far away it is from the periapsis
	//var eccentricDegree = (360 + degree + loPE) % 360;

	// Convert it into needed formats
	//var degreesFromAN = DtoR(-degree - loAN);

	if (i == 0) {
		i = 0.000001;
	}

	var o = DtoR(loAN);
	i = DtoR(i);

	var distance = magnitude(position);

	// Recalculate position - see earlier in the program

	// Find initial degrees from the ascending node, set up tests
	var degreesFromAN = Math.asin(position[2] / (distance * Math.sin(i)));

	var testXOne =
		distance *
		(Math.cos(o) * Math.cos(degreesFromAN) -
			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var testYOne =
		distance *
		(Math.sin(o) * Math.cos(degreesFromAN) +
			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));

	var degreesFromANTwo = (Math.PI - degreesFromAN) % (2 * Math.PI);

	var testXTwo =
		distance *
		(Math.cos(o) * Math.cos(degreesFromANTwo) -
			Math.sin(o) * Math.sin(degreesFromANTwo) * Math.cos(i));
	var testYTwo =
		distance *
		(Math.sin(o) * Math.cos(degreesFromANTwo) +
			Math.cos(o) * Math.sin(degreesFromANTwo) * Math.cos(i));

	// Create test positions
	var primary = [position[0], position[1], position[2]];
	var testOne = [testXOne, testYOne, position[2]];
	var testTwo = [testXTwo, testYTwo, position[2]];

	var distOne = magnitude(subVec(primary, testOne));
	var distTwo = magnitude(subVec(primary, testTwo));

	// Decide which section of the inverse sin to use based on which is closer
	if (distOne < distTwo) {
		degreesFromAN = RtoD(degreesFromAN);
	} else {
		degreesFromAN = RtoD(degreesFromANTwo);
	}

	// Find final degree
	var degree = -degreesFromAN - loAN;

	return ((360 - degree) % 360) - 1 / orbitResolution;
}

function findVelocity(name, time) {
	// Return velocity at a given time of a planet

	// Find position and then the degree to match with other knowledge
	var position = findPlanetLocation(name, time);
	var degree =
		Math.round((360 + vectorToAngle(position)) * orbitResolution) %
		(360 * orbitResolution);

	var newDegree = Math.round(
		findPlanetDegree(name, position) * orbitResolution,
	);
	if (!isNaN(newDegree)) {
		degree = (360 * orbitResolution + newDegree) % (360 * orbitResolution);
	}

	// Find the infintesimal change in distance and time
	var deltaTime =
		orbitalTimes[name][(degree + 1) % (360 * orbitResolution)] -
		orbitalTimes[name][degree];
	//deltaTime = findPeriod(planets[name].a, planets[name].center)
	var deltaDist = subVec(
		orbitalPositions[name][(degree + 1) % (360 * orbitResolution)],
		orbitalPositions[name][degree],
	);

	// Velocity = distance / time, except to find a vector velocity, use a vector distance
	var velocityVec = multiplyVec(1 / deltaTime, deltaDist);

	// Set the magnitude of the velocity according to the viz-viva equation
	var velMag = Math.sqrt(
		M3S2toAU3Y2(findGravParam(planets[name]['center'])) *
			(2 / magnitude(position) - 1 / planets[name]['a']),
	);
	velocityVec = setMagnitude(velocityVec, velMag);

	// Return the velocity in vector form
	return velocityVec;
}

// Orbital Data Calculation Functions

function generateOrbitalCoords(name) {
	// Iterate through and calculate all orbital positions for a planet and store them.

	// Initialise the degree and co-ordinates
	var degree = 360;
	var coords = [];

	while (degree > 0) {
		// Iterate through every one of the 360 * orbitResolution points and add to array
		degree -= 1 / orbitResolution;
		var array = calculateOrbitalPositionVector(name, degree);
		coords.push(array);
	}

	// Store for later use to prevent excessive calculation
	orbitalPositions[name] = coords;
}

function generateOrbitalTimes(name) {
	// Calculate where the planet should be at a given time

	// Get the correct data
	var a = planets[name]['a'];
	var L = planets[name]['rL'];
	var center = planets[name]['center'];
	var gravitationalParameter = findGravParam(center);
	gravitationalParameter = M3S2toAU3Y2(gravitationalParameter);

	// The inital degree starts at its position at epoch - because the time is zero at 0 remainer time
	var degree = Math.round(L * orbitResolution) % (360 * orbitResolution);

	// Initialise storage variables
	orbitalTimes[name] = {};
	orbitalVelocities[name] = {};
	orbitalTimes[name][degree] = 0;

	// Initialise iterator variables
	var timesum = 0;
	var counter = 1;

	// Iterate through each degree and find the time at each
	while (counter < 360 * orbitResolution) {
		// Move the degree forward
		degree = (degree + 1) % (360 * orbitResolution);
		var currentDegree = degree % (360 * orbitResolution);

		// Find the positions, and the distance between
		var arrayOne = orbitalPositions[name][currentDegree];
		var arrayTwo =
			orbitalPositions[name][
				(currentDegree + 1) % (360 * orbitResolution)
			];
		var distance = magnitude(subVec(arrayOne, arrayTwo));

		// Find the velocity at this point
		var velocity = Math.pow(
			gravitationalParameter * (2 / magnitude(arrayOne) - 1 / a),
			0.5,
		);

		// Also store this velocity in the orbital velocities part
		orbitalVelocities[name][degree] = {
			velocity: velocity,
			distance: distance,
			time: distance / velocity,
		};

		// Additive time calculated by how long it takes to get between that small segment
		timesum += distance / velocity;
		orbitalTimes[name][degree] = timesum;

		// Move the counter foward
		counter += 1;
	}

	// Finish it off by making the last be the full period
	degree =
		(Math.round(L * orbitResolution) - 1 + 360 * orbitResolution) %
		(360 * orbitResolution);
	orbitalTimes[name][degree] = findPeriod(a, center);
}

function calculateOrbitalPositionVector(name, degree) {
	// Given which degree a planet is at, return the position vector

	// Get orbital data
	var e = planets[name]['e'];
	var i = planets[name]['i'];
	var a = planets[name]['a'];
	var loPE = planets[name]['loPE'];
	var loAN = planets[name]['loAN'];
	var center = planets[name]['center'];

	// Eccentric degree is how far away it is from the periapsis
	var eccentricDegree = (360 + degree + loPE) % 360;

	// Find out the magnitude of the position vector
	var distance =
		(a * (1 - e * e)) / (1 + e * Math.cos(DtoR(eccentricDegree)));

	// Convert it into needed formats
	var degreesFromAN = DtoR(-degree - loAN);
	var o = DtoR(loAN);
	i = DtoR(i);

	// Calculate the X, Y and Z components
	var x =
		distance *
		(Math.cos(o) * Math.cos(degreesFromAN) -
			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var y =
		distance *
		(Math.sin(o) * Math.cos(degreesFromAN) +
			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var z = distance * (Math.sin(degreesFromAN) * Math.sin(i));

	// Deal with axial tilts of moons (the moon/luna are excepted due to its odd orbit)
	// The only parameters I could find were discounting axial tilt - I think due to how odd it is
	if (
		center != 'sun' &&
		name != 'luna' &&
		name != 'the moon' &&
		name != 'ship'
	) {
		if (planets[center]['axialTilt']) {
			// Calculates angular momentum vector, rotate by the rotation of the parent axial tilt from Z+
			// Then recalculate moderated orbital parameters based on this angular momentum

			var axisAN;
			var iAxis;

			if (!planets[name]['loANeff'] || !planets[name]['ieff']) {
				calculateEffectiveParams(name);
			}
			axisAN = planets[name]['loANeff'];
			iAxis = planets[name]['ieff'];

			// Recalculate position - see earlier in the program
			var degreesFromAxisAN = DtoR(-degree - axisAN);
			var oAxis = DtoR(axisAN);
			iAxis = DtoR(iAxis);
			x =
				distance *
				(Math.cos(oAxis) * Math.cos(degreesFromAxisAN) -
					Math.sin(oAxis) *
						Math.sin(degreesFromAxisAN) *
						Math.cos(iAxis));
			y =
				distance *
				(Math.sin(oAxis) * Math.cos(degreesFromAxisAN) +
					Math.cos(oAxis) *
						Math.sin(degreesFromAxisAN) *
						Math.cos(iAxis));
			z = distance * (Math.sin(degreesFromAxisAN) * Math.sin(iAxis));
		}
	}

	// Return position
	return [x, y, z];
}

function calculateEffectiveParams(name) {
	// Find the axial tilt
	var axialTilt = planets[name]['orbitalAxis'];

	var zAxis = [0, 0, 1];

	// This is the nodes vector - points at AN
	var n = crossProduct(zAxis, axialTilt);

	if (axialTilt[0] == 0 && axialTilt[1] == 0) {
		// If it points straight up, deflect marginally to avoid divide by zero errors
		axialTilt = [0, 0.0000000000001, 1];
	}

	// Calculate the new axes
	var iAxis = RtoD(Math.acos(axialTilt[2] / magnitude(axialTilt)));
	var axisAN = (360 + RtoD(Math.acos(n[0] / magnitude(n)))) % 360;
	if (n[1] < 0) {
		// Flip to loAN if it is around the way, the inverse cos function can't explain everytihing
		axisAN = 360 - axisAN;
	}

	if (isNaN(axisAN)) {
		// If inclination is zero - this can be anything, but zero is easiest
		axisAN = 0;
	}

	// Find the effective longitude of the ascending node and inclination
	planets[name]['loANeff'] = axisAN;
	planets[name]['ieff'] = iAxis;
}

function calculateAxialTilt(name) {
	// Rotate the angular momentum vector by the difference between vertical and the center's axis to find the new angular momentum vector

	// Get planetary data
	var i = planets[name]['i'];
	var loAN = planets[name]['loAN'];
	var center = planets[name]['center'];

	// Initialise the original angular momentum
	var originalAngMom = [0, 0, 0];

	// Calculate how far around the AN and inclination are for use in the later sections
	var ANdegree = DtoR((360 + loAN) % 360);
	i = DtoR(i);

	// Turn the orbital parameters into an angular momentum vector (reversing paramsFromVec calcs)
	var dist = Math.cos(Math.PI / 2 - i);
	var height = Math.sin(Math.PI / 2 - i);

	// Calculate needed sections. The angular momentum points 270 degrees (anticlockwise) from the AN
	var orgX = Math.sin(ANdegree);
	var orgY = -Math.cos(ANdegree);
	var orgZ = height;

	// Calculate angular momentum unit vector
	originalAngMom[0] = orgX * dist;
	originalAngMom[1] = orgY * dist;
	originalAngMom[2] = orgZ;
	originalAngMom = setMagnitude(originalAngMom, 1); // Note: Because I'm just looking at direction, the angular momentum is moderated to be 1 - a unit vector

	// Initialise major axes
	var zAxis = [0, 0, 1];
	var axialTilt = planets[center]['axialTilt'];

	// This finds where it is rotated and how much by
	var rotationAxis = crossProduct(zAxis, axialTilt); // Find the axis to rotate about: Cross product of the axial tilt and "up"
	var rotationDegree = Math.acos(dotProduct(zAxis, axialTilt)); // Find how many degrees to rotate by

	// Transform it into a unit vector that's compatible with threejs
	rotationAxis = setMagnitude(rotationAxis, 1);
	rotationAxis = threeVector(rotationAxis);

	// Find the new angular momentum
	var newAngMom = threeVector(originalAngMom);

	// Use ThreeJS to rotate the vector
	newAngMom.applyAxisAngle(rotationAxis, rotationDegree);
	// To reduce error, an inbuilt ThreeJS function used here instead of a matrix transform

	// Return the new angular momentum vector
	axialTilt = reverseThreeVector(newAngMom);
	return axialTilt;
}

// TRANSFER FUNCTIONS - This is a supersection over Ballistic, Interstellar, Epstien and Propagation Delay calculators

// BALLISTIC TRANSFER CALCULATIONS (Interplanetary and Interlunar)

// Lambert Ballistic Transfer Calculator Functions

function calculateLambertTransfer(nameOne, nameTwo, distOne, distTwo) {
	// Calculate the transfer between two planets
	// I will try and explain the maths, but to see the full derivations, check the credits page - I've used the same variable names

	// Disable logged transfer
	loggedTransfer = false;

	// Stop the simulation from running to speed it up
	startTransferCalc();

	// Reset all systems - stop people from messing it up while the program is busy
	document.getElementById('disabledCover').style.display = 'block';
	if (!webVR) {
		document.getElementById('shipViewDiv').style.display = 'block';
	}
	resetShipSystems();

	// Initialise empty transit windows
	transitWindows = {};

	// Bring up the loading screen
	document.getElementById('loadingScreen').style.display = 'block';
	if (stereoDisp) {
		document.getElementById('loadingScreenAux').style.display = 'block';
	}

	// Get the initial Message
	message =
		loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

	// Import needed variables
	var center = planets[nameOne]['center'];
	var startTime = currentTime.getTime();
	var aOne = parseScalarInput(planets[nameOne]['a'], 'AU');
	var aTwo = parseScalarInput(planets[nameTwo]['a'], 'AU');

	// Find and convert gravitational parameter
	var gravitationalParameter = parseScalarInput(
		findGravParam(center),
		'm^3/s^2',
	);

	// Calculate periods
	var periodOne = parseScalarInput(
		findPeriod(aOne.value * convertDistance('M', 'AU'), center),
		'y',
	);
	var periodTwo = parseScalarInput(
		findPeriod(aTwo.value * convertDistance('M', 'AU'), center),
		'y',
	);
	var synodicPeriod = parseScalarInput(
		calculateSynodicPeriod(
			periodOne.value * convertTime('S', 'Y'),
			periodTwo.value * convertTime('S', 'Y'),
			center,
		),
		'y',
	); // Synodic Period in years

	// Calculate boundary limits on the iterator
	var smallPeriod;
	if (periodOne.value > periodTwo.value) {
		smallPeriod = periodTwo;
	} else {
		smallPeriod = periodOne;
	}
	var tofMargin = divide(smallPeriod, parseScalarInput(Math.pow(10, 7), ''));

	// Get a guesstimate of the semi-latus rectum (p)
	var largeSemiMajor;
	var smallSemiMajor;
	var largeE;
	var smallE;
	if (aOne.value > aTwo.value) {
		largeSemiMajor = aOne;
		smallSemiMajor = aTwo;
		largeE = parseScalarInput(planets[nameOne]['e'], '');
		smallE = parseScalarInput(planets[nameTwo]['e'], '');
	} else {
		largeSemiMajor = aTwo;
		smallSemiMajor = aOne;
		largeE = parseScalarInput(planets[nameTwo]['e'], '');
		smallE = parseScalarInput(planets[nameOne]['e'], '');
	}

	// Define bounding parameters - this is a VERY rough (hence why the rest is needed) Hohmann transfer orbit for dynamic calculation and estimation
	var outerPoint = multiply(
		largeSemiMajor,
		add(parseScalarInput(1, ''), largeE),
	);
	var innerPoint = multiply(
		smallSemiMajor,
		subtract(parseScalarInput(1, ''), smallE),
	);

	var transitA = divide(add(outerPoint, innerPoint), parseScalarInput(2, ''));
	//var transitA = ((largeSemiMajor * (1 + largeE)) + (smallSemiMajor * (1 - smallE))) / 2;
	var periodT = parseScalarInput(
		findPeriod(transitA.value * convertDistance('M', 'AU'), center),
		'y',
	);
	//var periodT = findPeriod(transitA, center);

	// Define the resolution - this means looking at resolution squared windows
	var resolution = 200;
	if ((timeRatio + lastTimeRatio) / 2 > 1.5 && !twoStage) {
		console.log(
			'Calculating Low Resolution Transfer - Slow Running Computer',
		);
		resolution = 100;
	}
	totalCalculations = 0;

	// Two-stage transfer calculation data
	var globalResolution = 200;
	var firstResolution = 20; // This MUST divide cleanly into the global resolution
	var secondResolution = globalResolution / firstResolution;
	var windowsNum = 5;
	storedWindows = [];
	if (twoStage) {
		resolution = firstResolution;
	}
	inSecondStage = false;

	// Define limits
	var upperTransitBound = 0.9;
	var lowerTransitBound = 0.1;
	var increment = divide(synodicPeriod, parseScalarInput(resolution, ''));
	var timeIncrement = divide(
		multiply(
			parseScalarInput(upperTransitBound - lowerTransitBound, ''),
			periodT,
		),
		parseScalarInput(resolution, ''),
	);
	//var timeIncrement = (upperTransitBound - lowerTransitBound) * periodT / resolution;

	// Define the radial position vectors
	var rOne = [];
	var rTwo = [];

	// Keep track of the data - lowest data contains the best transit data, the lowest DV keeps track of whether a new one is better
	lowestData = {};
	lowestDeltaVee = parseScalarInput(Math.pow(10, 10), 'm/s');

	// Keep track of the timing of the transfer in the consolte
	console.log('Calculating Transfer...');

	var calcData = {
		startTime: startTime,
		gravParam: gravitationalParameter,
		tofMargin: tofMargin,
		distOne: distOne,
		distTwo: distTwo,
		synPeriod: synodicPeriod,
		windowsNum: windowsNum,
	};

	for (
		var deptTime = 0;
		deptTime < synodicPeriod.value;
		deptTime += increment.value
	) {
		// Iterate through departure times - once it reaches the synodic period, it should have found one

		// Clear out a window so it can assign more transfers
		transitWindows[deptTime] = {};

		for (
			var travelTime = periodT.value * lowerTransitBound;
			travelTime < periodT.value * upperTransitBound;
			travelTime += timeIncrement.value
		) {
			// Iterate through transit times
			setTimeout(
				function (deptTime, travelTime) {
					// Set timeout to allow program to function for computation - parameters passed at other end

					calculateTransferWindow(
						deptTime,
						travelTime,
						nameOne,
						nameTwo,
						calcData,
					);
				},
				0,
				deptTime,
				travelTime,
			); // This passes the parameters inside so it doesn't calculate 40,000 of just the final variables
		}
	}

	if (twoStage) {
		var miscData = {
			secondResolution: secondResolution,
		};

		setTimeout(function () {
			// Wait for the transfer calculator to finish up BEFORE running this - it must have found the best one
			secondTransferStage(
				nameOne,
				nameTwo,
				increment.value,
				timeIncrement.value,
				miscData,
				calcData,
			);
		}, 0);
	} else {
		setTimeout(function () {
			// Wait for the transfer calculator to finish up BEFORE running this - it must have found the best one
			finaliseTransferCalc();
		}, 0);
	}
}

function calculateTransferWindow(
	deptTime,
	travelTime,
	nameOne,
	nameTwo,
	miscData,
) {
	// Calculate an individual transfer window

	// Get the raw data
	var rawDTime = deptTime;
	var rawTTime = travelTime;

	// Add another to the total calculations for efficiency tracking
	totalCalculations += 1;

	// Parse all input data
	var startTime = miscData.startTime;
	var gravitationalParameter = miscData.gravParam;
	var tofMargin = miscData.tofMargin;
	var distOne = miscData.distOne;
	var distTwo = miscData.distTwo;
	var synodicPeriod = miscData.synPeriod;
	var windowsNum = miscData.windowsNum;

	travelTime = parseScalarInput(travelTime, 's');

	// Find initial variables for first planet
	var departingTime = new Date(
		startTime + deptTime * convertTime('S', 'MS', 1),
	);
	var rOne = parseVectorInput(
		findPlanetLocation(nameOne, departingTime),
		'AU',
	);
	var departingVelocity = parseVectorInput(
		findVelocity(nameOne, departingTime),
		'AU/y',
	);

	// Find initial variables for second planet
	var arrivingTime = new Date(
		departingTime.getTime() + outputScalar(travelTime, 'ms'),
	);
	var rTwo = parseVectorInput(
		findPlanetLocation(nameTwo, arrivingTime),
		'AU',
	);
	var arrivingVelocity = parseVectorInput(
		findVelocity(nameTwo, arrivingTime),
		'AU/y',
	);

	// Define some handy variables for the magnitudes of vectors
	var rOneMag = vectorMagnitude(rOne);
	var rTwoMag = vectorMagnitude(rTwo);

	// Find deltaV
	var deltaV = parseScalarInput(
		angleBetweenVectors(outputVector(rOne, 'AU'), outputVector(rTwo, 'AU')),
		'degrees',
	);

	// Calculate k,m,l
	var k = multiply(multiply(rOneMag, rTwoMag), subtract(1, cos(deltaV)));
	var m = multiply(multiply(rOneMag, rTwoMag), add(1, cos(deltaV)));
	var l = add(rOneMag, rTwoMag);
	//var k = rOneMag * rTwoMag * (1 - Math.cos(deltaV));
	//var m = rOneMag * rTwoMag * (1 + Math.cos(deltaV));
	//var l = rOneMag + rTwoMag;

	// Important bounders for the iterator
	var pi = divide(k, add(l, pow(multiply(2, m), 0.5)));
	var pii = divide(k, subtract(l, pow(multiply(2, m), 0.5)));
	//var pi = k / (l + Math.pow(2 * m, 0.5));
	//var pii = k / (l - Math.pow(2 * m, 0.5));

	// Some misc variables
	var low;
	var high;
	var p1;
	var p2;

	// The starting boundaries affect the results quite a bit
	var startSeed = 2000000; // This MUST be >= 1

	if (deltaV.value > Math.PI) {
		// These are limits defined by the maths, just roll with it
		low = parseScalarInput(0, 'm');
		high = pii;
		p1 = add(multiply(0.5 + 1 / startSeed, subtract(pii, pi)), pi);
		p2 = add(multiply(0.5 - 1 / startSeed, subtract(pii, pi)), pi);
	} else {
		low = pi;
		//p1 = ((0.5 + 1 / startSeed) * (pii - pi)) + pi;
		//p2 = ((0.5 - 1 / startSeed) * (pii - pi)) + pi;
		p1 = add(multiply(0.5 + 1 / startSeed, subtract(pii, pi)), pi);
		p2 = add(multiply(0.5 - 1 / startSeed, subtract(pii, pi)), pi);
		high = parseScalarInput(Infinity, 'm');
	}

	// Calculate the first times
	var t1 = calculateTime(
		p1,
		rOne,
		rTwo,
		k,
		l,
		m,
		deltaV,
		gravitationalParameter,
	);
	var t2 = calculateTime(
		p2,
		rOne,
		rTwo,
		k,
		l,
		m,
		deltaV,
		gravitationalParameter,
	);

	// How many passes of the iterator before it hits the escape system
	var numTries = Math.pow(10, 2);

	// Iterative convergence algorithm for semi-latus rectum
	while (
		Math.abs(t2.value - travelTime.value) > tofMargin.value &&
		!isNaN(p2.value) &&
		numTries >= 0 &&
		p2.value < high.value &&
		p2.value > low.value
	) {
		var pnew = add(
			p2,
			divide(
				multiply(subtract(travelTime, t2), subtract(p2, p1)),
				subtract(t2, t1),
			),
		); // Linear convergence

		// Update variables for the next go
		p1 = p2;
		p2 = pnew;
		t1 = t2;
		t2 = calculateTime(
			p2,
			rOne,
			rTwo,
			k,
			l,
			m,
			deltaV,
			gravitationalParameter,
		);
		numTries -= 1;
	}

	// Final semi-latus rectum is the selected one
	var p = p2;

	// Calculate f
	var f = subtract(1, multiply(divide(rTwoMag, p), subtract(1, cos(deltaV))));
	//var f = 1 - (rTwoMag / p) * (1 - Math.cos(deltaV));

	// Change parameter to keep units consistent
	//gravitationalParameter = gravitationalParameter * convertTime("Y", "S", -2);

	// Calculate more variables that don't have a physical correlate - see previous maths comment
	var g = divide(
		multiply(multiply(rOneMag, rTwoMag), sin(deltaV)),
		pow(multiply(gravitationalParameter, p), 0.5),
	);
	//var g = rOneMag * rTwoMag * Math.sin(deltaV) / Math.pow(gravitationalParameter * p, 0.5);
	var fDot = multiply(
		multiply(
			pow(divide(gravitationalParameter, p), 0.5),
			tan(divide(deltaV, 2)),
		),
		subtract(
			subtract(divide(subtract(1, cos(deltaV)), p), divide(1, rOneMag)),
			divide(1, rTwoMag),
		),
	);
	//var fDot = Math.pow(gravitationalParameter / p, 0.5) * Math.tan(deltaV / 2) * (((1 - Math.cos(deltaV)) / p) - (1 / rOneMag) - (1 / rTwoMag));
	var gDot = subtract(
		1,
		multiply(divide(rOneMag, p), subtract(1, cos(deltaV))),
	);
	//var gDot = 1 - (rOneMag / p) * (1 - Math.cos(deltaV));

	// Calculate initial and final velocities - relative to FRAME not to PLANETS
	var vOne = divide(subtract(rTwo, multiply(f, rOne)), g);
	var vTwo = add(multiply(fDot, rOne), multiply(gDot, vOne));
	//var vOne = multiplyVec((1 / g), subVec(rTwo, multiplyVec(f, rOne)));
	//var vTwo = addVec(multiplyVec(fDot, rOne), multiplyVec(gDot, vOne));

	// Change parameter back for other equations
	//gravitationalParameter = gravitationalParameter * convertTime("S", "Y", -2);

	// Determing velocites in m/s, not m/year
	//vOne = multiplyVec(convertTime("S", "Y", -1), vOne);
	//vTwo = multiplyVec(convertTime("S", "Y", -1), vTwo);

	// Calculate Capture and transfer delta vees
	var DCO = vectorMagnitude(subtract(vTwo, arrivingVelocity));
	var DTO = vectorMagnitude(subtract(vOne, departingVelocity));

	//var DCO = magnitude(subVec(vTwo, arrivingVelocity)) * convertSpeed("AU/Y", "M/S");
	//var DTO = magnitude(subVec(vOne, departingVelocity)) * convertSpeed("AU/Y", "M/S");

	// These are the gravitational ones - escape velocities
	var DCOGrav = parseScalarInput(0, 'm/s');
	var DTOGrav = parseScalarInput(0, 'm/s');

	var deltaVee = parseScalarInput(0, 'm/s');

	// Manage if it is an orbit or satellite, otherwise look at graivity
	if (nameOne == 'orbit1') {
		deltaVee = add(deltaVee, DTO);
	} else if (planets[nameOne]['satellite'] == true) {
		deltaVee = add(deltaVee, DTO);
	} else {
		DTOGrav = parseScalarInput(
			calculateEscapeVelocity(nameOne, distOne) +
				calculateExtraVelocity(DTO.value, nameOne, distOne),
			'm/s',
		);
		deltaVee = add(
			deltaVee,
			parseScalarInput(
				calculateEscapeVelocity(nameOne, distOne) +
					calculateExtraVelocity(DTO.value, nameOne, distOne),
				'm/s',
			),
		);
	}

	// If not aerobraking, deal with orbit and satellite possibilities
	if (
		!(
			(planets[nameOne]['center'] == 'sun' &&
				document.getElementById('IPAero').checked) ||
			(planets[nameOne]['center'] != 'sun' &&
				document.getElementById('ILAero').checked)
		)
	) {
		if (nameOne == 'orbit2') {
			deltaVee = add(deltaVee, DCO);
		} else if (planets[nameTwo]['satellite'] == true) {
			deltaVee = add(deltaVee, DCO);
		} else {
			DCOGrav = parseScalarInput(
				calculateEscapeVelocity(nameTwo, distTwo) +
					calculateExtraVelocity(DCO.value, nameTwo, distTwo),
				'm/s',
			);
			deltaVee = add(
				deltaVee,
				parseScalarInput(
					calculateEscapeVelocity(nameTwo, distTwo) +
						calculateExtraVelocity(DCO.value, nameTwo, distTwo),
					'm/s',
				),
			);
		}
	}

	// Calculate the semi-major axis for verification
	//var a = (m * k * p) / (((2 * m) - Math.pow(l, 2)) * Math.pow(p, 2) + (2 * k * l * p) - Math.pow(k, 2));
	var a = divide(
		multiply(multiply(m, k), p),
		add(
			multiply(subtract(multiply(2, m), pow(l, 2)), pow(p, 2)),
			subtract(multiply(multiply(k, 2), multiply(l, p)), pow(k, 2)),
		),
	);

	// Format ALL THE LOGGING DATA
	var formatData = {};

	formatData['pos'] = outputVector(rOne, 'AU');
	formatData['vel'] = outputVector(vOne, 'AU/y');
	formatData['TO'] = DTO.value;
	formatData['CO'] = DCO.value;
	formatData['TOGrav'] = DTOGrav.value;
	formatData['COGrav'] = DCOGrav.value;
	formatData['capTime'] = arrivingTime;
	formatData['depTime'] = departingTime;
	formatData['pos2'] = outputVector(rTwo, 'AU');
	formatData['vel2'] = outputVector(vTwo, 'AU/y');
	formatData['depVel'] = outputVector(departingVelocity, 'AU/y');
	formatData['arrVel'] = outputVector(arrivingVelocity, 'AU/y');
	formatData['predictedTime'] = outputScalar(t2, 'y');
	formatData['tTime'] = outputScalar(travelTime, 'y');
	formatData['timeDiff'] =
		(Math.abs(t2.value - travelTime.value) / travelTime.value) * 100 + '%';
	formatData['a'] = outputScalar(a, 'AU');
	formatData['misc'] = {
		p: p.value,
		highP: high.value,
		lowP: low.value,
		m: m.value,
		k: k.value,
		l: l.value,
		f: f.value,
		g: g.value,
		fDot: fDot.value,
		gDot: gDot.value,
	};
	formatData['numTries'] = numTries;
	formatData['gravParam'] = gravitationalParameter;
	formatData['dTime'] = deptTime;
	formatData['deltaVee'] = deltaVee.value;
	formatData['nameOne'] = nameOne;
	formatData['nameTwo'] = nameTwo;
	formatData['rawDTime'] = rawDTime;
	formatData['rawTTime'] = rawTTime;

	if (miscData.index) {
		formatData['index'] = miscData.index;
	}

	if (!transitWindows[deptTime]) {
		// Open up the departure time JSON if not initialised
		transitWindows[deptTime] = {};
	}

	// Log the data
	transitWindows[deptTime][outputScalar(travelTime, 'y')] = formatData;

	// If it is an invaid transfer, disregard as the most efficient. Invalid is hyperbolic, not number values, or if the convergence went outside allowed boundaries
	if (validTransfer(formatData)) {
		// Decide which lowest data tracking method
		if (twoStage && !inSecondStage) {
			// Choose whether to add a new piece of data
			if (storedWindows.length < windowsNum) {
				storedWindows.push(formatData);

				storedWindows.sort(function (x, y) {
					// This sorts is in descending order, highest first
					x = x.deltaVee;
					y = y.deltaVee;
					if (x < y) {
						return 1;
					}
					if (x > y) {
						return -1;
					}
					return 0;
				});
			} else if (deltaVee.value < storedWindows[0].deltaVee) {
				storedWindows[0] = formatData;

				storedWindows.sort(function (x, y) {
					// This sorts is in descending order, highest first
					x = x.deltaVee;
					y = y.deltaVee;
					if (x < y) {
						return 1;
					}
					if (x > y) {
						return -1;
					}
					return 0;
				});
			}
		} else {
			if (deltaVee.value < lowestDeltaVee.value) {
				// If it's better, set it as the new best
				lowestDeltaVee = deltaVee;
				lowestData = formatData;
			}
		}
	}

	// Update the estimated time message
	if ((new Date().getTime() / 1000) % 0.5 < 0.1) {
		if (timeEstimateUpdated == false) {
			var elapsedTime =
				(new Date().getTime() - transTime.getTime()) / 1000;
			var predictedTime =
				(elapsedTime * (synodicPeriod.value - deptTime)) / deptTime;
			lastTimeMessage =
				'<br><br>Estimated time remaining<br>' +
				round(predictedTime) +
				' s';

			timeEstimateUpdated = true;
		}
	} else {
		timeEstimateUpdated = false;
	}

	// Update witty text
	var seconds = (new Date().getTime() / 1000) % 4;
	if (seconds < 1) {
		// Update the message after 4 seconds
		if (messageUpdated == false) {
			message =
				loadingMessages[
					Math.floor(Math.random() * loadingMessages.length)
				];
			messageUpdated = true;
		}
	} else {
		messageUpdated = false;
	}

	// Update loading text
	var displayText =
		'Calculating Transfer<br>' +
		round((100 * deptTime) / synodicPeriod.value, 0) +
		'%';

	displayText += lastTimeMessage;
	document.getElementById('loadingText').innerHTML = displayText;
	document.getElementById('loadingTextAux').innerHTML = displayText;

	// Otherwise, keep adding dots
	document.getElementById('wittyText').innerHTML =
		message + '.'.repeat(Math.floor(seconds));
	document.getElementById('wittyTextAux').innerHTML =
		message + '.'.repeat(Math.floor(seconds));
}

function calculateTime(p, rOne, rTwo, k, l, m, deltaV, gravParam) {
	// Given the parameters, calculate the transfer time for the convergence algorithm
	// This one is another that has complex, not necessarily self-explanatory maths. Check the website in the credits section

	// Convert the gravitational parameter's units
	//gravParam = gravParam * convertTime("Y", "S", -2);

	// Easy magnitude of the vectors
	var rOneMag = vectorMagnitude(rOne);
	var rTwoMag = vectorMagnitude(rTwo);

	// Calculate the semi-major axis
	var a = divide(
		multiply(multiply(m, k), p),
		add(
			multiply(subtract(multiply(2, m), pow(l, 2)), pow(p, 2)),
			subtract(multiply(multiply(k, 2), multiply(l, p)), pow(k, 2)),
		),
	);

	// Calculate a bunch of variables with no real counterpart
	var f = subtract(1, multiply(divide(rTwoMag, p), subtract(1, cos(deltaV))));
	//var f = 1 - (rTwoMag / p) * (1 - Math.cos(deltaV));

	// Change parameter to keep units consistent
	//gravitationalParameter = gravitationalParameter * convertTime("Y", "S", -2);

	// Calculate more variables that don't have a physical correlate - see previous maths comment
	var g = divide(
		multiply(multiply(rOneMag, rTwoMag), sin(deltaV)),
		pow(multiply(gravParam, p), 0.5),
	);
	//var g = rOneMag * rTwoMag * Math.sin(deltaV) / Math.pow(gravitationalParameter * p, 0.5);
	var fDot = multiply(
		multiply(pow(divide(gravParam, p), 0.5), tan(divide(deltaV, 2))),
		subtract(
			subtract(
				divide(subtract(1, cos(deltaV)), p),
				divide(parseScalarInput(1, ''), rOneMag),
			),
			divide(parseScalarInput(1, ''), rTwoMag),
		),
	);
	var deltaE = invCos(
		subtract(
			1,
			multiply(divide(rOneMag, a), subtract(parseScalarInput(1, ''), f)),
		),
	);
	if (
		invSin(
			divide(
				multiply(multiply(-1, rOneMag), multiply(rTwoMag, fDot)),
				pow(multiply(gravParam, a), 0.5),
			),
		).value < 0
	) {
		// Check to see if it should flip it - in the dead zone of arccos
		deltaE.value = 2 * Math.PI - deltaE.value;
	}

	// Calculate transfer time
	var t = add(
		g,
		multiply(
			pow(divide(pow(a, 3), gravParam), 0.5),
			subtract(deltaE, sin(deltaE)),
		),
	);

	if (a.value < 0) {
		// Calculate it differently if it's hyperbolic
		var deltaF = Math.acosh(
			outputScalar(
				subtract(1, multiply(divide(rOneMag, a), subtract(1, f))),
				'',
			),
		);
		if (deltaF < 0) {
			deltaF = 2 * Math.PI + deltaF;
		}
		t = add(
			g,
			multiply(
				pow(divide(multiply(-1, pow(a, 3)), gravParam), 0.5),
				Math.sinh(deltaF) - deltaF,
			),
		);
	}

	// Return the time, converting it into the years used
	return t;
}

function secondTransferStage(
	nameOne,
	nameTwo,
	dTimeIncrement,
	tTimeIncrement,
	miscData,
	calcData,
) {
	// Complete the second stage of the transfer calculations

	// Log how many calculations used in stage one
	console.log('Stage 1 Complete: ' + totalCalculations + ' windows analysed');
	var stageOneCalcs = totalCalculations;

	// Set a flag saying that it's in the second stage of the transfer calculations
	inSecondStage = true;

	// Get extra data in
	var secondResolution = miscData.secondResolution;

	// For each of the top transfer windows
	for (var index in storedWindows) {
		calcData.index = index;

		// Get the next window
		var primaryWindow = storedWindows[index];

		// Find the initial time values
		var initialTransTime = primaryWindow.rawTTime;
		var initialDeptTime = primaryWindow.rawDTime;

		// Find the new time increments
		var newDTimeInc = dTimeIncrement / secondResolution;
		var newTTimeInc = tTimeIncrement / secondResolution;

		// Iterate through all of the smaller transit windows
		for (var dIndex = 0; dIndex < secondResolution; dIndex++) {
			var newDTime = initialDeptTime + dIndex * newDTimeInc;

			for (var tIndex = 0; tIndex < secondResolution; tIndex++) {
				var newTTime = initialTransTime + tIndex * newTTimeInc;

				if (tIndex == 0 && dIndex == 0) {
					// If it's the first one, it's already been calculated

					var formatData = primaryWindow;

					var deltaVee = parseScalarInput(
						primaryWindow.deltaVee,
						'M/S',
					);

					if (deltaVee.value < lowestDeltaVee.value) {
						// If it's better, set it as the new best
						lowestDeltaVee = deltaVee;
						lowestData = formatData;
					}
				} else {
					// Calculate again - this time it will find the highest value
					calculateTransferWindow(
						newDTime,
						newTTime,
						nameOne,
						nameTwo,
						calcData,
					);
				}
			}
		}
	}

	// Log the total calculations needed for stage two
	console.log(
		'Stage 2 Complete: ' +
			(totalCalculations - stageOneCalcs) +
			' windows analysed',
	);

	// Finish the calculations off for the best transfer window
	finaliseTransferCalc();
}

function finaliseTransferCalc() {
	console.log('Deriving Parameters...');

	finishLambertCalculation();

	// Keep track  of name data for eventual display
	//lowestData["nameOne"] = nameOne;
	//lowestData["nameTwo"] = nameTwo;

	// Open up the user UI and let them use it again
	if (!webVR) {
		document.getElementById('shipViewDiv').style.display = 'block';
	}
	document.getElementById('loadingScreen').style.display = 'none';
	document.getElementById('loadingScreenAux').style.display = 'none';
	document.getElementById('disabledCover').style.display = 'none';

	// Let the user know it's done
	console.log(
		'Lambert Transfer Calculated: ' +
			round((new Date().getTime() - transTime.getTime()) / 1000, 2) +
			's',
	);
	console.log('Calculated with ' + totalCalculations + ' windows analysed');
	swal({
		title: 'Transfer Calculated',
		html: 'Look at the simulation for the gray ship and its orbit, or the bottom right for the &Delta;V Breakdown',
		type: 'success',
	}).then((result) => {
		if (result.value) {
			// Resume simulation running
			endTransferCalc();
		}
	});
}

function finishLambertCalculation() {
	// Finalise the lambert calculation for display

	var center = planets[lowestData['nameOne']]['center'];

	// Extract the position and velocity vectors for ease
	var r = lowestData['pos'];
	var v = lowestData['vel'];

	var r2 = lowestData['pos2'];
	var v2 = lowestData['vel2'];

	// Log the data just to be sure for debugging
	console.log(lowestData);

	// Initialise the final choices
	var selectedR;
	var selectedV;
	var selectedTime;

	if (magnitude(r) < magnitude(r2)) {
		// Look at the higher energy planet, tends to be more accurate (not by much, but a bit)
		selectedR = r;
		selectedV = v;
		selectedTime = lowestData['depTime'];
	} else {
		selectedR = r2;
		selectedV = v2;
		selectedTime = lowestData['capTime'];
	}

	selectedR = r;
	selectedV = v;
	selectedTime = lowestData['depTime'];

	// Upon recieveing parameters, proceed to return data and signal success
	lowestData['params'] = paramsFromVec(
		selectedR,
		selectedV,
		selectedTime,
		center,
	);

	// Return data to IP or IL transfer
	returnData = lowestData;
	transitData = lowestData;
}

function paramsFromVec(r, v, time, center) {
	// Calculate orbital parameters given orbital state vectors and a given time
	// IMPORTANT NOTE - I will try to explain the equations, but the derivations/explanations are not here (because that's not what this is). It's in the credits section BTW

	// Get the gravitational parameter and convert it to the needed units
	var gravitationalParameter = findGravParam(center);
	gravitationalParameter = M3S2toAU3Y2(gravitationalParameter);

	// Define some needed axes
	var z = [0, 0, 1];
	var x = [1, 0, 0];

	// H is the angular momentum vector (without the mass)
	var h = crossProduct(r, v);

	if (h[0] == 0 && h[1] == 0) {
		// If angular velocity is straight up, deflect negligibly to avoid divide by 0 errors
		h = [0, 0.0000000000001, 1];
	}

	// N is the nodes vector - point towards ascending node with relation to the ecliptic
	var n = crossProduct(z, h);

	// Eccentricity is split to make it more easily maintainable
	var ePartOne = multiplyVec(
		Math.pow(magnitude(v), 2) - gravitationalParameter / magnitude(r),
		r,
	);
	var ePartTwo = multiplyVec(dotProduct(r, v), v);

	// E is the eccentricity vector - points at the periapsis with a magnitude equal to the eccentricity
	var e = multiplyVec(1 / gravitationalParameter, subVec(ePartOne, ePartTwo));

	// A is the semi-major axis, this is a reverse vis-viva equation
	var a =
		1 /
		(2 / magnitude(r) - Math.pow(magnitude(v), 2) / gravitationalParameter);

	// I is the orbital inclination
	var i = RtoD(Math.acos(h[2] / magnitude(h)));

	// L is the mean longitude at epoch - NOTE THAT THIS EQUATION IS NOT USED, L is calculated separately
	var L =
		(360 +
			RtoD(Math.acos(dotProduct(e, r) / (magnitude(e) * magnitude(r))))) %
		360;

	// Calculate the longitude of the Ascending Node
	var loAN = (360 + RtoD(Math.acos(n[0] / magnitude(n)))) % 360;
	if (n[1] < 0) {
		// Flip to loAN if it is around the way, the inverse cos function can't explain everytihing
		loAN = 360 - loAN;
	}

	// Make sure it's got the right magnitude (0-loAN-360)
	loAN = loAN % 360;

	// Calculate the longitude of the PEriapsis
	var aoPE = RtoD(
		Math.acos(dotProduct(n, e) / (magnitude(n) * magnitude(e))),
	);
	if (e[2] < 0) {
		aoPE = 360 - aoPE;
	}

	var loPE = (aoPE + loAN) % 360;

	var params = {
		// Set the parameters
		e: magnitude(e),
		a: a,
		i: i,
		loAN: loAN,
		loPE: loPE % 360,
	};

	// Find the position at a given time
	var A = RtoD(Math.acos(dotProduct(e, r) / (magnitude(e) * magnitude(r))));
	if (dotProduct(r, v) < 0) {
		A = 360 - A;
	}
	var rL = (A + loPE) % 360;

	// Initialise the ship
	planets['ship'] = params;
	planets['ship']['center'] = center;
	planets['ship']['epoch'] = time;
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};

	// Clear the ship out - it was needed only for the existing functions to run
	delete planets['ship'];

	// Return the correct parameters
	params['rL'] = rL;
	return params;
}

function calculateEscapeVelocity(centerBody, initalRadiusAbove) {
	// Calculate the escape velocity of a body

	// Get initial data
	var r = planets[centerBody]['r'] * convertDistance('AU', 'KM', 1);
	var gravParam = findGravParam(centerBody);

	// Calculate the total radius
	var radiusTotal = (r + initalRadiusAbove) * convertDistance('KM', 'M', 1);

	// Plug it into the escape velocity formula
	var deltaVee =
		Math.pow((2 * gravParam) / radiusTotal, 0.5) -
		Math.pow(gravParam / radiusTotal, 0.5);

	return deltaVee;
}

function calculateExtraVelocity(velocity, name, radius) {
	// Calculate the excess velocity at the bottom of a hyperbolic trajectory given the velocity at insertion

	// Get inital numbers
	var SOIGravParam = findGravParam(name);
	var insertionVelocity = velocity;

	// Find the size of the SOI and the velocity at the edge
	var planetSOI = planets[name]['SOI'] * convertDistance('AU', 'M', 1);
	var exitSOIA =
		1 / (2 / planetSOI + Math.pow(insertionVelocity, 2) / SOIGravParam);

	// Calculate height above the planet
	var planetRadius = planets[name]['r'] * convertDistance('AU', 'KM', 1);
	var radiusTotal = (planetRadius + radius) * convertDistance('KM', 'M', 1);

	// Calculate the speed at exiting the SOI
	var deltaVeeExit = Math.pow(
		SOIGravParam * (2 / radiusTotal + 1 / exitSOIA),
		0.5,
	);

	// Return the speed without the escape velcity - this is the hyperbolic EXCESS velocity
	return deltaVeeExit - Math.pow((2 * SOIGravParam) / radiusTotal, 0.5);
}

// Primary Interplanetary Transfer Calculator

function calculateIPTransfer() {
	// Calculate an interplanetary transfer

	// Set the initial transit time - this is used for evaluating efficiency
	transTime = new Date();

	// Stop a transit if one is in progress
	if (shipEndTime) {
		endShipTransit();
	}

	// Hide the delta vee display, to reset
	document.getElementById('deltaVeeDisplay').style.display = 'none';

	// Clear maneuvers list
	var maneuvers = [];

	// Import and format names correctly
	var properNameTwo = document
		.getElementById('toTarget')
		.value.replace('The ', '');
	var nameOne = document.getElementById('fromTarget').value.toLowerCase();
	var nameTwo = document.getElementById('toTarget').value.toLowerCase();

	// Decide which mode of Lambert calculation should be used
	twoStage = !document.getElementById('IPPorkchop').checked;

	if (nameOne == nameTwo) {
		// Stop them fron transferring between the same planets - doesn't really work
		swal('Error', 'You must select two different planets', 'error');
	} else {
		// Import parking orbit parameters
		var fromRadius = document.getElementById('fromDistanceAbove').value;
		var toRadius = document.getElementById('fromDistanceAbove').value;

		// Add Trans-NAME Injection to the maneuvers list - This is moving out to escape velocity
		maneuvers.push({
			name: 'T' + properNameTwo[0] + 'I',
			title: 'Trans-' + properNameTwo + ' Injection',
			deltaVee: calculateEscapeVelocity(nameOne, fromRadius),
		});

		// Stop people from activating transfer  too many times
		document.getElementById('IPTransferButton').disabled = true;
		document.getElementById('ILTransferButton').disabled = true;

		// Run the main transfer engine
		calculateLambertTransfer(nameOne, nameTwo, fromRadius, toRadius);

		storedTransferData = {
			maneuvers: maneuvers,
			nameOne: nameOne,
			nameTwo: nameTwo,
			properNameTwo: properNameTwo,
			fromRadius: fromRadius,
			toRadius: toRadius,
		};

		delayIPTransfer();
	}
}

function delayIPTransfer() {
	// Set timeouts to get the results afterwards - Lambert uses these to stop program shutdown during computation
	if (twoStage) {
		setTimeout(function () {
			setTimeout(function () {
				finishIPTransfer();
			}, 0);
		}, 0);
	} else {
		setTimeout(function () {
			setTimeout(function () {
				finishIPTransfer();
			}, 0);
		}, 0);
	}
}

function finishIPTransfer() {
	// Finish off the IP Transfer

	// Parse stored data
	var maneuvers = storedTransferData.maneuvers;
	var nameOne = storedTransferData.nameOne;
	var nameTwo = storedTransferData.nameTwo;
	var properNameTwo = storedTransferData.properNameTwo;
	var fromRadius = storedTransferData.fromRadius;
	var toRadius = storedTransferData.toRadius;

	// Keep the returned data in a local variable
	var array = returnData;

	// Calculate the extra velocity needed for the transfer (note that these two both happen at once from the parking orbit)
	var deltaVeeExit = calculateExtraVelocity(array['TO'], nameOne, fromRadius);
	maneuvers.push({
		// Add NAME Transfer orbit in the maneuvers list
		name: properNameTwo[0] + 'TO',
		title: properNameTwo + ' Transfer Orbit',
		deltaVee: deltaVeeExit,
	});

	// Set ship parameters
	shipParameters = array['params'];

	// Find hyperbolic excess velocity at arrival
	var deltaVeeEnter = calculateExtraVelocity(array['CO'], nameTwo, toRadius);

	// Add the next two maneuvers - Both occur at the final parking orbit
	maneuvers.push({
		name: properNameTwo[0] + 'CO',
		hide: document.getElementById('IPAero').checked,
		title: properNameTwo + ' Capture Orbit',
		deltaVee: deltaVeeEnter,
	});
	maneuvers.push({
		name: properNameTwo[0] + 'OI',
		hide: document.getElementById('IPAero').checked,
		title: properNameTwo + ' Orbit Insertion',
		deltaVee: calculateEscapeVelocity(nameTwo, toRadius),
	});

	// Show the maneuver list
	displayManeuvers(maneuvers, array);

	// Start the ship display
	shipCenter = 'sun';
	startShipDisplay(array['depTime'], array['capTime'], array['capTime']);

	// Reset everything for more transfers
	document.getElementById('IPTransferButton').disabled = false;
	document.getElementById('ILTransferButton').disabled = false;

	// Calculate total delta vee
	var DV =
		calculateEscapeVelocity(nameTwo, toRadius) +
		deltaVeeExit +
		deltaVeeEnter +
		calculateEscapeVelocity(nameOne, fromRadius);

	// Print the porkchop
	printPorkchop(array.dTime, array.tTime, returnData['deltaVee']);
}

// Primary Interlunar Transfer Calculator

function calculateILTransfer() {
	// Calculate an interlunar transfer

	// Set the initial transit time - this is used for evaluating efficiency
	transTime = new Date();

	// Important note - Orbit is now deprecated, but not removed
	// It's just that the name "orbit" can never be selected

	if (shipEndTime) {
		// Stop transfers in progress, if any
		endShipTransit();
	}

	// Hide the DV display
	document.getElementById('deltaVeeDisplay').style.display = 'none';

	// Clear maneuvers list
	var maneuvers = [];

	// Import and fix names
	var properNameOne = document
		.getElementById('fromILTarget')
		.value.replace('The ', '');
	var properNameTwo = document
		.getElementById('toILTarget')
		.value.replace('The ', '');
	var nameOne = document.getElementById('fromILTarget').value.toLowerCase();
	var nameTwo = document.getElementById('toILTarget').value.toLowerCase();

	// Decide which mode of Lambert calculation should be used
	twoStage = !document.getElementById('ILPorkchop').checked;

	if (nameOne == nameTwo && nameOne != 'orbit') {
		// Make sure they don't pick the same moon
		swal('Error', 'You must select two different moons', 'error');
	} else {
		// Pick the center
		var center = document.getElementById('ILCenter').value.toLowerCase();

		// Initalise semi-major axis veriables
		var aOne;
		var aTwo;

		// Determine semi-major axes
		if (nameOne == 'orbit') {
			aOne =
				planets[center]['r'] +
				document.getElementById('fromDistanceAboveIL').value *
					convertDistance('KM', 'AU', 1);
		} else {
			aOne = planets[nameOne]['a'];
		}
		if (nameTwo == 'orbit') {
			aTwo =
				planets[center]['r'] +
				document.getElementById('toDistanceAboveIL').value *
					convertDistance('KM', 'AU', 1);
		} else {
			aTwo = planets[nameTwo]['a'];
		}

		// Correct orbital parameters if orbit selected - NOTE: this just assumes a simple orbit for simplicity
		if (nameOne == 'orbit') {
			nameOne = 'orbit1';
			planets[nameOne] = {
				a: aOne,
				loAN: 0,
				L: 0,
				loPE: 0,
				i: 0,
				e: 0,
				center: center,
			};
			generateOrbitalCoords(nameOne);
			generateOrbitalTimes(nameOne);
		}
		if (nameTwo == 'orbit') {
			nameTwo = 'orbit2';
			planets[nameTwo] = {
				a: aTwo,
				loAN: 0,
				L: 0,
				loPE: 0,
				i: 0,
				e: 0,
				center: center,
			};
			generateOrbitalCoords(nameTwo);
			generateOrbitalTimes(nameTwo);
		}

		// Keep track of inital and final parking orbit distance
		var fromRadius = document.getElementById('fromDistanceAbove').value;
		var toRadius = document.getElementById('fromDistanceAbove').value;

		// Run main transfer engine
		calculateLambertTransfer(nameOne, nameTwo, fromRadius, toRadius);

		storedTransferData = {
			nameOne: nameOne,
			nameTwo: nameTwo,
			maneuvers: maneuvers,
			properNameTwo: properNameTwo,
			fromRadius: fromRadius,
			toRadius: toRadius,
			center: center,
		};

		delayILTransfer();
	}
}

function delayILTransfer() {
	// Set timeouts to get the results afterwards - Lambert uses these to stop program shutdown during computation
	if (twoStage) {
		setTimeout(function () {
			setTimeout(function () {
				finishILTransfer();
			}, 0);
		}, 0);
	} else {
		setTimeout(function () {
			setTimeout(function () {
				finishILTransfer();
			}, 0);
		}, 0);
	}
}

function finishILTransfer() {
	// Finish off the IL Transfer

	// Parse stored data
	var nameOne = storedTransferData.nameOne;
	var nameTwo = storedTransferData.nameTwo;
	var maneuvers = storedTransferData.maneuvers;
	var properNameTwo = storedTransferData.properNameTwo;
	var fromRadius = storedTransferData.fromRadius;
	var toRadius = storedTransferData.toRadius;
	var center = storedTransferData.center;

	// Clear orbital positions and numbers to stop program interference - they don't actually exist
	if (nameOne == 'orbit1') {
		delete orbitalPositions[nameOne];
		delete orbitalTimes[nameOne];
	}
	if (nameTwo == 'orbit2') {
		delete orbitalPositions[nameTwo];
		delete orbitalTimes[nameTwo];
	}

	// Set the ship parameters
	shipParameters = returnData['params'];

	// Deal with different maneuver names with each orbit
	if (nameOne != 'orbit1' && !planets[nameOne]['satellite']) {
		maneuvers.push({
			name: 'T' + properNameTwo[0] + 'I',
			title: 'Trans-' + properNameTwo + ' Injection',
			deltaVee: calculateEscapeVelocity(nameOne, fromRadius),
		});
	}

	if (nameTwo == 'orbit2' || planets[nameTwo]['satellite'] == true) {
		if (nameOne != 'orbit1' && !planets[nameOne]['satellite']) {
			var deltaVeeExit = calculateExtraVelocity(
				returnData['TO'],
				nameOne,
				fromRadius,
			);
			maneuvers.push({
				name: 'Hohmann Transfer',
				title: 'Hohmann Transfer',
				deltaVee: deltaVeeExit,
			});
		} else {
			maneuvers.push({
				name: 'Hohmann Transfer',
				title: 'Hohmann Transfer',
				deltaVee: returnData['TO'],
			});
		}
	} else {
		if (nameOne == 'orbit1' || planets[nameOne]['satellite'] == true) {
			maneuvers.push({
				name: properNameTwo[0] + 'TO',
				title: properNameTwo + ' Transfer Orbit',
				deltaVee: returnData['TO'],
			});
		} else {
			deltaVeeExit = calculateExtraVelocity(
				returnData['TO'],
				nameOne,
				fromRadius,
			);
			maneuvers.push({
				name: properNameTwo[0] + 'TO',
				title: properNameTwo + ' Transfer Orbit',
				deltaVee: deltaVeeExit,
			});
		}
	}

	// Deal with maneuvers and names, still
	if (nameTwo == 'orbit2') {
		maneuvers.push({
			name: 'Circularizing',
			title: 'Circularizing',
			deltaVee: returnData['CO'],
			hide: document.getElementById('ILAero').checked,
		});
	} else if (planets[nameTwo]['satellite'] == true) {
		maneuvers.push({
			name: 'Matching Orbits',
			title: 'Matching Orbits',
			hide: document.getElementById('ILAero').checked,
			deltaVee: returnData['CO'],
		});
	} else {
		deltaVeeExit = calculateExtraVelocity(
			returnData['CO'],
			nameTwo,
			fromRadius,
		);

		maneuvers.push({
			name: properNameTwo[0] + 'CO',
			title: properNameTwo + ' Capture Orbit',
			hide: document.getElementById('ILAero').checked,
			deltaVee: deltaVeeExit,
		});
	}

	if (nameTwo != 'orbit2' && !planets[nameTwo]['satellite']) {
		maneuvers.push({
			name: properNameTwo[0] + 'OI',
			title: properNameTwo + ' Orbit Insertion',
			hide: document.getElementById('ILAero').checked,
			deltaVee: calculateEscapeVelocity(nameTwo, toRadius),
		});
	}

	// Keep total delta-vee
	var DV = Number(displayManeuvers(maneuvers, returnData));

	// Remove the orbits from the planet list
	delete planets['orbit1'];
	delete planets['orbit2'];

	// Set ship data
	shipCenter = center;

	// Move on to displaying the ship
	startShipDisplay(returnData.depTime, returnData.capTime);

	// Print the porkchop plot
	printPorkchop(returnData.dTime, returnData.tTime, returnData['deltaVee']);
}

// Ballistic Transfer Orbital Position Calculator

function findShipLocation() {
	// Find where the ship should be at a given time

	// Get the current time, and if there is no such time, use now
	var time = currentTime;
	if (Object.prototype.toString.call(time) !== '[object Date]') {
		time = new Date(time);
	}

	// Use the existing planet finding function - the fact that this function exists is just slightly a bit of a throw new Error("Something bad happened.")back
	var array = findPlanetLocation('ship', currentTime);

	// Return the array
	return array;
}

// Porkchop Functions

function printPorkchop(bestDeptTime, bestTransitTime, minDV) {
	// Print the entire porkchop plot

	if (!loggedTransfer && !twoStage) {
		var originalDeptKeys = Object.keys(transitWindows);
		var originalTransKeys = Object.keys(transitWindows[0]);

		if (Object.keys(transitWindows).length == 100) {
			for (var deptTimeIndex in originalDeptKeys) {
				// Iterate through all departure times

				var topRow = deptTimeIndex == 0;
				var bottomRow = deptTimeIndex == originalDeptKeys.length - 1;

				var deptTime = Number(originalDeptKeys[Number(deptTimeIndex)]);

				var nextDeptTime = Number(
					originalDeptKeys[Number(deptTimeIndex) + 1],
				);
				var newDeptTime = Number(nextDeptTime + deptTime) / 2;

				transitWindows[newDeptTime] = {};

				for (var transitTimeIndex in originalTransKeys) {
					// Iterate through all 200x200 transits
					var leftColumn = transitTime == 0;
					var rightColumn =
						transitTime == originalTransKeys.length - 1;

					var transitTime = Number(
						originalTransKeys[Number(transitTimeIndex)],
					);

					var nextTransitTime = Number(
						originalTransKeys[Number(transitTimeIndex) + 1],
					);
					var newTransitTime = (nextTransitTime + transitTime) / 2;

					if (!rightColumn && !bottomRow) {
						var deltaVees = [];

						if (!bottomRow) {
							deltaVees.push(
								transitWindows[nextDeptTime][transitTime],
							);
						}

						deltaVees.push(transitWindows[deptTime][transitTime]);

						var totalDV = 0;
						for (var index in deltaVees) {
							if (deltaVees[index]) {
								totalDV += deltaVees[index].deltaVee;
								if (
									!validTransfer(deltaVees[index]) &&
									!deltaVees[index].filler
								) {
									totalDV = Infinity;
								}
							}
						}
						var newDV = totalDV / deltaVees.length;

						transitWindows[newDeptTime][transitTime] = {
							deltaVee: newDV,
							misc: {},
							filler: true,
						};
					}
				}
			}

			originalDeptKeys = Object.keys(transitWindows);
			originalTransKeys = Object.keys(transitWindows[0]);

			for (var deptTimeIndex in originalDeptKeys) {
				// Iterate through all departure times

				var topRow = deptTimeIndex == 0;
				var bottomRow = deptTimeIndex == originalDeptKeys.length - 1;

				var deptTime = Number(originalDeptKeys[Number(deptTimeIndex)]);

				var nextDeptTime = Number(
					originalDeptKeys[Number(deptTimeIndex) + 1],
				);
				var newDeptTime = Number(nextDeptTime + deptTime) / 2;

				for (var transitTimeIndex in originalTransKeys) {
					// Iterate through all 200x200 transits
					var leftColumn = transitTime == 0;
					var rightColumn =
						transitTime == originalTransKeys.length - 1;

					var transitTime = Number(
						originalTransKeys[Number(transitTimeIndex)],
					);

					var nextTransitTime = Number(
						originalTransKeys[Number(transitTimeIndex) + 1],
					);
					var newTransitTime = (nextTransitTime + transitTime) / 2;

					if (!rightColumn && !bottomRow) {
						var deltaVees = [];

						if (!rightColumn) {
							deltaVees.push(
								transitWindows[deptTime][nextTransitTime],
							);
						}

						deltaVees.push(transitWindows[deptTime][transitTime]);

						var totalDV = 0;
						for (var index in deltaVees) {
							if (deltaVees[index]) {
								totalDV += deltaVees[index].deltaVee;

								if (
									!validTransfer(deltaVees[index]) &&
									!deltaVees[index].filler
								) {
									totalDV = Infinity;
								}
							}
						}
						var newDV = totalDV / deltaVees.length;

						transitWindows[deptTime][newTransitTime] = {
							deltaVee: newDV,
							misc: {},
							filler: true,
						};
					}
				}
			}
		}

		// Get canvas context
		var c = document.getElementById('porkchop');
		var ctx = c.getContext('2d');
		ctx.clearRect(0, 0, c.width, c.height);

		// Colour gradients in multiples of minimum delta vee
		var colours = {
			'1.0': [0, 51, 204],
			1.3: [0, 153, 255],
			'2.0': [0, 255, 0],
			'4.0': [255, 255, 0],
			'8.0': [255, 51, 0],
		};

		// Note - Actual co-ordinates of current position
		var x = 0;
		var y = document.getElementById('porkchop').height;

		// The width and height of each transit window on the plot
		var width =
			document.getElementById('porkchop').width /
			Object.keys(transitWindows).length;
		var height =
			document.getElementById('porkchop').height /
			Object.keys(transitWindows['0']).length;

		var deptKeys = Object.keys(transitWindows).sort(function (x, y) {
			x = Number(x);
			y = Number(y);
			if (x < y) {
				return -1;
			}
			if (x > y) {
				return 1;
			}
			return 0;
		});
		var transitKeys = Object.keys(transitWindows[0]).sort(function (x, y) {
			x = Number(x);
			y = Number(y);
			if (x < y) {
				return -1;
			}
			if (x > y) {
				return 1;
			}
			return 0;
		});

		for (var deptTimeIndex in deptKeys) {
			// Iterate through all departure times
			var deptTime = deptKeys[deptTimeIndex];

			for (var transitTimeIndex in transitKeys) {
				// Iterate through all 200x200 transits

				var transitTime = transitKeys[transitTimeIndex];

				if (!isNaN(deptTime) && !isNaN(transitTime)) {
					// Find the current Delta Vee (DV)
					var curDV =
						transitWindows[deptTime][transitTime]['deltaVee'];

					// Select correct colour number
					var index = 0;
					var value = curDV / minDV;
					while (value >= Number(Object.keys(colours)[index])) {
						// Select colour range
						index += 1;
					}

					// Set real colour
					var currentColour = [];

					// Find the minimum and maxiumum bounds
					var minBound = Object.keys(colours)[index - 1];
					var maxBound = Object.keys(colours)[index];

					// Check to see if it's valid
					var isValid =
						validTransfer(transitWindows[deptTime][transitTime]) ||
						transitWindows[deptTime][transitTime].filler;

					// Calculate colour
					if (isValid && index == 0) {
						// If it's the smallest, use the lowest colour

						currentColour = colours[Object.keys(colours)[0]];
					} else if (isValid && index < Object.keys(colours).length) {
						// Find the colour calculated

						for (var i = 0; i < 3; i++) {
							currentColour[i] = calculateColour(
								colours[minBound][i],
								colours[maxBound][i],
								minBound,
								maxBound,
								curDV / minDV,
							);
						}
					} else {
						// If it's invalid, pick the largest colour, as it failed (and is likely a hyperbola - v. high delta vee)

						currentColour =
							colours[
								Object.keys(colours)[
									Object.keys(colours).length - 1
								]
							];
					}

					// Place a pixel on the porkchop
					ctx.fillStyle =
						'rgb(' +
						currentColour[0] +
						',' +
						currentColour[1] +
						',' +
						currentColour[2] +
						')';
					ctx.fillRect(
						Math.ceil(x),
						Math.ceil(y),
						Math.ceil(width),
						Math.ceil(height),
					);
					y -= height;
				}
			}

			// Reset the y and add another onto the X
			y = document.getElementById('porkchop').height;
			x += width;
		}

		// Find location of best transfer
		var firstIndex = deptKeys.indexOf(String(bestDeptTime));

		var centerX = firstIndex * width;
		var centerY =
			document.getElementById('porkchop').height -
			transitKeys.indexOf(String(bestTransitTime)) * height;

		// Draw the circle around the selected transit
		ctx.beginPath();
		ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI, false);
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.stroke();

		// Label the selected transit
		ctx.font = '15px Arial';
		ctx.fillStyle = '#ffffff';

		var xDisp = centerX + 7;
		var text = round(minDV, 0) + 'm/s';
		if (centerX > document.getElementById('porkchop').width / 2) {
			// Flip depending on which side the best is
			xDisp = centerX - ctx.measureText(text).width - 7;
		}
		ctx.fillText(text, xDisp, centerY - 7);

		var printer = '<tr><td>Key</td><td>&Delta; (m/s)</td></tr>';

		for (var i in colours) {
			// Print the key
			var DVrange = round(minDV * Number(i), 0);
			if (i == Object.keys(colours)[Object.keys(colours).length - 1]) {
				DVrange += '+';
			}

			var colour =
				'rgb(' +
				colours[i][0] +
				',' +
				colours[i][1] +
				',' +
				colours[i][2] +
				')';
			printer +=
				'<tr><td><svg width="12px" height="12px"><g><rect height="18px" width="18px" style="fill:' +
				colour +
				';"></rect></g></svg></td><td>' +
				DVrange +
				'</td></tr>';
		}

		document.getElementById('porkchopKey').innerHTML = printer;

		for (var deptTime in transitWindows) {
			// Iterate through all departure times

			for (var transitTime in transitWindows[deptTime]) {
				// Iterate through all 200x200 transits

				if (transitWindows[deptTime][transitTime].filler) {
					delete transitWindows[deptTime][transitTime];
				}
			}
			if (Object.keys(transitWindows[deptTime]).length == 0) {
				delete transitWindows[deptTime];
			}
		}
	}
}

function calculateColour(start, end, min, max, cur) {
	// Calculate the correct shade:
	// Min, Max and Current are the start, end and current point in the region
	// Start and End are the colour value start and end
	return Math.round((end - start) * ((cur - min) / (max - min)) + start);

	// This doesn't seem clear, but it looks better elsewhere - just trust the maths
}

function logCourse(x, y) {
	// This is a debugging function - logs transfer data of clicked area on porkchop plot to console
	// Given X and Y of mouse click event (relative to screen)
	var boundingRect = document
		.getElementById('porkchop')
		.getBoundingClientRect();

	// Calculate the x and y relative to the porkchop itself
	x = x - boundingRect.left;
	y = document.getElementById('porkchop').height - (y - boundingRect.top);

	// Pixels per transit window for vertical and horizontal axies
	var width =
		document.getElementById('porkchop').width /
		Object.keys(transitWindows).length;
	var height =
		document.getElementById('porkchop').height /
		Object.keys(transitWindows['0']).length;

	// Calculates number of transit window (round for safety)
	var deptTimeNum = Math.round(x / width);
	var transitTimeNum = Math.round(y / height);

	// Find the transit window coordinates
	var deptTime = Object.keys(transitWindows)[deptTimeNum];
	var transitTime = Object.keys(transitWindows[deptTime])[transitTimeNum];

	// Log it
	var storedData = transitWindows[deptTime][transitTime];

	if (displayLoggedCourse) {
		if (validTransfer(storedData)) {
			loggedTransfer = true;
			lowestData = storedData;
			resetShipSystems();
			finishLambertCalculation();
			if (planets[storedData.nameOne].center == 'sun') {
				finishIPTransfer();
			} else {
				finishILTransfer();
			}
		} else {
			swal(
				'Sorry',
				"You can't take a look at this transfer. Please try another!",
				'warning',
			);
		}
	} else {
		console.log(storedData);
	}
}

function validTransfer(transferData) {
	return (
		!isNaN(transferData.misc.p) &&
		transferData.numTries > 0 &&
		transferData.a > 0 &&
		transferData.misc.p < transferData.misc.highP &&
		transferData.misc.p > transferData.misc.lowP
	);
}

// Ballistic UI Display Functions

function displayManeuvers(maneuvers, transitDetails) {
	// Display the Delta V's calculated

	// Initalise display
	document.getElementById('deltaVeeDisplay').style.display = 'block';
	if (twoStage) {
		document.getElementById('retractDetails').style.display = 'none';
	} else {
		document.getElementById('retractDetails').style.display = 'block';
	}
	document.getElementById('DVTitle').innerHTML = '&Delta;V Breakdown';

	// Set total tracking to zero
	var totalDeltaVee = 0;

	// Start the printer with the talb eheaders
	var printer = "<tr><td><table style='text-align:left;'>";
	printer +=
		'<tr><td><h3>Maneuver</h3></td><td><h3>&Delta;V (m/s)</h3></td></tr>';
	for (var index in maneuvers) {
		// Run through all of the maneuvers
		if (maneuvers[index]['deltaVee'] > 0.001) {
			// Hide any negligible maneuvers (1mm/s is negligible)

			// No tooltip unless the maneuver has a title - in which case it's the title
			var toolTip = '';
			if (maneuvers[index]['title'] != undefined) {
				// Add a tooltip if specified
				toolTip = maneuvers[index]['title'];
			}

			var colour = '#ffffff';
			if (maneuvers[index]['hide'] == true) {
				// Colour maneuvers paler if it is hidden/irrelevant (like for aerobraking)
				colour = '#888888';
			} else {
				totalDeltaVee += parseFloat(maneuvers[index]['deltaVee']); // If not hidden, add it to the total
			}

			// Add the actual maneuver as another table row
			printer +=
				"<tr title='" +
				toolTip +
				"' style='color:" +
				colour +
				"'><td title='" +
				toolTip +
				"'>" +
				maneuvers[index]['name'] +
				"</td><td title='" +
				toolTip +
				"'>" +
				round(maneuvers[index]['deltaVee'], 3) +
				'</td></tr>';
		}
	}

	// Display the total
	totalDeltaVee = round(totalDeltaVee, 3);
	printer +=
		'<tr><td>Total</td><td>' +
		totalDeltaVee +
		'</td></tr></table></td></tr>';

	printer += '<tr><td><table>';
	printer += '<tr><td><h3>Transit Time</h3></td></tr>';

	if (planets[transitDetails.nameOne].center == 'sun') {
		printer +=
			'<tr><td>' +
			round(transitDetails['tTime'] * convertTime('Y', 'Mo'), 1) +
			'</td><td>months</td></td></tr>';
	}
	printer +=
		'<tr><td>' +
		round(transitDetails['tTime'] * convertTime('Y', 'W'), 1) +
		'</td><td>weeks</td></td></tr>';
	printer +=
		'<tr><td>' +
		round(transitDetails['tTime'] * convertTime('Y', 'D'), 1) +
		'</td><td>days</td></td></tr>';
	if (planets[transitDetails.nameOne].center != 'sun') {
		printer +=
			'<tr><td>' +
			round(transitDetails['tTime'] * convertTime('Y', 'H'), 1) +
			'</td><td>hours</td></td></tr>';
	}
	printer += '</table></td></tr>';

	if (!loggedTransfer) {
		// Actually push it to the display
		document.getElementById('maneuverDisplay').innerHTML = printer;
	}

	// Return the total number for use in the transfer calculators
	return totalDeltaVee;
}

function calculateShipCoords(shipParams) {
	// Calculate the ship's coordinates

	// Store the center, and set the ship's center to the sun temporarily
	// This is because positions already have axial tilt included, so centering it on the planet would make it double count it
	var center = shipParams['center'];
	shipParams['center'] = 'sun';

	// Create a ship for running through existing functions
	planets['ship'] = shipParams;
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};

	// Iterate through all degree points and calculate where the ship should be
	var degree = 360;
	var coords = [];
	while (degree > 0) {
		degree -= 1 / orbitResolution;
		var array = calculateOrbitalPositionVector('ship', degree);

		coords.push(array);
	}

	// Reassign the center to be correct
	shipParams['center'] = center;

	// Return the data
	return coords;
}

// Ballistic UI Management Functions

function changeILCenter() {
	// Change central planet for an IL transfer - changes center as well

	// Set the center
	var centeredObject = document
		.getElementById('ILCenter')
		.value.toLowerCase();
	document.getElementById('centerSelect').value = centeredObject;

	//var printer = "<option value='orbit'>Orbit</option>";
	// Create the dropdowns needed for interlunar transfers
	var printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && centeredObject != 'sun' && name != 'ship') {
				if (planets[name]['center'] == centeredObject) {
					printer +=
						"<option value='" +
						capitalise(name) +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}
	document.getElementById('fromILTarget').innerHTML = printer;
	document.getElementById('toILTarget').innerHTML = printer;

	changeCenter();

	//updateDropdowns();
}

// Ballistic Graphics Display Functions

function startShipDisplay(startTime, endTime) {
	// Intitialize the ship display

	// Create the ship in the planets array
	planets['ship'] = shipParameters;
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};
	planets['ship']['center'] = shipCenter;

	// Add the ship to all the dropdowns
	sortPlanetData();
	updateDropdowns();
	updateLightMoon();

	// Calculate orbital positions and times
	orbitalPositions['ship'] = calculateShipCoords(shipParameters);
	generateOrbitalTimes('ship');

	// Develop the ship markers, path and geometry
	showShipPath(startTime, endTime);
}

function showShipPath(startTime, endTime) {
	// Show the ship path and the ship's geometry

	// Get the correct times
	shipStartTime = startTime;
	currentTime = startTime;
	displayTime = new Date(currentTime.getTime() + timeDiff);
	shipEndTime = endTime;

	// Set the marker scale
	var scale = shipParameters['a'] * markerScale;

	// Create the lens flare
	if (renderingLensFlares) {
		var flareColor = new THREE.Color(white);
		var textureFlare = textureLoader.load('assets/flares/planetFlare.png');
		var lensFlare = new THREE.Lensflare();
		lensFlare.addElement(
			new THREE.LensflareElement(
				textureFlare,
				1,
				0.0,
				flareColor,
				THREE.AdditiveBlending,
			),
		);
		lensFlare.castShadow = false;
		planets['ship']['lensFlare'] = lensFlare;
		scene.add(lensFlare);
		lensFlare.visible = false;
	}

	// Create the ship marker
	var geometry = shipGeometry(1);
	var markerMesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: shipColour,
			side: THREE.FrontSide,
			opacity: 1,
			transparent: true,
		}),
	);
	markerMesh.name = 'ship';
	markerMesh.position.set(0, 0, 0);
	markerMesh.size = 1;
	scene.add(markerMesh);

	// Set the surface and marker meshes into the planets array
	planets['ship']['markerMesh'] = markerMesh;
	planets['ship']['surfaceMesh'] = shipSurfaceMesh;

	if (shipParameters['center'] != 'sun') {
		// Adjust scaling if not centered on the sun
		var mod;
		if (shipAxis.x != 0) {
			mod = planets['ship']['surfaceMesh'].scale.y;
		} else if (shipAxis.y != 0) {
			mod = planets['ship']['surfaceMesh'].scale.x;
		} else if (shipAxis.z != 0) {
			mod = planets['ship']['surfaceMesh'].scale.x;
		}
		var newScale = mod * shipParameters['a'] * 10;
		planets['ship']['surfaceMesh'].scale.set(newScale, newScale, newScale);
	} else {
		var newScale = 6.685 * Math.pow(10, -8) * totalScale;
		planets['ship']['surfaceMesh'].scale.set(newScale, newScale, newScale);
	}

	// Deal with visibility and scaling of the surface and markers
	planets['ship']['surfaceMesh'].visible = true;
	planets['ship']['markerMesh'].scale.set(scale, scale, scale);

	createShipOrbit();

	// Start ship location tracking
	lastShipLocation = findShipLocation();
	earlierShipLocation = lastShipLocation;
}

function updateShipPath() {
	// Update where the ship's path, location and rotation

	// Update where the ship is supposed to be and the global variable (the global is Sol relative)
	var shipArray = findShipLocation();
	currentShipPosition = addVec(shipArray, currentPositions[shipCenter]);

	// Move the marker and lensFlare
	planets['ship']['markerMesh'].position.copy(
		threeVector(
			multiplyVec(
				totalScale,
				addVec(shipArray, currentPositions[shipCenter]),
			),
		),
	);
	if (planets['ship']['lensFlare']) {
		planets['ship']['lensFlare'].position.copy(
			planets['ship']['markerMesh'].position,
		);
	}
	planets['ship']['surfaceMesh'].position.copy(
		planets['ship']['markerMesh'].position,
	);

	// Set the rotation angle based on how far through it is
	shipRotAngle =
		(2 * Math.PI * (currentTime.getTime() - shipStartTime.getTime())) /
		(shipEndTime.getTime() - shipStartTime.getTime());

	// Align the ship with the orbit mark
	var directionVector = findVelocity('ship', currentTime);
	if (timeIncrement < 0) {
		directionVector = multiplyVec(-1, directionVector);
	}
	planets['ship']['markerMesh'].quaternion.setFromUnitVectors(
		new THREE.Vector3(0, 1, 0),
		threeVector(directionVector).clone().normalize(),
	);
	planets['ship']['surfaceMesh'].quaternion.setFromUnitVectors(
		shipAxis,
		threeVector(directionVector).clone().normalize(),
	);
	if (planets['ship'].surfaceMesh.children[0]) {
		if (planets['ship'].surfaceMesh.children[0].children[0].children[0]) {
			// If it's the Roci, turn it to make it look better
			planets[
				'ship'
			].surfaceMesh.children[0].children[0].children[0].quaternion.setFromAxisAngle(
				new THREE.Vector3(0, 0, 1),
				shipRotAngle,
			);
		}
	}

	//  Move the orbit path to keep with the central body
	planets['ship']['orbitMesh'].position.copy(
		threeVector(multiplyVec(totalScale, currentPositions[shipCenter])),
	);

	// If it's outside the transfer time, stop the transit
	if (
		currentTime.getTime() > shipEndTime.getTime() ||
		currentTime.getTime() < shipStartTime.getTime()
	) {
		endShipTransit();
	}

	if (planets['ship']) {
		// If the ship still exists (it has gotten halfway through only to have the ship deleted from under it)

		if (timeIncrement != 0) {
			// Switch to different tracking system if no time's passing
			earlierShipLocation = lastShipLocation;
			lastShipLocation = findShipLocation();
		} else {
			// Just keep it going normally
			lastShipLocation = earlierShipLocation;
		}
	}
}

function endShipTransit() {
	// Stop all ship transits and reset

	// Reset the scale of the global ship surface mesh
	shipSurfaceMesh.scale.set(10, 10, 10);

	// Hide the orbit and lens flare
	planets['ship']['orbitMesh'].visible = false;
	if (planets['ship']['lensFlare']) {
		planets['ship']['lensFlare'].visible = false;
	}

	// Disable software variables
	shipEndTime = false;

	// Hide ship related UI elements
	document.getElementById('shipViewDiv').style.display = 'none';
	document.getElementById('deltaVeeDisplay').style.display = 'none';

	// If it's looking at the ship
	if (cameraMode == 'shipCenter') {
		// Move back to the sun, or if it's around a planet, the planet

		if (planets['ship'].center != 'sun') {
			document.getElementById('centerSelect').value =
				planets['ship'].center;
			changeCenter();
			if (shouldShow(transitData['nameTwo'])) {
				document.getElementById('moonSelect').value =
					transitData['nameTwo'];
				changeMoon();
			}
		} else {
			if (shouldShow(transitData['nameTwo'])) {
				document.getElementById('centerSelect').value =
					transitData['nameTwo'];
			} else {
				document.getElementById('centerSelect').value = 'sun';
			}
			changeCenter();
		}

		// Update all the relevant data
		changeCenter();
		updateDropdowns();
	}

	// Hide the surface and remove the marker
	planets['ship']['orbitMesh'].visible = false;
	planets['ship'].surfaceMesh.visible = false;
	scene.remove(planets['ship']['orbitMesh']);
	scene.remove(planets['ship'].markerMesh);

	// Delete the ship data in the planets array
	delete planets['ship'];
	delete currentPositions['ship'];

	// Move from ship camera (it doesn't do anything if its already off)
	resetShipView();
	fixLightLagDropdown();
}

function createShipOrbit() {
	// Create the orbit of the ship

	// Initialise the full orbit
	var fullOrbit = new THREE.Group();

	// If not in low res, and orbit opacity is on, split the orbit into sections for opacity management
	if (!lowRes && orbitOpacity) {
		// Split orbit into individually-managable sections
		var opacity = baseOrbitOpacity;
		for (var i = 0; i < 360 * orbitOpacityRes; i++) {
			var degree = i / orbitOpacityRes;
			var nextDegree = (i + 1) / orbitOpacityRes;
			var planetOrbit = createOrbit('ship', degree, nextDegree);
			var orbitMaterial = new THREE.LineBasicMaterial({
				color: shipTrackColour,
				transparent: true,
				opacity: opacity,
			});
			var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
			scene.add(orbitPath);
			orbitPath.scale.set(totalScale, totalScale, totalScale);
			fullOrbit.add(orbitPath);
		}
	} else {
		// Set orbit as one piece for computational simplicity
		opacity = 1;

		var planetOrbit = createOrbit('ship', 0, 360);
		var orbitMaterial = new THREE.LineBasicMaterial({
			color: shipTrackColour,
			transparent: true,
			opacity: opacity,
		});
		var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
		scene.add(orbitPath);
		orbitPath.scale.set(totalScale, totalScale, totalScale);
		fullOrbit.add(orbitPath);
	}

	// Add the ship orbit
	scene.add(fullOrbit);
	planets['ship']['orbitMesh'] = fullOrbit;
}

function drawShipOrbit(positions) {
	// Return a ThreeJS geometry given the ship's orbital positions

	// Start the geometry and an array for the verticies
	var geometry = new THREE.Geometry();
	var vertexes = [];

	// Start the correct number of degrees
	var degree = 360 * orbitResolution;
	while (degree > 0) {
		// Iterate through all the degree points and add the verticies

		degree -= 1;
		vertexes.push(threeVector(positions[degree]));
	}

	// Link up the first and last points
	for (var index in vertexes) {
		geometry.vertices.push(vertexes[index]);
	}
	geometry.vertices.push(vertexes[0]);

	// Return the geometry
	return geometry;
}

// INTERSTELLAR TRANSFER FUNCTIONS

// Interstellar UI Verification

function validateAccel() {
	// Error checking on the interstellar acceleration

	// Find the acceleration
	var accel = Number(document.getElementById('ISAccel').value);

	if (accel <= 0) {
		// Set to 1g - Zero doesn't work
		accel = 9.8;
	}

	// On update, fix the time again
	document.getElementById('ISAccel').value = accel;
	if (!document.getElementById('ISCoast').checked) {
		timeLimits();
	}
}

function validateDist() {
	// Error checking on the interstellar distance

	// Find the distance
	var dist = Number(document.getElementById('ISDist').value);

	if (dist <= 0) {
		// It kinda breaks with a distance of zero, set it to arbitrary non-zero
		dist = 1;
	}

	// On update, fix the time again
	document.getElementById('ISDist').value = dist;
	if (!document.getElementById('ISCoast').checked) {
		timeLimits();
	}
}

function updateTargetDistance() {
	// Update the target distance if a star selected

	// Find the star and the distance
	var distance = document.getElementById('starTarget').value;
	document.getElementById('ISDist').value = distance;

	if (!document.getElementById('ISCoast').checked) {
		// If it's not coasting, limit the time as needed
		timeLimits();
	}

	// If Homestead II (from the Passengers movie) is selected, link to the document I wrote about why it makes no sense
	// I actually used the equations derived for this to figure out some of the flaws
	if (
		document.getElementById('starTarget').options[
			document.getElementById('starTarget').selectedIndex
		].text == 'Homestead II'
	) {
		document.getElementById('DVTitle').innerHTML =
			'Why the Starship <i>Avalon</i> Makes No Sense';
		document.getElementById('maneuverDisplay').innerHTML =
			"<a href='https://docs.google.com/document/d/1yrxS7CCBUR1JSzk-vZSBew5YpE2Bp-3RSavM3KmGRPM/edit?usp=sharing' target='_blank '>Link to Google Doc</a>";
		document.getElementById('deltaVeeDisplay').style.display = 'block';
	}
}

function timeLimits() {
	// Limit the time if coasting, set the time if not

	// Gather data
	var flyby = document.getElementById('ISFlyby').checked;
	var coast = document.getElementById('ISCoast').checked;
	var accelTime =
		Number(document.getElementById('ISTime').value) *
		convertTime('Y', 'S', 1);
	var accel = Number(document.getElementById('ISAccel').value);
	var dist =
		Number(document.getElementById('ISDist').value) *
		convertDistance('LY', 'M', 1);
	var c = 299792458;

	if (!flyby) {
		// If it's not doing a flyby, max is defined by accel-decel, rather than accel
		dist = dist / 2;
	}

	// Set the maximum and minimum allowed limits
	var maxTime = Math.pow(Math.pow(dist / c, 2) + (2 * dist) / accel, 0.5); // This is the inverse of the distance calculatoer
	var minTime = 0;

	var newAccelTime = 0;
	if (accelTime <= minTime) {
		newAccelTime = minTime + 0.001 * convertTime('Y', 'S'); // Set it to just marginally over the minumum time (can't go anywhere accelerating for 0 seconds)
	} else if (accelTime > maxTime) {
		// Set it to the max allowable time if it's over
		newAccelTime = maxTime;
	} else {
		// Just set it to what it was already
		newAccelTime = accelTime;
	}

	// Set the time
	document.getElementById('ISTime').value =
		newAccelTime * convertTime('S', 'Y', 1);

	if (coast == false) {
		// If it's not coasting, fix that more properly to be exactly as needed
		updateCoastTime();
	}
}

function updateCoastTime() {
	// Calculate coasting time

	// Gather data
	var flyby = document.getElementById('ISFlyby').checked;
	var accelTime = 0;
	var accel = Number(document.getElementById('ISAccel').value);
	var dist =
		Number(document.getElementById('ISDist').value) *
		convertDistance('LY', 'M', 1);
	var c = 299792458;

	if (!flyby) {
		// If it's not doing a flyby, it will accel-decel, rather than just a straight accel
		dist = dist / 2;
	}

	// This is the inverse of the relativistic distance equation
	accelTime = Math.pow(Math.pow(dist / c, 2) + (2 * dist) / accel, 0.5);

	if (document.getElementById('ISTime').disabled) {
		// Correctly update the right colour if it's disabled or not
		document.getElementById('ISTimeText').style.color = '#888';
	} else {
		document.getElementById('ISTimeText').style.color = '#fff';
	}

	// Set the value into the textbox - limit it by the size of the textbox (rounding to 11 figures)
	document.getElementById('ISTime').value = round(
		accelTime * convertTime('S', 'Y', 1),
		11,
	);
}

// Interstellar UI Display

function printISTransfer(transferData) {
	// Print the IS Transfer data - each part is pretty self-explanatory
	var printer = "<tr><td><table style='text-align:left;'>";

	// Print key
	printer +=
		'<tr><td>' +
		'<b>Phase</b>' +
		'</td><td>' +
		'<b>Distance (ly)</b>' +
		'</td><td>' +
		'<b>Earth Time (y)</b>' +
		'</td><td>' +
		'<b>Ship Time (y)</b>' +
		'</td></tr>';

	// Print table headings
	printer +=
		'<tr><td>' +
		'Accel' +
		'</td><td>' +
		round(transferData['distances']['accel'], 3) +
		'</td><td>' +
		round(transferData['times']['accel'], 3) +
		'</td><td>' +
		round(transferData['timesRel']['accel'], 3) +
		'</td></tr>';

	// Print accel, coast (if applicable), and decel
	if (transferData['times']['coast'] > Math.pow(10, -10)) {
		printer +=
			'<tr><td>' +
			'Coast' +
			'</td><td>' +
			round(transferData['distances']['coast'], 3) +
			'</td><td>' +
			round(transferData['times']['coast'], 3) +
			'</td><td>' +
			round(transferData['timesRel']['coast'], 3) +
			'</td></tr>';
	}
	if (transferData['times']['decel'] > 0) {
		printer +=
			'<tr><td>' +
			'Decel' +
			'</td><td>' +
			round(transferData['distances']['decel'], 3) +
			'</td><td>' +
			round(transferData['times']['decel'], 3) +
			'</td><td>' +
			round(transferData['timesRel']['decel'], 3) +
			'</td></tr>';
	}

	// Log total
	printer +=
		'<tr><td>' +
		'Total' +
		'</td><td>' +
		round(transferData['distances']['total'], 3) +
		'</td><td>' +
		round(transferData['times']['total'], 3) +
		'</td><td>' +
		round(transferData['timesRel']['total'], 3) +
		'</td></tr>';

	// End table
	printer += '</table></td></tr>';

	// Print maximum velocity
	printer +=
		'<tr><td>Maximum Velocity: ' +
		round(transferData['maxVel'] * 100, 2) +
		'% c</td></tr>';

	var value =
		(transferData['times']['accel'] + transferData['times']['decel']) *
		convertTime('Y', 'S') *
		transferData['data']['accel'];
	var power = 0;
	while (value / Math.pow(10, power + 1) > 1) {
		power += 1;
	}

	printer +=
		'<tr><td>Effective &Delta;V: ' +
		round(value / Math.pow(10, power), 3) +
		'x10<sup>' +
		power +
		'</sup> m/s</td></tr>';

	// Set general maneuvers
	document.getElementById('DVTitle').innerHTML =
		'Time and Distance Breakdown';
	document.getElementById('maneuverDisplay').innerHTML = printer;
	document.getElementById('deltaVeeDisplay').style.display = 'block';
}

// Powered Constant-Thrust Relativistic Interstellar Transfer Calculation Functions

function calculateISTransfer() {
	// Primary IS Transfer Calculator

	// Suspend computation while calculating
	startTransferCalc();

	// Keep track of when it started calculating for evaluation of efficiency
	transTime = new Date();

	// Fix all ship systems before starting
	resetShipSystems();

	// Reset the display
	document.getElementById('deltaVeeDisplay').style.display = 'none';
	document.getElementById('retractDetails').style.display = 'none';

	// Import data
	var c = 299792458;

	// Gather necessary data
	var flyby = document.getElementById('ISFlyby').checked;
	var accelTime =
		Number(document.getElementById('ISTime').value) *
		convertTime('Y', 'S', 1);
	var accel = Number(document.getElementById('ISAccel').value);
	var dist =
		Number(document.getElementById('ISDist').value) *
		convertDistance('LY', 'M', 1);
	var totalDist = dist;

	// Compact it for ease of typing (yes I know this is bad practice, but it's better)
	var a = accel;
	var t = accelTime;

	// Calculate distances, velocity and time relativistically
	var accelDist = calculateISDistance(a, t, c);
	var accelTimeRel = calculateISTime(a, t, c);
	var velocity = calculateISVelocity(a, t, c);

	// Init calculation variables
	var totalTimeRel = 0;
	var totalTime = 0;
	var decelTime = 0;
	var decelTimeRel = 0;
	var decelDist = 0;
	var remainingDist = dist;

	// Track the total time and relativistic time calculations (this part covers the acceleration)
	totalTime += accelTime;
	totalTimeRel += accelTimeRel;
	remainingDist -= accelDist;

	if (flyby != true) {
		// If it's not doing a flyby, it will need to decelarate
		decelTime = accelTime;
		totalTime += decelTime;
		decelTimeRel = accelTimeRel;
		totalTimeRel += decelTimeRel;
		decelDist = accelDist;
		remainingDist -= decelDist;
	}

	// Figure out how long it's just coasting
	var coastTime = remainingDist / velocity;
	var coastDist = remainingDist;
	var coastTimeRel =
		coastTime / Math.pow(1 - Math.pow(velocity / c, 2), -0.5);
	totalTime += coastTime;
	totalTimeRel += coastTimeRel;

	// If pointing at a real star, find the location
	var starName = '';
	var RA = [0, 0, 0]; // Stored as degrees minutes, seconds for ease of editing and researching
	var DE = [0, 0, 0]; // Likewise the the declination format

	if (
		document.getElementById('ISDist').value ==
		document.getElementById('starTarget').value
	) {
		// Use the real star data if available
		starName =
			document.getElementById('starTarget').options[
				document.getElementById('starTarget').selectedIndex
			].text;
		RA = stars[starName]['RA'];
		DE = stars[starName]['DE'];
	}

	var transferData = {
		// Store a bunch of transfer data
		data: {
			accel: accel,
			accelTime: accelTime,
		},
		times: {
			accel: accelTime * convertTime('S', 'Y', 1),
			coast: coastTime * convertTime('S', 'Y', 1),
			decel: decelTime * convertTime('S', 'Y', 1),
			total: totalTime * convertTime('S', 'Y', 1),
		},
		timesRel: {
			accel: accelTimeRel * convertTime('S', 'Y', 1),
			coast: coastTimeRel * convertTime('S', 'Y', 1),
			decel: decelTimeRel * convertTime('S', 'Y', 1),
			total: totalTimeRel * convertTime('S', 'Y', 1),
		},
		distances: {
			accel: accelDist * convertDistance('M', 'LY', 1),
			coast: coastDist * convertDistance('M', 'LY', 1),
			decel: decelDist * convertDistance('M', 'LY', 1),
			total: totalDist * convertDistance('M', 'LY', 1),
		},
		maxVel: velocity / c,
		star: {
			RA: RA,
			DE: DE,
			name: starName,
		},
	};

	// Print out the maneuvers
	printISTransfer(transferData);

	// Display it onscreen
	displayISTransfer(transferData);
}

function displayISTransfer(transferData) {
	// Start displaying

	// Fix everything before starting
	resetShipSystems();

	// Calculate numerical Right Ascension and Declination (stored as degrees/minutes/seconds etc. for ease of maintainance)
	var RA =
		(180 * transferData['star']['RA'][0]) / 12 +
		(180 * transferData['star']['RA'][1]) / (12 * 60) +
		(180 * transferData['star']['RA'][2]) / (12 * 60 * 60);
	var DE =
		(180 * transferData['star']['DE'][0]) / 180 +
		(180 * transferData['star']['DE'][1]) / (180 * 60) +
		(180 * transferData['star']['DE'][2]) / (180 * 60 * 60);

	var starVector = calculateVectorFromRADE(RA, DE);

	// Create a vector 10,000 AU out that is correctly aligned from Earth (starts at Earth going in that direction)
	var rad = 10000;
	var earth = currentPositions['earth'];
	var mag = rad - dotProduct(earth, starVector);
	var finalStar = addVec(multiplyVec(mag, starVector), earth);
	finalStar = setMagnitude(finalStar, rad);
	transferData['starVector'] = finalStar;

	// Global transfer data variable
	ISTransferData = transferData;

	// Allow the user to select the ship's view
	if (!webVR) {
		document.getElementById('shipViewDiv').style.display = 'block';
	}

	// Start actually rendering the ship on it
	rad = 100; // Reset it to 100 because that's where it stops tracking at the heliopause
	startISTransfer(transferData, rad);
}

// Interstellar Graphics Display Functions

function startISTransfer(transferData, r) {
	// Start all calculations for the IS transfer

	// Initialise ship class with appropriate data
	planets['ship'] = {
		a: 100,
		center: 'sun',
	};
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};

	// Place the ship there for switching to
	sortPlanetData();
	updateDropdowns();
	updateLightMoon();

	// Create the intersellar line
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		threeVector(multiplyVec(totalScale, currentPositions['earth'])),
		threeVector(multiplyVec(totalScale, transferData['starVector'])),
	);
	ISTransferData['path'] = {
		start: currentPositions['earth'],
		end: transferData['starVector'],
	};
	var material = new THREE.LineDashedMaterial({
		color: shipTrackColour,
		dashSize: 0.1 * totalScale,
		gapSize: 0.1 * totalScale,
		transparent: true,
	});
	planets['ship']['orbitMesh'] = new THREE.Line(geometry, material);
	planets['ship']['orbitMesh'].computeLineDistances();
	scene.add(planets['ship']['orbitMesh']);

	// Distance calculations
	ISStartTime = currentTime;
	var c = 299792458;
	var d = r * convertDistance('AU', 'M');
	var timeToDist = Math.pow(
		Math.pow(d / c, 2) + (2 * d) / transferData['data']['accel'],
		0.5,
	);
	ISEndTime = new Date(
		currentTime.getTime() + timeToDist * convertTime('S', 'MS'),
	);

	// Place the lens flare
	if (renderingLensFlares) {
		var flareColor = new THREE.Color(shipColour);
		var textureFlare = textureLoader.load('assets/flares/planetFlare.png');
		var lensFlare = new THREE.Lensflare();

		lensFlare.addElement(
			new THREE.LensflareElement(
				textureFlare,
				1,
				0.0,
				flareColor,
				THREE.AdditiveBlending,
			),
		);
		lensFlare.castShadow = false;
		planets['ship']['lensFlare'] = lensFlare;
		scene.add(lensFlare);
		lensFlare.visible = false;
	}

	// Place the ship marker
	var geometry = shipGeometry(1);
	var markerMesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: shipColour,
			side: THREE.FrontSide,
			opacity: 1,
			transparent: true,
		}),
	);
	markerMesh.name = 'ship';
	markerMesh.size = 1;
	markerMesh.position.set(0, 0, 0);
	scene.add(markerMesh);

	// Bind meshes to ship in planets array for display
	var scale = 3 * markerScale;
	planets['ship']['markerMesh'] = markerMesh;
	planets['ship']['surfaceMesh'] = shipSurfaceMesh;
	planets['ship']['surfaceMesh'].visible = true;

	scale = scale * planets['ship'].markerMesh.size;
	planets['ship']['markerMesh'].scale.set(scale, scale, scale);

	var newScale = 6.685 * Math.pow(10, -8) * totalScale;
	planets['ship']['surfaceMesh'].scale.set(newScale, newScale, newScale);

	// Finish transfer calculation
	console.log(
		'Interstellar Transfer Calculated: ' +
			round((new Date().getTime() - transTime.getTime()) / 1000, 2) +
			's',
	);
	swal({
		title: 'Transfer Calculated',
		text: 'Look at the simulation for the gray ship and its path, or the bottom right for the Time and Distance Breakdown',
		type: 'success',
	}).then((result) => {
		if (result.value) {
			// Resume simulation running
			endTransferCalc();
		}
	});
	console.log(transferData);
}

function updateISTransfer() {
	// Update the ship position during the transfer

	if (planets['ship']) {
		// Collect data
		var a = ISTransferData['data']['accel'];
		var c = 299792458;
		var t =
			(currentTime.getTime() - ISStartTime.getTime()) *
			convertTime('MS', 'S');
		var remainingTime = 0;

		if (ISEndTime.getTime() < currentTime.getTime()) {
			// Stop if it's over
			endISTransfer();
			swal({
				title: 'Tracking Stopped',
				text: 'The ship is now past the heliopause and outbound of the Solar System!',
				timer: 10000, // Close after 10s
			});
		} else if (currentTime.getTime() < ISStartTime.getTime()) {
			// Stop if it's before the start
			endISTransfer();
		}

		if (t > ISTransferData['data']['accelTime']) {
			// Move to coast mode if it is past accelerating
			remainingTime = t - ISTransferData['data']['accelTime'];
			t = ISTransferData['data']['accelTime'];
		}

		// Calculate distances
		var d = calculateISDistance(a, t, c);
		var coastD = ISTransferData['maxVel'] * c * remainingTime;
		var dist = (coastD + d) * convertDistance('M', 'AU');

		// Figure out ship location
		var currentPos = addVec(
			ISTransferData['path']['start'],
			setMagnitude(
				subVec(
					ISTransferData['path']['end'],
					ISTransferData['path']['start'],
				),
				dist,
			),
		);
		lastShipLocation = currentPos;
		var shipArray = currentPos;

		// Move everything around to
		currentShipPosition = shipArray;
		if (planets['ship']) {
			// Move the ship to the correct spot
			planets['ship']['markerMesh'].position.copy(
				threeVector(multiplyVec(totalScale, shipArray)),
			);
			if (planets['ship']['lensFlare']) {
				planets['ship']['lensFlare'].position.copy(
					planets['ship']['markerMesh'].position,
				);
			}
			planets['ship']['surfaceMesh'].position.copy(
				planets['ship']['markerMesh'].position,
			);

			// Figure out where it should point
			var directionVector = subVec(
				ISTransferData['path']['end'],
				ISTransferData['path']['start'],
			);

			// Calculate Lorentz factor
			var v = calculateISVelocity(a, t, c);
			var gamma = 1 / Math.pow(1 - Math.pow(v / c, 2), 0.5); // Lorentz factor

			// Calculate size of the ship marker
			var size =
				(1 + magnitude(subVec(currentPos, currentPositions['earth']))) *
				(3 * markerScale);
			size = size * planets['ship'].markerMesh.size;
			planets['ship']['markerMesh'].scale.copy(
				threeVector([size, size / gamma, size]),
			);

			// Contract the ship correctly based along the primary axis
			if (reverseThreeVector(shipAxis)[0] != 0) {
				var scale = reverseThreeVector(
					planets['ship']['surfaceMesh'].scale,
				)[1];
				planets['ship']['surfaceMesh'].scale.copy(
					threeVector([scale / gamma, scale, scale]),
				);
			} else if (reverseThreeVector(shipAxis)[1] != 0) {
				var scale = reverseThreeVector(
					planets['ship']['surfaceMesh'].scale,
				)[0];
				planets['ship']['surfaceMesh'].scale.copy(
					threeVector([scale, scale / gamma, scale]),
				);
			} else if (reverseThreeVector(shipAxis)[2] != 0) {
				var scale = reverseThreeVector(
					planets['ship']['surfaceMesh'].scale,
				)[0];
				planets['ship']['surfaceMesh'].scale.copy(
					threeVector([scale, scale, scale / gamma]),
				);
			}

			// Set the rotation angle based on how far through it is
			shipRotAngle =
				(2 *
					Math.PI *
					(currentTime.getTime() - ISStartTime.getTime())) /
				(ISEndTime.getTime() - ISStartTime.getTime());

			// Align ship with direction of motion
			planets['ship']['markerMesh'].quaternion.setFromUnitVectors(
				new THREE.Vector3(0, 1, 0),
				threeVector(directionVector).clone().normalize(),
			);
			planets['ship']['surfaceMesh'].quaternion.setFromUnitVectors(
				shipAxis,
				threeVector(directionVector).clone().normalize(),
			);

			if (planets['ship'].surfaceMesh.children[0]) {
				if (
					planets['ship'].surfaceMesh.children[0].children[0]
						.children[0]
				) {
					// This is so the Roci can roll to look better
					planets[
						'ship'
					].surfaceMesh.children[0].children[0].children[0].quaternion.setFromAxisAngle(
						new THREE.Vector3(0, 0, 1),
						shipRotAngle,
					);
				}
			}
		}
	}
}

function endISTransfer() {
	// Stop the IS transfer

	// Set program flags to stop the transfer
	ISEndTime = false;
	ISStartTime = false;

	// Hide the markers
	planets['ship'].markerMesh.visible = false;
	planets['ship'].surfaceMesh.visible = false;

	planets['ship']['orbitMesh'].visible = false;
	if (planets['ship']['lensFlare']) {
		planets['ship']['lensFlare'].visible = false;
	}

	document.getElementById('shipViewDiv').style.display = 'none';

	// Clear out the ship data
	delete currentPositions['ship'];
	delete planets['ship'];

	if (cameraMode == 'shipCenter') {
		// Move it back to the sun once it's done if centered on the ship
		document.getElementById('centerSelect').value = 'sun';
		changeCenter();
		updateDropdowns();
	}

	resetShipView();
}

// These DO NOT include derivation - go see the inital paper or subsequent maths, depending

function calculateISVelocity(a, t, c) {
	// Note to self - you're just going to have to either look at your Desmos script or look at the paper again to re-derive this one (this is true for all of these sorts for IS)
	// Calculate the velocity when accelearting at a given time based on acceleration, time accelerating, and c
	return (a * t) / Math.pow(1 + Math.pow((a * t) / c, 2), 0.5);
}

function calculateISDistance(a, t, c) {
	// Calculate distance travelled when accelerating given acceleration, time accelerating, and c
	return (
		(Math.pow(c, 2) / a) * (Math.pow(Math.pow((a * t) / c, 2) + 1, 0.5) - 1)
	);
}

function calculateISTime(a, t, c) {
	// Calculate relativistic time aboard the ship given acceleration, time accelerating, and c
	return (c * Math.atan((a * t) / c)) / a;
}

// EPSTEIN DRIVE TRANSFER FUNCTIONS

// Epstein UI Management Functions

function collectEpsteinData() {
	// Get all the data for an Epstien transfer

	// Suspend simulation for ease of computation
	startTransferCalc();

	// Keep track of start of Epstein transfer for efficiency tracking
	transTime = new Date();

	// Clear all ship systems
	resetShipSystems();

	// Get all the transfer data
	var nameOne = document
		.getElementById('fromEpsteinTarget')
		.value.toLowerCase();
	var nameTwo = document
		.getElementById('toEpsteinTarget')
		.value.toLowerCase();
	var gees = Number(document.getElementById('EpsteinGees').value);

	// Start calculation
	calculateEpsteinTransfer(nameOne, nameTwo, gees);
}

function displayEpsteinManeuvers(epstienTransitData) {
	// Display all maneuvers for an Epstien transfer (units hours) given the transit data

	// Create all maneuvers
	var maneuvers = [];

	maneuvers.push({
		name:
			'Decelerating from ' + epstienTransitData['nameOne'] + ' velocity',
		time: epstienTransitData['times'][1],
	});

	maneuvers.push({
		name: 'Before Flip',
		time: epstienTransitData['times'][2],
	});

	maneuvers.push({
		name: 'After Flip',
		time: epstienTransitData['times'][3],
	});

	maneuvers.push({
		name: 'Matching ' + epstienTransitData['nameTwo'] + ' velocity',
		time: epstienTransitData['times'][4],
	});

	// Print all maneuvers
	document.getElementById('deltaVeeDisplay').style.display = 'block';
	document.getElementById('retractDetails').style.display = 'none';
	document.getElementById('DVTitle').innerHTML = 'Time Breakdown';
	var totalDeltaVee = 0;
	var printer = "<tr><td><table style='text-align:left;'>";
	printer =
		'<tr><td><h3>Maneuver</h3></td><td><h3>Time (hours)</h3></td></tr>';
	for (var index in maneuvers) {
		if (maneuvers[index]['time'] != 0) {
			maneuvers[index]['time'] = round(
				maneuvers[index]['time'] * convertTime('S', 'H', 1),
				3,
			);

			printer +=
				'<tr><td>' +
				maneuvers[index]['name'] +
				'</td><td>' +
				maneuvers[index]['time'] +
				'</td></tr>';
			totalDeltaVee += parseFloat(maneuvers[index]['time']);
		}
	}
	totalDeltaVee = round(totalDeltaVee, 3);
	printer += '<tr><td>Total</td><td>' + totalDeltaVee + '</td></tr>';

	// End table
	printer += '</table></td></tr><br>';

	var value =
		totalDeltaVee * convertTime('H', 'S', 1) * epstienTransitData['accel'];
	var power = 0;
	while (value / Math.pow(10, power + 1) > 1) {
		power += 1;
	}

	printer +=
		'<tr><td>Total &Delta;V: ' +
		round(value / Math.pow(10, power), 3) +
		'x10<sup>' +
		power +
		'</sup></td><td> m/s</td></tr>';

	document.getElementById('maneuverDisplay').innerHTML = printer;

	// Alert the user it's done. Doesn't start until alert dismissed
	swal({
		title: 'Transfer Calculated',
		text: 'Look at the simulation for the gray ship and its track, or the bottom right for the Time Breakdown',
		type: 'success',
	}).then((result) => {
		if (result.value) {
			// Resume simulation running
			endTransferCalc();
		}
	});

	// Log how long it took to calculate
	console.log(
		'Epstein Transfer Calculated: ' +
			round((new Date().getTime() - transTime.getTime()) / 1000, 2) +
			's',
	);
}

function changeEpsteinCenter() {
	// Change central planet for an Epstein transfer - changes center as well

	// Change the center of the program to match the Epstien center
	var centeredObject = document
		.getElementById('EpsteinCenter')
		.value.toLowerCase();
	document.getElementById('centerSelect').value = centeredObject;
	changeCenter();

	// Create all the options needed
	var printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && name != 'ship') {
				if (planets[name]['center'] == centeredObject) {
					printer +=
						"<option value='" +
						name +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}

	// Push printer to both dropdowns
	document.getElementById('fromEpsteinTarget').innerHTML = printer;
	document.getElementById('toEpsteinTarget').innerHTML = printer;
}

// Epstein Drive (Powered Constant High Thrust) Transfer Calculation Functions

function calculateEpsteinTransfer(nameOne, nameTwo, gees) {
	// Main Epstein calculator

	// Start small-time loading system
	startSmallLoading();

	// Ensure they don't go to the same one
	if (nameOne != nameTwo) {
		// Allow the user to see from the ship's view
		if (!webVR) {
			document.getElementById('shipViewDiv').style.display = 'block';
		}

		// Take in data
		var accel = gees * 9.807;
		var bestTimeDifference = Math.pow(10, 20);
		var bestTransitData = {};

		// Find the initial positions
		var departingPosition = findPlanetLocation(nameOne, currentTime);
		var departingVelocity = findVelocity(nameOne, currentTime);

		// Get the transfer data for this transferr
		transferData = calculateTransferDuration(
			(planets[nameOne]['a'] + planets[nameTwo]['a']) *
				convertDistance('AU', 'M', 1),
			accel,
			0,
			0,
		);
		var period = transferData['totalTime'] * convertTime('S', 'Y', 1) * 10;

		// Get the data from the best transfer
		bestTransitData['nameOne'] = nameOne;
		bestTransitData['nameTwo'] = nameTwo;

		bestTransitData['departingPosition'] = departingPosition;
		bestTransitData['departingVelocity'] = departingVelocity;

		for (
			var transitTime = 0;
			transitTime < period;
			transitTime += period / 10000
		) {
			// Iterate through to find valid transfer

			// Calculate portion of velocity that is against direction of motion and time to neutralize
			// The portion with the velocity is useful

			// Find arriving distance from the iteration
			var arrivingTime = new Date(
				currentTime.getTime() + transitTime * convertTime('Y', 'MS', 1),
			);
			var arrivingPosition = findPlanetLocation(nameTwo, arrivingTime);
			var arrivingVelocity = findVelocity(nameTwo, arrivingTime);

			// Find the distance of this transfer
			var distance =
				magnitude(subVec(arrivingPosition, departingPosition)) *
				convertDistance('AU', 'M', 1);

			// Find the velocity proportion aligned with the departing velocity
			var alignVector = subVec(arrivingPosition, departingPosition);
			var alignAngle = Math.acos(
				dotProduct(alignVector, departingVelocity) /
					(magnitude(alignVector) * magnitude(departingVelocity)),
			);

			// Find the planet velocity aligned with the transit vector
			var alignedDeparting =
				magnitude(departingVelocity) * Math.cos(alignAngle);
			var antiDeparting =
				magnitude(departingVelocity) * Math.sin(alignAngle);

			alignVector = subVec(departingPosition, arrivingPosition);
			alignAngle = Math.acos(
				dotProduct(alignVector, arrivingVelocity) /
					(magnitude(alignVector) * magnitude(arrivingVelocity)),
			);

			var alignedArriving =
				magnitude(arrivingVelocity) * Math.cos(alignAngle);
			var antiArriving =
				magnitude(arrivingVelocity) * Math.cos(alignAngle);

			// Convert from AU/Y to M/S
			alignedDeparting = alignedDeparting * convertSpeed('AU/Y', 'M/S');
			antiDeparting = antiDeparting * convertSpeed('AU/Y', 'M/S');
			alignedArriving = alignedArriving * convertSpeed('AU/Y', 'M/S');
			antiArriving = antiArriving * convertSpeed('AU/Y', 'M/S');

			// If -ve amount is aligned, nothing is aligned
			if (alignedDeparting < 0) {
				antiDeparting = Math.sqrt(
					Math.pow(alignedDeparting, 2) + Math.pow(antiDeparting, 2),
				);
				alignedDeparting = 0;
			}

			if (alignedArriving < 0) {
				antiArriving = Math.sqrt(
					Math.pow(alignedArriving, 2) + Math.pow(antiArriving, 2),
				);
				alignedArriving = 0;
			}

			// Find out how long the transfer would take
			var transferData = calculateTransferDuration(
				distance,
				accel,
				alignedDeparting,
				alignedArriving,
			);

			var travelTime = transferData['totalTime'];
			var departingDuration = antiDeparting / accel;
			var arrivingDuration = antiArriving / accel;

			// Find the time difference
			var difference = Math.abs(
				arrivingDuration +
					departingDuration +
					travelTime -
					transitTime * convertTime('Y', 'S', 1),
			);

			// Find the transfer that most closely aligns with the selected iteration
			if (difference < bestTimeDifference) {
				// Store all data about best transfer
				bestTimeDifference = difference;
				bestTransitData['accel'] = accel;
				bestTransitData['transitTime'] = transitTime;
				bestTransitData['calculatedTransitTime'] =
					arrivingDuration + departingDuration + travelTime;
				bestTransitData['difference'] = difference;
				bestTransitData['arrivingTime'] = arrivingTime;
				bestTransitData['arrivingPosition'] = arrivingPosition;
				bestTransitData['arrivingVelocity'] = arrivingVelocity;
				bestTransitData['times'] = {
					1: departingDuration,
					2: transferData['preFlip'],
					3: transferData['postFlip'],
					4: arrivingDuration,
				};
				bestTransitData['returnData'] = transferData;
				bestTransitData['startVelocity'] = alignedDeparting;
				bestTransitData['startTime'] = currentTime;
				bestTransitData['endVelocity'] = alignedArriving;
			}
		}
		console.log(bestTransitData);

		// Find the maximum distance from the central body
		var maxDist = planets[planets[nameOne]['center']]['r'] * 1.5;
		if (planets[nameOne]['center'] == 'sun') {
			// Do not get too close to the sun
			maxDist = 0.275;
		}

		var vec1 = departingPosition;
		var vec2 = bestTransitData['arrivingPosition'];
		var centralObj = [0, 0, 0];

		// Collect needed data and vectors
		var travelDir = setMagnitude(subVec(vec2, vec1), 1);
		var centralVec = subVec(centralObj, vec1);
		var perpProject = dotProduct(travelDir, centralVec);
		var centralProject = addVec(vec1, setMagnitude(travelDir, perpProject));
		var dirVec1 = setMagnitude(subVec(vec1, centralProject), 1);
		var dirVec2 = setMagnitude(subVec(vec2, centralProject), 1);

		if (dirVec1 == dirVec2) {
			// If the closest distance is outside of the transfer line, it's in no danger
			maxDist = 0;
		}

		var smallestA;

		if (planets[nameOne]['a'] > planets[nameTwo]['a']) {
			smallestA = planets[nameTwo]['a'];
		} else {
			smallestA = planets[nameOne]['a'];
		}

		if (magnitude(subVec(centralProject, centralObj)) > maxDist) {
			// If it's okay...
			// Start displaying best transfer
			showEpsteinPath(bestTransitData);
			displayEpsteinManeuvers(bestTransitData);
			endSmallLoading();
		} else {
			// If it gets too close, add some time and try again
			var timeToAdd =
				(findPeriod(smallestA, planets[nameOne]['center']) *
					convertTime('Y', 'MS')) /
				10;
			currentTime.setTime(currentTime.getTime() + timeToAdd);
			collectEpsteinData();
		}
	} else {
		// Tell the user they must go BETWEEN places
		swal('Sorry', 'You must pick two different bodies', 'error');
	}
}

function calculateTransferDuration(
	distance,
	accel,
	startVelocity,
	endVelocity,
) {
	// Calculate how long a transfer should take, given data

	// Initialise time and velocity
	var time = 0;
	var preFlipTime = 0;
	var postFlipTime = 0;
	var largestStartVelocity = 0;
	var lowestStartVelocity = 0;

	if (startVelocity > endVelocity) {
		// Figure out which is larger
		largestStartVelocity = startVelocity;
		lowestStartVelocity = endVelocity;
	} else {
		largestStartVelocity = endVelocity;
		lowestStartVelocity = startVelocity;
	}

	// Time disparity between the two sides, pre and post flip
	var timeRemoved = (largestStartVelocity - lowestStartVelocity) / accel;

	if (startVelocity > endVelocity) {
		// Add the time to start with
		postFlipTime = timeRemoved;
	} else {
		preFlipTime = timeRemoved;
	}

	// Calcualte the distance
	distance =
		distance -
		((accel / 2) * Math.pow(timeRemoved, 2) +
			timeRemoved * lowestStartVelocity);

	//preFlipTime += Math.sqrt(2 * (distance / 2) / accel);
	//postFlipTime += Math.sqrt(2 * (distance / 2) / accel);

	// Excluding the extra speed, how long should each side take?
	preFlipTime +=
		(-largestStartVelocity +
			Math.sqrt(Math.pow(largestStartVelocity, 2) + accel * distance)) /
		accel;
	postFlipTime +=
		(-largestStartVelocity +
			Math.sqrt(Math.pow(largestStartVelocity, 2) + accel * distance)) /
		accel;

	time = preFlipTime + postFlipTime;

	if (distance < 0) {
		time = 0;
	}

	// Format data for return
	var returnData = {
		preFlip: preFlipTime,
		postFlip: postFlipTime,
		totalTime: time,
	};

	return returnData;
}

// Epstein Graphics Display Functions

function showEpsteinPath(epstienTransitData) {
	// Display the path of the Epstien transfer
	// This creates the main line of it

	var arrivingTime = epstienTransitData['arrivingTime'];
	var geometry = new THREE.Geometry();

	// Calculate times and locations
	var startTime = new Date(currentTime.getTime());
	var transferStart = new Date(
		currentTime.getTime() +
			epstienTransitData['times'][1] * convertTime('S', 'MS', 1),
	);
	var transferEnd = new Date(
		arrivingTime.getTime() -
			epstienTransitData['times'][4] * convertTime('S', 'MS', 1),
	);
	var endTime = new Date(arrivingTime.getTime());

	var nameOne = epstienTransitData['nameOne'];
	var nameTwo = epstienTransitData['nameTwo'];

	var startLocation = findPlanetLocation(nameOne, transferStart);
	var endLocation = findPlanetLocation(nameTwo, transferEnd);
	var flipDistFromStart =
		epstienTransitData['startVelocity'] *
			epstienTransitData['returnData']['preFlip'] +
		(epstienTransitData['accel'] / 2) *
			Math.pow(epstienTransitData['returnData']['preFlip'], 2);
	flipDistFromStart = flipDistFromStart * convertDistance('M', 'AU', 1);
	var travelVector = subVec(endLocation, startLocation);

	// Add a line geometry (the first and last are very small except for low accelerations)
	geometry.vertices.push(
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameOne, startTime)),
		),
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameOne, transferStart)),
		),
	);

	geometry.vertices.push(
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameOne, transferStart)),
		),
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameTwo, transferEnd)),
		),
	);

	geometry.vertices.push(
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameTwo, transferEnd)),
		),
		threeVector(
			multiplyVec(totalScale, findPlanetLocation(nameTwo, endTime)),
		),
	);

	// Create the mesh for the line
	var material = new THREE.LineDashedMaterial({
		color: shipTrackColour,
		dashSize: 0.1 * totalScale,
		gapSize: 0.1 * totalScale,
		transparent: true,
	});
	EpsteinLine = new THREE.Line(geometry, material);
	scene.add(EpsteinLine);
	EpsteinLine.computeLineDistances();

	// Continue calculating
	startEpsteinDisplay(epstienTransitData);
}

function startEpsteinDisplay(epstienTransitData) {
	// Begin main display for Epstien, initialize ship

	// Figure out roughly how large to make the ship
	var a =
		(planets[epstienTransitData['nameOne']]['a'] +
			planets[epstienTransitData['nameTwo']]['a']) /
		2;
	var scale = a * markerScale;

	// Initialise the ship data
	planets['ship'] = {
		a: a,
		center: planets[epstienTransitData['nameOne']]['center'],
	};
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};

	// Format dropdowns
	sortPlanetData();
	updateDropdowns();
	updateLightMoon();

	// Load surface of start and end
	loadSurface(epstienTransitData['nameOne']);
	loadSurface(epstienTransitData['nameTwo']);
	planets[epstienTransitData['nameOne']].surfaceMesh.visible = true;
	planets[epstienTransitData['nameTwo']].surfaceMesh.visible = true;

	// Create and place lens flare and ship geometry
	var flareColor = new THREE.Color(white);
	var textureFlare = textureLoader.load('assets/flares/planetFlare.png');

	// Configure ship lens flare
	var lensFlare = new THREE.Lensflare();
	lensFlare.addElement(
		new THREE.LensflareElement(
			textureFlare,
			1,
			0.0,
			flareColor,
			THREE.AdditiveBlending,
		),
	);
	lensFlare.castShadow = false;

	planets['ship']['lensFlare'] = lensFlare;
	scene.add(lensFlare);
	lensFlare.visible = false;

	// Create ship marker
	var geometry = shipGeometry(1);
	var markerMesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: shipColour,
			side: THREE.FrontSide,
			opacity: 1,
			transparent: true,
		}),
	);
	markerMesh.name = 'ship';
	markerMesh.position.set(0, 0, 0);
	markerMesh.position.set(0, 0, 0);

	scene.add(markerMesh);

	// Configure ship scaling
	markerMesh.size = 1;
	planets['ship']['markerMesh'] = markerMesh;
	planets['ship']['surfaceMesh'] = shipSurfaceMesh;
	planets['ship']['surfaceMesh'].visible = true;
	if (planets['ship']['center'] != 'sun') {
		var mod;
		if (shipAxis.x != 0) {
			mod = planets['ship']['surfaceMesh'].scale.y;
		} else if (shipAxis.y != 0) {
			mod = planets['ship']['surfaceMesh'].scale.x;
		} else if (shipAxis.z != 0) {
			mod = planets['ship']['surfaceMesh'].scale.x;
		}
		var newScale = mod * planets['ship']['a'] * 10;
		planets['ship']['surfaceMesh'].scale.set(newScale, newScale, newScale);
	} else {
		var newScale = 6.685 * Math.pow(10, -8) * totalScale;
		planets['ship']['surfaceMesh'].scale.set(newScale, newScale, newScale);
	}

	scale = scale * planets['ship'].markerMesh.size;
	planets['ship']['markerMesh'].scale.set(scale, scale, scale);

	// Add a transparent sphere at the flip-and-burn point
	geometry = new THREE.SphereGeometry(totalScale * a * 0.04, geoRes, geoRes);
	var material = new THREE.MeshBasicMaterial({
		color: shipTrackColour,
		opacity: 0.3,
		transparent: true,
		depthWrite: false,
	});

	// Create flip marker
	flipMarker = new THREE.Mesh(geometry, material);
	flipMarker.name = 'Flip and burn point';
	scene.add(flipMarker);

	// Set Epstein data
	EpsteinCenter = planets[epstienTransitData['nameOne']]['center'];
	EpsteinEndTime = new Date(
		currentTime.getTime() +
			epstienTransitData['transitTime'] * convertTime('Y', 'MS', 1),
	);
	EpsteinStartTime = new Date(currentTime.getTime());
	EpsteinTransitData = epstienTransitData;

	EpsteinShown = true;
}

function updateEpsteinPath() {
	// Update Epstien path position

	// Get data
	var transitData = EpsteinTransitData;

	// If outside transfer, end it
	if (
		currentTime.getTime() < EpsteinStartTime.getTime() ||
		EpsteinEndTime.getTime() < currentTime.getTime()
	) {
		// Stop if outside transfer time
		endEpsteinTransfer();
	}

	// Get times needed for update
	var transferStart = new Date(
		EpsteinStartTime.getTime() +
			transitData['times'][1] * convertTime('S', 'MS', 1),
	);
	var transferEnd = new Date(
		transitData['arrivingTime'].getTime() -
			transitData['times'][4] * convertTime('S', 'MS', 1),
	);

	// Get names
	var nameOne = transitData['nameOne'];
	var nameTwo = transitData['nameTwo'];

	// Figure out where everything starts
	var startLocation = findPlanetLocation(nameOne, transferStart);
	var endLocation = findPlanetLocation(nameTwo, transferEnd);
	var flipDistFromStart =
		transitData['startVelocity'] * transitData['returnData']['preFlip'] +
		(transitData['accel'] / 2) *
			Math.pow(transitData['returnData']['preFlip'], 2);
	flipDistFromStart = flipDistFromStart * convertDistance('M', 'AU', 1);
	var travelVector = subVec(endLocation, startLocation);
	var flipLocation = addVec(
		startLocation,
		multiplyVec(flipDistFromStart / magnitude(travelVector), travelVector),
	);

	if (planets['ship']) {
		// Deal with ship visiblity

		if (EpsteinShown) {
			planets['ship'].markerMesh.material.opacity = 0;

			planets['ship']['lensFlare'].visible = false;
			if (!webVR) {
				flipMarker.visible = false;
				EpsteinLine.visible = false;
			}
			if (realSystem) {
				planets['ship']['lensFlare'].visible = true;
			} else {
				planets['ship'].markerMesh.material.opacity = 1;
				if (!webVR) {
					flipMarker.visible = true;
					EpsteinLine.visible = true;
				}
			}
		} else {
			if (!webVR) {
				EpsteinLine.visible = false;
				flipMarker.visible = false;
				planets['ship'].markerMesh.visible = false;
			}
		}

		//lastEpsteinLocation = EpsteinArray;

		EpsteinArray = calculateEpsteinPosition(
			currentTime,
			EpsteinTransitData,
		);

		if (currentTime.getTime() < transferStart.getTime()) {
			// If matching velocity, follow the planet
			EpsteinArray = findPlanetLocation(nameOne, currentTime);
			EpsteinArray = addVec(
				EpsteinArray,
				setMagnitude(
					[-EpsteinArray[1], EpsteinArray[0], EpsteinArray[2]],
					10 * planets[nameOne]['r'],
				),
			);
		} else if (transferEnd.getTime() < currentTime.getTime()) {
			EpsteinArray = findPlanetLocation(nameTwo, currentTime);
			EpsteinArray = addVec(
				EpsteinArray,
				setMagnitude(
					[-EpsteinArray[1], EpsteinArray[0], EpsteinArray[2]],
					10 * planets[nameTwo]['r'],
				),
			);
		}

		// Move the ship marker
		lastShipLocation = EpsteinArray;
		currentShipPosition = addVec(
			EpsteinArray,
			currentPositions[EpsteinCenter],
		);
		planets['ship']['markerMesh'].position.copy(
			threeVector(multiplyVec(totalScale, currentShipPosition)),
		);
		planets['ship']['lensFlare'].position.copy(
			planets['ship']['markerMesh'].position,
		);
		planets['ship']['surfaceMesh'].position.copy(
			planets['ship']['markerMesh'].position,
		);

		// Keep the flip marker stationary relative to the central body
		flipMarker.position.copy(
			threeVector(
				multiplyVec(
					totalScale,
					addVec(flipLocation, currentPositions[EpsteinCenter]),
				),
			),
		);

		flipLocation[2] += 0.0003 * magnitude(travelVector); // This is placed slightly above so the ship actually rotates

		var directionVector = subVec(flipLocation, EpsteinArray); // It ALWAYS points towards the flip-and-burn point

		if (currentTime.getTime() < transferStart.getTime()) {
			// Except when it is attenuating the misaligned velocity
			directionVector = multiplyVec(
				-1,
				findVelocity(nameOne, currentTime),
			);
		} else if (transferEnd.getTime() < currentTime.getTime()) {
			directionVector = findVelocity(nameTwo, currentTime);
		}

		// Set the rotation angle based on how far through it is
		shipRotAngle =
			(2 * Math.PI * (currentTime.getTime() - transferStart.getTime())) /
			(transferEnd.getTime() - transferStart.getTime());

		// Rotate the ship to face the correct travel direction
		planets['ship']['markerMesh'].quaternion.setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			threeVector(directionVector).clone().normalize(),
		);
		planets['ship']['surfaceMesh'].quaternion.setFromUnitVectors(
			shipAxis,
			threeVector(directionVector).clone().normalize(),
		);
		if (planets['ship'].surfaceMesh.children[0]) {
			if (
				planets['ship'].surfaceMesh.children[0].children[0].children[0]
			) {
				// If it's the Roci, turn it so it looks better
				planets[
					'ship'
				].surfaceMesh.children[0].children[0].children[0].quaternion.setFromAxisAngle(
					new THREE.Vector3(0, 0, 1),
					shipRotAngle,
				);
			}
		}

		// Keep the transfer line in the correct position
		EpsteinLine.position.copy(
			threeVector(
				multiplyVec(totalScale, currentPositions[EpsteinCenter]),
			),
		);
	}
}

function calculateEpsteinPosition(time, transitData) {
	// Given transit data and current time, where should the ship be?
	//var geometry = new THREE.Geometry();

	// Figure out when all this is happening
	var transferStart = new Date(
		EpsteinStartTime.getTime() +
			transitData['times'][1] * convertTime('S', 'MS', 1),
	);
	var flipTime = new Date(
		transferStart.getTime() +
			transitData['returnData']['preFlip'] * convertTime('S', 'MS', 1),
	);
	var transferEnd = new Date(
		transitData['arrivingTime'].getTime() -
			transitData['times'][4] * convertTime('S', 'MS', 1),
	);

	// Get transit data and position
	var nameOne = transitData['nameOne'];
	var nameTwo = transitData['nameTwo'];
	var position = [0, 0, 0];

	// Figure out when all this is happening
	var startLocation = findPlanetLocation(nameOne, transferStart);
	var endLocation = findPlanetLocation(nameTwo, transferEnd);

	// Get distances and vectors for calculations
	var flipDistFromStart =
		transitData['startVelocity'] * transitData['returnData']['preFlip'] +
		(transitData['accel'] / 2) *
			Math.pow(transitData['returnData']['preFlip'], 2);
	flipDistFromStart = flipDistFromStart * convertDistance('M', 'AU', 1);
	var travelVector = subVec(endLocation, startLocation);
	var flipLocation = addVec(
		startLocation,
		multiplyVec(flipDistFromStart / magnitude(travelVector), travelVector),
	);
	var midVelocity =
		transitData['startVelocity'] +
		transitData['returnData']['preFlip'] * transitData['accel'];

	if (time.getTime() > flipTime.getTime()) {
		// Currently POST-FLIP

		// Calculate distance and position
		var secondsAfter =
			(time.getTime() - flipTime.getTime()) * convertTime('MS', 'S', 1);
		var distance =
			secondsAfter * midVelocity -
			(transitData['accel'] / 2) * Math.pow(secondsAfter, 2);
		distance = distance * convertDistance('M', 'AU');
		var displacementVector = subVec(endLocation, flipLocation);
		position = addVec(
			flipLocation,
			multiplyVec(
				distance / magnitude(displacementVector),
				displacementVector,
			),
		);
	} else {
		// Currently PRE-FLIP

		// Calculate distance and position
		var secondsBefore =
			(flipTime.getTime() - time.getTime()) * convertTime('MS', 'S', 1);
		distance =
			secondsBefore * midVelocity -
			(transitData['accel'] / 2) * Math.pow(secondsBefore, 2);
		distance = distance * convertDistance('M', 'AU');
		displacementVector = subVec(startLocation, flipLocation);
		position = addVec(
			flipLocation,
			multiplyVec(
				distance / magnitude(displacementVector),
				displacementVector,
			),
		);
	}

	return position;
}

function endEpsteinTransfer() {
	// Stop an Epstein Transfer

	// Hide all meshes and reset control varaibles
	EpsteinLine.visible = false;
	scene.remove(EpsteinLine);
	EpsteinEndTime = false;
	EpsteinShown = false;

	// Hide and remove ship markers
	planets['ship'].markerMesh.visible = false;
	scene.remove(planets['ship'].markerMesh);
	planets['ship'].surfaceMesh.visible = false;

	// Set ship surface scale
	shipSurfaceMesh.scale.set(10, 10, 10);

	// Hide ship markers and flares
	flipMarker.visible = false;
	scene.remove(flipMarker);
	planets['ship']['lensFlare'].visible = false;

	// Hide displays
	document.getElementById('shipViewDiv').style.display = 'none';
	document.getElementById('deltaVeeDisplay').style.display = 'none';

	delete currentPositions['ship'];

	if (cameraMode == 'shipCenter') {
		// Reset the ship view to the central body if it was on the ship

		if (planets['ship'].center != 'sun') {
			document.getElementById('centerSelect').value =
				planets['ship'].center;
			changeCenter();
			if (shouldShow(EpsteinTransitData['nameTwo'])) {
				document.getElementById('moonSelect').value =
					EpsteinTransitData['nameTwo'];
				changeMoon();
			}
		} else {
			if (shouldShow(EpsteinTransitData['nameTwo'])) {
				document.getElementById('centerSelect').value =
					EpsteinTransitData['nameTwo'];
			} else {
				document.getElementById('centerSelect').value = 'sun';
			}
			changeCenter();
		}

		updateDropdowns();
	}

	// Remove ship data
	delete planets['ship'];
	resetShipView();
}

// PROPAGATION DELAY (LIGHT LAG) CALCULATION FUNCTIONS

// Propagation UI Management Functions

function fixLightLagDropdown() {
	// Correct the light lag dropdown if it was looking at the ship when a transfer ends
	if (document.getElementById('lightMoonChoice').value == 'ship') {
		document.getElementById('lightMoonChoice').value = 'planet';
	}

	if (document.getElementById('lightChoice').value == 'ship') {
		document.getElementById('lightChoice').value = 'sun';
	}
}

function updateLightMoon() {
	// Update the dropdown for the moon section of the light dropdown

	// Take in values
	var planet = document.getElementById('lightChoice').value;
	var moonValue = document.getElementById('lightMoonChoice').value;

	// Check if any moons are added
	var moonAdded = false;

	// Add the base one - the central planet
	var printer = "<option value='planet'>" + capitalise(planet) + '</option>';
	if (planet != 'sun' && planet != 'ship') {
		// The sun and the ship are special
		// Iterate through all planets
		for (var moon in planets) {
			if (planets[moon]['center'] == planet) {
				// If it is a moon of that planet
				if (shouldShow(moon)) {
					// And it should be shown

					// Add it to the printer, and keep say it has been added
					printer +=
						"<option value='" +
						moon +
						"'>" +
						capitalise(moon) +
						'</option>';
					moonAdded = true;
				}
			}
		}
	}

	// Push it to the dropdown
	document.getElementById('lightMoonChoice').innerHTML = printer;

	// Display IFF a moon was added
	if (moonAdded) {
		document.getElementById('lightMoonDiv').style.display = 'block';
	} else {
		document.getElementById('lightMoonDiv').style.display = 'none';
	}

	// Replace the value of the moon div if it's no longer there
	if (!shouldShow(moonValue)) {
		document.getElementById('lightMoonChoice').value = 'planet';
	} else {
		document.getElementById('lightMoonChoice').value = moonValue;
	}

	// Further correction of the moon div choice
	if (moonValue != 'planet') {
		if (moonValue == '') {
			document.getElementById('lightMoonChoice').value = 'planet';
		} else if (planets[moonValue].center != planet) {
			document.getElementById('lightMoonChoice').value = 'planet';
		}
	}

	// Recalculate light lag
	if (document.getElementById('transferType').value == 'lightLag') {
		calculateLightLag();
	}
}

// Propagation Delay Calculation Functions

function calculateLightLag() {
	// Calculate delay due to light speed for all shown bodies, and print

	// Initialise table headers
	var printer =
		"Propagation Delays<table style='margin:auto;text-align:left;'><tr><th><b>Planet</b></th><th><b>Delay</b></th></tr>";

	// Get name data
	var middle = document.getElementById('lightChoice').value;
	var name = 'sun';

	var lightspeed = 299792458; // Thankfully, the exact value

	// Get the selected body
	if (
		document.getElementById('lightMoonChoice').value != 'planet' &&
		document.getElementById('lightMoonChoice').value
	) {
		middle = document.getElementById('lightMoonChoice').value;
	}

	// Find the position of the selected body
	var middlePos;
	if (middle == 'ship') {
		middlePos = lastShipLocation;
		if (planets[middle]['center'] != 'sun') {
			middlePos = addVec(
				lastShipLocation,
				currentPositions[planets[middle]['center']],
			);
		}
	} else {
		middlePos = currentPositions[middle];
		if (!shouldUpdate(middle)) {
			middlePos = addVec(
				findPlanetLocation(middle, currentTime),
				currentPositions[planets[middle]['center']],
			);
		}
	}

	// Get the needed distance vector from the name to the selected
	var distanceVector = subVec(currentPositions[name], middlePos);
	var distance = magnitude(distanceVector);

	// Calcualate the time of propagation
	var time = round(
		convertTime('S', 'M', 1) *
			convertDistance('AU', 'M', 1) *
			(distance / lightspeed),
		1,
	);

	// Add the row to the table
	printer +=
		'<tr><td>' +
		name +
		'</td><td>' +
		time +
		" <span style='color:#888;'>minutes</span></td></tr>";

	// Go through all the planets
	for (var name in planets) {
		if (shouldShow(name)) {
			// Do it for every planet
			if (planets[name]['center'] == 'sun' && name != 'sun') {
				// Get the distance vector
				if (name == 'ship') {
					distanceVector = subVec(lastShipLocation, middlePos);
				} else {
					distanceVector = subVec(currentPositions[name], middlePos);
				}

				// Find the distance and time
				distance = magnitude(distanceVector);
				time = round(
					convertTime('S', 'M', 1) *
						convertDistance('AU', 'M', 1) *
						(distance / lightspeed),
					1,
				);

				// Add the next row to the table
				printer +=
					'<tr><td>' +
					name +
					'&nbsp;</td><td>' +
					time +
					" <span style='color:#888;'>minutes</span></td></tr>";
			}
		}
	}

	// Add a blank space to the table
	printer += '<tr><td></td><td></td></tr>';

	for (var name in planets) {
		// Do it for every moon of the planet (from the surface)
		if (shouldShow(name)) {
			if (
				(planets[name]['center'] == middle && middle != 'sun') ||
				(planets[middle]['center'] == name && name != 'sun') ||
				(planets[middle]['center'] == planets[name]['center'] &&
					planets[name]['center'] != 'sun')
			) {
				// Find the distance vector
				if (name == 'ship') {
					distanceVector = lastShipLocation;
					if (middle == 'ship') {
						distanceVector = [0, 0, 0];
					}
				} else {
					distanceVector = subVec(currentPositions[name], middlePos);
				}

				// Don't do it if the moon is not shown
				if (!shouldUpdate(name)) {
					distanceVector = findPlanetLocation(name, currentTime);
					if (planets[middle]['center'] != 'sun') {
						distanceVector = subVec(
							addVec(
								findPlanetLocation(name, currentTime),
								currentPositions[planets[middle]['center']],
							),
							middlePos,
						);
					}
				}

				// Calculate distance and time
				distance = magnitude(distanceVector);
				time = round(
					convertDistance('AU', 'M', 1) * (distance / lightspeed),
					1,
				);

				// Add the next row to the table
				printer +=
					'<tr><td>' +
					name +
					'&nbsp;</td><td>' +
					time +
					" <span style='color:#888;'>seconds</span></td></tr>";
			}
		}
	}

	// Finish the table
	printer += '</table>';

	// Print out the light delays
	document.getElementById('lightDelays').innerHTML = printer;

	// Display prop. delay visualiser ONLY if not low res
	if (!lowRes) {
		// Display lines
		displayLightLagLines(middle);

		// Check if it needs to update the photons - if none are actually there
		var needsUpdate = true;
		for (var name in lightParticles) {
			if (lightParticles[name].visible) {
				needsUpdate = false;
			}
		}
		if (needsUpdate) {
			releaseLightParticles();
		}

		// Update the light lag lines and positions of photons
		updateLightParticles(middle);
	}
}

// Propagation Delay Graphics Display Functions

function createLightLagLines() {
	// Create all lines for the planets (and the ship)

	for (var name in planets) {
		createLightLagLine(name);
	}
	createLightLagLine('ship');
}

function createLightLagLine(name) {
	// Create the light line

	// Create base geometry
	var geometry = new THREE.Geometry();
	geometry.dynamic = true;

	// Select material
	var material = new THREE.LineDashedMaterial({
		color: white,
		dashSize: 0.1 * totalScale,
		gapSize: 0.1 * totalScale,
	});

	// Create it
	var line = new THREE.Line(geometry, material);
	line.computeLineDistances();

	// Add the line
	lightLagLines[name] = line;
	scene.add(line);
}

function displayLightLagLines(center) {
	// Display the lines the light travels across

	// Find the position of the central object
	var middlePos;

	if (center == 'ship') {
		middlePos = lastShipLocation;
		if (planets[center]['center'] != 'sun') {
			middlePos = addVec(
				lastShipLocation,
				currentPositions[planets[center]['center']],
			);
		}
	} else {
		middlePos = currentPositions[center];
		if (!shouldUpdate(center)) {
			middlePos = addVec(
				findPlanetLocation(center, currentTime),
				currentPositions[planets[center]['center']],
			);
		}
	}

	// Erase previous ones
	// clearLightLagLines();

	// Create all lines
	if (!realSystem) {
		for (var name in planets) {
			var condition = planets[name]['center'] != 'sun';

			if (centeredPlanet != 'sun') {
				condition =
					condition ||
					planets[centeredPlanet]['orbitMesh'].visible == true ||
					(planets[center]['center'] == name && name != 'sun') ||
					planets[name]['center'] == center;
			} else {
				condition = planets[name]['center'] == 'sun';
			}

			if (condition) {
				// If it needs to be updated - if not, just hide it

				if (
					shouldShow(name) &&
					(planets[name]['center'] == center ||
						planets[name]['center'] == planets[center]['center'] ||
						planets[name]['center'] == 'sun')
				) {
					// Find where the line's going to
					var destVec;
					if (name == 'ship') {
						destVec = lastShipLocation;
						if (planets[name]['center'] != 'sun') {
							destVec = addVec(
								lastShipLocation,
								currentPositions[planets[name]['center']],
							);
						}
					} else {
						destVec = currentPositions[name];
						if (!shouldUpdate(name)) {
							destVec = addVec(
								findPlanetLocation(name, currentTime),
								currentPositions[planets[name]['center']],
							);
						}
					}

					// Create base geometry
					var geometry = new THREE.Geometry();
					geometry.vertices.push(
						threeVector(multiplyVec(totalScale, middlePos)),
						threeVector(multiplyVec(totalScale, destVec)),
					);

					var length = magnitude(subVec(middlePos, destVec));

					// Select material
					var material = new THREE.LineDashedMaterial({
						color: white,
						dashSize: 0.1 * totalScale,
						gapSize: 0.1 * totalScale,
					});

					var isMoonLine =
						(planets[name]['center'] != 'sun' &&
							planets[name]['center'] ==
								planets[center]['center']) ||
						(planets[center]['center'] == name &&
							planets[center]['center'] != 'sun') ||
						(planets[name]['center'] == center &&
							planets[name]['center'] != 'sun');

					if (isMoonLine) {
						material = new THREE.LineDashedMaterial({
							color: white,
							dashSize: 0.0001 * totalScale,
							gapSize: 0.0001 * totalScale,
						});
					}

					// Create it
					//var line = new THREE.Line(geometry, material);
					//line.distance = length;

					// Update all line properties
					lightLagLines[name].distance = length;
					lightLagLines[name].geometry = geometry;
					lightLagLines[name].computeLineDistances();
					lightLagLines[name].material = material;
					lightLagLines[name].visible = true;
				} else {
					lightLagLines[name].visible = false;
				}
			} else {
				lightLagLines[name].visible = false;
			}
		}
	}
}

function hideLightLagLines() {
	// Hide all prop. delay lines
	for (var name in lightLagLines) {
		lightLagLines[name].visible = false;
	}
}

function hideLightParticles() {
	// Clear out the photons

	for (var name in lightParticles) {
		lightParticles[name].visible = false;
	}
}

function releaseLightParticles() {
	// Yes, they are photons - but this keeps a naming theme

	// Set the time to keep track from
	lightParticleTime = currentTime;
}

function createLightParticles() {
	// Clear out the photons
	for (var name in lightParticles) {
		scene.remove(lightParticles[name]);
		delete lightParticles[name];
	}

	// Create a photon for every planet (and the ship)
	for (var name in planets) {
		createLightParticle(name);
	}

	createLightParticle('ship');
}

function createLightParticle(name) {
	// Create a single photon

	// Create the photon
	var geometry = sphereGeo;
	var material = new THREE.MeshBasicMaterial({
		color: 0xffff00,
	});
	var photon = new THREE.Mesh(geometry, material);

	// Add the photon
	lightParticles[name] = photon;
	scene.add(photon);
	photon.visible = false;

	var size = planets['sun']['r'] / 2;
	photon.scale.set(size, size, size);
}

function updateLightParticles(center) {
	// Update the position of each photon
	var timeChange =
		(currentTime.getTime() - lightParticleTime.getTime()) / 1000; // Number of SIM seconds since photon release
	var lightSpeed = 299792458; // Thankfully, the exact value
	var distChange = timeChange * lightSpeed;

	// Find central position
	var middlePos;
	if (center == 'ship') {
		middlePos = lastShipLocation;
		if (planets[center]['center'] != 'sun') {
			middlePos = addVec(
				lastShipLocation,
				currentPositions[planets[center]['center']],
			);
		}
	} else {
		middlePos = currentPositions[center];
		if (!shouldUpdate(center)) {
			middlePos = addVec(
				findPlanetLocation(center, currentTime),
				currentPositions[planets[center]['center']],
			);
		}
	}

	// Update all photon positions
	for (var name in lightParticles) {
		// Only update if the line is visible
		if (lightLagLines[name] && lightLagLines[name].visible) {
			var shouldDisplay = lightLagLines[name].visible;

			// If it will appear for fewer than five frames, just don't show it
			if (timeRate != 0) {
				var totalSimTime =
					(lightLagLines[name].distance *
						convertDistance('AU', 'M')) /
					lightSpeed;
				var totalFrames =
					totalSimTime / ((timeRate * timeScale) / 1000);

				// Value for timeRate equal to 5h/sec
				if (totalFrames < 1 || 2 * 3600 < timeRate) {
					shouldDisplay = false;
				} else {
					shouldDisplay = lightLagLines[name].visible;
				}
			}

			var isMoonPhoton =
				(planets[name]['center'] != 'sun' &&
					planets[name]['center'] == planets[center]['center']) ||
				(planets[center]['center'] == name &&
					planets[center]['center'] != 'sun') ||
				(planets[name]['center'] == center &&
					planets[name]['center'] != 'sun');

			if (
				!(
					planets[name]['center'] != 'sun' &&
					planets[name]['center'] == planets[center]['center']
				) &&
				!isMoonPhoton &&
				planets[name]['center'] != 'sun'
			) {
				shouldDisplay = false;
			}

			// Only update if it is visible
			if (lightParticles[name].visible || shouldDisplay) {
				// Set the size
				var size =
					(totalScale * lightLagLines[name].distance) /
					Math.pow(10, 20);
				if (isMoonPhoton) {
					if (
						planets[name]['center'] == 'earth' ||
						planets[center]['center'] == 'earth'
					) {
						size = 0.00002;
					} else if (
						planets[name]['center'] == 'mars' ||
						planets[center]['center'] == 'mars'
					) {
						size = 0.000005;
					} else {
						size = 0.00007;
					}
				} else {
					size = 0.05;
				}
				lightParticles[name].scale.set(size, size, size);

				// Find the endpoint
				var destVec;
				if (name == 'ship') {
					destVec = lastShipLocation;
					if (planets[name]['center'] != 'sun') {
						destVec = addVec(
							lastShipLocation,
							currentPositions[planets[name]['center']],
						);
					}
				} else {
					destVec = currentPositions[name];
					if (!shouldUpdate(name)) {
						destVec = addVec(
							findPlanetLocation(name, currentTime),
							currentPositions[planets[name]['center']],
						);
					}
				}

				// Find the needed vectors
				var moveVec = subVec(destVec, middlePos);
				var oriDist = magnitude(moveVec);
				var distance = convertDistance('M', 'AU') * distChange;

				// Find the final position
				moveVec = setMagnitude(moveVec, distance);

				var position = addVec(moveVec, middlePos);

				// Set position
				lightParticles[name].position.copy(
					threeVector(multiplyVec(totalScale, position)),
				);

				lightParticles[name].displayName = true;

				// If it's past the planet, remove it
				if (distance > oriDist) {
					//scene.remove(lightParticles[name]);
					//delete lightParticles[name];
					shouldDisplay = false;
				}
			}
			if (lightParticles[name]) {
				lightParticles[name].visible = shouldDisplay;
			}
		} else {
			lightParticles[name].visible = false;
		}
	}
}

// GENERAL TRANSFER UI FUNCTIONS

function resetShipSystems() {
	// Reset all types of transfers

	// Software end the transfers
	if (shipEndTime) {
		endShipTransit();
	}

	if (EpsteinEndTime) {
		endEpsteinTransfer();
	}

	if (ISEndTime) {
		endISTransfer();
	}

	if (realSystem) {
		showHideReal();
	}

	// Clear the sofware variables
	shipEndTime = false;
	EpsteinEndTime = false;
	ISEndTime = false;

	// Clear the ship array
	planets['ship'] = {};
	planets['ship'].viewingClass = {
		minorBody: false,
		minorSatellite: false,
		expanse: false,
		expanseHide: false,
		easterEgg: false,
	};
	planets['ship'].mapClass = {};

	// Hide the ship info window
	document.getElementById('shipToolTip').style.display = 'none';
	showingShipTooltip = true;
}

function shipGeometry(scale) {
	// Return the ship's geometry given the scale

	// As a somewhat reference, I based it off the Apollo CSM (kudos to anyone who reads this and understands what it is)
	// For those who don't - Command Service Module, the bit that went to the moon (sans lander)

	// Get the scaling and resolution varaibles set up
	var size = totalScale * scale * 3;
	var res = geoRes;

	// Create geometries
	var cylinderGeo = new THREE.CylinderGeometry(
		size / 12,
		size / 12,
		size / 4,
		res,
	);
	var coneGeo = new THREE.ConeGeometry(size / 12, size / 4, res);
	var rocketGeo = new THREE.ConeGeometry(size / 15, size / 4, res);

	// Create the meshes
	var cylinderMesh = new THREE.Mesh(
		cylinderGeo,
		new THREE.MeshBasicMaterial({}),
	);
	var coneMesh = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({}));
	var rocketMesh = new THREE.Mesh(rocketGeo, new THREE.MeshBasicMaterial({}));

	// Move meshes around to correct positions
	coneMesh.position.y = size / 4;
	rocketMesh.position.y = -size / 10;

	// Merge new meshes
	var geometry = cylinderGeo;

	// Add the rocket nozzle
	rocketMesh.updateMatrix();
	geometry.merge(rocketMesh.geometry, rocketMesh.matrix);

	// Add the command module cone
	coneMesh.updateMatrix();
	geometry.merge(coneMesh.geometry, coneMesh.matrix);

	// Hand back the geometry
	return geometry;
}

// UI FUNCTIONS

// WebVR Graphics Management Functions

function resetMainVRPosition() {
	cameraZeroPos = reverseThreeVector(camera.position);
	updateSystemScaling();
}

function updateGlobalWebVRScaling() {
	webVRStandardLength = Math.pow(
		10,
		Number(document.getElementById('webVRScaler').value),
	);
	updateSystemScaling();
}

// Center Changing Functions

function changeCenter() {
	// Change which major body is being looked at

	// Fix the camera view if it's at the ship
	if (cameraMode == 'ship') {
		resetShipView();
	}

	if (document.getElementById('centerSelect').value == 'ship') {
		// Ship display interrupt - The ship is special and rendered differently

		if (
			centeredPlanet != 'sun' &&
			shouldShow(centeredPlanet) &&
			realSystem == false
		) {
			planets[centeredPlanet]['orbitMesh'].visible = !realSystem;
		}

		if (
			centeredObject != 'sun' &&
			shouldShow(centeredObject) &&
			realSystem == false
		) {
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
		}

		// Update camera projection matrix
		updateCameraNear();

		startShipCenter();
		document.getElementById('moonSelectDisplay').style.display = 'none';

		if (webVR) {
			updateSystemScaling();
			updateWebVRVisibility();
		}
	} else {
		// Only display the ship orbit if not in the real system
		if (planets['ship']) {
			if (EpsteinEndTime) {
				EpsteinLine.visible = !realSystem;
				flipMarker.visible = !realSystem;
			} else {
				if (planets['ship']['orbitMesh']) {
					planets['ship']['orbitMesh'].visible = !realSystem;
				}
			}
			planets['ship']['markerMesh'].visible = true;
			if (realSystem) {
				planets['ship'].markerMesh.opacity = 0;
			} else {
				planets['ship'].markerMesh.opacity = 1;
			}
		}

		stopShipCenter();

		if (document.getElementById('bootScreen').style.display == 'none') {
			startSmallLoading();
		}

		var oldPlanet = centeredPlanet;

		// Show the orbit on exit so that if it was hidden, it goes back to normal
		if (
			centeredPlanet != 'sun' &&
			shouldShow(centeredPlanet) &&
			realSystem == false
		) {
			planets[centeredPlanet]['orbitMesh'].visible = !realSystem;
			planets[centeredPlanet]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity = 1;
				}
			});
		}

		if (
			centeredObject != 'sun' &&
			shouldShow(centeredObject) &&
			realSystem == false
		) {
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
			planets[centeredObject]['orbitMesh'].traverse(function (node) {
				if (node.material) {
					node.material.opacity = 1;
				}
			});
		}

		// Reset centered object and planet
		centeredObject = document.getElementById('centerSelect').value;
		centeredPlanet = document.getElementById('centerSelect').value;

		// Update the camera projection matrix
		updateCameraNear();

		// Load the surface if it's not the Ring
		if (centeredPlanet != 'sol ring') {
			loadSurface(centeredPlanet);
		}

		// Hid the moons of the old planet
		if (oldPlanet != 'sun' && oldPlanet != 'ship') {
			for (var moon in planets) {
				if (shouldShow(moon) && planets[moon]['center'] == oldPlanet) {
					planets[moon].markerMesh.visible = false;
					if (planets[moon]['atmoMesh']) {
						planets[moon]['atmoMesh'].visible = false;
					}
				}
			}
		}
		if (planets[oldPlanet]['atmoMesh']) {
			planets[oldPlanet]['atmoMesh'].visible = false;
		}

		// Display the moons of the new planet
		var printer =
			"<option value='planet'>" +
			capitalise(centeredPlanet) +
			'</option>';
		if (centeredPlanet != 'sun' && centeredPlanet != 'ship') {
			for (var moon in planets) {
				if (planets[moon]['center'] == centeredPlanet) {
					if (shouldShow(moon)) {
						planets[moon]['markerMesh'].visible = true;
						if (realSystem) {
							planets[moon].markerMesh.opacity = 0.3;
						} else {
							planets[moon].markerMesh.opacity = 0;
						}
						if (planets[moon]['atmoMesh']) {
							planets[moon]['atmoMesh'].visible = true;
						}
						printer +=
							"<option value='" +
							moon +
							"'>" +
							capitalise(moon) +
							'</option>';
					}
					loadSurface(moon);
				}
			}
		}

		if (planets[centeredPlanet]['atmoMesh']) {
			planets[centeredPlanet]['atmoMesh'].visible = true;
		}

		// Update moon select
		document.getElementById('moonSelect').innerHTML = printer;
		if (
			printer !=
			"<option value='planet'>" + capitalise(centeredObject) + '</option>'
		) {
			document.getElementById('moonSelectDisplay').style.display =
				'inline';
		} else {
			document.getElementById('moonSelectDisplay').style.display = 'none';
		}

		// Load a model if it is a model
		if (
			centeredObject != 'sun' &&
			centeredObject != 'the ring' &&
			centeredObject != 'tycho station' &&
			centeredObject &&
			centeredObject != 'ship'
		) {
			// Load model if required
			if (
				planets[centeredObject]['surfaceMesh'].geometry.type ==
					'SphereGeometry' &&
				planets[centeredObject]['mapClass']['model']
			) {
				if (!lowRes) {
					loadModel(centeredObject);
				}
			}
		}

		// Hide the old moons of the planet it switched off
		hideUselessMoons(oldPlanet, centeredPlanet);

		if (webVR) {
			updateSystemScaling();
			updateWebVRVisibility();
		}
	}
}

function changeMoon() {
	// Change which moon is centered (or the parent planet)
	if (cameraMode == 'ship') {
		resetShipView();
	}

	if (document.getElementById('moonSelect').value == 'ship') {
		// Ship centering interrupt

		startShipCenter();

		// Show orbit mesh on leaving to ensure it is correctly
		if (centeredObject != 'sun' && shouldShow(centeredObject)) {
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
		}

		// Update camera projection matrix
		updateCameraNear();

		if (webVR) {
			updateSystemScaling();
			updateWebVRVisibility();
		}
	} else {
		// Display the orbit (as long as it's not viewing the real system)
		if (planets['ship']) {
			if (EpsteinEndTime) {
				EpsteinLine.visible = !realSystem;
				flipMarker.visible = !realSystem;
			} else if (planets['ship']['orbitMesh']) {
				planets['ship']['orbitMesh'].visible = !realSystem;
			}
			planets['ship']['markerMesh'].visible = true;
			if (realSystem) {
				planets['ship'].markerMesh.opacity = 0;
			} else {
				planets['ship'].markerMesh.opacity = 1;
			}
		}

		stopShipCenter();

		// Change which moon is being looked at (if the planet has one)

		// Show orbit mesh on leaving to ensure it is correctly
		if (centeredObject != 'sun' && shouldShow(centeredObject)) {
			planets[centeredObject]['orbitMesh'].visible = !realSystem;
		}

		// If it says planet, go to the central object
		if (document.getElementById('moonSelect').value != 'planet') {
			centeredObject = document.getElementById('moonSelect').value;
		} else {
			centeredObject = document.getElementById('centerSelect').value;
		}

		// Update camera projection matrix
		updateCameraNear();

		// Limit controls minimum distance due to sun flare problem
		if (centeredObject != 'sun' && centeredObject) {
			var mod = 1.1;

			if (planets[centeredObject]['modelScale']) {
				mod = planets[centeredObject]['modelScale'];
			}

			controls.minDistance =
				scene.scale.x *
					(planets[centeredObject]['r'] * mod) *
					totalScale +
				camera.near;
		}

		if (centeredObject != 'sun' && centeredObject) {
			// Load model if not loaded
			if (
				planets[centeredObject]['surfaceMesh'].geometry.type ==
					'SphereGeometry' &&
				planets[centeredObject]['mapClass']['model']
			) {
				var name = centeredObject;
				if (!lowRes) {
					loadModel(name);
				}
			}
		}

		if (stereoDisp) {
			if (centeredPlanet == 'titan') {
				planets['titan'].surfaceMesh.visible = false;
			}
		}

		if (webVR) {
			updateSystemScaling();
			updateWebVRVisibility();
		}
	}
}

function updateCameraNear() {
	// Update the camera projection matrix
	if (cameraMode == 'shipCenter') {
		camera.near =
			(2209.789810047425 *
				shipSurfaceMesh.scale.y *
				cameraNearMultiplier) /
			2;
	} else if (centeredObject == 'sun' || centeredObject != centeredPlanet) {
		camera.near = (2 * totalScale) / Math.pow(10, 8);
	} else {
		camera.near =
			planets[centeredObject].r * totalScale * cameraNearMultiplier;
	}

	if (webVR) {
		camera.near = 0.1;
	}

	camera.updateProjectionMatrix();
	if (stereoDisp) {
		cameraLeft.near = camera.near;
		cameraRight.near = camera.near;

		cameraLeft.updateProjectionMatrix();
		cameraRight.updateProjectionMatrix();
	}
}

function hideUselessMoons(oldPlanet, newPlanet) {
	// Strategically hide moons and surfaces to reduce computer load

	if (oldPlanet != 'sun') {
		// The sun is special
		if (planets[oldPlanet]['surfaceMesh']) {
			// If it has a surface, hide the surface and lens flare of the old planet
			planets[oldPlanet]['surfaceMesh'].visible = false;
		}
		if (planets[oldPlanet]['lensFlare']) {
			planets[oldPlanet]['lensFlare'].visible = false;
		}
		if (planets[newPlanet]['orbitMesh']) {
			planets[oldPlanet]['orbitMesh'].visible = true;
		}

		// Set opacity of marker to 0 if realsystem to keep tooltips operational
		if (!realSystem) {
			planets[oldPlanet].markerMesh.material.opacity = 0.3;
		} else {
			planets[oldPlanet].markerMesh.material.opacity = 0;
		}

		// Hide all the moons of the old planet
		for (var moon in planets[oldPlanet]['moons']) {
			if (shouldShow(moon)) {
				planets[moon]['surfaceMesh'].visible = false;
				if (planets[moon]['lensFlare']) {
					planets[moon]['lensFlare'].visible = false;
				}
				planets[moon].markerMesh.material.opacity = 0;
				planets[moon]['orbitMesh'].visible = false;
			}
		}
	}

	if (newPlanet != 'sun') {
		// The sun is special

		// Show surface, lensflare and orbit of the new planet
		if (planets[newPlanet]['surfaceMesh']) {
			planets[newPlanet]['surfaceMesh'].visible = true;
		}
		if (planets[newPlanet]['lensFlare']) {
			planets[newPlanet]['lensFlare'].visible = realSystem;
		}
		if (planets[newPlanet]['orbitMesh']) {
			planets[newPlanet]['orbitMesh'].visible = true;
		}

		// Set opacity of marker to 0 if realsystem to keep tooltips operational
		if (!realSystem) {
			planets[newPlanet].markerMesh.material.opacity = 0.3;
		} else {
			planets[newPlanet].markerMesh.material.opacity = 0;
		}

		// Don't show the ship marker if it is part of the ship view
		if (
			(shipCameraTo == newPlanet || shipCameraFrom == newPlanet) &&
			cameraMode == 'ship'
		) {
			planets[newPlanet].markerMesh.material.opacity = 0;
		}

		// Iterate through each moon and show all of them
		for (var moon in planets[newPlanet]['moons']) {
			if (shouldShow(moon)) {
				// Show surface and lensflare
				if (planets[moon]['surfaceMesh']) {
					planets[moon]['surfaceMesh'].visible = true;
				}
				if (planets[moon]['lensFlare']) {
					planets[moon]['lensFlare'].visible = realSystem;
				}

				// Set opacity of marker to 0 if realsystem to keep tooltips operational
				if (!realSystem) {
					planets[moon].markerMesh.material.opacity = 0.3;
				} else {
					planets[moon].markerMesh.material.opacity = 0;
				}

				// Show orbit
				planets[moon]['orbitMesh'].visible = !realSystem;

				// Deal with moon marker opacity
				if (cameraMode == 'ship') {
					if (shipCameraTo == moon || shipCameraFrom == moon) {
						planets[moon].markerMesh.material.opacity = 0;
					}
				}
			}
		}
	}
}

// WebVR Managment Functions

function updateWebVRVisibility() {
	shipCameraFrom = null;
	shipCameraTo = null;

	if (EpsteinEndTime) {
		shipCameraFrom = EpsteinTransitData['nameOne'];
		shipCameraTo = EpsteinTransitData['nameTwo'];
	}

	if (shipEndTime) {
		shipCameraFrom = transitData['nameOne'];
		shipCameraTo = transitData['nameTwo'];
	}

	if (centeredPlanet == 'sun' && cameraMode == 'orbital') {
		for (var name in planets) {
			if (planets[name].orbitMesh) {
				var needToShow =
					planets[name]['center'] == 'sun' &&
					shouldShow(name) &&
					!realSystem;

				planets[name].orbitMesh.visible = needToShow;
				planets[name].markerMesh.visible = needToShow;
			}
		}
	} else if (cameraMode == 'shipCenter') {
		for (var name in planets) {
			if (planets[name].orbitMesh) {
				if (
					(planets[name]['center'] != centeredPlanet ||
						planets[name]['center'] == 'sun' ||
						name == 'ship') &&
					name != shipCameraFrom &&
					name != shipCameraTo
				) {
					planets[name].orbitMesh.visible = false;
				}
			}
		}
	} else {
		for (var name in planets) {
			if (planets[name].orbitMesh) {
				if (
					planets[name]['center'] != centeredPlanet ||
					planets[name]['center'] == 'sun'
				) {
					planets[name].orbitMesh.visible = false;
				}
			}
		}
	}

	if (cameraMode == 'shipCenter') {
		changeObjectVisibility(planets['ship'].markerMesh, false);
		changeObjectVisibility(EpsteinLine, false);
		changeObjectVisibility(flipMarker, false);
		changeObjectVisibility(shipSurfaceMesh, true);
	} else {
		if (planets['ship']) {
			changeObjectVisibility(planets['ship'].markerMesh, !realSystem);
		}
		changeObjectVisibility(EpsteinLine, !realSystem);
		changeObjectVisibility(flipMarker, !realSystem);
		changeObjectVisibility(shipSurfaceMesh, !realSystem);
	}
}

function updateSystemScaling() {
	var distanceModerator;

	var solarStandardLength = 1;
	var planetStandardLength = 2;
	var shipStandardLength = 1;

	var chosenStandardLength;

	if (centeredPlanet == 'sun' && cameraMode == 'orbital') {
		var chosenName = 'earth';
		if (
			planets[chosenName].surfaceMesh.position &&
			magnitude(
				reverseThreeVector(planets[chosenName].surfaceMesh.position),
			) != 0
		) {
			distanceModerator = magnitude(
				reverseThreeVector(planets[chosenName].surfaceMesh.position),
			);
		} else {
			distanceModerator = planets[chosenName].a * totalScale;
		}

		chosenStandardLength = solarStandardLength;
	} else if (cameraMode == 'orbital') {
		//var innerName = Object.keys(planets[centeredPlanet]["moons"])[Math.floor((Object.keys(planets[centeredPlanet]["moons"]).length - 1) / 2)]

		var innerName = 'luna';

		if (
			planets[innerName].surfaceMesh.position &&
			magnitude(
				reverseThreeVector(
					planets[innerName].surfaceMesh.position != 0,
				),
			)
		) {
			distanceModerator = magnitude(
				subVec(
					reverseThreeVector(planets[innerName].surfaceMesh.position),
					reverseThreeVector(
						planets[planets[innerName]['center']].surfaceMesh
							.position,
					),
				),
			);
		} else {
			distanceModerator = planets[innerName].a * totalScale;
		}

		//distanceModerator = planets[centeredPlanet].r * totalScale

		chosenStandardLength = planetStandardLength;

		//distanceModerator = magnitude(subVec(reverseThreeVector(planets[innerName].surfaceMesh.position), reverseThreeVector(planets[planets[innerName]["center"]].surfaceMesh.position)))
	} else if (cameraMode == 'shipCenter') {
		distanceModerator = getObjectSize(shipSurfaceMesh);
		chosenStandardLength = shipStandardLength;
	}

	var scaleValue = Number(
		(
			(chosenStandardLength * webVRStandardLength) /
			distanceModerator
		).toPrecision(5),
	);

	//scaleValue = Math.pow(10, -12)

	scene.scale.set(scaleValue, scaleValue, scaleValue);

	updateCameraNear();
}

// Loading Management Functions

function startSmallLoading() {
	// Start Small Loading Screen

	if (Object.keys(orbitalTimes).length !== 0) {
		smallLoadingCounter = new Date();

		smallLoadingTimer = setTimeout(function () {
			document.getElementById('smallLoadingScreen').style.display =
				'block';
			document.getElementById('smallDisabledCover').style.display =
				'block';
		}, 1000); // 3000
	}
}

function endSmallLoading() {
	// Dismiss small loading screen

	if (smallLoadingTimer) {
		// If the timer actually exists

		clearTimeout(smallLoadingTimer);

		smallLoadingTimer = undefined;

		endSmallLoadingTimer = setInterval(function () {
			// Until it's been up for at least 3 seconds, don't dismiss it
			if (new Date().getTime() > smallLoadingCounter.getTime() + 3000) {
				document.getElementById('smallLoadingScreen').style.display =
					'none';
				document.getElementById('smallDisabledCover').style.display =
					'none';
				clearInterval(endSmallLoadingTimer);
			}
		}, 100);
	}
}

function startTransferCalc() {
	// Stop all calculation and rendering while calculating a transfer
	calculatingTransfer = true;

	// Stop asking for animation frames
	cancelAnimationFrame(animator);
}

function endTransferCalc() {
	// Resume all animation and calculation
	calculatingTransfer = false;

	checkTime = new Date();
	checkTimeRemaining = checkTimeSection;

	// Re-initialise animation
	animate();

	cancelAnimationFrame(animator);

	animate();
}

// Asset Loading Functions

function loadSurface(name) {
	// Load the planetary surface from a sphere upon actually looking at it - saves on laoding everything from the start

	var globalBumpScaling = 1;

	if (webVR) {
		globalBumpScaling = 1 * Math.pow(10, -2);
	}

	// Do a number of checks
	if (name != 'sun') {
		if (!lowRes) {
			if (name != 'the ring') {
				if (
					planets[name]['rotation'] &&
					!planets[name].surfaceMesh.material.map
				) {
					var loadName = name;
					if (name == 'the moon') {
						// The moon is the same as Luna
						loadName = 'luna';
					}

					if (
						!planets[name]['mapClass']['model'] &&
						planets[name]['mapClass']['surfaceMap'] != false
					) {
						// If texture, map onto surface
						planets[name].surfaceMesh.material.color.setRGB(
							1,
							1,
							1,
						); // Colour back to white to not tint the surface
						planets[name].surfaceMesh.material.map =
							textureLoader.load(
								'assets/maps/' + loadName + '.jpg',
							);
						planets[name].surfaceMesh.material.needsUpdate = true;
					}

					if (
						planets[name]['mapClass']['bumpMap'] ||
						planets[name]['mapClass']['normalMap']
					) {
						// If they have height maps

						if (planets[name]['mapClass']['normalMap']) {
							// Use the normal map
							planets[name].surfaceMesh.material.normalMap =
								textureLoader.load(
									'assets/normalmaps/' + loadName + '.jpg',
								);
						} else {
							// Otherwise, bump map
							planets[name].surfaceMesh.material.bumpMap =
								textureLoader.load(
									'assets/bumpmaps/' + loadName + '.jpg',
								);
						}

						if (planets[name]['mapClass']['normalMap']) {
							// Reset the scale
							if (planets[name]['heightMapScale']) {
								planets[name].surfaceMesh.material.normalScale =
									new THREE.Vector2(
										globalBumpScaling *
											planets[name]['heightMapScale'],
										globalBumpScaling *
											planets[name]['heightMapScale'],
									);
							}
						} else {
							if (planets[name]['heightMapScale']) {
								planets[
									name
								].surfaceMesh.material.heightMapScale =
									globalBumpScaling *
									planets[name]['heightMapScale'];
								planets[name].surfaceMesh.material.bumpScale =
									globalBumpScaling *
									planets[name]['heightMapScale'];
							} else {
								planets[
									name
								].surfaceMesh.material.heightMapScale =
									globalBumpScaling * 1;
								planets[name].surfaceMesh.material.bumpScale =
									globalBumpScaling * 1;
							}
						}
					}
					if (planets[name]['mapClass']['specularMap']) {
						// Deal with specular specularMap - this is just Earth
						planets[name].surfaceMesh.material.specularMap =
							textureLoader.load(
								'assets/specmaps/' + loadName + '.jpg',
							);
						planets[name].surfaceMesh.material.specular =
							new THREE.Color(0x111111);
						planets[name].surfaceMesh.material.shininess = 30;
					}

					if (
						planets[name]['mapClass']['atmo'] &&
						name != 'mars' &&
						!lowRes
					) {
						planets[name].atmoMesh.material.map =
							textureLoader.load(
								'assets/special/' + name + 'cloudmap.jpg',
							);
						if (name == 'earth') {
							planets[name].atmoMesh.material.alphaMap =
								textureLoader.load(
									'assets/special/' + name + 'cloudmap.jpg',
								);
						}
						planets[name].atmoMesh.material.needsUpdate = true;
					}
				}
			} else {
				// Set texture of the ring edge
				var texture = new THREE.TextureLoader().load(
					'assets/special/theringedge.png',
				);
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(30, 1);

				// Set the basic colour
				planets[name].surfaceMesh.children[0].material.color = {
					// Colour back to white to not tint the surface
					r: 1,
					g: 1,
					b: 1,
				};
				planets[name].surfaceMesh.children[1].material.color = {
					// Colour back to white to not tint the surface
					r: 1,
					g: 1,
					b: 1,
				};
				planets[name].surfaceMesh.children[0].material.map = texture;

				// Set the transparency of the tranparent ring
				texture = new THREE.TextureLoader().load(
					'assets/special/theringinvedge.png',
				);
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(30, 1);

				// Set all textures
				planets[name].surfaceMesh.children[0].material.specularMap =
					texture;
				planets[name].surfaceMesh.children[0].material.alphaMap =
					texture;
				planets[
					name
				].surfaceMesh.children[0].material.transparent = true;
				planets[name].surfaceMesh.children[1].material.map =
					textureLoader.load('assets/special/theringmap.png');
			}
		}
	}
}

function loadModel(name) {
	// Load in a model of a body which has one (rendered as a featureless sphere before)
	startSmallLoading();

	// Determine which version it should load
	var add = '';
	var stringAdd = '';

	if (highDef) {
		add = ' HD';
		stringAdd = ' - HD Version';
	}

	// Determine which type it should load
	if (planets[name]['mapClass']['glTF']) {
		var loader = new THREE.GLTFLoader();

		// Run the loader on the model
		loader.load(
			'models/glTF/' + name.toUpperCase() + add + '/scene.gltf',
			function (loadedScene) {
				// Set timeout to avoid computational freezing
				setTimeout(function () {
					endSmallLoading();

					console.log(capitalise(name) + ' Loaded' + stringAdd);

					planets[name]['surfaceMesh'].visible = false;
					scene.remove(planets[name]['surfaceMesh']);
					// Hide the old surface

					// Remove something more mesh-like (it's still a container) from the initial scene
					var mesh = loadedScene.scene.children[0];

					// Iterate through all children of the container and set shadow rules
					mesh.traverse(function (child) {
						// Go through all the children and apply shadow rules
						if (child instanceof THREE.Mesh) {
							// Set shadow rules
							child.castShadow = true;
							child.receiveShadow = true;
							//child.material.normalScale.set(-1, 1)
							//child.material.metalness = 1;
						}
					});

					placeSphere(name, mesh);
					planets[name]['surfaceMesh'].visible = true;
					// Render and place the new one

					var mod = 1;

					if (planets[centeredObject]['modelScale']) {
						mod = planets[centeredObject]['modelScale'];
					}
					planets[name]['surfaceMesh'].scale.copy(
						threeVector([1, 1, 1]),
					);
					var value =
						(mod * planets[centeredObject].r * totalScale) /
						(getObjectSize(planets[name]['surfaceMesh']) / 2);
					planets[name]['surfaceMesh'].scale.copy(
						threeVector([value, value, value]),
					);
					// If it's really tiny (such as 67p), make it larger for viewing

					fixPlanetRotation(name);
					// Rotate for axial tilt
				}, 0);
			},
		);
	} else {
		var loader = new THREE.OBJLoader();

		loader.load('models/obj/' + name + add + '.obj', function (object) {
			endSmallLoading();

			console.log(capitalise(name) + ' Loaded' + stringAdd);

			var settings = {
				color: planets[name]['colour'], // Make the planet's colour be the surface colour
			};
			var material;

			if (userOnPhone) {
				material = new THREE.MeshLambertMaterial(settings);
			} else {
				settings.specular = black;
				settings.shininess = 0;
				material = new THREE.MeshPhongMaterial(settings);
			}

			// Process geometry

			var geometry = new THREE.Geometry();

			for (var index in object.children) {
				// Iterate through and merge sub-geometries into one geometry
				var child = object.children[index];
				//child.material = material;
				var newGeometry = new THREE.Geometry().fromBufferGeometry(
					child.geometry,
				);

				var newMesh = new THREE.Mesh(newGeometry);

				newMesh.updateMatrix();
				geometry.merge(newMesh.geometry, newMesh.matrix);
			}

			geometry.computeFaceNormals();
			geometry.mergeVertices();
			geometry.computeVertexNormals();

			planets[name]['surfaceMesh'].visible = false;
			scene.remove(planets[name]['surfaceMesh']);
			// Hide the old surface

			var mesh = new THREE.Mesh(geometry, material);
			placeSphere(name, mesh);
			planets[name]['surfaceMesh'].visible = true;
			// Render and place the new one

			mesh.castShadow = false;
			mesh.receiveShadow = false;

			var mod = 1;

			if (planets[name]['modelScale']) {
				mod = planets[name]['modelScale'];
			}

			// If it's really tiny (such as 67p), make it larger for viewing

			fixPlanetRotation(name);
			// Rotate for axial tilt

			planets[name]['surfaceMesh'].scale.copy(threeVector([1, 1, 1]));
			var value =
				(mod * planets[name].r * totalScale) /
				(getObjectSize(planets[name]['surfaceMesh']) / 2);
			planets[name]['surfaceMesh'].scale.copy(
				threeVector([value, value, value]),
			);
		});
	}
}

// User Time Functions

function changeTimeScale() {
	// Change the rate at which time passes
	if (!isNaN(Number(document.getElementById('inputTimeScale').value))) {
		// If it's valid
		// Take it in and set the time frame
		apparentTimeRate =
			document.getElementById('inputTimeScale').value *
			convertTime('H', 'S', 1);
		timeRate = apparentTimeRate;
		timeIncrement = timeRate * (1000 / timeScale);
	} else {
		// ELSE place the current one back in
		document.getElementById('inputTimeScale').value =
			apparentTimeRate * convertTime('S', 'H', 1);
	}
}

function setNowTime() {
	// Set the time to now
	var now = new Date();

	// Get current time
	var time = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		now.getHours(),
		now.getMinutes(),
		now.getSeconds(),
	);
	var year = time.getFullYear();
	var month = time.getMonth() + 1;
	var day = time.getDate();
	var hours = time.getHours();
	if (hours < 10) {
		hours = '0' + hours;
	}
	var minutes = time.getMinutes();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}

	// Set the pickers to the current time
	document.getElementById('timepicker').value = hours + ':' + minutes;
	document.getElementById('datepicker').value =
		day + '/' + month + '/' + year;

	// Update the current time
	setCurrentTime();
}

function setCurrentTime() {
	// Set the simulation time to the selected time, fix all rotations and positions

	// Take in selected data
	var hours = document.getElementById('timepicker').value.split(':')[0];
	var minutes = document.getElementById('timepicker').value.split(':')[1];

	var day = document.getElementById('datepicker').value.split('/')[0];
	var month = document.getElementById('datepicker').value.split('/')[1] - 1;
	var year = document.getElementById('datepicker').value.split('/')[2];

	var newTime = new Date(
		year,
		month,
		day,
		hours,
		minutes,
		currentTime.getSeconds(),
		currentTime.getMilliseconds(),
	);
	var timeDif = newTime.getTime() - currentTime.getTime();

	for (var name in planets) {
		if (name != 'ship') {
			// Fix rotations by however much the time just changed
			var axis = new THREE.Vector3(0, 1, 0).normalize();
			if (planets[name]['mapClass']['model']) {
				axis = new THREE.Vector3(0, 0, 1).normalize();
			}
			var rotation =
				(2 * Math.PI * timeDif * convertTime('MS', 'D', 1)) /
				planets[name]['rotation'];

			planets[name]['surfaceMesh'].rotateOnAxis(axis, rotation);
		}
	}
	currentTime = new Date(
		newTime.getUTCFullYear(),
		newTime.getUTCMonth(),
		newTime.getUTCDate(),
		newTime.getUTCHours(),
		newTime.getUTCMinutes(),
		newTime.getUTCSeconds(),
	);
	displayTime = newTime;
}

// Transfer display functions

function changeTransferType() {
	// Change type of transfer

	// Hide all controls
	document.getElementById('IPTransfer').style.display = 'none';
	document.getElementById('ILTransfer').style.display = 'none';
	document.getElementById('EpsteinTransfer').style.display = 'none';
	document.getElementById('lightLag').style.display = 'none';
	document.getElementById('ISTransfer').style.display = 'none';

	document.getElementById('deltaVeeDisplay').style.display = 'none';

	document.getElementById(
		document.getElementById('transferType').value,
	).style.display = 'block';

	if (document.getElementById('transferType').value == 'ILTransfer') {
		// Move it to the selected center if it's an IL transfer
		changeILCenter();
	}

	if (document.getElementById('transferType').value == 'EpsteinTransfer') {
		// Move it to the selected center if it's an EP transfer
		changeEpsteinCenter();
	}

	hideLightLagLines();
	hideLightParticles();
}

function hideShowPorkchop() {
	// Hide or show the porkchop plot
	if (porkchopShown) {
		porkchopShown = false;
		document.getElementById('transferDetails').style.bottom = '-300px';
		setTimeout(function () {
			if (porkchopShown == false) {
				document.getElementById('transferDetails').style.display =
					'none';
			}
		}, 2000);
		document.getElementById('retractDetails').style.bottom = '0px';
		//document.getElementById("retractDetailsImage").style.transform = "rotate(90deg)";
	} else {
		porkchopShown = true;
		document.getElementById('transferDetails').style.display = 'block';
		setTimeout(function () {
			document.getElementById('transferDetails').style.bottom = '10px';
		}, 1);
		document.getElementById('retractDetails').style.bottom = '260px';
		//document.getElementById("retractDetailsImage").style.transform = "rotate(270deg)";
	}
}

// Text Update and verification

function toIPText() {
	// On changing of the destination IP field - perform validation and display updates
	var name = document.getElementById('toTarget').value.toLowerCase();
	if (
		planets[name]['atmoMesh'] != undefined ||
		planets[name]['r'] > planets['earth']['r'] * 2
	) {
		// If it has an atmosphere, or if it is large enough to be a gas giant
		// ~2 Earth Radii is the upper cutoff of superearth, and the lower cutoff of gas giants (approx)
		document.getElementById('IPAerobrake').style.display = 'inline';
	} else {
		document.getElementById('IPAerobrake').style.display = 'none';
	}

	// Manage aerobraking display
	document.getElementById('IPAero').checked = false;
	document.getElementById('toDistanceAbove').disabled =
		document.getElementById('IPAero').checked;

	// Grey out the textbox caption to indicate if it's disabled
	if (document.getElementById('IPAero').checked) {
		document.getElementById('toDistAboveText').style.color =
			'rgb(136,136,136)';
	} else {
		document.getElementById('toDistAboveText').style.color =
			'rgb(255,255,255)';
	}
}

function fromILText() {
	// On changing of the origin IL Field - perform validation and display updates

	if (
		document.getElementById('fromILTarget').value.toLowerCase() == 'orbit'
	) {
		document.getElementById('fromDistSelect').style.display = 'inline';
	} else {
		if (
			planets[
				document.getElementById('fromILTarget').value.toLowerCase()
			]['satellite']
		) {
			document.getElementById('fromDistSelect').style.display = 'none';
		} else {
			document.getElementById('fromDistSelect').style.display = 'inline';
		}
	}
}

function toILText() {
	// On changing of the destination IL Field - run error checking and display updates

	var name = document.getElementById('toILTarget').value.toLowerCase();

	if (name != 'orbit') {
		if (planets[name]['satellite']) {
			// No need for final orbit distance for satellite
			document.getElementById('toDistSelect').style.display = 'none';
		} else {
			document.getElementById('toDistSelect').style.display = 'inline';
		}

		if (planets[name]['atmoMesh'] != undefined) {
			// Aerobraking not possible without air
			document.getElementById('ILAerobrake').style.display = 'inline';
		} else {
			document.getElementById('ILAerobrake').style.display = 'none';
		}
	} else {
		document.getElementById('ILAerobrake').style.display = 'none';
		document.getElementById('toDistSelect').style.display = 'inline';
	}

	// Manage aerobrake display
	document.getElementById('IPAero').checked = false;
	document.getElementById('toDistanceAboveIL').disabled =
		document.getElementById('IPAero').checked;

	// Grey out the textbox caption to indicate that it's disabled
	if (document.getElementById('IPAero').checked) {
		document.getElementById('toDistAboveILText').style.color =
			'rgb(136,136,136)';
	} else {
		document.getElementById('toDistAboveILText').style.color =
			'rgb(255,255,255)';
	}
}

function updateAerobrakes() {
	// Update whether or not the distance above matters
	// Disable the textbox if aerobraking, the parking orbit no longer matters
	// Gray out the text below if it is disabled, otherwise keep it white
	document.getElementById('toDistanceAboveIL').disabled =
		document.getElementById('ILAero').checked;
	if (document.getElementById('ILAero').checked) {
		document.getElementById('toDistAboveILText').style.color =
			'rgb(136,136,136)';
	} else {
		document.getElementById('toDistAboveILText').style.color =
			'rgb(255,255,255)';
	}

	document.getElementById('toDistanceAbove').disabled =
		document.getElementById('IPAero').checked;
	if (document.getElementById('IPAero').checked) {
		document.getElementById('toDistAboveText').style.color =
			'rgb(136,136,136)';
	} else {
		document.getElementById('toDistAboveText').style.color =
			'rgb(255,255,255)';
	}
}

// Mass graphics

function showHideReal() {
	// Display or hide the real solar system (lens flares vs markers and orbits)

	realSystem = !realSystem;
	for (var planet in planets) {
		if (!realSystem && planet != 'sun') {
			planets[planet].markerMesh.material.opacity = 0.3;
			if (planet == 'ship') {
				planets[planet].markerMesh.material.opacity = 1;
			}
		} else {
			planets[planet].markerMesh.material.opacity = 0;
		}
		if (planet != 'sun') {
			// Manage if lens flare and orbit should be shown (conditional on whether it can be hidden)
			planets[planet]['lensFlare'].visible =
				realSystem &&
				(planets[planet]['center'] == centeredPlanet ||
					planets[planet]['center'] == 'sun' ||
					planet == centeredObject);

			if (planets[planet]['orbitMesh']) {
				planets[planet]['orbitMesh'].visible = !realSystem;
			}

			if (
				planets[planet]['markerMesh'] &&
				(planets[planet]['surfaceMesh'].visible ||
					planets[planet]['center'] == 'sun')
			) {
				if (realSystem) {
					planets[planet]['markerMesh'].opacity = 0.3;
				} else {
					planets[planet]['markerMesh'].opacity = 0;
				}
			}
		}
	}

	// Manage how the ship should be displayed
	if (planets['ship']) {
		if (planets['ship']['orbitMesh']) {
			planets['ship']['orbitMesh'].visible = !realSystem;
		} else {
			EpsteinLine.visible = !realSystem;
			flipMarker.visible = !realSystem;
		}

		if (realSystem) {
			planets['ship'].markerMesh.opacity = 0;
		} else {
			planets['ship'].markerMesh.opacity = 1;
		}

		if (cameraMode == 'ship') {
			// Hide the ship if in ship camera view
			planets['ship'].markerMesh.visible = false;
			planets['ship'].surfaceMesh.visible = false;
			planets['ship']['lensFlare'].visible = false;
			if (planets['ship']['orbitMesh']) {
				planets['ship']['orbitMesh'].visible = false;
			}
		}

		if (
			shipEndTime == false &&
			EpsteinEndTime == false &&
			ISEndTime == false
		) {
			// Hide ship if no transfer
			planets['ship']['lensFlare'].visible = false;

			if (planets['ship']['orbitMesh']) {
				planets['ship']['orbitMesh'].visible = false;
			}
		}
	}

	if (realSystem) {
		// Switch controls
		document.getElementById('visibleControl').innerHTML =
			'Show Orbit Diagram';
	} else {
		document.getElementById('visibleControl').innerHTML =
			'Show Real Solar System';
	}

	updatePlanetsDisplay();
}

function updatePlanetsDisplay() {
	// Update planet display
	bodiesShow = document.getElementById('showBodies').checked;
	expanseShow = document.getElementById('showExpanse').checked;
	satellitesShow = document.getElementById('showSatellites').checked;
	advancedShow = document.getElementById('showAdvanced').checked;

	if (planets['mars']['ringMesh']) {
		planets['mars']['ringMesh'].visible = expanseShow; // Take care of the Deimos Ring
	}

	// Manage guides
	vernalLine.visible = advancedShow && !realSystem;
	belt.visible = advancedShow && !realSystem;
	kuiper.visible = advancedShow && !realSystem;

	for (var name in planets) {
		if (name != 'sun' && name != 'ship') {
			// If it should be changed, modify whether the planet shows

			if (
				planets[name].viewingClass.expanseHide ||
				planets[name].viewingClass.minorSatellite ||
				planets[name].viewingClass.expanse ||
				planets[name].viewingClass.minorBody
			) {
				changePlanetDisplay(name, shouldShow(name));
			}
		}
	}
	updateDropdowns();

	if (webVR) {
		updateWebVRVisibility();
	}
}

// Specific Graphic Control

function shouldUpdate(name) {
	// Determine whether the planet should be updated

	var update = false;
	if (
		planets[name]['surfaceMesh'].visible ||
		planets[name]['center'] == 'sun' ||
		planets[name]['satellite']
	) {
		update = true;
	}
	if (planets[name]['lensFlare']) {
		if (planets[name]['lensFlare'].visible) {
			update = true;
		}
	}
	return update;
}

function changePlanetDisplay(name, toggle) {
	// Switch if the planet should be shown or not
	// toggle = true realSystem = false: Show normal bits
	//
	//var planet = planets[name];

	// Show the planet if called for and ONLY if it should be for computational power
	planets[name].surfaceMesh.visible =
		toggle &&
		((planets[name]['center'] == centeredPlanet &&
			centeredObject != 'sun') ||
			name == centeredObject);
	if (planets[name].atmoMesh) {
		planets[name].atmoMesh.visible =
			toggle &&
			(planets[name]['center'] == centeredPlanet ||
				name == centeredObject);
	}
	planets[name].markerMesh.visible =
		toggle &&
		(planets[name]['center'] == centeredPlanet ||
			planets[name]['center'] == 'sun' ||
			name == centeredObject);

	if (planets[name].lensFlare) {
		if (realSystem == true && toggle == true) {
			// Show the lens flare if it should be shown AND  if realSystem = true
			planets[name].lensFlare.visible =
				true &&
				((planets[name]['center'] == centeredPlanet &&
					centeredObject != 'sun') ||
					name == centeredObject);
			toggle = false;
		} else {
			planets[name].lensFlare.visible = false;
		}
	}

	// Manage the opacity of the marker meshes
	planets[name].orbitMesh.visible = toggle;
	if (toggle) {
		planets[name].markerMesh.material.opacity = 0.3;
	} else {
		planets[name].markerMesh.material.opacity = 0;
	}
}

// Body Display Evaluations

function shouldShow(name) {
	// Determine if it should show the planet based on the modifier arrays

	// Get initial data
	name = name.toLowerCase();
	var show = false;
	var changed = false;

	// First, check if it exists and is controled by any of these
	if (planets[name]) {
		if (planets[name].viewingClass) {
			if (planets[name].viewingClass.minorBody) {
				// If it is in a list, unless it is to be shown, don't show it
				changed = true;
				if (bodiesShow) {
					show = true;
				}
			}
			if (planets[name].viewingClass.expanse) {
				// ETC
				changed = true;
				if (expanseShow) {
					show = true;
				}
			}
			if (planets[name].viewingClass.minorSatellite) {
				changed = true;
				if (satellitesShow) {
					show = true;
				}
			}
			if (planets[name].viewingClass.expanseHide) {
				changed = true;
				if (!expanseShow) {
					show = true;
				}
			}

			if (planets[name].viewingClass.easterEgg) {
				changed = true;
				if (!eggEnabled) {
					show = false;
				}
			}
		}
	}

	if (changed == false) {
		// If it's not in any list, show it anyway.
		show = true;
	}

	if (name == '' || !name) {
		show = false;
	}

	return show;
}

// Dropdown Display Control

function updateDropdowns() {
	// Update all the dropdowns when planets shown or hidden - and deal with if they are selected

	// To figure out what each does, look at the rules and which one each populates
	// Note that if the value is not valid, it will move back to a default value

	var centerChanged = false;
	var moonChanged = false;

	// Get ALL the data
	var moonValue = document.getElementById('moonSelect').value;
	var centerValue = document.getElementById('centerSelect').value;
	var fromValue = document.getElementById('fromTarget').value;
	var toValue = document.getElementById('toTarget').value;
	var fromILValue = document.getElementById('fromILTarget').value;
	var toILValue = document.getElementById('toILTarget').value;
	var ILValue = document.getElementById('ILCenter').value;
	var fromEpsteinValue = document.getElementById('fromEpsteinTarget').value;
	var toEpsteinValue = document.getElementById('toEpsteinTarget').value;
	var EpsteinCenterValue = document.getElementById('EpsteinCenter').value;
	var lightChoiceValue = document.getElementById('lightChoice').value;

	// Update the center and light choice dropdowns
	var printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name == 'sun') {
				printer +=
					"<option value='" +
					name +
					"'>" +
					capitalise(name) +
					'</option>';
			} else {
				if (planets[name]['center'] == 'sun') {
					printer +=
						"<option value='" +
						name +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}

	document.getElementById('centerSelect').innerHTML = printer;
	document.getElementById('lightChoice').innerHTML = printer;

	// Update the interplanetary to and from dropdowns
	printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && name != 'ship') {
				if (planets[name]['center'] == 'sun') {
					printer +=
						"<option value='" +
						capitalise(name) +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}
	document.getElementById('fromTarget').innerHTML = printer;
	document.getElementById('toTarget').innerHTML = printer;
	//document.getElementById("ILCenter").innerHTML = printer;

	// Update the Epstein Drive to and from dropdowns
	printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && name != 'ship') {
				if (
					planets[name]['center'] == EpsteinCenterValue.toLowerCase()
				) {
					printer +=
						"<option value='" +
						name +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}
	document.getElementById('fromEpsteinTarget').innerHTML = printer;
	document.getElementById('toEpsteinTarget').innerHTML = printer;

	// Update Epstein and IL center dropdowns
	printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun') {
				if (planets[name]['center'] == 'sun') {
					var centerCount = 0;
					for (var planet in planets) {
						if (
							planets[planet]['center'] == name &&
							shouldShow(planet)
						) {
							centerCount += 1;
						}
					}
					if (centerCount >= 2) {
						printer +=
							"<option value='" +
							capitalise(name) +
							"'>" +
							capitalise(name) +
							'</option>';
					}
				}
			}
		}
	}
	document.getElementById('EpsteinCenter').innerHTML =
		"<option value='sun'>Sun</option>" + printer;
	document.getElementById('ILCenter').innerHTML = printer;

	// Update the moon selector dropdown
	printer = "<option value='sun'>Sun</option>";
	for (var name in planets) {
		if (shouldShow(name)) {
			if (name != 'sun') {
				if (planets[name]['center'] == 'sun') {
					var count = 0;
					for (var name2 in planets) {
						if (planets[name2]['center'] == name) {
							count += 1;
						}
					}
					if (count >= 2) {
						printer +=
							"<option value='" +
							capitalise(name) +
							"'>" +
							capitalise(name) +
							'</option>';
					}
				}
			}
		}
	}
	printer =
		"<option value='planet'>" + capitalise(centeredPlanet) + '</option>';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && centeredPlanet != 'sun') {
				if (planets[name]['center'] == centeredPlanet) {
					printer +=
						"<option value='" +
						name +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}
	document.getElementById('moonSelect').innerHTML = printer;

	// Update interlunar to and from dropdowns
	printer = '';
	for (var name in currentPositions) {
		if (shouldShow(name)) {
			if (name != 'sun' && centeredObject != 'sun' && name != 'ship') {
				if (planets[name]['center'] == ILValue.toLowerCase()) {
					printer +=
						"<option value='" +
						capitalise(name) +
						"'>" +
						capitalise(name) +
						'</option>';
				}
			}
		}
	}
	document.getElementById('fromILTarget').innerHTML = printer;
	document.getElementById('toILTarget').innerHTML = printer;

	// Set to defaults if planet not shown
	if (!shouldShow(moonValue)) {
		moonValue = 'planet';
		moonChanged = true;
	}

	if (!shouldShow(centerValue)) {
		centerValue = 'sun';
		centerChanged = true;
	}

	if (!shouldShow(fromValue)) {
		fromValue = 'Mercury';
	}

	if (!shouldShow(toValue)) {
		toValue = 'Mercury';
	}

	var centerCount = 0;
	for (var planet in planets) {
		if (
			planets[planet]['center'] == ILValue.toLowerCase() &&
			shouldShow(planet)
		) {
			centerCount += 1;
		}
	}

	// If the IL center value has fewer than two moons, switch
	if (!shouldShow(ILValue) || centerCount < 2) {
		document.getElementById('ILCenter').selectedIndex = 0;
		ILValue = document.getElementById('ILCenter').value;
		document.getElementById('ILCenter').selectedIndex = null;

		printer = '';
		for (var name in currentPositions) {
			if (shouldShow(name)) {
				if (
					name != 'sun' &&
					centeredObject != 'sun' &&
					name != 'ship'
				) {
					if (planets[name]['center'] == ILValue.toLowerCase()) {
						printer +=
							"<option value='" +
							capitalise(name) +
							"'>" +
							capitalise(name) +
							'</option>';
					}
				}
			}
		}

		document.getElementById('fromILTarget').innerHTML = printer;
		document.getElementById('toILTarget').innerHTML = printer;
	}

	if (!shouldShow(fromILValue)) {
		document.getElementById('fromILTarget').selectedIndex = 0;
		fromILValue = document.getElementById('fromILTarget').value;
		document.getElementById('fromILTarget').selectedIndex = null;
	}

	if (!shouldShow(toILValue)) {
		document.getElementById('toILTarget').selectedIndex = 0;
		toILValue = document.getElementById('toILTarget').value;
		document.getElementById('toILTarget').selectedIndex = null;
	}

	var centerCount = 0;
	for (var planet in planets) {
		if (
			planets[planet]['center'] == EpsteinCenterValue.toLowerCase() &&
			shouldShow(planet)
		) {
			centerCount += 1;
		}
	}

	if (!shouldShow(EpsteinCenterValue) || centerCount < 2) {
		EpsteinCenterValue = 'sun';
		fromEpsteinValue = 'mercury';
		toEpsteinValue = 'mercury';

		printer = '';
		for (var name in currentPositions) {
			if (shouldShow(name)) {
				if (name != 'sun' && name != 'ship') {
					if (
						planets[name]['center'] ==
						EpsteinCenterValue.toLowerCase()
					) {
						printer +=
							"<option value='" +
							name +
							"'>" +
							capitalise(name) +
							'</option>';
					}
				}
			}
		}

		document.getElementById('fromEpsteinTarget').innerHTML = printer;
		document.getElementById('toEpsteinTarget').innerHTML = printer;
	}

	if (!shouldShow(fromEpsteinValue)) {
		fromEpsteinValue = 'mercury';
	}

	if (!shouldShow(toEpsteinValue)) {
		toEpsteinValue = 'mercury';
	}

	if (!shouldShow(lightChoiceValue)) {
		lightChoiceValue = 'sun';
	}

	// Push the fixed values back in
	document.getElementById('moonSelect').value = moonValue;
	document.getElementById('centerSelect').value = centerValue;
	document.getElementById('fromTarget').value = fromValue;
	document.getElementById('toTarget').value = toValue;
	document.getElementById('fromILTarget').value = fromILValue;
	document.getElementById('toILTarget').value = toILValue;
	document.getElementById('ILCenter').value = ILValue;
	document.getElementById('fromEpsteinTarget').value = fromEpsteinValue;
	document.getElementById('toEpsteinTarget').value = toEpsteinValue;
	document.getElementById('EpsteinCenter').value = EpsteinCenterValue;
	document.getElementById('lightChoice').value = lightChoiceValue;

	updateLightMoon();

	// If anything's changed, make sure it correctly changes
	if (centerChanged) {
		changeCenter();
	}
	if (moonChanged) {
		changeMoon();
	}
}

// Ship Camera Controls

function startShipView() {
	// Initialize the ship camera view
	document.getElementById('shipViewButton').innerHTML = 'Orbital Camera View';
	document.getElementById('shipViewButton').onclick = resetShipView;
	cameraMode = 'ship';
	controls.enabled = false;

	if (EpsteinEndTime) {
		shipCameraFrom = EpsteinTransitData['nameOne'];
		shipCameraTo = EpsteinTransitData['nameTwo'];
	}

	if (shipEndTime) {
		shipCameraFrom = transitData['nameOne'];
		shipCameraTo = transitData['nameTwo'];
	}
}

function resetShipView() {
	// End the ship camera view, back to the normal orbital view
	cameraMode = 'orbital';
	document.getElementById('shipViewButton').onclick = startShipView;
	document.getElementById('shipViewButton').innerHTML = 'Ship Camera View';
	if (shipCameraFrom) {
		if (!realSystem) {
			planets[shipCameraFrom].markerMesh.material.opacity = 0.3;
		} else {
			planets[shipCameraFrom].markerMesh.material.opacity = 0;
		}
	}
	if (shipCameraTo) {
		if (!realSystem) {
			planets[shipCameraTo].markerMesh.material.opacity = 0.3;
		} else {
			planets[shipCameraTo].markerMesh.material.opacity = 0;
		}
	}
	shipCameraFrom = null;
	shipCameraTo = null;
	controls.enabled = true;

	if (shipEndTime != false || EpsteinEndTime != false || ISEndTime != false) {
		planets['ship'].surfaceMesh.visible = true;
		if (planets['ship']['markerMesh']) {
			planets['ship'].markerMesh.visible = true;
			if (!realSystem) {
				planets['ship'].markerMesh.material.opacity = 1;
			} else {
				planets['ship'].markerMesh.material.opacity = 0;
			}
		}
		if (planets['ship']['lensFlare']) {
			planets['ship']['lensFlare'].visible = realSystem;
		}
		if (planets['ship']['orbitMesh']) {
			planets['ship']['orbitMesh'].visible = !realSystem;
		}
	}
}

// Ship Centered Orbital View (handled separately due to the ship not being like a regular planet)

function startShipCenter() {
	// Move the camera into centering around the ship
	cameraMode = 'shipCenter';
}

function stopShipCenter() {
	// Move the camera back to normal viewing
	// This distinction is ONLY needed because this ship is not controlled like a normal planet
	cameraMode = 'orbital';
}

// Instrument Panel control

function retractInstrumentPanels() {
	// Pull all panels back off the side
	document.getElementById('viewInstrumentPanel').style.left = '-250px';
	if (stereoDisp) {
		document.getElementById('backLink').style.right =
			10 - document.getElementById('backLink').clientWidth / 4 + 'px';
		document.getElementById('retractArrow').style.left =
			0 - document.getElementById('retractArrow').clientWidth / 4 + 'px';
		document.getElementById('retractDetails').style.right =
			10 -
			document.getElementById('retractDetails').clientWidth / 4 +
			'px';
		document.getElementById('transferDetails').style.right =
			10 -
			document.getElementById('transferDetails').clientWidth / 4 +
			'px';
	} else {
		document.getElementById('backLink').style.right = '10px';
		document.getElementById('retractArrow').style.left = '0px';
		document.getElementById('retractDetails').style.right = '10px';
		document.getElementById('transferDetails').style.right = '10px';
	}
	document.getElementById('transferInstrumentPanel').style.right = '-250px';

	document.getElementById('retractImage').style.transform = 'rotate(180deg)';
	document.getElementById('retractArrow').onclick = extendInstrumentPanels;
}

function extendInstrumentPanels() {
	// Push the panels into the viewframe
	if (stereoDisp) {
		document.getElementById('viewInstrumentPanel').style.left =
			10 -
			document.getElementById('viewInstrumentPanel').clientWidth / 4 +
			'px';
		document.getElementById('backLink').style.right =
			260 -
			document.getElementById('transferInstrumentPanel').clientWidth / 2 -
			document.getElementById('backLink').clientWidth / 4 +
			'px';
		document.getElementById('transferInstrumentPanel').style.right =
			10 -
			document.getElementById('transferInstrumentPanel').clientWidth / 4 +
			'px';
		document.getElementById('retractArrow').style.left =
			260 -
			document.getElementById('viewInstrumentPanel').clientWidth / 2 -
			document.getElementById('retractArrow').clientWidth / 4 +
			'px';

		document.getElementById('retractDetails').style.right =
			260 -
			document.getElementById('viewInstrumentPanel').clientWidth / 2 -
			document.getElementById('retractDetails').clientWidth / 4 +
			'px';
		document.getElementById('transferDetails').style.right =
			260 -
			document.getElementById('viewInstrumentPanel').clientWidth / 2 -
			document.getElementById('transferDetails').clientWidth / 4 +
			'px';
	} else {
		document.getElementById('viewInstrumentPanel').style.left = '10px';
		document.getElementById('backLink').style.right = '260px';
		document.getElementById('transferInstrumentPanel').style.right = '10px';
		document.getElementById('retractArrow').style.left = '260px';

		document.getElementById('retractDetails').style.right = '260px';
		document.getElementById('transferDetails').style.right = '260px';
	}
	document.getElementById('retractImage').style.transform = 'rotate(0deg)';
	document.getElementById('retractArrow').onclick = retractInstrumentPanels;
}

// GENERAL FUNCTIONS

function round(value, points) {
	// Round a value to a certain number of decimal points
	//return Math.round(value * Math.pow(10, points)) / Math.pow(10, points);

	if (!points) {
		points = 0;
	}

	return value.toFixed(points);
}

function roundChop(value, points) {
	if (!points) {
		points = 0;
	}

	return Math.round(value * Math.pow(10, points)) / Math.pow(10, points);
}

// ThreeJS helper functions

function getObjectSize(obj) {
	var box = new THREE.Box3().setFromObject(obj);

	var firstBound = reverseThreeVector(box.max);
	var secondBound = reverseThreeVector(box.min);

	return (
		magnitude(subVec(firstBound, secondBound)) /
		Math.sqrt(3) /
		scene.scale.x
	);
}

// Transformation Functions

function M3S2toAU3Y2(value) {
	// Convert M3/S2 to AU3/Y2 - for gravParams
	return value * convertDistance('M', 'AU', 3) * convertTime('S', 'Y', -2);
}

function AU3Y2toM3S2(value) {
	// Convert AU3/Y2 to M3/S2 - for gravParams
	return value * convertDistance('AU', 'M', 3) * convertTime('Y', 'S', -2);
}

function convertTime(from, to, pow) {
	// Convert any time from a format to a format with a given power
	if (pow == undefined) {
		pow = 1;
	}
	var value = 1;

	if (from == 'MS') {
		value = 1;
	} else if (from == 'S') {
		value = 1000;
	} else if (from == 'M') {
		value = 1000 * 60;
	} else if (from == 'H') {
		value = 1000 * 60 * 60;
	} else if (from == 'D') {
		value = 1000 * 60 * 60 * 24;
	} else if (from == 'W') {
		value = 1000 * 60 * 60 * 24 * 7;
	} else if (from == 'Mo') {
		value = (1000 * 60 * 60 * 24 * 365.2422) / 12;
	} else if (from == 'Y') {
		value = 1000 * 60 * 60 * 24 * 365.2422;
	}

	if (to == 'MS') {
		value = value;
	} else if (to == 'S') {
		value = value / 1000;
	} else if (to == 'M') {
		value = value / (1000 * 60);
	} else if (to == 'H') {
		value = value / (1000 * 60 * 60);
	} else if (to == 'D') {
		value = value / (1000 * 60 * 60 * 24);
	} else if (to == 'W') {
		value = value / (1000 * 60 * 60 * 24 * 7);
	} else if (to == 'Mo') {
		value = value / ((1000 * 60 * 60 * 24 * 365.2422) / 12);
	} else if (to == 'Y') {
		value = value / (1000 * 60 * 60 * 24 * 365.2422);
	}

	var finalValue = Math.pow(value, pow);

	return finalValue;
}

function convertDistance(from, to, pow) {
	// Convert any distance from anything to anything, and with a power modifier

	if (pow == undefined) {
		pow = 1;
	}
	var value = 1;

	if (from == 'M') {
		value = 1;
	} else if (from == 'KM') {
		value = 1000;
	} else if (from == 'AU') {
		value = 149597870700;
	} else if (from == 'LY') {
		value = 9460528436447506;
	}

	if (to == 'M') {
		value = value;
	} else if (to == 'KM') {
		value = value / 1000;
	} else if (to == 'AU') {
		value = value / 149597870700;
	} else if (to == 'LY') {
		value = value / 9460528436447506;
	}

	var finalValue = Math.pow(value, pow);

	return finalValue;
}

function convertSpeed(from, to) {
	// Convert a speed in L/T format from anything to anything
	if (from == 'C') {
		from = ['LY', 'Y'];
	} else {
		from = from.split('/');
	}
	if (to == 'C') {
		to = ['LY', 'Y'];
	} else {
		to = to.split('/');
	}

	var Dfrom = from[0];
	var Tfrom = from[1];
	var Dto = to[0];
	var Tto = to[1];

	return convertDistance(Dfrom, Dto, 1) * convertTime(Tfrom, Tto, -1);
}

function DtoR(degrees) {
	// Degrees to Radians
	return (degrees / 180) * Math.PI;
}

function RtoD(radians) {
	// Radians to degrees
	return (radians / Math.PI) * 180;
}

function threeVector(array) {
	// Make a normal vector into a ThreeJS Vector3
	if (webVR) {
		return new THREE.Vector3(array[1], array[2], array[0]);
	} else {
		return new THREE.Vector3(array[0], array[1], array[2]);
	}
}

function reverseThreeVector(threeVector) {
	// Turn it from a threevector into an array-type vector
	if (webVR) {
		return [threeVector.z, threeVector.x, threeVector.y];
	} else {
		return [threeVector.x, threeVector.y, threeVector.z];
	}
}

function threeColourToRGB(threeColour) {
	return (
		'rgb(' +
		round(threeColour.r * 255) +
		',' +
		round(threeColour.g * 255) +
		',' +
		round(threeColour.b * 255) +
		')'
	);
}

function calculateVectorFromRADE(RA, DE) {
	// Convert a Right Ascension and DEclination into 3-part vector

	// Define three major axes. VE - Vernal Equinox. UP - Up, North Pole. MI - Mid, 6hr RA
	var VE = [1, 0, 0];
	var UP = planets['earth']['axialTilt'];
	var MI = setMagnitude(crossProduct(UP, VE), 1);

	// Convert to radians for maths functions
	RA = DtoR(RA);
	DE = DtoR(DE);

	// Determine how much in each axis
	var VEMag = Math.cos(DE) * Math.cos(RA);
	var MIMag = Math.cos(DE) * Math.sin(RA);
	var UPMag = Math.sin(DE);

	// Combine all to preduce resultant vector
	var vector = addVec(
		addVec(setMagnitude(VE, VEMag), setMagnitude(MI, MIMag)),
		setMagnitude(UP, UPMag),
	);

	return vector;
}

// Orbital Calculation Functions

function findPeriod(a, center) {
	// Find the period of a planet given the center and semi-major axis

	// Find and convert the gravitational parameter of the center
	var gravitationalParameter = findGravParam(center);
	gravitationalParameter = M3S2toAU3Y2(gravitationalParameter);

	// Calculate from Keplar's second law
	return Math.pow(
		((4 * Math.pow(Math.PI, 2)) / gravitationalParameter) * Math.pow(a, 3),
		1 / 2,
	); // Period in years. 1AU = 1 year
}

function calculateSynodicPeriod(period1, period2) {
	// Calculate synodic period given two periods

	// Both objects MUST be in the same SOI (kinda obviously, why would you try this if they weren't?)
	return 1 / Math.abs(1 / period1 - 1 / period2);
}

// Data Return Functions

function findGravParam(center) {
	// Find gravitational parameter of a body

	// Set default mass to sun
	var mass = 1.98855 * Math.pow(10, 30);

	// Reverse-derive from orbit of the Earth
	mass = AU3Y2toM3S2(4 * Math.PI * Math.PI) / gravitationalConstant;

	// Calculate the gravitational parameter
	var gravitationalParameter = mass * gravitationalConstant;

	if (center != 'sun') {
		// If around a non-sun body, find the parameter
		if (planets[center]['mass']) {
			gravitationalParameter =
				planets[center]['mass'] * gravitationalConstant;
		} else {
			gravitationalParameter = planets[center]['gravParam'];
		}
	}

	// Return the gravitational parameter
	return gravitationalParameter;
}

// Vector Manipulation Functions

function dotProduct(vector1, vector2) {
	// Take the dot product of two vectors
	return (
		vector1[0] * vector2[0] +
		vector1[1] * vector2[1] +
		vector1[2] * vector2[2]
	);
}

function crossProduct(v1, v2) {
	// Return the cross product of two vectors
	return [
		v1[1] * v2[2] - v1[2] * v2[1],
		v1[2] * v2[0] - v1[0] * v2[2],
		v1[0] * v2[1] - v1[1] * v2[0],
	];
}

function multiplyVec(mul, vec) {
	// Multiply a vector by a number
	return [mul * vec[0], mul * vec[1], mul * vec[2]];
}

function addVec(vec1, vec2) {
	// Add vectors
	return [vec1[0] + vec2[0], vec1[1] + vec2[1], vec1[2] + vec2[2]];
}

function subVec(vec1, vec2) {
	// Subtract vectors
	return [vec1[0] - vec2[0], vec1[1] - vec2[1], vec1[2] - vec2[2]];
}

function magnitude(vector) {
	// Find the magnitude of a vector
	return Math.pow(
		vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2],
		0.5,
	);
}

function setMagnitude(vector, mag) {
	// Set the magnitude of a vector
	return multiplyVec(mag / magnitude(vector), vector);
}

function vectorToAngle(vector) {
	// Find what angle a given vector is at from the vernal equinox - ANTICLOCKWISE

	// Use tangents to find out what angle it is
	var degreesFromOne = RtoD(Math.atan(vector[1] / vector[0])) % 360;

	if (vector[0] < 0) {
		// Compensate for arctan's blind spot
		degreesFromOne += 180;
	}

	// Round it out, ensuring that it is exactly one of the known orbital markers
	return (
		Math.round(orbitResolution * ((360 + degreesFromOne) % 360)) /
		orbitResolution
	);
}

function angleBetweenVectors(vec1, vec2) {
	// Find the anticlockwise angle between vectors

	// This the the acute angle between the two vectors
	var angle = RtoD(
		Math.acos(dotProduct(vec1, vec2) / (magnitude(vec1) * magnitude(vec2))),
	);

	// If the z component of the cross product > 0, anticlockwise angle is reported. Otherwise, it needs to be reversed to be the obtuse angle so it's anticlockwise
	if (crossProduct(vec1, vec2)[2] < 0) {
		angle = 360 - angle;
	}

	// Return the angle, making sure it's 0<angle<360
	return (360 + angle) % 360;
}

// String Transformation Functions

function capitalise(string) {
	// Capitalise the given string
	var splitString = string.split(' ');
	var newString = '';
	for (var index in splitString) {
		if (index != 0) {
			newString += ' ';
		}

		var subString = splitString[index].toLowerCase();

		newString += subString.charAt(0).toUpperCase() + subString.substr(1);
	}
	return newString;
}

// FUN FUNCTIONS

// Easter Egg Functions

function checkEasterEggs() {
	// This is called when disabling the SOI sphere

	if (eggEnabled == false) {
		// Check if it should activate the easter eggs
		if (centeredObject == 'iapetus') {
			if (ASZPlayed == false) {
				// If it's looking at iapetus, play ASZ if it hasn't already
				ASZPlayed == true;
				playSound('ASZ');
			}

			if (document.getElementById('ASZ').currentTime > 8.177516) {
				// Time determined experimentally - stop if after that
				swal(
					'You found the Easter Egg!',
					"You have found the Monolith. Don't worry, this program won't turn homicidal (we hope)",
					'success',
				);
				egg();
			}
		}
		if (centeredObject == 'eros') {
			// Activate upon reaching Eros
			swal(
				'You found the Easter Egg!',
				"Welcome to Eros Station! Everyone's a winner on Eros...",
				'success',
			);
			egg();
		}
		if (centeredObject == 'phoebe') {
			// Activate upon reaching Phoebe
			swal(
				'You found the Easter Egg!',
				'Welcome to Phoebe Station. Watch out for alien superweapons and MCRN missiles.',
				'success',
			);
			egg();
		}
	}
}

function egg() {
	// Enable the easter egg functions
	if (eggEnabled == false) {
		// Add Passengers star
		stars['Homestead II'] = {
			distance: 54.8220302098,
			RA: [3, 33, 49.33],
			DE: [-58, -56, -18.6],
		};
		startStarInterface();
		if (!lowRes) {
			createStarMarkers();
		}

		// Show Expanse hider
		document.getElementById('epstienAllow').style.display = 'block';
		document.getElementById('expanseAllowTitle').style.display = 'inline';
		document.getElementById('expanseAllowCheck').style.display = 'inline';

		// Stop other egg methods
		eggEnabled = true;
		if (!lowRes) {
			planets['iapetus'].ringMesh.visible = false;
		}
		updatePlanetsDisplay();
	}
}

function playSound(key) {
	// Play a given sound
	var sound = document.getElementById(key);
	sound.play();
	setTimeout(function () {
		// Stop it after 20 seconds
		sound.pause();
	}, 20000);
}

// LDSS Nauvoo Launch Animation Functions

function launchNauvoo() {
	// Begin Nauvoo Launch

	// Remove Camera control
	controls.enabled = false;

	// Set Nauvoo Launch Variables
	nauvooLaunched = false;
	launchTimer = new Date();

	// Make sure Eros and Tycho are shown
	document.getElementById('showExpanse').checked = true;
	updatePlanetsDisplay();

	// Fix the time
	document.getElementById('inputTimeScale').value = '0.00027778';
	changeTimeScale();

	// If the Nauvoo is no longer at Tycho, put it back at Tycho
	if (!planets['tycho station'].surfaceMesh.children[0].children[1]) {
		scene.remove(nauvooMeshStor);
		planets['tycho station'].surfaceMesh.children[0].add(nauvooMeshStor);
	}

	// Add some extra spacing for launch systems
	planets['tycho station']['r'] = 1000 * convertDistance('M', 'AU');

	// Load Eros if it's not loaded
	if (planets['eros']['surfaceMesh'].geometry.type == 'SphereGeometry') {
		if (!lowRes) {
			loadModel('eros');
		}
	}

	// Get the Nauvoo mesh
	nauvooMeshStor =
		planets['tycho station'].surfaceMesh.children[0].children[1];

	// Look at Tycho Station
	document.getElementById('centerSelect').value = 'tycho station';
	changeCenter();

	// Turn on the caption
	document.getElementById('caption').style.display = 'block';
}

function updateNauvoo() {
	// Hide the controls
	retractInstrumentPanels();

	// Put a better variable for the Nauvoo mesh
	var nauvooMesh = nauvooMeshStor;

	// Vector of the apparent "deflection" of Eros
	var deflectPos = [0, 0, 0];

	// Find time
	var time =
		(new Date().getTime() - launchTimer.getTime()) * convertTime('MS', 'S');

	// Set parameters for the Nauvoo's turn
	var radius = 3000 * convertDistance('M', 'AU') * totalScale;
	var finalAngle = Math.PI / 4;

	// Moderate position for Tycho
	var directionControl = 1;
	if (currentPositions['tycho station'][1] < 0) {
		directionControl = -1;
	}

	// Control the Nauvoo's position
	if (time >= 0 && time <= 5) {
		// Clamps disengaged

		// Update caption
		document.getElementById('caption').innerHTML =
			'Docking clamps disengaged';

		// Determine the time
		var remainingTime = time - 0;
		var sectionTime = 5;

		// Find initial and final positions of the Tycho docking bridge
		var initialPos = -250 * convertDistance('M', 'AU') * totalScale;
		var finalPos = -100 * convertDistance('M', 'AU') * totalScale;

		// Find the current position of the Tycho docking bridge
		var pos =
			(finalPos - initialPos) * (remainingTime / sectionTime) +
			initialPos;

		// Set the current position
		planets[
			'tycho station'
		].surfaceMesh.children[0].children[0].children[3].position.y = pos;

		// Set effective current angle
		currentAngle = 0;

		// Set position and rotation of the Nauvoo to a constant
		nauvooMesh.position.set(
			0,
			-(250 + 400) * convertDistance('M', 'AU') * totalScale,
			0,
		);
		var axis = threeVector([-1, 0, 0]);
		nauvooMeshStor.quaternion.setFromUnitVectors(
			axis,
			threeVector([
				-Math.cos(currentAngle),
				0,
				Math.sin(currentAngle) * directionControl,
			]),
		);
		nauvooMesh.visible = true;
	} else if (time >= 5 && time <= 15) {
		// Engaging reorientation of the Nauvoo

		// Update caption
		document.getElementById('caption').innerHTML =
			'Commencing reorientation of the Nauvoo';

		// Determine the time
		remainingTime = time - 5;
		sectionTime = 10;

		// Set the Nauvoo's angular acceleration (determined by the section time)
		var angAccel = (2 * (finalAngle / 2)) / Math.pow(sectionTime / 2, 2);

		// Calcule constant angular motion (not realistic)
		var currentAngle = finalAngle * (remainingTime / sectionTime);

		// Determine the angle by angular acceleration
		if (remainingTime / sectionTime < 1 / 2) {
			// If in the first phase, it's accelerating
			currentAngle = (1 / 2) * angAccel * Math.pow(remainingTime, 2);
		} else {
			// If in the second phase, it's decelerating
			currentAngle =
				finalAngle -
				(1 / 2) * angAccel * Math.pow(sectionTime - remainingTime, 2);
		}

		// Set initial position of the Nauvoo
		initialPos = [
			0,
			-(250 + 400) * convertDistance('M', 'AU') * totalScale,
			0,
		];

		// Set the middle of the rotation circle
		var middlePos = addVec([0, 0, radius * directionControl], initialPos);

		// Find the position of the Nauvoo relative to the center of the rotation circle
		var relativePos = [
			-Math.sin(currentAngle),
			0,
			-Math.cos(currentAngle) * directionControl,
		];
		relativePos = setMagnitude(relativePos, radius);

		// Find the current position of the Nauvoo
		var position = addVec(relativePos, middlePos);

		// Set position and rotation of the Nauvoo
		//nauvooMesh.position.copy(threeVector(position));
		nauvooMesh.position.set(position.x, position.y, position.z);
		nauvooMeshStor.quaternion.setFromUnitVectors(
			threeVector([-1, 0, 0]),
			threeVector([
				-Math.cos(currentAngle),
				0,
				Math.sin(currentAngle) * directionControl,
			]),
		);
	} else if (time >= 15 && time <= 23) {
		// Nauvoo set for optimal trajectory

		// Determine the time
		remainingTime = time - 15;
		sectionTime = 8;

		// Update the caption
		if (remainingTime > 5) {
			document.getElementById('caption').innerHTML =
				'Main engine powerup in T-' +
				Math.ceil(sectionTime - remainingTime) +
				' seconds';
		} else {
			document.getElementById('caption').innerHTML =
				'Nauvoo is now set for optimal trajectory';
		}

		// Set the current angle
		currentAngle = finalAngle;

		// Re-derive position (see last for what this all means)
		initialPos = [
			0,
			-(250 + 400) * convertDistance('M', 'AU') * totalScale,
			0,
		];
		middlePos = addVec([0, 0, radius * directionControl], initialPos);
		relativePos = [
			-Math.sin(currentAngle),
			0,
			-Math.cos(currentAngle) * directionControl,
		];
		relativePos = setMagnitude(relativePos, radius);
		position = addVec(relativePos, middlePos);

		// Set position and rotation of the Nauvoo
		//nauvooMesh.position.copy(threeVector(position));
		nauvooMesh.position.set(position.x, position.y, position.z);
		nauvooMeshStor.quaternion.setFromUnitVectors(
			threeVector([-1, 0, 0]),
			threeVector([
				-Math.cos(currentAngle),
				0,
				Math.sin(currentAngle) * directionControl,
			]),
		);
	} else if (time >= 23 && time <= 38) {
		// Launch the Nauvoo

		// Update the caption
		document.getElementById('caption').innerHTML =
			'Good luck, and Godspeed';

		// Determine the time
		remainingTime = time - 23;
		sectionTime = 15;

		// Set the current angle
		currentAngle = finalAngle;

		// Re-derive position (see rotation phase for what it means)
		initialPos = [
			0,
			-(250 + 400) * convertDistance('M', 'AU') * totalScale,
			0,
		];
		middlePos = addVec([0, 0, radius * directionControl], initialPos);
		relativePos = [
			-Math.sin(currentAngle),
			0,
			-Math.cos(currentAngle) * directionControl,
		];
		relativePos = setMagnitude(relativePos, radius);

		// Set the initial position
		var initialPosition = addVec(relativePos, middlePos);

		// Accelerate at 20 m/s^2 (2 gees)
		var accel = 20 * convertDistance('M', 'AU') * totalScale;

		// Find the distance it's moved from the initial position
		var distance = (1 / 2) * (accel * 9.8) * Math.pow(remainingTime, 2);

		// Set the unit vector that defines the direction
		var direction = [
			-Math.cos(currentAngle),
			0,
			Math.sin(currentAngle) * directionControl,
		];

		// Find the vector it's travelled from the initial position
		var nextPosition = setMagnitude(direction, distance);

		// Find the current position of the Nauvoo
		position = addVec(initialPosition, nextPosition);

		// Set the position and rotation of the Nauvoo
		//nauvooMesh.position.copy(threeVector(position));
		nauvooMesh.position.set(position.x, position.y, position.z);
		nauvooMeshStor.quaternion.setFromUnitVectors(
			threeVector([-1, 0, 0]),
			threeVector([
				-Math.cos(currentAngle),
				0,
				Math.sin(currentAngle) * directionControl,
			]),
		);
	} else if (time >= 38 && time <= 58) {
		// Find the current time
		remainingTime = time - 38;
		sectionTime = 20;

		// Update the caption, with lines pulled from The Expanse
		if (remainingTime < sectionTime / 2) {
			document.getElementById('caption').innerHTML = '';
		} else if (
			remainingTime > sectionTime - 10 &&
			remainingTime < sectionTime - 8
		) {
			document.getElementById('caption').innerHTML =
				'Guys, what just happened?';
		} else if (
			remainingTime > sectionTime - 8 &&
			remainingTime < sectionTime - 6
		) {
			document.getElementById('caption').innerHTML =
				'Guys, what just happened?<br><br>The Nauvoo just missed!';
		} else if (
			remainingTime > sectionTime - 6 &&
			remainingTime < sectionTime - 4
		) {
			document.getElementById('caption').innerHTML = '';
		} else if (
			remainingTime > sectionTime - 4 &&
			remainingTime < sectionTime - 2
		) {
			document.getElementById('caption').innerHTML =
				"The Nauvoo didn't move";
		} else {
			document.getElementById('caption').innerHTML =
				"The Nauvoo didn't move<br><br>Eros did";
		}

		// Set the rotation of the Nauvoo
		nauvooMesh.rotation.set(0, 0, 0);

		// Remove the Nauvoo's mesh from Tycho, and add it to the scene independently
		if (planets['tycho station'].surfaceMesh.children[0].children[1]) {
			planets['tycho station'].surfaceMesh.children[0].remove(nauvooMesh);
			scene.add(nauvooMesh);
		}

		// Set the initial speed at 10km/s (yes, laughably slow, but it would be invisible otherwise)
		var initialSpeed = 10000 * convertDistance('M', 'AU') * totalScale;

		// Set the current speed
		var speed = initialSpeed;

		// Set the direction of motion
		var motion = [-1, 0, 0];

		// Create the velocity vector
		var velocitySection = multiplyVec(speed, motion);

		// Set the total deflection at 200km
		var totalDeflect = 200000 * convertDistance('M', 'AU') * totalScale;

		// Set the initial and final deflect positions
		var finalDeflectPos = [0, -totalDeflect, 0];
		deflectPos = [0, 0, 0];

		// The set the acceleration time
		var accelTime = 2.5;

		// Determine the acceleration needed for Eros to deflect
		accel = totalDeflect / Math.pow(accelTime, 2);

		// Manage the total deflection
		if (
			remainingTime >= sectionTime / 2 - accelTime &&
			remainingTime <= sectionTime / 2
		) {
			// Eros is accelerating away
			var distance =
				0.5 *
				accel *
				Math.pow(remainingTime - (sectionTime / 2 - accelTime), 2);
			deflectPos = setMagnitude(finalDeflectPos, distance);
		} else if (
			remainingTime >= sectionTime / 2 &&
			remainingTime <= sectionTime / 2 + accelTime
		) {
			// Eros is decelerating to a relative stop
			var distance =
				totalDeflect -
				0.5 *
					accel *
					Math.pow(remainingTime - (sectionTime / 2 + accelTime), 2);
			deflectPos = setMagnitude(finalDeflectPos, distance);
		} else if (remainingTime > sectionTime / 2 + accelTime) {
			// Eros is at a relative stop at the total defelction
			var distance = totalDeflect;
			deflectPos = setMagnitude(finalDeflectPos, distance);
		}

		// Find the position of the nauvoo from the start
		var posDiff = multiplyVec(remainingTime, velocitySection);

		// Find the initial position (enough that the Nauvoo is at Eros halfway through this section)
		initialPos = multiplyVec((-1 * initialSpeed * sectionTime) / 2, motion);

		// Find the initial position of Eros
		var erosPos = multiplyVec(totalScale, currentPositions['eros']);

		// Find the position of the Nauvoo relative to Sol
		var nauvooPos = addVec(
			erosPos,
			addVec(initialPos, addVec(deflectPos, posDiff)),
		);

		// Set the position of the Nauvoo
		nauvooMesh.position.copy(threeVector(nauvooPos));
	} else {
		// Finalise launch processes

		nauvooMesh.visible = false;
		nauvooLaunched = true;
		controls.enabled = true;

		extendInstrumentPanels();
		nauvooMeshStor = nauvooMesh;

		// Remove the extra spacing allocated for the Nauvoo
		planets['tycho station']['r'] = 350 * convertDistance('M', 'AU');

		// Turn off the caption after a delay
		document.getElementById('caption').style.display = 'none';
	}

	// Control the camera position
	if (time >= 0 && time <= 35) {
		// Viewing Tycho

		// Derive the components of the camera position (these are pre-set)
		var cameraVerticalPoint = multiplyVec(
			convertDistance('M', 'AU') * totalScale,
			[0, 0, 1000],
		);
		var cameraHorizontalPoint = setMagnitude(
			currentPositions['tycho station'],
			-6000 * convertDistance('M', 'AU') * totalScale,
		);

		// Find the total camera position
		var cameraPoint = addVec(cameraHorizontalPoint, cameraVerticalPoint);

		// Find the absolute camera position
		var centralPoint = multiplyVec(
			totalScale,
			currentPositions['tycho station'],
		);

		// Set the camera position
		camera.position.copy(threeVector(addVec(cameraPoint, centralPoint)));
		controls.update();
	}
	if (time >= 38 && time <= 53) {
		// Viewing Eros

		// If not looking at Eros, look at Eros
		if (document.getElementById('centerSelect').value != 'eros') {
			document.getElementById('centerSelect').value = 'eros';
			changeCenter();
		}

		// Fix the controls ONLY before the camera moves
		if (time < 40) {
			controls.update();
		}

		// Derive the components of the camera position (these are pre-set)
		cameraVerticalPoint = multiplyVec(
			convertDistance('M', 'AU') * totalScale,
			[0, 0, 60000],
		);
		cameraHorizontalPoint = setMagnitude(
			currentPositions['eros'],
			-60000 * convertDistance('M', 'AU') * totalScale,
		);

		// Find the total camera position
		cameraPoint = addVec(cameraHorizontalPoint, cameraVerticalPoint);

		// Modify this by the necessary deflection
		cameraPoint = addVec(deflectPos, cameraPoint);

		// Find the absolute camera position
		centralPoint = multiplyVec(totalScale, currentPositions['eros']);

		// Find the camera target by modifying by the necessary deflection
		var targetPoint = addVec(deflectPos, centralPoint);
		targetPoint = [0, 0, 0];

		// Set camera position and controls target
		camera.position.copy(threeVector(addVec(cameraPoint, centralPoint)));
		controls.target.copy(threeVector(targetPoint));
	}

	if (webVR) {
		updateSystemPosition();
	}
}

// Solar System Tour Animation Functions

function startSystemTour() {
	// Start the Solar System tour

	runningTour = true;

	// Change the center to shift it over
	document.getElementById('centerSelect').value = 'mercury';
	changeCenter();

	// Turn on the caption display
	document.getElementById('caption').style.display = 'block';

	// Select the stops of the tour
	tourStops = {
		earth: planets['earth']['r'] * 5,
		'the moon': planets['the moon']['r'] * 5,
		mars: planets['mars']['r'] * 10,
		jupiter: planets['jupiter']['r'] * 10,
		callisto: planets['callisto']['r'] * 5,
		saturn: planets['saturn']['r'] * 10,
		titan: planets['titan']['r'] * 5,
	};

	// Start the tour timer
	tourTime = new Date();

	// Pre-prepare the maneuvers and displays
	prepareSystemTour();
	calculateSystemTour();

	// Set the correct time scale for the tour
	document.getElementById('inputTimeScale').value = '1';
	changeTimeScale();

	// Change the primary exection timer to update the system tour instead of the simulation
	clearInterval(executionTimer);
	executionTimer = setInterval(function () {
		updateSystemTour();
	}, 1000 / timeScale);

	// Disable the controls for the user
	controls.enabled = false;
}

function prepareSystemTour() {
	// Prepare the system graphics for the tour

	for (var name in tourStops) {
		// Iterate through each object in the tour

		if (name != 'sun') {
			// Except the sun (because it's special)

			// Load the model if it has one, otherwise load the surface
			if (planets[centeredObject]['mapClass']['model']) {
				if (
					planets[centeredObject]['surfaceMesh'].geometry.type ==
					'SphereGeometry'
				) {
					loadModel(centeredObject);
				}
			} else {
				loadSurface(name);
			}

			// Show the surface and marker of each stop on the tour
			if (planets[name].surfaceMesh) {
				planets[name].surfaceMesh.visible = true;
			}

			if (planets[name].markerMesh) {
				planets[name].markerMesh.visible = !realSystem;
			}

			// Update the location of all the planets
			findPlanetLocation(name, currentTime);
		}
	}
}

function calculateSystemTour() {
	// Calculate all the actions in the tour

	// Get a list of all the stops
	var stops = Object.keys(tourStops);

	// Create the movements array and the first movement - from the initial camera position to the first stop
	var movements = [
		{
			start: multiplyVec(1 / totalScale, initialCamera),
			end: addVec(
				setMagnitude([0, -1, 0], tourStops[stops[0]]),
				currentPositions[stops[0]],
			),
			type: 'translation',
			firstCamera: 'sun',
			secondCamera: stops[0],
			cameraMove: 'slide',
			messageObject: stops[0],
		},
	];

	// Create the movements between all the different stops on the tour
	for (var stopNum = 0; stopNum < stops.length - 1; stopNum++) {
		// Create the rotation around the planet

		// This calculates the vector on the other side of the planet from the destination - where it crosses over
		var transitVector = subVec(
			currentPositions[stops[stopNum + 1]],
			currentPositions[stops[stopNum]],
		);
		var standOffPos = setMagnitude(
			transitVector,
			tourStops[stops[stopNum]],
		);
		var finalPosition = multiplyVec(-1, standOffPos);

		// Create the rotation
		var rotation = {
			start: subVec(
				movements[movements.length - 1].end,
				currentPositions[stops[stopNum]],
			),
			end: finalPosition,
			type: 'rotation',
			camera: stops[stopNum],
			secondCamera: stops[stopNum + 1],
			center: stops[stopNum],
			auxType: 'overshoot',
			messageObject: stops[stopNum],
		};

		// Create the translation to the next planet

		// Calculate the final position of the rotation
		var ratio =
			dotProduct(rotation.start, rotation.end) /
			(magnitude(rotation.start) * magnitude(rotation.end));
		var angle = RtoD(Math.acos(ratio));
		var currentRotation = angle + additionalDegrees;

		// Set the primary rotation and multiplication axes
		var rotationAxis = crossProduct(rotation.start, rotation.end);
		var auxAxis = setMagnitude(
			crossProduct(rotationAxis, rotation.start),
			tourStops[rotation.center],
		);

		// Find the two position components
		var firstModeratedPos = multiplyVec(
			Math.cos(DtoR(currentRotation)),
			rotation.start,
		);
		var secondModeratedPos = multiplyVec(
			Math.sin(DtoR(currentRotation)),
			auxAxis,
		);

		// Find the final rotation position and the starting translation position
		var startPosition = setMagnitude(
			addVec(firstModeratedPos, secondModeratedPos),
			tourStops[rotation.center],
		);

		// Negative one because it points from the destination TO the origin planet
		var finalStandOff = setMagnitude(
			transitVector,
			-1 * tourStops[stops[stopNum + 1]],
		);
		var finalArrivePosition = addVec(
			finalStandOff,
			currentPositions[stops[stopNum + 1]],
		);

		// Create the translation
		var translation = {
			start: addVec(startPosition, currentPositions[stops[stopNum]]),
			end: finalArrivePosition,
			type: 'translation',
			firstCamera: stops[stopNum],
			secondCamera: stops[stopNum + 1],
			cameraMove: 'jump',
			messageObject: stops[stopNum + 1],
		};

		// Add both to the camera movements
		movements.push(rotation);
		movements.push(translation);
	}

	// Create final rotation - this is to -1 to keep the camera pointing correctly with the top of the screen at Y+
	var rotation = {
		start: subVec(
			movements[movements.length - 1].end,
			currentPositions[stops[stops.length - 1]],
		),
		end: setMagnitude([0, -1, 0], tourStops[stops[stops.length - 1]]),
		type: 'rotation',
		camera: stops[stops.length - 1],
		secondCamera: stops[stops.length - 1],
		center: stops[stops.length - 1],
		auxType: 'finalStop',
		messageObject: stops[stops.length - 1],
	};
	movements.push(rotation);

	// Create final translation - back to the program start position
	var translation = {
		start: addVec(
			movements[movements.length - 1].end,
			currentPositions[stops[stops.length - 1]],
		),
		end: multiplyVec(1 / totalScale, initialCamera),
		type: 'translation',
		firstCamera: stops[stops.length - 1],
		secondCamera: 'sun',
		cameraMove: 'slide',
		messageObject: 'Solar System',
	};
	movements.push(translation);

	// Calculate the amount of time for each movement
	var totalTime = 0;
	for (var index in movements) {
		// Initialise time and movements
		var movementTime = 0;
		var movement = movements[index];

		// Check movement type
		if (movement.type == 'translation') {
			// Find the total distance
			var distance = magnitude(subVec(movement.start, movement.end));

			// Initialise times
			var accelTime;
			var coastTime;
			var decelTime;

			// If it is moving further than the zero-coast distance (i.e. if it does coast)
			if (
				distance >
				2 *
					(1 / 2) *
					tourTranslationAcceleration *
					Math.pow(
						tourTranslationSpeed / tourTranslationAcceleration,
						2,
					)
			) {
				// Calculate the non-acclerating distance
				var remainingDist =
					distance -
					2 *
						(1 / 2) *
						tourTranslationAcceleration *
						Math.pow(
							tourTranslationSpeed / tourTranslationAcceleration,
							2,
						);

				// Accel time defined by how long it takes to get to max speed
				accelTime = tourTranslationSpeed / tourTranslationAcceleration;

				// Coast time is just distance/speed
				coastTime = remainingDist / tourTranslationSpeed;

				// Decelerates for same time as acceleration
				decelTime = accelTime;
			} else {
				// Accel time defined by how fast it can get in the distance it has
				accelTime = Math.pow(
					distance / tourTranslationAcceleration,
					1 / 2,
				);

				// No coasting, by definition
				coastTime = 0;

				// Decelerates for same time as acceleration
				decelTime = accelTime;
			}

			// Calculate the distance that corresponds to each time
			movements[index].accelDist =
				(1 / 2) * tourTranslationAcceleration * Math.pow(accelTime, 2);
			movements[index].coastDist = coastTime * tourTranslationSpeed;
			movements[index].decelDist =
				(1 / 2) * tourTranslationAcceleration * Math.pow(decelTime, 2);

			// Calculate the total distance it moves
			movements[index].totalDist =
				movements[index].accelDist +
				movements[index].coastDist +
				movements[index].decelDist;

			// Set the movment acceleration time
			movements[index].accelTime = accelTime;
			movements[index].coastTime = coastTime;
			movements[index].decelTime = decelTime;

			// Set the total movement time
			movementTime = accelTime + coastTime + decelTime;
		} else if (movement.type == 'rotation') {
			// Find the distance between the start and the end points
			var ratio =
				dotProduct(movement.start, movement.end) /
				(magnitude(movement.start) * magnitude(movement.end));
			var angle = RtoD(Math.acos(ratio));

			// Set the angle until it switches cameras
			movements[index]['cameraAngle'] = angle;

			// Set the total angle it moves
			if (movement.auxType == 'overshoot') {
				// If it overshoots to look at the next planet, add the additional degrees
				movements[index]['angle'] = angle + additionalDegrees;
			} else if (movement.auxType == 'finalStop') {
				movements[index]['angle'] = angle;
			}

			// Set the total movement time
			movementTime = movements[index]['angle'] / tourRotationSpeed;
		}

		// Add the movement and start time to the maneuver
		movements[index].movementTime = movementTime;
		movements[index].startTime = totalTime;

		// Increment total time
		totalTime += movementTime;
	}

	// Set the global tour movements variable equal to the movements
	tourMovements = movements;
}

function updateSystemTour() {
	// Keep the instrument panels retracted
	retractInstrumentPanels();

	// Keep the sun flare in the correct position
	managePlanetSunFlares();

	// Keep the moons with the planets
	recenterOrbits();

	// Manage orbit opacities if needed
	if (!lowRes && orbitOpacity) {
		manageOrbitOpacities();
	}

	// Keep all planets, rings and flares in the correct positions
	updatePlanetRings();
	updateAllPlanets();
	manageSunFlare();

	// Manage how the orbit lines should be displayed
	controlSOIOrbitDisplay();

	if (nightEarth) {
		// If the night side of Earth rendered, manage its display
		manageEarthNight();
	}

	// Get the current time and initialise variables
	var time = (new Date().getTime() - tourTime.getTime()) / 1000;
	var movement = tourMovements[0];
	var selectedTime = 0;
	var index = 0;

	// Find the current maneuver
	while (
		selectedTime + movement.movementTime < time &&
		index < tourMovements.length
	) {
		movement = tourMovements[index];
		selectedTime = movement.startTime;
		index += 1;
	}

	// If it's past the last movment, end it
	if (
		time >
		tourMovements[tourMovements.length - 1].startTime +
			tourMovements[tourMovements.length - 1].movementTime
	) {
		endSystemTour();
	} else {
		// Find the time in the movement, and the percentage through
		var elapsedTime = time - movement.startTime;
		var percentThrough =
			(time - movement.startTime) / movement.movementTime;

		// Initialise camera position and camera target varaibles
		var position;
		var target;

		// Initialise message variable
		var message;

		// If it's rotating around a planet
		if (movement.type == 'rotation') {
			// Find the rotation angle
			var currentRotation = percentThrough * movement.angle;

			// If the rotation is greater than the given angle, move the target to the next planet
			if (currentRotation > movement.cameraAngle) {
				target = currentPositions[movement.secondCamera];
				message =
					movement.messageObject +
					'<br>Next up: ' +
					movement.secondCamera;
			} else {
				target = currentPositions[movement.camera];
				message = movement.messageObject;
			}

			// Find the two rotation axes
			var rotationAxis = crossProduct(movement.start, movement.end);
			var auxAxis = setMagnitude(
				crossProduct(rotationAxis, movement.start),
				tourStops[movement.center],
			);

			// Find the two sections of the position
			var firstModeratedPos = multiplyVec(
				Math.cos(DtoR(currentRotation)),
				movement.start,
			);
			var secondModeratedPos = multiplyVec(
				Math.sin(DtoR(currentRotation)),
				auxAxis,
			);

			// Set the position
			position = addVec(
				setMagnitude(
					addVec(firstModeratedPos, secondModeratedPos),
					tourStops[movement.center],
				),
				currentPositions[movement.center],
			);
		} else if (movement.type == 'translation') {
			// If moving between planets

			// Find the distance it's moved through the transfer
			var distance;
			if (elapsedTime < movement.accelTime) {
				// In acceleration phase
				distance = 0;
				distance +=
					(1 / 2) *
					tourTranslationAcceleration *
					Math.pow(elapsedTime, 2);
			} else if (elapsedTime < movement.accelTime + movement.coastTime) {
				// In coast phase
				distance = movement.accelDist;
				distance +=
					tourTranslationSpeed * (elapsedTime - movement.accelTime);
			} else if (elapsedTime < movement.movementTime) {
				// In deceleration phase
				var momentTime =
					elapsedTime - movement.accelTime - movement.coastTime;

				distance = movement.accelDist + movement.coastDist;
				distance +=
					movement.accelTime *
						tourTranslationAcceleration *
						momentTime -
					(1 / 2) *
						tourTranslationAcceleration *
						Math.pow(momentTime, 2);
			}

			// Find the current position
			percentThrough = distance / movement.totalDist;
			position = addVec(
				multiplyVec(percentThrough, movement.end),
				multiplyVec(1 - percentThrough, movement.start),
			);
			position = addVec(
				movement.start,
				setMagnitude(subVec(movement.end, movement.start), distance),
			);

			// Manage the camera target and how it moves
			if (movement.cameraMove == 'slide') {
				target = addVec(
					multiplyVec(
						1 - percentThrough,
						currentPositions[movement.firstCamera],
					),
					multiplyVec(
						percentThrough,
						currentPositions[movement.secondCamera],
					),
				);
			} else if (movement.cameraMove == 'jump') {
				target = currentPositions[movement.secondCamera];
			}

			// Change the center of the camera's focus - if it's not  done already
			if (movement.secondCamera != centeredObject) {
				var center = movement.secondCamera;
				if (planets[movement.secondCamera].center != 'sun') {
					center = planets[movement.secondCamera].center;
				}
				document.getElementById('centerSelect').value = center;
				changeCenter();
				if (planets[movement.secondCamera].center != 'sun') {
					document.getElementById('moonSelect').value =
						movement.secondCamera;
					changeMoon();
				}
			}

			// Update the message
			message = 'Travelling to ' + movement.messageObject;
		}

		// Update camera position and target as given by the previous functions
		camera.position.copy(threeVector(multiplyVec(totalScale, position)));
		controls.target.copy(threeVector(multiplyVec(totalScale, target)));
		controls.minDistance = 0;
		controls.update();

		// Update the captions
		document.getElementById('caption').innerHTML = message;

		// Update the cameras if in stereo display
		if (stereoDisp) {
			moveSecondary3DCameras();
			updateLoadingScreens();
		}
	}
}

function endSystemTour() {
	// Re-enable the controls
	controls.enabled = true;
	runningTour = false;

	// Set the speed back to the default
	document.getElementById('inputTimeScale').value = '24';
	changeTimeScale();

	// Extend the instrument panels again
	extendInstrumentPanels();

	// Hide the caption
	document.getElementById('caption').style.display = 'none';

	// Switch the center back to the sun
	document.getElementById('centerSelect').value = 'sun';
	changeCenter();

	// Re-start the simulation
	clearInterval(executionTimer);
	//startSimulation();

	// Ensure the camera is back in the correct position
	camera.position.copy(threeVector(initialCamera));

	startSystemTour();
}

// Expanse Functions

function manageExpanse() {
	// Alter Ceres and Eros rotation rates to produce 0.4g if the Expanse is on, otherwise keep it real and normal
	if (expanseShow) {
		planets['eros']['rotation'] = 0.003283572577418981;
		planets['ceres']['rotation'] = 0.02595892051770833;
		belt.name = 'The Belt';
	} else {
		planets['eros']['rotation'] = 0.2195833;
		planets['ceres']['rotation'] = 0.37808333;
		belt.name = 'Asteroid Belt';
	}
}

// ThreeJS General Management Functions

function changeObjectVisibility(item, state) {
	if (item) {
		item.visible = state;
	}
}

// Development Functions and Variables

// GLOBAL VARIABLE DEFINITIONS

// Easter Egg

var eggEnabled = false;
var ASZPlayed = false;

// Message Control

var kerbalMessages = [
	// Kerbal style loading messages
	'Adjusting Heisenberg Compensator',
	'Calcuating Ultimate Answer',
	'Simulating New Universe',
	'Reversing Polarity',
	'Firing Up Torch Drive',
	'Inventing Epstein Drive',
	'Terraforming Mars',
	'Polishing Rings',
	'Bending Orbits',
	'Discovering Gravity',
	'Beaming Aboard',
	'Boldly Going',
	'Going FTL',
	'Igniting Sun',
	'Spinning Planets',
	'Painting Red Spot',
	'Removing Pluto',
	'Discovering Worlds',
	'Designing Rockets',
	'Calling Orbital Mechanic',
	'Transferring Hohmann',
	'Warping to the Future',
	'Tilting Moons',
	'Setting Phasers to Stun',
	'Not Reading Manual',
	'Defending Against Kraken',
	'Planning Unplanned Disassembly',
	'Hiding Space Kraken',
	'Leaving in Konami Code',
	'Discovering Protomolecule',
	'Settling Argument of Periapsis',
	'Cleaning Launch Window',
	'Effecting Oberth',
	'Pointing Correct End Towards Space',
	'Placing Monolith',
	'Spinning up Eros',
	'Spinning up Ceres',
	'Launching Tesla Roadster',
	'Combobulating Discombobulator',
];
var realMessages = [
	// More serious messages that actually say what's going on
	"Solving Lambert's Problem",
	"Applying Gauss' Solution",
	'Calculating Position Vectors',
	'Optimising Trajectory Time',
	'Calculating Vector Difference',
	'Generating Porkchop Plot',
	'Iterating Transfer Times',
	'Iterating Synodic Period',
	'Running Linear Convergence',
	'Selecting Semi-Latus Rectum',
	'Calculating Hyperbolic Excess Velocity',
	'Calculating Orbital Parameters',
	'Determining Angular Momentum',
	'Determing Mean Longitude',
	'Running Progressive Binary Convergence',
	'Reverse-Deriving Mean Longitude',
	'Calculating Delta Vee',
	'Calculating Orbital Positions',
	'Deriving Orbital Velocities',
	'Iterating by Orbital Degrees',
	'Constructing Ship Geometry',
	'Rendering Orbital Track',
	'Rendering Ship Marker',
	'Aligning Ship to Track',
];
var loadingMessages = realMessages;
var bootMessages = kerbalMessages;
var message =
	loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
var messageUpdated = false;
var returnData;

// Loading Control

var loadingTimer;
var lastLoadingTime;
var shipLoading = false;

// Primary Graphics Control

var executionTimer;
var initialCamera;

// Constants

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var EPOCH = new Date(2000, 0, 1, 12, 0, 0, 0); // January 2000, 12h terrestrial
var gravitationalConstant = 6.67408 * Math.pow(10, -11);
var pixelRatio;

// Optional Showing

var bodiesShow = false;
var expanseShow = false;
var satellitesShow = false;
var advancedShow = false;
var realSystem = false;

// Threejs

var renderer, scene, camera;
var controls;
var textureLoader = new THREE.TextureLoader();
var projector,
	mouse = {
		x: 0,
		y: 0,
	},
	INTERSECTED;
var animator;
var ambientLight;
var pointLight;
var spotLight;

// Main Camera control

var cameraNearMultiplier = 0.004;

// Resolution Control

var orbitResolution = 2;
var totalScale = Math.round(convertDistance('AU', 'M'));
var geoRes = 128;
var markerScale = (1 / 10) * (3 / 4);
var sunMarkerSize = 0.1;
var renderingLensFlares = true;

// Star field controls

var starFieldDist = 1000000;
var starField;

// Time Control

var now = new Date();
var displayTime = now;
var currentTime = new Date(
	now.getUTCFullYear(),
	now.getUTCMonth(),
	now.getUTCDate(),
	now.getUTCHours(),
	now.getUTCMinutes(),
	now.getUTCSeconds(),
); // May not actually be now, just when it is displayed
var timeDiff = displayTime.getTime() - currentTime.getTime();
var timeScale = 60; // Number of increments per second
var apparentTimeRate = 3600 * 24; // Rate at which time passes in sim seconds / real second
var timeRate = 3600 * 24; // Rate at which time passes in sim seconds / computational second
var timeIncrement = (timeRate * 1000) / timeScale; // Simulation time to add per time increment

// Transfer Time Management Control

var calculatingTransfer = false;

// Ship Control

var shipColour = new THREE.Color(0xaaaaaa);
var shipTrackColour = new THREE.Color(0xaaaaaa);
var shipCenter;
var lastShipLocation = [0, 0, 0];
var earlierShipLocation;
var shipStartTime = false;
var shipEndTime = false;
var transitData;
var shipRotAngle = Math.PI / 4;
var shipSurfaceMesh;
var currentShipPosition;
var shipAxis;

// Nauvoo Control

var launchTimer;
var nauvooLaunched = false;
var nauvooMeshStor;

// Solar System Tour Control

var tourTime;
var tourRotationSpeed = 20; // Measured in degrees/sec
var tourTranslationSpeed = 2; // Measured in AU/sec
var tourTranslationAcceleration = 0.15; // Measured in AU/sec^2
var tourMovements;
var tourStops;
var additionalDegrees = 60;
var runningTour = false;

// Lambert (Ballistic) Transfer Control

var loggedTransfer = false;
var displayLoggedCourse = true;
var storedTransferData;
var lowestDeltaVee;
var lowestData;

var twoStage = true;
var storedWindows;
var inSecondStage;
var totalCalculations;

// Epstein Control

var EpsteinEndTime = false;
var EpsteinStartTime = false;
var EpsteinCenter;
var EpsteinLine;
var EpsteinArray;
var EpsteinShown = true;
var EpsteinTransitData;
var flipMarker;

// IS Control

var ISTransferData;
var ISStartTime = false;
var ISEndTime = false;
var displayStars = {};

// Prop. Delay Control

var lightLagLines = {};
var lightParticleTime;
var lightParticles = {};

// Viewport Control

var centeredObject = 'sun';
var centeredPlanet = 'sun';
var lastPosition = [0, 0, 0];
var cameraMode = 'orbital';
var shipCameraTo;
var shipCameraFrom;

// Tooltip Control

var intersectedObject;
var toolTipMargin = 60;
var toolTipCanvasMargin = 100;
var tooltipLineAngle = 10;
var showingShipTooltip = true;

// Estimated Time Control

var lastTimeMessage = '';
var timeEstimateUpdated = false;

// Mars Dust Storm Controls

var marsOpacityUpper = 0.6;
var marsOpacityLower = 0.05;
var marsOpacityTarget = 0;
var marsOpacityTicks = 0;
var marsOpacity =
	Math.random() * (marsOpacityUpper - marsOpacityLower) + marsOpacityLower;
var marsOpacityInterval;
var marsOpacityPoints = {
	0.1: 20,
	0.2: 20,
	0.3: 20,
	0.4: 0.1,
	0.5: 0.1,
	0.6: 0.1,
	0.7: 1,
	0.8: 3,
	0.9: 5,
};
var marsOpacityValues = {
	0.1: 0,
	0.2: 0,
	0.3: 0,
	0.4: 0,
	0.5: 0,
	0.6: 0,
	0.7: 0,
	0.8: 0,
	0.9: 0,
};

// Orbit Line Fading Control

var rotationDegrees = 90;
var baseOrbitOpacity = 0.3;
var orbitOpacity = HEIGHT >= 1080 - 155;
var orbitOpacityRes = 1;
var orbitRotationLimit = 0.09;

// Earth Night Side Controls

var nightEarth;

// Timer controls

var lightLagTimes = 0;
var lightLagTimeInterval = timeScale;
var smallLoadingTimer;
var endSmallLoadingTimer;
var smallLoadingCounter;

// Loading and debugging times

var clock = new THREE.Clock();
var lastTimeRatio = 1;
var timeRatio = 1;
var checkTime;
var checkTimeSection;
var checkTimeRemaining;
var logInterval = 5000;
var logTracker = 0;
var transTime;
var timeRatioLog = false;

// Flare controls

var sunFlare;
var shipFlareSize = 2.5;

// Guides mesh storage

var belt;
var kuiper;
var vernalLine;

// Colours global variables

var white = new THREE.Color(0xffffff);
var black = new THREE.Color(0x000000);

// Geometry storage to speed up startup

var geoScale = totalScale;
var sphereGeo = new THREE.SphereGeometry(geoScale, geoRes, geoRes);

// 3D Display Control

var stereoDisp = false;
var cameraSep = 0;
var cameraLeft;
var cameraRight;

// Low Resolution Control

var lowRes = false;

// High Resolution Control

var highDef = false;

// Full WebVR Control

var webVR = false;
var webVRStandardLength = 1; // Length to moderate to (in meters)
var cameraZeroPos = [0, 0, 0];
var defaultSystemPos;
var defaultPhonePos = [1, 0, 0.75];

// WebVR Control Variables - Not modified in this program, but WebVR

var baseURL = '';
var webVRDisp = false;

// Track Mobile Device

var userOnPhone = false;

// Porkchop Plot Control

var porkchopShown = false;

// Planet Details Storage - Generated once and once only

var currentPositions = {
	sun: [0, 0, 0],
};
var currentDegrees = {};
var orbitalPositions = {};
var orbitalTimes = {};
var shipParameters = {};
var orbitalVelocities = {};
var transitWindows = {};
var originalPlanets = {};

// Global Definitions

/* global THREE */
/* global swal */
/* global planets */
/* global stars */
/* global navigator */
/* global firebase */
/* global $ */

// WithUnits definitions to prevent IDE flags

/* global sin */
/* global cos */
/* global tan */
/* global invSin */
/* global invCos */
/* global invTan */
/* global multiply */
/* global divide */
/* global pow */
/* global add */
/* global subtract */
/* global dotProductVector */
/* global crossProductVector */
/* global vectorMagnitude */
/* global setMagnitudeVector */
/* global makeUnitVector */
/* global parseScalarInput */
/* global parseVectorInput */
/* global parseUnits */
/* global convertTimeUnits */
/* global convertDistanceUnits */
/* global outputScalar */
/* global outputVector */
/* global production */
