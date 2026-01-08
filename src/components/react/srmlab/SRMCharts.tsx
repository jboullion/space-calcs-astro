// Interactive thrust and pressure curves using Plotly
import { useEffect, useRef, useState } from 'react';
import { useSRM } from './SRMContext';

export default function SRMCharts() {
	const { results, isSimulating } = useSRM();
	const thrustChartRef = useRef<HTMLDivElement>(null);
	const pressureChartRef = useRef<HTMLDivElement>(null);
	const knChartRef = useRef<HTMLDivElement>(null);
	const burnAreaChartRef = useRef<HTMLDivElement>(null);
	const [Plotly, setPlotly] = useState<any>(null);

	// Load Plotly only on client side
	useEffect(() => {
		import('plotly.js-dist-min').then((module) => {
			setPlotly(module.default);
		});
	}, []);

	useEffect(() => {
		if (!Plotly || !results || !thrustChartRef.current || !pressureChartRef.current ||
			!knChartRef.current || !burnAreaChartRef.current) {
			return;
		}

		// Thrust curve
		const thrustTrace = {
			x: results.t,
			y: results.F,
			type: 'scatter',
			mode: 'lines',
			name: 'Thrust',
			line: { color: '#0d6efd', width: 2 },
		};

		const thrustLayout = {
			title: 'Thrust vs Time',
			xaxis: { title: 'Time (s)', gridcolor: '#444' },
			yaxis: { title: 'Thrust (N)', gridcolor: '#444' },
			plot_bgcolor: '#1a1a1a',
			paper_bgcolor: '#212529',
			font: { color: '#fff' },
			margin: { l: 60, r: 40, t: 50, b: 50 },
		};

		Plotly.newPlot(
			thrustChartRef.current,
			[thrustTrace],
			thrustLayout,
			{ responsive: true, displayModeBar: false },
		);

		// Pressure curve
		const pressureTrace = {
			x: results.t,
			y: results.Pc.map((p: number) => p / 1e6), // Convert to MPa
			type: 'scatter',
			mode: 'lines',
			name: 'Pressure',
			line: { color: '#dc3545', width: 2 },
		};

		const pressureLayout = {
			title: 'Chamber Pressure vs Time',
			xaxis: { title: 'Time (s)', gridcolor: '#444' },
			yaxis: { title: 'Pressure (MPa)', gridcolor: '#444' },
			plot_bgcolor: '#1a1a1a',
			paper_bgcolor: '#212529',
			font: { color: '#fff' },
			margin: { l: 60, r: 40, t: 50, b: 50 },
		};

		Plotly.newPlot(
			pressureChartRef.current,
			[pressureTrace],
			pressureLayout,
			{ responsive: true, displayModeBar: false },
		);

		// Kn ratio curve
		const knTrace = {
			x: results.t,
			y: results.Kn,
			type: 'scatter',
			mode: 'lines',
			name: 'Kn',
			line: { color: '#ffc107', width: 2 },
		};

		const knLayout = {
			title: 'Kn Ratio vs Time',
			xaxis: { title: 'Time (s)', gridcolor: '#444' },
			yaxis: { title: 'Kn (Ab/At)', gridcolor: '#444' },
			plot_bgcolor: '#1a1a1a',
			paper_bgcolor: '#212529',
			font: { color: '#fff' },
			margin: { l: 60, r: 40, t: 50, b: 50 },
		};

		Plotly.newPlot(
			knChartRef.current,
			[knTrace],
			knLayout,
			{ responsive: true, displayModeBar: false },
		);

		// Burn area curve
		const burnAreaTrace = {
			x: results.t,
			y: results.Ab.map((a: number) => a * 1e4), // Convert to cm²
			type: 'scatter',
			mode: 'lines',
			name: 'Burn Area',
			line: { color: '#20c997', width: 2 },
		};

		const burnAreaLayout = {
			title: 'Burn Area vs Time',
			xaxis: { title: 'Time (s)', gridcolor: '#444' },
			yaxis: { title: 'Burn Area (cm²)', gridcolor: '#444' },
			plot_bgcolor: '#1a1a1a',
			paper_bgcolor: '#212529',
			font: { color: '#fff' },
			margin: { l: 60, r: 40, t: 50, b: 50 },
		};

		Plotly.newPlot(
			burnAreaChartRef.current,
			[burnAreaTrace],
			burnAreaLayout,
			{ responsive: true, displayModeBar: false },
		);

		// Cleanup
		return () => {
			if (thrustChartRef.current) {
				Plotly.purge(thrustChartRef.current);
			}
			if (pressureChartRef.current) {
				Plotly.purge(pressureChartRef.current);
			}
			if (knChartRef.current) {
				Plotly.purge(knChartRef.current);
			}
			if (burnAreaChartRef.current) {
				Plotly.purge(burnAreaChartRef.current);
			}
		};
	}, [Plotly, results]);

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
			<div ref={thrustChartRef} className="mb-4" />
			<div ref={pressureChartRef} className="mb-4" />
			<div ref={knChartRef} className="mb-4" />
			<div ref={burnAreaChartRef} className="mb-4" />
		</div>
	);
}
