import React, { useState } from 'react';
import { useMoonPhase } from './MoonPhaseContext';
import InputWrapper from '../forms/InputWrapper';

export default function MoonPhaseForm() {
	const {
		selectedDate,
		setSelectedDate,
		showSun,
		setShowSun,
		rotationSpeed,
		setRotationSpeed,
		location,
		setLocation,
	} = useMoonPhase();

	const [useCustomLocation, setUseCustomLocation] = useState<boolean>(false);
	const [tempLocation, setTempLocation] = useState<{
		latitude: number;
		longitude: number;
	}>(location || { latitude: 0, longitude: 0 });

	// Handle date change
	const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(event.target.value);
		if (!isNaN(newDate.getTime())) {
			setSelectedDate(newDate);
		}
	};

	// Handle location toggle
	const handleLocationToggle = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const useLocation = event.target.checked;
		setUseCustomLocation(useLocation);

		if (!useLocation) {
			setLocation(null);
		} else if (tempLocation) {
			setLocation(tempLocation);
		}
	};

	// Handle location input changes
	const handleLatitudeChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const lat = parseFloat(event.target.value);
		if (!isNaN(lat) && lat >= -90 && lat <= 90) {
			const newLocation = { ...tempLocation, latitude: lat };
			setTempLocation(newLocation);
			if (useCustomLocation) {
				setLocation(newLocation);
			}
		}
	};

	const handleLongitudeChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const lng = parseFloat(event.target.value);
		if (!isNaN(lng) && lng >= -180 && lng <= 180) {
			const newLocation = { ...tempLocation, longitude: lng };
			setTempLocation(newLocation);
			if (useCustomLocation) {
				setLocation(newLocation);
			}
		}
	};

	// Format date for input element
	const formatDateForInput = (date: Date): string => {
		return date.toISOString().split('T')[0];
	};

	return (
		<div className="p-2 rounded border mb-5">
			<InputWrapper
				id="date-picker"
				label="Select Date"
				description="Choose any date to view the moon phase"
				input={
					<input
						type="date"
						className="form-control"
						value={formatDateForInput(selectedDate)}
						onChange={handleDateChange}
					/>
				}
			/>

			<InputWrapper
				id="rotation-speed"
				label="Animation Speed"
				description="Adjust speed of the orbital animation"
				input={
					<input
						type="range"
						className="form-range"
						min="0"
						max="2"
						step="0.1"
						value={rotationSpeed}
						onChange={(e) =>
							setRotationSpeed(parseFloat(e.target.value))
						}
					/>
				}
			/>

			<InputWrapper
				id="show-sun"
				label="Show Sun"
				description="Toggle visibility of the Sun in visualization"
				input={
					<div className="form-check">
						<input
							className="form-check-input"
							type="checkbox"
							id="showSunCheck"
							checked={showSun}
							onChange={(e) => setShowSun(e.target.checked)}
						/>
						<label
							className="form-check-label"
							htmlFor="showSunCheck"
						>
							Display Sun
						</label>
					</div>
				}
			/>

			<InputWrapper
				id="use-location"
				label="Use Custom Location"
				description="Enable to see moonrise/moonset times for your location"
				input={
					<div className="form-check">
						<input
							className="form-check-input"
							type="checkbox"
							id="useLocationCheck"
							checked={useCustomLocation}
							onChange={handleLocationToggle}
						/>
						<label
							className="form-check-label"
							htmlFor="useLocationCheck"
						>
							Use Location
						</label>
					</div>
				}
			/>

			{useCustomLocation && (
				<div className="mt-3">
					<div className="mb-3">
						<label htmlFor="latitude" className="form-label">
							Latitude (-90° to 90°)
						</label>
						<input
							type="number"
							className="form-control"
							id="latitude"
							value={tempLocation.latitude}
							onChange={handleLatitudeChange}
							min="-90"
							max="90"
							step="0.001"
						/>
					</div>
					<div className="mb-3">
						<label htmlFor="longitude" className="form-label">
							Longitude (-180° to 180°)
						</label>
						<input
							type="number"
							className="form-control"
							id="longitude"
							value={tempLocation.longitude}
							onChange={handleLongitudeChange}
							min="-180"
							max="180"
							step="0.001"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
