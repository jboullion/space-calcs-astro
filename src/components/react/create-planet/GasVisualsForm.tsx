import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import { usePlanet } from './PlanetContext';
import type { GasGiantVisuals } from './types';

const DEFAULT_GAS_VISUALS: GasGiantVisuals = {
	bandCount: 8,
	rotationSpeed: 1.0,
	bandColors: [
		'#C88B3A',
		'#B87A30',
		'#D89C4A',
		'#A86920',
		'#C88B3A',
		'#B87A30',
		'#D89C4A',
		'#A86920',
	],
	bandBlending: 0.4,
};

export default function GasVisualsForm() {
	const { atmosphere, setAtmosphere } = usePlanet();

	const gasVisuals = atmosphere.gasGiantVisuals || DEFAULT_GAS_VISUALS;

	const updateGasVisuals = (updates: Partial<GasGiantVisuals>) => {
		const newGasVisuals = {
			...gasVisuals,
			...updates,
		};

		setAtmosphere({
			...atmosphere,
			gasGiantVisuals: newGasVisuals,
		});
	};

	const generateBandColors = (baseColor: string, count: number) => {
		// Convert hex to HSL for easier manipulation
		const hex2Hsl = (hex: string) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
				hex,
			);
			if (!result) return null;

			const r = parseInt(result[1], 16) / 255;
			const g = parseInt(result[2], 16) / 255;
			const b = parseInt(result[3], 16) / 255;

			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			let h = 0,
				s = 0,
				l = (max + min) / 2;

			if (max !== min) {
				const d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

				switch (max) {
					case r:
						h = (g - b) / d + (g < b ? 6 : 0);
						break;
					case g:
						h = (b - r) / d + 2;
						break;
					case b:
						h = (r - g) / d + 4;
						break;
				}
				h /= 6;
			}
			return { h: h * 360, s: s * 100, l: l * 100 };
		};

		const hsl2Hex = (h: number, s: number, l: number) => {
			l /= 100;
			const a = (s * Math.min(l, 1 - l)) / 100;
			const f = (n: number) => {
				const k = (n + h / 30) % 12;
				const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
				return Math.round(255 * color)
					.toString(16)
					.padStart(2, '0');
			};
			return `#${f(0)}${f(8)}${f(4)}`;
		};

		const baseHsl = hex2Hsl(baseColor);
		if (!baseHsl) return Array(count).fill(baseColor);

		// Create more pronounced light/dark variations
		return Array.from({ length: count }, (_, i) => {
			// Alternate between darker and lighter bands
			const isDark = i % 2 === 0;

			// More subtle hue variation
			const hueOffset = (Math.random() - 0.5) * 5;

			// More pronounced lightness variation
			const lightOffset = isDark ? -15 : 10;

			// Slight saturation boost for darker bands
			const satOffset = isDark ? 5 : -5;

			return hsl2Hex(
				(baseHsl.h + hueOffset) % 360,
				Math.max(0, Math.min(100, baseHsl.s + satOffset)),
				Math.max(20, Math.min(80, baseHsl.l + lightOffset)),
			);
		});
	};

	return (
		<div>
			<InputWrapper
				id="base-color"
				label="Surface Color"
				tooltip="Primary color of the gas giant's surface"
				description="This color will be used to generate band variations"
				input={
					<input
						type="color"
						id="base-color"
						value={gasVisuals.bandColors[0] || '#C88B3A'}
						onChange={(e) => {
							const newColors = generateBandColors(
								e.target.value,
								gasVisuals.bandCount,
							);
							updateGasVisuals({ bandColors: newColors });
						}}
						className="form-control form-control-color"
					/>
				}
			/>

			<InputWrapper
				id="band-count"
				label="Band Count"
				tooltip="Number of visible bands on the gas giant"
				description="Controls the number of distinct color bands"
				input={
					<NumberInput
						id="band-count"
						value={gasVisuals.bandCount}
						onChange={(value) => {
							const newColors = generateBandColors(
								gasVisuals.bandColors[0],
								value,
							);
							updateGasVisuals({
								bandCount: value,
								bandColors: newColors,
							});
						}}
						min={1}
						max={16}
						step={1}
					/>
				}
			/>

			<InputWrapper
				id="rotation-speed"
				label="Rotation Speed"
				tooltip="Speed of band rotation"
				description="Controls how fast the bands appear to move"
				input={
					<NumberInput
						id="rotation-speed"
						value={gasVisuals.rotationSpeed}
						onChange={(value) =>
							updateGasVisuals({ rotationSpeed: value })
						}
						min={0}
						max={5}
						step={0.1}
					/>
				}
			/>

			<InputWrapper
				id="band-blending"
				label="Band Blending"
				tooltip="Amount of blending between bands"
				description="Controls how sharply the bands are separated"
				input={
					<NumberInput
						id="band-blending"
						value={gasVisuals.bandBlending}
						onChange={(value) =>
							updateGasVisuals({ bandBlending: value })
						}
						min={0}
						max={1}
						step={0.1}
					/>
				}
			/>
		</div>
	);
}
