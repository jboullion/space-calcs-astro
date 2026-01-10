import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react';
import type {
	MotorConfig,
	SimulationOutput,
	GrainSegment,
	PropellantData,
	NozzleConfig,
} from './types';
import { DEFAULT_PROPELLANT, DEFAULT_NOZZLE } from './constants';
import { simulateMotor } from './lib/simulator';
import { autoSizeNozzle } from './lib/nozzle';
import { evaluateGrainStack } from './lib/geometry';

interface SRMContextType {
	config: MotorConfig;
	setConfig: (config: MotorConfig) => void;
	results: SimulationOutput | null;
	setResults: (results: SimulationOutput | null) => void;
	isSimulating: boolean;
	setIsSimulating: (value: boolean) => void;
	// Convenience setters
	updateGrainStack: (stack: GrainSegment[]) => void;
	updatePropellant: (propellant: PropellantData) => void;
	updateNozzle: (nozzle: NozzleConfig) => void;
	updateCaseInnerDiameter: (diameter: number) => void;
	updateFreeVolume: (volume: number) => void;
	// Simulation
	runSimulation: () => void;
}

const SRMContext = createContext<SRMContextType | undefined>(undefined);

export function SRMProvider({ children }: { children: ReactNode }) {
	const [config, setConfig] = useState<MotorConfig>({
		caseInnerDiameter: 0.0508, // 50.8mm (2 inches)
		freeVolume: 3e-4, // 300 cm³
		grainStack: [],
		propellant: DEFAULT_PROPELLANT,
		nozzle: DEFAULT_NOZZLE,
	});
	const [results, setResults] = useState<SimulationOutput | null>(null);
	const [isSimulating, setIsSimulating] = useState(false);

	const updateGrainStack = useCallback((stack: GrainSegment[]) => {
		setConfig((prev) => ({ ...prev, grainStack: stack }));
	}, []);

	const updatePropellant = useCallback((propellant: PropellantData) => {
		setConfig((prev) => ({ ...prev, propellant }));
	}, []);

	const updateNozzle = useCallback((nozzle: NozzleConfig) => {
		setConfig((prev) => ({ ...prev, nozzle }));
	}, []);

	const updateCaseInnerDiameter = useCallback((diameter: number) => {
		setConfig((prev) => ({ ...prev, caseInnerDiameter: diameter }));
	}, []);

	const updateFreeVolume = useCallback((volume: number) => {
		setConfig((prev) => ({ ...prev, freeVolume: volume }));
	}, []);

	const runSimulation = useCallback(() => {
		// Validation
		if (config.grainStack.length === 0) {
			alert('Please add at least one grain segment');
			return;
		}

		setIsSimulating(true);
		setResults(null);

		// Run simulation asynchronously to allow UI to update
		setTimeout(() => {
			try {
				let finalConfig = config;

				// Auto-size nozzle if in auto mode
				if (config.nozzle.mode === 'auto') {
					// Ensure targetPressure is set
					const targetPressure = config.nozzle.targetPressure || 13789520; // Default 2000 psi

					// Create geometry function for auto-sizing
					const geoFcn = (x: number) => evaluateGrainStack(x, config.grainStack);

					// Run auto-sizing
					const autoResult = autoSizeNozzle(
						{
							propellant: config.propellant,
							grainStack: config.grainStack,
							nozzle: {
								...config.nozzle,
								targetPressure,
							},
						},
						geoFcn,
					);

					// Display warnings if any
					if (autoResult.warnings.length > 0) {
						console.warn('Auto-sizing warnings:');
						autoResult.warnings.forEach((w) => console.warn('  ' + w));
					} else {
						console.log('Auto-sizing successful:');
						console.log(`  Throat diameter: ${(autoResult.throatDiameter * 1000).toFixed(2)} mm`);
						console.log(`  Exit diameter: ${(autoResult.exitDiameter * 1000).toFixed(2)} mm`);
						console.log(`  Expansion ratio: ${autoResult.eps.toFixed(1)}:1`);
					}

					// Update config with auto-sized nozzle
					finalConfig = {
						...config,
						nozzle: {
							...config.nozzle,
							throatDiameter: autoResult.throatDiameter,
							exitDiameter: autoResult.exitDiameter,
						},
					};

					// Update the context with the auto-sized values so user can see them
					setConfig(finalConfig);
				}

				const output = simulateMotor(finalConfig);
				setResults(output);
			} catch (error) {
				console.error('Simulation error:', error);
				alert('Simulation failed: ' + (error as Error).message);
			} finally {
				setIsSimulating(false);
			}
		}, 50);
	}, [config, setConfig]);

	return (
		<SRMContext.Provider
			value={{
				config,
				setConfig,
				results,
				setResults,
				isSimulating,
				setIsSimulating,
				updateGrainStack,
				updatePropellant,
				updateNozzle,
				updateCaseInnerDiameter,
				updateFreeVolume,
				runSimulation,
			}}
		>
			{children}
		</SRMContext.Provider>
	);
}

export function useSRM() {
	const context = useContext(SRMContext);
	if (!context) {
		throw new Error('useSRM must be used within SRMProvider');
	}
	return context;
}
