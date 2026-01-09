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
				const output = simulateMotor(config);
				setResults(output);
			} catch (error) {
				console.error('Simulation error:', error);
				alert('Simulation failed: ' + (error as Error).message);
			} finally {
				setIsSimulating(false);
			}
		}, 50);
	}, [config]);

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
