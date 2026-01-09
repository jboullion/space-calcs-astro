import React, { useState, useCallback, useEffect } from 'react';

const FullscreenButton = () => {
	const [isFullscreen, setIsFullscreen] = useState(false);

	const toggleFullscreen = useCallback(() => {
		const canvas = document.querySelector('.app');

		if (!document.fullscreenElement) {
			if (canvas?.requestFullscreen) {
				canvas.requestFullscreen();
			} else if ((canvas as any).webkitRequestFullscreen) {
				(canvas as any).webkitRequestFullscreen();
			} else if ((canvas as any).msRequestFullscreen) {
				(canvas as any).msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if ((document as any).webkitExitFullscreen) {
				(document as any).webkitExitFullscreen();
			} else if ((document as any).msExitFullscreen) {
				(document as any).msExitFullscreen();
			}
		}
	}, []);

	// Update fullscreen state
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener(
			'webkitfullscreenchange',
			handleFullscreenChange,
		);
		document.addEventListener(
			'mozfullscreenchange',
			handleFullscreenChange,
		);
		document.addEventListener('MSFullscreenChange', handleFullscreenChange);

		return () => {
			document.removeEventListener(
				'fullscreenchange',
				handleFullscreenChange,
			);
			document.removeEventListener(
				'webkitfullscreenchange',
				handleFullscreenChange,
			);
			document.removeEventListener(
				'mozfullscreenchange',
				handleFullscreenChange,
			);
			document.removeEventListener(
				'MSFullscreenChange',
				handleFullscreenChange,
			);
		};
	}, []);

	return (
		<button
			onClick={toggleFullscreen}
			className="btn btn-dark position-absolute bottom-0 end-0 m-3"
			style={{
				backgroundColor: 'rgba(0, 0, 0, 0.7)',
				zIndex: 1000,
			}}
		>
			<i
				className={`fas ${
					isFullscreen ? 'fa-compress' : 'fa-expand'
				} me-2`}
			></i>
			{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
		</button>
	);
};

export default FullscreenButton;
