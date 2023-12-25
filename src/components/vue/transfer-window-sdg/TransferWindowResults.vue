<template>
	<div>
		<div class="p-2 rounded border mb-5">
			<p>Calculating...</p>
			<button class="btn btn-danger" @click="calculateIPTransfer">
				Calculate
			</button>
		</div>
	</div>
</template>
<script setup lang="ts">
/**
 * TODO: Must Dos!
 * Once the calculations are work try to hide them away in functions to clean up this file
 *
 *
 */
import { ref, computed } from 'vue';

import type {
	FormatDataType,
	ITransferWindowForm,
	Maneuver,
	PlanetOrbit,
	ScalarInput,
	TransferData,
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
	outputScalar,
	parseVectorInput,
	vectorMagnitude,
	outputVector,
	cos,
	pow,
	sin,
	tan,
	validTransfer,
	convertDistance,
	findPeriod,
	convertTime,
	EPOCH,
} from './functions';
import { realMessages } from './constants';

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
let twoStage = false;
let loggedTransfer = false;
let loadingMessages = realMessages;
let message =
	loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
let timeRatio = 1;
let lastTimeRatio = 1;
let storedTransferData: TransferData | null = null;
var orbitResolution = 2;
let orbitalTimes: any = {};
let orbitalPositions: any = {};

let currentDegrees: any = {};

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
	let maneuvers: Maneuver[] = [];

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
	const gravitationalParameter = parseScalarInput(center, 'm^3/s^2');

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
		findPlanetLocation(originPlanet, departingTime),
		'AU',
	);
	var departingVelocity = parseVectorInput(
		findVelocity(originPlanet, departingTime),
		'AU/y',
	);

	// Find initial variables for second planet
	var arrivingTime = new Date(
		departingTime.getTime() + outputScalar(travelTimeScalar, 'ms'),
	);
	var rTwo = parseVectorInput(
		findPlanetLocation(destinationPlanet, arrivingTime),
		'AU',
	);
	var arrivingVelocity = parseVectorInput(
		findVelocity(destinationPlanet, arrivingTime),
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
		calculateEscapeVelocity(originPlanet, distOne) +
			calculateExtraVelocity(DTO.value, originPlanet, distOne),
		'm/s',
	);
	deltaVee = add(
		deltaVee,
		parseScalarInput(
			calculateEscapeVelocity(originPlanet, distOne) +
				calculateExtraVelocity(DTO.value, originPlanet, distOne),
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
				calculateEscapeVelocity(destinationPlanet, distTwo) +
					calculateExtraVelocity(
						DCO.value,
						destinationPlanet,
						distTwo,
					),
				'm/s',
			);
			deltaVee = add(
				deltaVee,
				parseScalarInput(
					calculateEscapeVelocity(destinationPlanet, distTwo) +
						calculateExtraVelocity(
							DCO.value,
							destinationPlanet,
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
	console.log({ lowestData });

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

function calculateEscapeVelocity(
	centerBody: PlanetOrbit,
	initalRadiusAbove: number,
) {
	// Calculate the escape velocity of a body

	// Get initial data
	var r = centerBody['r'] * convertDistance('AU', 'KM', 1);
	var gravParam = findGravParam(centerBody);

	// Calculate the total radius
	var radiusTotal = (r + initalRadiusAbove) * convertDistance('KM', 'M', 1);

	// Plug it into the escape velocity formula
	var deltaVee =
		Math.pow((2 * gravParam) / radiusTotal, 0.5) -
		Math.pow(gravParam / radiusTotal, 0.5);

	return deltaVee;
}

function calculateExtraVelocity(
	velocity: number,
	planet: PlanetOrbit,
	radius: number,
) {
	// Calculate the excess velocity at the bottom of a hyperbolic trajectory given the velocity at insertion

	// Get inital numbers
	var SOIGravParam = findGravParam(planet);
	var insertionVelocity = velocity;
	const SOI = planet['SOI'] ?? 0;

	// Find the size of the SOI and the velocity at the edge
	var planetSOI = SOI * convertDistance('AU', 'M', 1);
	var exitSOIA =
		1 / (2 / planetSOI + Math.pow(insertionVelocity, 2) / SOIGravParam);

	// Calculate height above the planet
	var planetRadius = planet['r'] * convertDistance('AU', 'KM', 1);
	var radiusTotal = (planetRadius + radius) * convertDistance('KM', 'M', 1);

	// Calculate the speed at exiting the SOI
	var deltaVeeExit = Math.pow(
		SOIGravParam * (2 / radiusTotal + 1 / exitSOIA),
		0.5,
	);

	// Return the speed without the escape velcity - this is the hyperbolic EXCESS velocity
	return deltaVeeExit - Math.pow((2 * SOIGravParam) / radiusTotal, 0.5);
}

function findPlanetLocation(planet: PlanetOrbit, time: Date) {
	// Deliver a planet location given the current time

	// Get the data
	var a = planet['a'];
	var L = planet['rL'] ?? 1;
	var center = planet['center'];

	// Find the excesss time since the epoch, less than the period for ease of computiation
	var period = findPeriod(a, center);
	var tempEpoch = EPOCH.getTime();
	// if (planet['epoch']) {
	// 	// If a custom epoch, use that
	// 	tempEpoch = planet['epoch'];
	// }
	var milliseconds = time.getTime() - tempEpoch; // Milliseconds between EPOCH and current time
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
	var diffPoint = orbitalTimes[planet.value][0];

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
		var testValue = orbitalTimes[planet.value][testDegree];

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
	var previousArray = orbitalPositions[planet.value][previousDegree];

	// Move it between positions to ensure smooth animation - this is rather than jerking it from position to position
	var percentageAlong =
		(remainder - orbitalTimes[planet.value][previousDegree]) /
		(orbitalTimes[planet.value][nextDegree] -
			orbitalTimes[planet.value][previousDegree]);
	if (isNaN(percentageAlong)) {
		// if an error is throw new Error("Something bad happened.")n, just pick halfway
		percentageAlong = 0.5;
	}

	// Save the current position
	if (planet.value != 'sun') {
		currentDegrees[planet.value] =
			(previousDegree + percentageAlong) / orbitResolution;
	}

	// Find the next position
	var nextArray = orbitalPositions[planet.value][nextDegree];

	// Find the difference and moderate by the percentage along, and generate the new position vector
	var diffArray = subVec(nextArray, previousArray);
	diffArray = multiplyVec(percentageAlong, diffArray);

	// Resolve it into a new position vector
	var array = addVec(previousArray, diffArray);

	// Return current position vector
	return array;
}

// function findPlanetDegree(planet: PlanetOrbit, position) {
// 	// This entire thing is reverse-deriving it by the same method used to generate the initial coords

// 	// Get initial data
// 	var e = planet['e'];
// 	var i = planet['i'];
// 	var a = planet['a'];
// 	var loPE = planet['loPE'];
// 	var loAN = planet['loAN'];
// 	var center = planet['center'];
// 	var name = planet['value'];

// 	if (
// 		center != 'sun' &&
// 		name != 'luna' &&
// 		name != 'the moon' &&
// 		name != 'ship'
// 	) {
// 		if (planets[center]['axialTilt']) {
// 			if (!planet['loANeff'] || !planet['ieff']) {
// 				calculateEffectiveParams(name);
// 			}

// 			loAN = planets[name]['loANeff'];
// 			i = planets[name]['ieff'];
// 		}
// 	}

// 	// Eccentric degree is how far away it is from the periapsis
// 	//var eccentricDegree = (360 + degree + loPE) % 360;

// 	// Convert it into needed formats
// 	//var degreesFromAN = DtoR(-degree - loAN);

// 	if (i == 0) {
// 		i = 0.000001;
// 	}

// 	var o = DtoR(loAN);
// 	i = DtoR(i);

// 	var distance = magnitude(position);

// 	// Recalculate position - see earlier in the program

// 	// Find initial degrees from the ascending node, set up tests
// 	var degreesFromAN = Math.asin(position[2] / (distance * Math.sin(i)));

// 	var testXOne =
// 		distance *
// 		(Math.cos(o) * Math.cos(degreesFromAN) -
// 			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
// 	var testYOne =
// 		distance *
// 		(Math.sin(o) * Math.cos(degreesFromAN) +
// 			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));

// 	var degreesFromANTwo = (Math.PI - degreesFromAN) % (2 * Math.PI);

// 	var testXTwo =
// 		distance *
// 		(Math.cos(o) * Math.cos(degreesFromANTwo) -
// 			Math.sin(o) * Math.sin(degreesFromANTwo) * Math.cos(i));
// 	var testYTwo =
// 		distance *
// 		(Math.sin(o) * Math.cos(degreesFromANTwo) +
// 			Math.cos(o) * Math.sin(degreesFromANTwo) * Math.cos(i));

// 	// Create test positions
// 	var primary = [position[0], position[1], position[2]];
// 	var testOne = [testXOne, testYOne, position[2]];
// 	var testTwo = [testXTwo, testYTwo, position[2]];

// 	var distOne = magnitude(subVec(primary, testOne));
// 	var distTwo = magnitude(subVec(primary, testTwo));

// 	// Decide which section of the inverse sin to use based on which is closer
// 	if (distOne < distTwo) {
// 		degreesFromAN = RtoD(degreesFromAN);
// 	} else {
// 		degreesFromAN = RtoD(degreesFromANTwo);
// 	}

// 	// Find final degree
// 	var degree = -degreesFromAN - loAN;

// 	return ((360 - degree) % 360) - 1 / orbitResolution;
// }

// function findVelocity(name, time) {
// 	// Return velocity at a given time of a planet

// 	// Find position and then the degree to match with other knowledge
// 	var position = findPlanetLocation(name, time);
// 	var degree =
// 		Math.round((360 + vectorToAngle(position)) * orbitResolution) %
// 		(360 * orbitResolution);

// 	var newDegree = Math.round(
// 		findPlanetDegree(name, position) * orbitResolution,
// 	);
// 	if (!isNaN(newDegree)) {
// 		degree = (360 * orbitResolution + newDegree) % (360 * orbitResolution);
// 	}

// 	// Find the infintesimal change in distance and time
// 	var deltaTime =
// 		orbitalTimes[name][(degree + 1) % (360 * orbitResolution)] -
// 		orbitalTimes[name][degree];
// 	//deltaTime = findPeriod(planets[name].a, planets[name].center)
// 	var deltaDist = subVec(
// 		orbitalPositions[name][(degree + 1) % (360 * orbitResolution)],
// 		orbitalPositions[name][degree],
// 	);

// 	// Velocity = distance / time, except to find a vector velocity, use a vector distance
// 	var velocityVec = multiplyVec(1 / deltaTime, deltaDist);

// 	// Set the magnitude of the velocity according to the viz-viva equation
// 	var velMag = Math.sqrt(
// 		M3S2toAU3Y2(findGravParam(planets[name]['center'])) *
// 			(2 / magnitude(position) - 1 / planets[name]['a']),
// 	);
// 	velocityVec = setMagnitude(velocityVec, velMag);

// 	// Return the velocity in vector form
// 	return velocityVec;
// }

// // Orbital Data Calculation Functions

// function generateOrbitalCoords(name) {
// 	// Iterate through and calculate all orbital positions for a planet and store them.

// 	// Initialise the degree and co-ordinates
// 	var degree = 360;
// 	var coords = [];

// 	while (degree > 0) {
// 		// Iterate through every one of the 360 * orbitResolution points and add to array
// 		degree -= 1 / orbitResolution;
// 		var array = calculateOrbitalPositionVector(name, degree);
// 		coords.push(array);
// 	}

// 	// Store for later use to prevent excessive calculation
// 	orbitalPositions[name] = coords;
// }

// function generateOrbitalTimes(name) {
// 	// Calculate where the planet should be at a given time

// 	// Get the correct data
// 	var a = planets[name]['a'];
// 	var L = planets[name]['rL'];
// 	var center = planets[name]['center'];
// 	var gravitationalParameter = findGravParam(center);
// 	gravitationalParameter = M3S2toAU3Y2(gravitationalParameter);

// 	// The inital degree starts at its position at epoch - because the time is zero at 0 remainer time
// 	var degree = Math.round(L * orbitResolution) % (360 * orbitResolution);

// 	// Initialise storage variables
// 	orbitalTimes[name] = {};
// 	orbitalVelocities[name] = {};
// 	orbitalTimes[name][degree] = 0;

// 	// Initialise iterator variables
// 	var timesum = 0;
// 	var counter = 1;

// 	// Iterate through each degree and find the time at each
// 	while (counter < 360 * orbitResolution) {
// 		// Move the degree forward
// 		degree = (degree + 1) % (360 * orbitResolution);
// 		var currentDegree = degree % (360 * orbitResolution);

// 		// Find the positions, and the distance between
// 		var arrayOne = orbitalPositions[name][currentDegree];
// 		var arrayTwo =
// 			orbitalPositions[name][
// 				(currentDegree + 1) % (360 * orbitResolution)
// 			];
// 		var distance = magnitude(subVec(arrayOne, arrayTwo));

// 		// Find the velocity at this point
// 		var velocity = Math.pow(
// 			gravitationalParameter * (2 / magnitude(arrayOne) - 1 / a),
// 			0.5,
// 		);

// 		// Also store this velocity in the orbital velocities part
// 		orbitalVelocities[name][degree] = {
// 			velocity: velocity,
// 			distance: distance,
// 			time: distance / velocity,
// 		};

// 		// Additive time calculated by how long it takes to get between that small segment
// 		timesum += distance / velocity;
// 		orbitalTimes[name][degree] = timesum;

// 		// Move the counter foward
// 		counter += 1;
// 	}

// 	// Finish it off by making the last be the full period
// 	degree =
// 		(Math.round(L * orbitResolution) - 1 + 360 * orbitResolution) %
// 		(360 * orbitResolution);
// 	orbitalTimes[name][degree] = findPeriod(a, center);
// }

// function calculateOrbitalPositionVector(name, degree) {
// 	// Given which degree a planet is at, return the position vector

// 	// Get orbital data
// 	var e = planets[name]['e'];
// 	var i = planets[name]['i'];
// 	var a = planets[name]['a'];
// 	var loPE = planets[name]['loPE'];
// 	var loAN = planets[name]['loAN'];
// 	var center = planets[name]['center'];

// 	// Eccentric degree is how far away it is from the periapsis
// 	var eccentricDegree = (360 + degree + loPE) % 360;

// 	// Find out the magnitude of the position vector
// 	var distance =
// 		(a * (1 - e * e)) / (1 + e * Math.cos(DtoR(eccentricDegree)));

// 	// Convert it into needed formats
// 	var degreesFromAN = DtoR(-degree - loAN);
// 	var o = DtoR(loAN);
// 	i = DtoR(i);

// 	// Calculate the X, Y and Z components
// 	var x =
// 		distance *
// 		(Math.cos(o) * Math.cos(degreesFromAN) -
// 			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
// 	var y =
// 		distance *
// 		(Math.sin(o) * Math.cos(degreesFromAN) +
// 			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));
// 	var z = distance * (Math.sin(degreesFromAN) * Math.sin(i));

// 	// Deal with axial tilts of moons (the moon/luna are excepted due to its odd orbit)
// 	// The only parameters I could find were discounting axial tilt - I think due to how odd it is
// 	if (
// 		center != 'sun' &&
// 		name != 'luna' &&
// 		name != 'the moon' &&
// 		name != 'ship'
// 	) {
// 		if (planets[center]['axialTilt']) {
// 			// Calculates angular momentum vector, rotate by the rotation of the parent axial tilt from Z+
// 			// Then recalculate moderated orbital parameters based on this angular momentum

// 			var axisAN;
// 			var iAxis;

// 			if (!planets[name]['loANeff'] || !planets[name]['ieff']) {
// 				calculateEffectiveParams(name);
// 			}
// 			axisAN = planets[name]['loANeff'];
// 			iAxis = planets[name]['ieff'];

// 			// Recalculate position - see earlier in the program
// 			var degreesFromAxisAN = DtoR(-degree - axisAN);
// 			var oAxis = DtoR(axisAN);
// 			iAxis = DtoR(iAxis);
// 			x =
// 				distance *
// 				(Math.cos(oAxis) * Math.cos(degreesFromAxisAN) -
// 					Math.sin(oAxis) *
// 						Math.sin(degreesFromAxisAN) *
// 						Math.cos(iAxis));
// 			y =
// 				distance *
// 				(Math.sin(oAxis) * Math.cos(degreesFromAxisAN) +
// 					Math.cos(oAxis) *
// 						Math.sin(degreesFromAxisAN) *
// 						Math.cos(iAxis));
// 			z = distance * (Math.sin(degreesFromAxisAN) * Math.sin(iAxis));
// 		}
// 	}

// 	// Return position
// 	return [x, y, z];
// }

// function calculateEffectiveParams(name) {
// 	// Find the axial tilt
// 	var axialTilt = planets[name]['orbitalAxis'];

// 	var zAxis = [0, 0, 1];

// 	// This is the nodes vector - points at AN
// 	var n = crossProduct(zAxis, axialTilt);

// 	if (axialTilt[0] == 0 && axialTilt[1] == 0) {
// 		// If it points straight up, deflect marginally to avoid divide by zero errors
// 		axialTilt = [0, 0.0000000000001, 1];
// 	}

// 	// Calculate the new axes
// 	var iAxis = RtoD(Math.acos(axialTilt[2] / magnitude(axialTilt)));
// 	var axisAN = (360 + RtoD(Math.acos(n[0] / magnitude(n)))) % 360;
// 	if (n[1] < 0) {
// 		// Flip to loAN if it is around the way, the inverse cos function can't explain everytihing
// 		axisAN = 360 - axisAN;
// 	}

// 	if (isNaN(axisAN)) {
// 		// If inclination is zero - this can be anything, but zero is easiest
// 		axisAN = 0;
// 	}

// 	// Find the effective longitude of the ascending node and inclination
// 	planets[name]['loANeff'] = axisAN;
// 	planets[name]['ieff'] = iAxis;
// }

// function calculateAxialTilt(name) {
// 	// Rotate the angular momentum vector by the difference between vertical and the center's axis to find the new angular momentum vector

// 	// Get planetary data
// 	var i = planets[name]['i'];
// 	var loAN = planets[name]['loAN'];
// 	var center = planets[name]['center'];

// 	// Initialise the original angular momentum
// 	var originalAngMom = [0, 0, 0];

// 	// Calculate how far around the AN and inclination are for use in the later sections
// 	var ANdegree = DtoR((360 + loAN) % 360);
// 	i = DtoR(i);

// 	// Turn the orbital parameters into an angular momentum vector (reversing paramsFromVec calcs)
// 	var dist = Math.cos(Math.PI / 2 - i);
// 	var height = Math.sin(Math.PI / 2 - i);

// 	// Calculate needed sections. The angular momentum points 270 degrees (anticlockwise) from the AN
// 	var orgX = Math.sin(ANdegree);
// 	var orgY = -Math.cos(ANdegree);
// 	var orgZ = height;

// 	// Calculate angular momentum unit vector
// 	originalAngMom[0] = orgX * dist;
// 	originalAngMom[1] = orgY * dist;
// 	originalAngMom[2] = orgZ;
// 	originalAngMom = setMagnitude(originalAngMom, 1); // Note: Because I'm just looking at direction, the angular momentum is moderated to be 1 - a unit vector

// 	// Initialise major axes
// 	var zAxis = [0, 0, 1];
// 	var axialTilt = planets[center]['axialTilt'];

// 	// This finds where it is rotated and how much by
// 	var rotationAxis = crossProduct(zAxis, axialTilt); // Find the axis to rotate about: Cross product of the axial tilt and "up"
// 	var rotationDegree = Math.acos(dotProduct(zAxis, axialTilt)); // Find how many degrees to rotate by

// 	// Transform it into a unit vector that's compatible with threejs
// 	rotationAxis = setMagnitude(rotationAxis, 1);
// 	rotationAxis = threeVector(rotationAxis);

// 	// Find the new angular momentum
// 	var newAngMom = threeVector(originalAngMom);

// 	// Use ThreeJS to rotate the vector
// 	newAngMom.applyAxisAngle(rotationAxis, rotationDegree);
// 	// To reduce error, an inbuilt ThreeJS function used here instead of a matrix transform

// 	// Return the new angular momentum vector
// 	axialTilt = reverseThreeVector(newAngMom);
// 	return axialTilt;
// }
</script>
