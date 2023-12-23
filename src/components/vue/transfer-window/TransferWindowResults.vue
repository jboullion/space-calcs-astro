<template>
	<div>
		<div class="p-2 rounded border mb-5">
			<p>Calculating...</p>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';

import type {
	FormatDataType,
	ITransferWindowForm,
	PlanetOrbit,
	ScalarInput,
	TransitWindow,
	VectorInput,
} from './types';
import {
	findGravParam,
	calculateSynodicPeriod,
	parseScalarInput,
	divide,
	multiply,
	add,
	subtract,
	baseUnits,
	outputScalar,
	parseVectorInput,
	vectorMagnitude,
	outputVector,
	cos,
	pow,
	sin,
	tan,
} from './functions';
import { planets } from './constants';
import { destinations } from '../delta-v/constants';

const props = defineProps<{
	formData: ITransferWindowForm;
}>();

const loading = ref<boolean>(false);
const now = new Date();
let currentTime = new Date(
	now.getUTCFullYear(),
	now.getUTCMonth(),
	now.getUTCDate(),
	now.getUTCHours(),
	now.getUTCMinutes(),
	now.getUTCSeconds(),
); // May not actually be now, just when it is displayed

let transitWindows: FormatDataType[][] = [];
let storedWindows: FormatDataType[] = [];
let lowestData: FormatDataType | null = null;
let totalCalculations = 0;
let inSecondStage = false;
let lowestDeltaVee: ScalarInput;
let transTime: Date = new Date();

// Primary Interplanetary Transfer Calculator

function calculateIPTransfer() {
	// Calculate an interplanetary transfer

	// Set the initial transit time - this is used for evaluating efficiency
	transTime = new Date();

	// // Stop a transit if one is in progress
	// if (shipEndTime) {
	// 	endShipTransit();
	// }

	// Hide the delta vee display, to reset
	//document.getElementById("deltaVeeDisplay").style.display = "none";

	// Clear maneuvers list
	let maneuvers = [];

	// Import and format names correctly
	const properName = props.formData.destination.name.replace('The ', '');
	const originPlanet = props.formData.origin;
	const destinationPlanet = props.formData.destination;

	// Decide which mode of Lambert calculation should be used
	twoStage = props.formData.departureToday;

	if (props.formData.origin == props.formData.destination) {
		// TODO: Create a better Bootstrap alert here
		alert("You can't transfer between the same planet!");
	} else {
		// Import parking orbit parameters
		const fromRadius = props.formData.originOrbit;
		const toRadius = props.formData.destinationOrbit;

		// Add Trans-NAME Injection to the maneuvers list - This is moving out to escape velocity
		maneuvers.push({
			name: 'T' + properName[0] + 'I',
			title: 'Trans-' + properName + ' Injection',
			deltaVee: calculateEscapeVelocity(originPlanet, fromRadius),
		});

		// Stop people from activating transfer  too many times
		// document.getElementById('IPTransferButton').disabled = true;
		// document.getElementById('ILTransferButton').disabled = true;

		// Run the main transfer engine
		calculateLambertTransfer(
			originPlanet,
			destinationPlanet,
			fromRadius,
			toRadius,
		);

		storedTransferData = {
			maneuvers: maneuvers,
			originPlanet: originPlanet,
			destinationPlanet: destinationPlanet,
			properName: properName,
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

function calculateLambertTransfer(
	originPlanet: PlanetOrbit,
	destinationPlanet: PlanetOrbit,
	distOne: number,
	distTwo: number,
) {
	// Calculate the transfer between two planets
	// I will try and explain the maths, but to see the full derivations, check the credits page - I've used the same variable names

	// Disable logged transfer
	loggedTransfer = false;

	// Stop the simulation from running to speed it up
	// startTransferCalc();

	// // Reset all systems - stop people from messing it up while the program is busy
	// document.getElementById('disabledCover').style.display = 'block';
	// if (!webVR) {
	// 	document.getElementById('shipViewDiv').style.display = 'block';
	// }
	// resetShipSystems();

	// Initialise empty transit windows
	transitWindows = [];

	// Bring up the loading screen
	// document.getElementById('loadingScreen').style.display = 'block';
	// if (stereoDisp) {
	// 	document.getElementById('loadingScreenAux').style.display = 'block';
	// }
	loading.value = true;

	// Get the initial Message
	message =
		loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

	// Import needed variables
	const center = originPlanet.center;
	const startTime = currentTime.getTime();
	const aOne = parseScalarInput(originPlanet.a, 'AU');
	const aTwo = parseScalarInput(destinationPlanet.a, 'AU');

	// Find and convert gravitational parameter
	const gravitationalParameter = parseScalarInput(
		findGravParam(center),
		'm^3/s^2',
	);

	// Calculate periods
	const periodOne = parseScalarInput(
		findPeriod(aOne.value * convertDistance('M', 'AU'), center),
		'y',
	);
	const periodTwo = parseScalarInput(
		findPeriod(aTwo.value * convertDistance('M', 'AU'), center),
		'y',
	);
	var synodicPeriod = parseScalarInput(
		calculateSynodicPeriod(
			periodOne.value * convertTime('S', 'Y'),
			periodTwo.value * convertTime('S', 'Y'),
			//center,
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
		largeE = parseScalarInput(originPlanet.e, '');
		smallE = parseScalarInput(destinationPlanet.e, '');
	} else {
		largeSemiMajor = aTwo;
		smallSemiMajor = aOne;
		largeE = parseScalarInput(destinationPlanet.e, '');
		smallE = parseScalarInput(originPlanet.e, '');
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

	var transitA = divide(
		add(outerPoint, innerPoint),
		parseScalarInput(2, ''),
	) as unknown as ScalarInput;

	//var transitA = ((largeSemiMajor * (1 + largeE)) + (smallSemiMajor * (1 - smallE))) / 2;
	var periodT = parseScalarInput(
		findPeriod(transitA['value'] * convertDistance('M', 'AU'), center),
		'y',
	);
	//var periodT = findPeriod(transitA, center);

	// Define the resolution - this means looking at resolution squared windows
	var resolution = 200;
	if ((timeRatio + lastTimeRatio) / 2 > 1.5 && !twoStage) {
		// console.log(
		// 	'Calculating Low Resolution Transfer - Slow Running Computer',
		// );
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
	var increment = divide(
		synodicPeriod,
		parseScalarInput(resolution, ''),
	) as unknown as ScalarInput;
	var timeIncrement = divide(
		multiply(
			parseScalarInput(upperTransitBound - lowerTransitBound, ''),
			periodT,
		),
		parseScalarInput(resolution, ''),
	) as unknown as ScalarInput;
	//var timeIncrement = (upperTransitBound - lowerTransitBound) * periodT / resolution;

	// Define the radial position vectors
	var rOne = [];
	var rTwo = [];

	// Keep track of the data - lowest data contains the best transit data, the lowest DV keeps track of whether a new one is better
	lowestData = null;
	lowestDeltaVee = parseScalarInput(
		Math.pow(10, 10),
		'm/s',
	) as unknown as ScalarInput;

	// // Keep track of the timing of the transfer in the console
	// console.log('Calculating Transfer...');

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
		transitWindows[deptTime] = [];

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
						originPlanet,
						destinationPlanet,
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
				originPlanet,
				destinationPlanet,
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
	deptTime: number,
	travelTime: number,
	originPlanet: PlanetOrbit,
	destinationPlanet: PlanetOrbit,
	miscData: any,
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

	const travelTimeScalar = parseScalarInput(travelTime, 's');

	// Find initial variables for first planet
	var departingTime = new Date(
		startTime + deptTime * convertTime('S', 'MS', 1),
	);
	var rOne = parseVectorInput(
		findPlanetLocation(originPlanet.name, departingTime),
		'AU',
	);
	var departingVelocity = parseVectorInput(
		findVelocity(originPlanet.name, departingTime),
		'AU/y',
	);

	// Find initial variables for second planet
	var arrivingTime = new Date(
		departingTime.getTime() + outputScalar(travelTimeScalar, 'ms'),
	);
	var rTwo = parseVectorInput(
		findPlanetLocation(destinationPlanet.name, arrivingTime),
		'AU',
	);
	var arrivingVelocity = parseVectorInput(
		findVelocity(destinationPlanet.name, arrivingTime),
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
	var k = multiply(
		multiply(rOneMag, rTwoMag),
		subtract(1, cos(deltaV)),
	) as unknown as ScalarInput;
	var m = multiply(
		multiply(rOneMag, rTwoMag),
		add(1, cos(deltaV)),
	) as unknown as ScalarInput;
	var l = add(rOneMag, rTwoMag) as unknown as ScalarInput;
	//var k = rOneMag * rTwoMag * (1 - Math.cos(deltaV));
	//var m = rOneMag * rTwoMag * (1 + Math.cos(deltaV));
	//var l = rOneMag + rTwoMag;

	// Important bounders for the iterator
	var pi = divide(
		k,
		add(l, pow(multiply(2, m), 0.5)),
	) as unknown as ScalarInput;
	var pii = divide(
		k,
		subtract(l, pow(multiply(2, m), 0.5)),
	) as unknown as ScalarInput;
	//var pi = k / (l + Math.pow(2 * m, 0.5));
	//var pii = k / (l - Math.pow(2 * m, 0.5));

	// Some misc variables
	let low;
	let high;
	let p1: ScalarInput;
	let p2: ScalarInput;

	// The starting boundaries affect the results quite a bit
	const startSeed = 2000000; // This MUST be >= 1

	if (deltaV.value > Math.PI) {
		// These are limits defined by the maths, just roll with it
		low = parseScalarInput(0, 'm');
		high = pii;
		p1 = add(
			multiply(0.5 + 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
		p2 = add(
			multiply(0.5 - 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
	} else {
		low = pi;
		//p1 = ((0.5 + 1 / startSeed) * (pii - pi)) + pi;
		//p2 = ((0.5 - 1 / startSeed) * (pii - pi)) + pi;
		p1 = add(
			multiply(0.5 + 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
		p2 = add(
			multiply(0.5 - 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
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
		Math.abs(t2.value - travelTimeScalar.value) > tofMargin.value &&
		!isNaN(p2.value) &&
		numTries >= 0 &&
		p2.value < high.value &&
		p2.value > low.value
	) {
		var pnew = add(
			p2,
			divide(
				multiply(subtract(travelTimeScalar, t2), subtract(p2, p1)),
				subtract(t2, t1),
			),
		) as unknown as ScalarInput; // Linear convergence

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
	) as unknown as ScalarInput;
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
	) as unknown as VectorInput;
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
	// if (originPlanet.name == 'orbit1') {
	// 	deltaVee = add(deltaVee, DTO);
	// } else if (originPlanet.['satellite'] == true) {
	// 	deltaVee = add(deltaVee, DTO);
	// } else {
	DTOGrav = parseScalarInput(
		calculateEscapeVelocity(originPlanet.name, distOne) +
			calculateExtraVelocity(DTO.value, originPlanet.name, distOne),
		'm/s',
	);
	deltaVee = add(
		deltaVee,
		parseScalarInput(
			calculateEscapeVelocity(originPlanet.name, distOne) +
				calculateExtraVelocity(DTO.value, originPlanet.name, distOne),
			'm/s',
		),
	) as unknown as ScalarInput;
	//}

	// If not aerobraking, deal with orbit and satellite possibilities
	if (!(originPlanet.center == 'sun' && props.formData.aerobrake)) {
		if (originPlanet.name == 'orbit2') {
			deltaVee = add(deltaVee, DCO) as unknown as ScalarInput;
		} else if (destinationPlanet.satellite == true) {
			deltaVee = add(deltaVee, DCO) as unknown as ScalarInput;
		} else {
			DCOGrav = parseScalarInput(
				calculateEscapeVelocity(destinationPlanet.name, distTwo) +
					calculateExtraVelocity(
						DCO.value,
						destinationPlanet.name,
						distTwo,
					),
				'm/s',
			);
			deltaVee = add(
				deltaVee,
				parseScalarInput(
					calculateEscapeVelocity(destinationPlanet.name, distTwo) +
						calculateExtraVelocity(
							DCO.value,
							destinationPlanet.name,
							distTwo,
						),
					'm/s',
				),
			) as unknown as ScalarInput;
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

	var formatData: FormatDataType = {
		pos: outputVector(rOne, 'AU'),
		vel: outputVector(vOne, 'AU/y'),
		TO: DTO.value,
		CO: DCO.value,
		TOGrav: DTOGrav.value,
		COGrav: DCOGrav.value,
		capTime: arrivingTime,
		depTime: departingTime,
		pos2: outputVector(rTwo, 'AU'),
		vel2: outputVector(vTwo, 'AU/y'),
		depVel: outputVector(departingVelocity, 'AU/y'),
		arrVel: outputVector(arrivingVelocity, 'AU/y'),
		predictedTime: outputScalar(t2, 'y'),
		tTime: outputScalar(travelTimeScalar, 'y'),
		timeDiff:
			(Math.abs(t2.value - travelTimeScalar.value) /
				travelTimeScalar.value) *
			100, //'%',
		a: outputScalar(a, 'AU'),
		misc: {
			p: p.value,
			highP: high.value,
			lowP: low.value,
			m: m.value,
			k: k.value,
			l: l.value,
			f: f.vector,
			g: g.value,
			fDot: fDot.vector,
			gDot: gDot.vector,
		},
		numTries: numTries,
		gravParam: gravitationalParameter,
		dTime: deptTime,
		deltaVee: deltaVee.value,
		originPlanet: originPlanet,
		destinationPlanet: destinationPlanet,
		rawDTime: rawDTime,
		rawTTime: rawTTime,
	};

	if (miscData.index) {
		formatData['index'] = miscData.index;
	}

	if (!transitWindows[deptTime]) {
		// Open up the departure time JSON if not initialised
		transitWindows[deptTime] = [];
	}

	// Log the data
	const yearsTraveled = outputScalar(travelTimeScalar, 'y');
	transitWindows[deptTime][yearsTraveled] = formatData;

	// If it is an invaid transfer, disregard as the most efficient. Invalid is hyperbolic, not number values, or if the convergence went outside allowed boundaries
	if (validTransfer(formatData)) {
		// Decide which lowest data tracking method
		if (twoStage && !inSecondStage) {
			// Choose whether to add a new piece of data
			if (storedWindows.length < windowsNum) {
				storedWindows.push(formatData);

				storedWindows.sort(function (x, y) {
					// This sorts is in descending order, highest first
					let xDv = x.deltaVee;
					let yDv = y.deltaVee;
					if (xDv < yDv) {
						return 1;
					}
					if (xDv > yDv) {
						return -1;
					}
					return 0;
				});
			} else if (deltaVee.value < storedWindows[0].deltaVee) {
				storedWindows[0] = formatData;

				storedWindows.sort(function (x, y) {
					// This sorts is in descending order, highest first
					let xDv = x.deltaVee;
					let yDv = y.deltaVee;
					if (xDv < yDv) {
						return 1;
					}
					if (xDv > yDv) {
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

	// // Update loading text
	// var displayText =
	// 	'Calculating Transfer<br>' +
	// 	round((100 * deptTime) / synodicPeriod.value, 0) +
	// 	'%';

	// displayText += lastTimeMessage;
	// document.getElementById('loadingText').innerHTML = displayText;
	// document.getElementById('loadingTextAux').innerHTML = displayText;

	// // Otherwise, keep adding dots
	// document.getElementById('wittyText').innerHTML =
	// 	message + '.'.repeat(Math.floor(seconds));
	// document.getElementById('wittyTextAux').innerHTML =
	// 	message + '.'.repeat(Math.floor(seconds));
}

function secondTransferStage(
	originPlanet: PlanetOrbit,
	destinationPlanet: PlanetOrbit,
	dTimeIncrement: number,
	tTimeIncrement: number,
	miscData: any,
	calcData: any,
) {
	// Complete the second stage of the transfer calculations

	// Log how many calculations used in stage one
	//console.log('Stage 1 Complete: ' + totalCalculations + ' windows analysed');
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
						originPlanet,
						destinationPlanet,
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

	// // Open up the user UI and let them use it again
	// if (!webVR) {
	// 	document.getElementById('shipViewDiv').style.display = 'block';
	// }
	// document.getElementById('loadingScreen').style.display = 'none';
	// document.getElementById('loadingScreenAux').style.display = 'none';
	// document.getElementById('disabledCover').style.display = 'none';

	// Let the user know it's done
	console.log(
		'Lambert Transfer Calculated: ' +
			round((new Date().getTime() - transTime.getTime()) / 1000, 2) +
			's',
	);
	console.log('Calculated with ' + totalCalculations + ' windows analysed');

	// swal({
	// 	title: 'Transfer Calculated',
	// 	html: 'Look at the simulation for the gray ship and its orbit, or the bottom right for the &Delta;V Breakdown',
	// 	type: 'success',
	// }).then((result) => {
	// 	if (result.value) {
	// 		// Resume simulation running
	// 		endTransferCalc();
	// 	}
	// });
}

function finishLambertCalculation() {
	if (!lowestData) {
		return;
	}
	// Finalise the lambert calculation for display

	var center = lowestData.originPlanet['center'];

	// Extract the position and velocity vectors for ease
	var r = lowestData['pos'];
	var v = lowestData['vel'];

	var r2 = lowestData['pos2'];
	var v2 = lowestData['vel2'];

	// Log the data just to be sure for debugging
	// console.log(lowestData);

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
</script>
