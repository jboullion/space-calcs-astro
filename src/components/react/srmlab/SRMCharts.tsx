// Interactive charts using Chart.js with Bootstrap tabs
import { useEffect, useRef, useState } from 'react';
import { useSRM } from './SRMContext';
import {
	Chart,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	LineController,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';

// Register Chart.js components
Chart.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	LineController,
	Title,
	Tooltip,
	Legend,
	Filler
);

export default function SRMCharts() {
	const { results, isSimulating } = useSRM();
	const thrustChartRef = useRef<HTMLCanvasElement>(null);
	const pressureChartRef = useRef<HTMLCanvasElement>(null);
	const knChartRef = useRef<HTMLCanvasElement>(null);
	const burnAreaChartRef = useRef<HTMLCanvasElement>(null);
	
	const [thrustChart, setThrustChart] = useState<Chart | null>(null);
	const [pressureChart, setPressureChart] = useState<Chart | null>(null);
	const [knChart, setKnChart] = useState<Chart | null>(null);
	const [burnAreaChart, setBurnAreaChart] = useState<Chart | null>(null);
	const [activeTab, setActiveTab] = useState('thrust');

	useEffect(() => {
		if (!results) return;

		// Common chart options
		const commonOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
			},
			scales: {
				x: {
					grid: {
						color: '#444',
					},
					ticks: {
						color: '#aaa',
					},
				},
				y: {
					grid: {
						color: '#444',
					},
					ticks: {
						color: '#aaa',
					},
				},
			},
		};

		// Thrust Chart
		if (thrustChartRef.current) {
			if (thrustChart) thrustChart.destroy();
			const ctx = thrustChartRef.current.getContext('2d');
			if (ctx) {
				const newChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: results.t.map((t) => t.toFixed(3)),
						datasets: [
							{
								label: 'Thrust (N)',
								data: results.F,
								borderColor: '#0d6efd',
								backgroundColor: 'rgba(13, 110, 253, 0.1)',
								borderWidth: 2,
								pointRadius: 0,
								fill: true,
							},
						],
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: {
								display: true,
								text: 'Thrust vs Time',
								color: '#fff',
								font: { size: 16 },
							},
						},
						scales: {
							...commonOptions.scales,
							x: {
								...commonOptions.scales.x,
								title: {
									display: true,
									text: 'Time (s)',
									color: '#aaa',
								},
							},
							y: {
								...commonOptions.scales.y,
								title: {
									display: true,
									text: 'Thrust (N)',
									color: '#aaa',
								},
							},
						},
					},
				});
				setThrustChart(newChart);
			}
		}

		// Pressure Chart
		if (pressureChartRef.current) {
			if (pressureChart) pressureChart.destroy();
			const ctx = pressureChartRef.current.getContext('2d');
			if (ctx) {
				const newChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: results.t.map((t) => t.toFixed(3)),
						datasets: [
							{
								label: 'Pressure (MPa)',
								data: results.Pc.map((p) => p / 1e6),
								borderColor: '#dc3545',
								backgroundColor: 'rgba(220, 53, 69, 0.1)',
								borderWidth: 2,
								pointRadius: 0,
								fill: true,
							},
						],
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: {
								display: true,
								text: 'Chamber Pressure vs Time',
								color: '#fff',
								font: { size: 16 },
							},
						},
						scales: {
							...commonOptions.scales,
							x: {
								...commonOptions.scales.x,
								title: {
									display: true,
									text: 'Time (s)',
									color: '#aaa',
								},
							},
							y: {
								...commonOptions.scales.y,
								title: {
									display: true,
									text: 'Pressure (MPa)',
									color: '#aaa',
								},
							},
						},
					},
				});
				setPressureChart(newChart);
			}
		}

		// Kn Chart
		if (knChartRef.current) {
			if (knChart) knChart.destroy();
			const ctx = knChartRef.current.getContext('2d');
			if (ctx) {
				const newChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: results.t.map((t) => t.toFixed(3)),
						datasets: [
							{
								label: 'Kn',
								data: results.Kn,
								borderColor: '#ffc107',
								backgroundColor: 'rgba(255, 193, 7, 0.1)',
								borderWidth: 2,
								pointRadius: 0,
								fill: true,
							},
						],
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: {
								display: true,
								text: 'Kn Ratio vs Time',
								color: '#fff',
								font: { size: 16 },
							},
						},
						scales: {
							...commonOptions.scales,
							x: {
								...commonOptions.scales.x,
								title: {
									display: true,
									text: 'Time (s)',
									color: '#aaa',
								},
							},
							y: {
								...commonOptions.scales.y,
								title: {
									display: true,
									text: 'Kn (Ab/At)',
									color: '#aaa',
								},
							},
						},
					},
				});
				setKnChart(newChart);
			}
		}

		// Burn Area Chart
		if (burnAreaChartRef.current) {
			if (burnAreaChart) burnAreaChart.destroy();
			const ctx = burnAreaChartRef.current.getContext('2d');
			if (ctx) {
				const newChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: results.t.map((t) => t.toFixed(3)),
						datasets: [
							{
								label: 'Burn Area (cm²)',
								data: results.Ab.map((a) => a * 1e4),
								borderColor: '#20c997',
								backgroundColor: 'rgba(32, 201, 151, 0.1)',
								borderWidth: 2,
								pointRadius: 0,
								fill: true,
							},
						],
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: {
								display: true,
								text: 'Burn Area vs Time',
								color: '#fff',
								font: { size: 16 },
							},
						},
						scales: {
							...commonOptions.scales,
							x: {
								...commonOptions.scales.x,
								title: {
									display: true,
									text: 'Time (s)',
									color: '#aaa',
								},
							},
							y: {
								...commonOptions.scales.y,
								title: {
									display: true,
									text: 'Burn Area (cm²)',
									color: '#aaa',
								},
							},
						},
					},
				});
				setBurnAreaChart(newChart);
			}
		}

		// Cleanup
		return () => {
			thrustChart?.destroy();
			pressureChart?.destroy();
			knChart?.destroy();
			burnAreaChart?.destroy();
		};
	}, [results]);

	if (isSimulating) {
		return (
			<div className="p-5 text-center">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
				<p className="text-muted mt-3">Generating charts...</p>
			</div>
		);
	}

	if (!results) {
		return null;
	}

	return (
		<div className="mb-3">
			<ul className="nav nav-tabs mb-3" role="tablist">
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'thrust' ? 'active' : ''}`}
						onClick={() => setActiveTab('thrust')}
						type="button"
					>
						<i className="fas fa-rocket me-1"></i>
						Thrust
					</button>
				</li>
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'pressure' ? 'active' : ''}`}
						onClick={() => setActiveTab('pressure')}
						type="button"
					>
						<i className="fas fa-gauge me-1"></i>
						Pressure
					</button>
				</li>
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'kn' ? 'active' : ''}`}
						onClick={() => setActiveTab('kn')}
						type="button"
					>
						<i className="fas fa-chart-line me-1"></i>
						Kn Ratio
					</button>
				</li>
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'burnArea' ? 'active' : ''}`}
						onClick={() => setActiveTab('burnArea')}
						type="button"
					>
						<i className="fas fa-fire me-1"></i>
						Burn Area
					</button>
				</li>
			</ul>

			<div className="tab-content">
				<div className={`tab-pane fade ${activeTab === 'thrust' ? 'show active' : ''}`}>
					<div style={{ height: '400px' }}>
						<canvas ref={thrustChartRef}></canvas>
					</div>
				</div>
				<div className={`tab-pane fade ${activeTab === 'pressure' ? 'show active' : ''}`}>
					<div style={{ height: '400px' }}>
						<canvas ref={pressureChartRef}></canvas>
					</div>
				</div>
				<div className={`tab-pane fade ${activeTab === 'kn' ? 'show active' : ''}`}>
					<div style={{ height: '400px' }}>
						<canvas ref={knChartRef}></canvas>
					</div>
				</div>
				<div className={`tab-pane fade ${activeTab === 'burnArea' ? 'show active' : ''}`}>
					<div style={{ height: '400px' }}>
						<canvas ref={burnAreaChartRef}></canvas>
					</div>
				</div>
			</div>
		</div>
	);
}
