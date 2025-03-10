import React, {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from 'react';
import * as Astronomy from 'astronomy-engine';

// Interface for the Moon phase data
interface MoonPhaseData {
	date: Date;
	illuminationPercent: number;
	phaseAngle: number;
	phaseName: string;
	moonAge: number;
	nextFullMoon: Date;
	nextNewMoon: Date;
}

// Interface for the Moon position data
interface MoonPosition {
	x: number;
	y: number;
	z: number;
}

// Interface for the Context type
interface MoonPhaseContextType {
	selectedDate: Date;
	setSelectedDate: (date: Date) => void;
	moonPhaseData: MoonPhaseData | null;
	setMoonPhaseData: (data: MoonPhaseData) => void;
	moonPosition: MoonPosition;
	showSun: boolean;
	setShowSun: (show: boolean) => void;
	rotationSpeed: number;
	setRotationSpeed: (speed: number) => void;
	location: {
		latitude: number;
		longitude: number;
	} | null;
	setLocation: (
		location: { latitude: number; longitude: number } | null,
	) => void;
}

// Create the context with a default undefined value
const MoonPhaseContext = createContext<MoonPhaseContextType | undefined>(
	undefined,
);

// Provider component
export const MoonPhaseProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [showSun, setShowSun] = useState<boolean>(true);
	const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
	const [location, setLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [moonPhaseData, setMoonPhaseData] = useState<MoonPhaseData | null>(
		null,
	);
	const [moonPosition, setMoonPosition] = useState<MoonPosition>({
		x: 5,
		y: 0,
		z: 0,
	});

	// Calculate moon position for visualization
	React.useEffect(() => {
		const calculateMoonPosition = () => {
			try {
				if (!selectedDate) return;

				console.log(
					'Calculating moon position for date:',
					selectedDate,
				);
				console.log(
					'Available Astronomy functions:',
					Object.keys(Astronomy).filter(
						(key) => typeof Astronomy[key] === 'function',
					),
				);

				// Calculate the moon's position using a different approach
				// Instead of trying to use EclipticCoordinates directly,
				// we'll use GetMoonPosition which returns equatorial coordinates
				const moonEquatorial = Astronomy.Equator(
					'Moon',
					selectedDate,
					true,
					true,
				);

				// Convert to a simple x,z position for visualization (keeping y=0 for simplicity)
				const distance = 5; // Scale for visualization
				const hourAngle = Math.PI - moonEquatorial.ra * (Math.PI / 12); // Convert RA to radians
				const x = distance * Math.cos(hourAngle);
				const z = distance * Math.sin(hourAngle);

				// Calculate 3D position (simplified model)
				const x = distance * Math.cos(angleRad);
				const z = distance * Math.sin(angleRad);

				// Update position
				setMoonPosition({
					x,
					y: 0, // Keep on ecliptic plane for simplicity
					z,
				});
			} catch (error) {
				console.error('Error calculating moon position:', error);
			}
		};

		calculateMoonPosition();
	}, [selectedDate]);

	const value = {
		selectedDate,
		setSelectedDate,
		moonPhaseData,
		setMoonPhaseData,
		moonPosition,
		showSun,
		setShowSun,
		rotationSpeed,
		setRotationSpeed,
		location,
		setLocation,
	};

	return (
		<MoonPhaseContext.Provider value={value}>
			{children}
		</MoonPhaseContext.Provider>
	);
};

// Custom hook to use the context
export const useMoonPhase = (): MoonPhaseContextType => {
	const context = useContext(MoonPhaseContext);
	if (context === undefined) {
		throw new Error('useMoonPhase must be used within a MoonPhaseProvider');
	}
	return context;
};
