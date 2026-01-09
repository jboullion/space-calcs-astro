// Test case validation comparing TypeScript simulator to MATLAB reference
// Based on RunSimulation.m test case

import type { MotorConfig, GrainSegment, PropellantData, NozzleConfig } from '../types';
import { simulateMotor } from '../lib/simulator';

/**
 * Test Case 1: Multi-segment motor from MATLAB RunSimulation.m
 * 
 * Configuration:
 * - Case ID: 50.8mm (2 inches)
 * - Finocyl segment: L=152.4mm, Ro=25.4mm, Ri=10mm, 6 fins
 * - BATES segment: L=152.4mm, Ro=25.4mm, Ri=12.7mm
 * - Propellant: Blue Thunder
 * - Auto-sized nozzle targeting 2000 psi (13.79 MPa)
 */

// Propellant: Blue Thunder
const blueThu: PropellantData = {
	name: 'Blue Thunder',
	density: 1625.09, // kg/m³
	a: 6.9947e-5,
	n: 0.321,
	gamma: 1.235,
	Tc: 2616.5, // K
	M: 0.022959, // kg/mol
	Pmin: 1,
	Pmax: 20e6,
};

// Nozzle configuration (manual for testing)
const nozzle: NozzleConfig = {
	mode: 'manual',
	throatDiameter: 0.01524, // 15.24mm (will be overridden by auto-sizing in practice)
	exitDiameter: 0.0762, // 76.2mm
	Cd: 0.98,
	ambientPressure: 101325, // 1 atm
	targetPressure: 2000 * 6894.76, // 2000 psi target
	targetExpansion: 25,
};

// Grain stack
const grainStack: GrainSegment[] = [
	{
		id: '1',
		type: 'finocyl',
		length: 0.1524, // 152.4mm
		outerRadius: 0.0254, // 25.4mm
		innerRadius: 0.0100, // 10mm
		inhibitEnds: true,
		finCount: 6,
		finDepth: 0.0060, // 6mm
		finThickness: 0.0040, // 4mm
	},
	{
		id: '2',
		type: 'bates',
		length: 0.1524, // 152.4mm
		outerRadius: 0.0254, // 25.4mm
		innerRadius: 0.0127, // 12.7mm
		inhibitEnds: true,
	},
];

// Motor configuration
const testConfig: MotorConfig = {
	caseInnerDiameter: 0.0508, // 50.8mm (2 inches)
	freeVolume: 3e-4, // 300 cm³
	grainStack: grainStack,
	propellant: blueThu,
	nozzle: nozzle,
};

/**
 * Expected MATLAB outputs (approximate - run MATLAB script to get exact values)
 * These are reference values to validate against
 */
const expectedMATLABResults = {
	// From MATLAB simulation
	totalImpulse: null, // Run MATLAB to get actual value
	peakPressure: null, // Peak chamber pressure (Pa)
	peakThrust: null, // Peak thrust (N)
	burnTime: null, // Burn time (s)
	deliveredIsp: null, // Specific impulse (s)
	propellantMass: null, // Total propellant mass (kg)
	
	// Tolerance for comparison
	tolerance: {
		impulse: 0.005, // 0.5% error
		pressure: 0.001, // 0.1% error
		thrust: 0.001, // 0.1% error
		time: 0.01, // 1% error
	},
};

/**
 * Run validation test
 */
export function runValidationTest() {
	console.log('=== SRM Simulator Validation Test ===');
	console.log('Running TypeScript simulation...');
	
	const startTime = performance.now();
	const results = simulateMotor(testConfig);
	const endTime = performance.now();
	
	console.log(`Simulation completed in ${(endTime - startTime).toFixed(2)}ms`);
	console.log('\nTypeScript Results:');
	console.log(`  Motor Class: ${results.designation}`);
	console.log(`  Total Impulse: ${results.totalImpulse?.toFixed(2)} N·s`);
	console.log(`  Peak Pressure: ${(results.peakPressure! / 1e6).toFixed(2)} MPa (${(results.peakPressure! / 6894.76).toFixed(0)} psi)`);
	console.log(`  Peak Thrust: ${results.peakThrust?.toFixed(1)} N`);
	console.log(`  Average Thrust: ${results.averageThrust?.toFixed(1)} N`);
	console.log(`  Burn Time: ${results.burnTime?.toFixed(3)} s`);
	console.log(`  Delivered Isp: ${results.deliveredIsp?.toFixed(1)} s`);
	console.log(`  Propellant Mass: ${results.propellantMass?.toFixed(3)} kg`);
	console.log(`  Initial Kn: ${results.initialKn?.toFixed(2)}`);
	console.log(`  Peak Kn: ${results.peakKn?.toFixed(2)}`);
	console.log(`  Volume Loading: ${(results.volumeLoading! * 100).toFixed(1)}%`);
	console.log(`  Port/Throat Ratio: ${results.portToThroatRatio?.toFixed(2)}`);
	
	// Comparison with MATLAB (if expected values are provided)
	if (expectedMATLABResults.totalImpulse !== null) {
		console.log('\n=== Validation vs MATLAB ===');
		
		const impulseError = Math.abs(
			(results.totalImpulse! - expectedMATLABResults.totalImpulse) / expectedMATLABResults.totalImpulse
		);
		const pressureError = Math.abs(
			(results.peakPressure! - expectedMATLABResults.peakPressure!) / expectedMATLABResults.peakPressure!
		);
		
		console.log(`  Total Impulse Error: ${(impulseError * 100).toFixed(3)}%`);
		console.log(`  Peak Pressure Error: ${(pressureError * 100).toFixed(3)}%`);
		
		// Check tolerances
		const passed = 
			impulseError < expectedMATLABResults.tolerance.impulse &&
			pressureError < expectedMATLABResults.tolerance.pressure;
		
		if (passed) {
			console.log('\n✅ VALIDATION PASSED - Results match MATLAB within tolerance');
		} else {
			console.log('\n❌ VALIDATION FAILED - Errors exceed tolerance');
		}
	} else {
		console.log('\n⚠️  No MATLAB reference data - run MATLAB script to get expected values');
	}
	
	return results;
}

/**
 * Simple BATES test case for quick validation
 */
export function runSimpleBATESTest() {
	console.log('=== Simple BATES Test ===');
	
	const simpleConfig: MotorConfig = {
		caseInnerDiameter: 0.0508,
		freeVolume: 1e-4,
		grainStack: [{
			id: '1',
			type: 'bates',
			length: 0.15,
			outerRadius: 0.0254,
			innerRadius: 0.0127,
			inhibitEnds: true,
		}],
		propellant: blueThu,
		nozzle: {
			mode: 'manual',
			throatDiameter: 0.012,
			exitDiameter: 0.06,
			Cd: 0.98,
			ambientPressure: 101325,
		},
	};
	
	const results = simulateMotor(simpleConfig);
	
	console.log('Results:');
	console.log(`  ${results.designation}`);
	console.log(`  Total Impulse: ${results.totalImpulse?.toFixed(2)} N·s`);
	console.log(`  Burn Time: ${results.burnTime?.toFixed(3)} s`);
	console.log(`  Peak Pressure: ${(results.peakPressure! / 6894.76).toFixed(0)} psi`);
	
	return results;
}
