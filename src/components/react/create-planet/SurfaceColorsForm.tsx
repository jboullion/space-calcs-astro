import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import { usePlanet } from './PlanetContext';

export default function SurfaceColorsForm() {
	const { surfaceColors, setSurfaceColors } = usePlanet();

	const handleColorChange = (
		colorType: keyof typeof surfaceColors,
		value: string,
	) => {
		setSurfaceColors({
			...surfaceColors,
			[colorType]: value,
		});
	};

	return (
		<div>
			<h5 className="mt-4 mb-3">Surface Colors</h5>

			<InputWrapper
				id="lowland-color"
				label="Lowland Color"
				tooltip="Color for valleys and low elevation areas"
				description="Applied to areas with low elevation"
				input={
					<input
						type="color"
						id="lowland-color"
						value={surfaceColors.lowland}
						onChange={(e) =>
							handleColorChange('lowland', e.target.value)
						}
						className="form-control form-control-color"
					/>
				}
			/>

			<InputWrapper
				id="base-color"
				label="Base Color"
				tooltip="Primary surface color of the planet"
				description="Main color for the planet's surface"
				input={
					<input
						type="color"
						id="base-color"
						value={surfaceColors.base}
						onChange={(e) =>
							handleColorChange('base', e.target.value)
						}
						className="form-control form-control-color"
					/>
				}
			/>

			<InputWrapper
				id="midland-color"
				label="Midland Color"
				tooltip="Color for medium elevation areas"
				description="Applied to areas with medium elevation"
				input={
					<input
						type="color"
						id="midland-color"
						value={surfaceColors.midland}
						onChange={(e) =>
							handleColorChange('midland', e.target.value)
						}
						className="form-control form-control-color"
					/>
				}
			/>

			<InputWrapper
				id="highland-color"
				label="Highland Color"
				tooltip="Color for mountains and high elevation areas"
				description="Applied to areas with high elevation"
				input={
					<input
						type="color"
						id="highland-color"
						value={surfaceColors.highland}
						onChange={(e) =>
							handleColorChange('highland', e.target.value)
						}
						className="form-control form-control-color"
					/>
				}
			/>
		</div>
	);
}
