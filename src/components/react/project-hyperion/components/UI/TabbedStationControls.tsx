import React, { useState } from 'react';
import { useStationStore } from '../../hooks/useStationStore';
import { EndcapType } from '../../types/station';
import { CameraType } from '../../types/camera';

// Constants for min/max values
export const MIN_RADIUS = 500;
export const MAX_RADIUS = 10000;
export const MIN_LENGTH = 1000;
export const MAX_LENGTH = 10000;

const styles = {
	container: {
		position: 'absolute',
		top: '1rem',
		left: '1rem',
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		padding: '1rem',
		borderRadius: '8px',
		color: 'white',
		fontFamily: 'Arial, sans-serif',
		width: '420px',
		transition: 'transform 0.3s ease-in-out',
	},
	toggleButton: {
		position: 'absolute',
		top: '1rem',
		right: '1rem',
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		color: 'white',
		border: 'none',
		padding: '0.5rem 1rem',
		borderRadius: '4px',
		cursor: 'pointer',
		fontFamily: 'Arial, sans-serif',
		zIndex: 1000,
		transition: 'background-color 0.2s',
	},
	hiddenMenu: {
		transform: 'translateX(-120%)',
	},
	tabs: {
		display: 'flex',
		marginBottom: '1rem',
		borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
	},
	tab: {
		padding: '0.5rem 1rem',
		cursor: 'pointer',
		backgroundColor: 'transparent',
		border: 'none',
		color: 'rgba(255, 255, 255, 0.6)',
		borderBottom: '2px solid transparent',
		transition: 'all 0.2s',
	},
	activeTab: {
		color: 'white',
		borderBottom: '2px solid white',
	},
	controlGroup: {
		marginBottom: '1rem',
	},
	label: {
		display: 'block',
		marginBottom: '0.5rem',
	},
	input: {
		width: '100%',
	},
	select: {
		width: '100%',
		padding: '0.5rem',
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		border: 'none',
		borderRadius: '4px',
		color: '#000',
	},
	hint: {
		fontSize: '0.8rem',
		color: 'rgba(255, 255, 255, 0.6)',
		marginTop: '0.5rem',
	},
	colorInput: {
		width: '100%',
		height: '40px',
		padding: '0',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
	},
};

const StationTab = () => {
	const {
		radius,
		length,
		endcapType,
		stationColor,
		endcapColor,
		showWireframe,
		setRadius,
		setLength,
		setEndcapType,
		setStationColor,
		setEndcapColor,
		setShowWireframe,
	} = useStationStore();

	return (
		<div>
			<div style={styles.controlGroup}>
				<label style={styles.label}>Radius: {radius}m</label>
				<input
					type="range"
					min={MIN_RADIUS}
					max={MAX_RADIUS}
					step="100"
					value={radius}
					onChange={(e) => setRadius(parseInt(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Length: {length}m</label>
				<input
					type="range"
					min={MIN_LENGTH}
					max={MAX_LENGTH}
					step="100"
					value={length}
					onChange={(e) => setLength(parseInt(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Endcap Type</label>
				<select
					value={endcapType}
					onChange={(e) =>
						setEndcapType(e.target.value as EndcapType)
					}
					style={styles.select}
				>
					<option value={EndcapType.None}>None</option>
					<option value={EndcapType.Flat}>Flat</option>
					<option value={EndcapType.Spherical}>Convex</option>
				</select>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Station Color</label>
				<input
					type="color"
					value={stationColor}
					onChange={(e) => setStationColor(e.target.value)}
					style={styles.colorInput}
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Endcap Color</label>
				<input
					type="color"
					value={endcapColor}
					onChange={(e) => setEndcapColor(e.target.value)}
					style={styles.colorInput}
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Show Wireframe</label>
				<input
					type="checkbox"
					checked={showWireframe}
					onChange={() => setShowWireframe(!showWireframe)}
				/>
			</div>
		</div>
	);
};

const EnvironmentTab = () => {
	const {
		hillsCount,
		hillHeight,
		hillColor,
		hillRatio,
		radius,
		setHillsCount,
		setHillHeight,
		setHillRatio,
		setHillColor,
	} = useStationStore();

	return (
		<div>
			<div style={styles.controlGroup}>
				<label style={styles.label}>
					Number of Hills: {hillsCount}
				</label>
				<input
					type="range"
					min={0}
					max={12}
					step="1"
					value={hillsCount}
					onChange={(e) => setHillsCount(parseInt(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Hill Height: {hillHeight}m</label>
				<input
					type="range"
					min={10}
					max={radius / 2}
					step="10"
					value={hillHeight}
					onChange={(e) => setHillHeight(parseInt(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Hill Ratio: {hillRatio}</label>
				<input
					type="range"
					min={0.1}
					max={1}
					step="0.01"
					value={hillRatio}
					onChange={(e) => setHillRatio(parseFloat(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Hill Color</label>
				<input
					type="color"
					value={hillColor}
					onChange={(e) => setHillColor(e.target.value)}
					style={styles.colorInput}
				/>
			</div>
		</div>
	);
};

const LightingTab = () => {
	const {
		lightIntensity,
		ambientLightIntensity,
		lightPosition,
		lightColor,
		ambientLightColor,
		length,
		setLightIntensity,
		setLightPosition,
		setLightColor,
		setAmbientLightIntensity,
		setAmbientLightColor,
	} = useStationStore();

	return (
		<div>
			<div style={styles.controlGroup}>
				<label style={styles.label}>
					Light Intensity: {lightIntensity.toFixed(1)}
				</label>
				<input
					type="range"
					min={0.1}
					max={20}
					step="0.1"
					value={lightIntensity}
					onChange={(e) =>
						setLightIntensity(parseFloat(e.target.value))
					}
					className="form-range"
				/>
			</div>

			{/* <div style={styles.controlGroup}>
        <label style={styles.label}>
          Light Falloff: {lightFalloff.toFixed(1)}
        </label>
        <input
          type="range"
          min={0.5}
          max={3}
          step="0.05"
          value={lightFalloff}
          onChange={(e) => setLightFalloff(parseFloat(e.target.value))}
          style={styles.input}
        />
      </div> */}

			<div style={styles.controlGroup}>
				<label style={styles.label}>
					Light Position: {lightPosition}m
				</label>
				<input
					type="range"
					min={-length / 2}
					max={length / 2}
					step="10"
					value={lightPosition}
					onChange={(e) => setLightPosition(parseInt(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Light Color</label>
				<input
					type="color"
					value={lightColor}
					onChange={(e) => setLightColor(e.target.value)}
					style={styles.colorInput}
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>
					Ambient Light Intensity: {ambientLightIntensity.toFixed(1)}
				</label>
				<input
					type="range"
					min={0}
					max={8}
					step="0.1"
					value={ambientLightIntensity}
					onChange={(e) =>
						setAmbientLightIntensity(parseFloat(e.target.value))
					}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Ambient Light Color</label>
				<input
					type="color"
					value={ambientLightColor}
					onChange={(e) => setAmbientLightColor(e.target.value)}
					style={styles.colorInput}
				/>
			</div>

			{/* <div style={styles.controlGroup}>
        <label style={styles.label}>Environment Map</label>
        <select
          value={environmentMap.preset}
          onChange={(e) =>
            setEnvironmentMap(
              EnvironmentMaps.find(
                (map) => map.preset === e.target.value
              ) as EnvironmentMap
            )
          }
          style={styles.select}
        >
          {EnvironmentMaps.map((map) => (
            <option value={map.preset}>{map.name}</option>
          ))}
        </select>
        <div style={styles.hint}>
          Different maps create different moods and lighting conditions.
        </div>
      </div> */}
		</div>
	);
};

const CameraTab = () => {
	const { cameraType, cameraFOV, setCameraType, setCameraFOV } =
		useStationStore();

	return (
		<div>
			<div style={styles.controlGroup}>
				<label style={styles.label}>
					Camera FOV: {cameraFOV.toFixed(1)}
				</label>
				<input
					type="range"
					min={30}
					max={120}
					step="1"
					value={cameraFOV}
					onChange={(e) => setCameraFOV(parseFloat(e.target.value))}
					className="form-range"
				/>
			</div>

			<div style={styles.controlGroup}>
				<label style={styles.label}>Camera Type</label>
				<select
					value={cameraType}
					onChange={(e) =>
						setCameraType(e.target.value as CameraType)
					}
					style={styles.select}
				>
					<option value={CameraType.ThirdPerson}>Third Person</option>
					<option value={CameraType.Orbit}>Orbit</option>
					<option value={CameraType.FreeMove}>Free Move</option>
				</select>
			</div>
		</div>
	);
};

export function TabbedStationControls() {
	const [activeTab, setActiveTab] = useState('station');
	const [showMenu, setShowMenu] = useState(true);

	const getTabStyle = (tabName: string) => ({
		...styles.tab,
		...(activeTab === tabName ? styles.activeTab : {}),
	});

	const containerStyle = {
		...(styles.container as React.CSSProperties),
		...(showMenu ? {} : (styles.hiddenMenu as React.CSSProperties)),
	};

	const toggleButtonStyle = {
		...(styles.toggleButton as React.CSSProperties),
		'&:hover': {
			backgroundColor: 'rgba(0, 0, 0, 0.8)',
		},
	};

	return (
		<>
			<button
				style={toggleButtonStyle}
				onClick={() => setShowMenu(!showMenu)}
			>
				{showMenu ? 'Hide Menu' : 'Show Menu'}
			</button>
			<div style={containerStyle}>
				<div style={styles.tabs}>
					<button
						style={getTabStyle('station')}
						onClick={() => setActiveTab('station')}
					>
						Station
					</button>
					<button
						style={getTabStyle('environment')}
						onClick={() => setActiveTab('environment')}
					>
						Environment
					</button>
					<button
						style={getTabStyle('lighting')}
						onClick={() => setActiveTab('lighting')}
					>
						Lighting
					</button>
					<button
						style={getTabStyle('camera')}
						onClick={() => setActiveTab('camera')}
					>
						Camera
					</button>
				</div>

				{activeTab === 'station' && <StationTab />}
				{activeTab === 'environment' && <EnvironmentTab />}
				{activeTab === 'lighting' && <LightingTab />}
				{activeTab === 'camera' && <CameraTab />}
			</div>
		</>
	);
}

export default TabbedStationControls;
