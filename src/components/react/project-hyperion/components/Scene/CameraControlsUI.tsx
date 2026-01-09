import { Leva } from 'leva';
import { CameraControls } from './CameraControls';
import type { CameraControlsUIProps } from '../../types/camera';

export function CameraControlsUI({ initialSettings }: CameraControlsUIProps) {
	// Get settings from Leva controls
	CameraControls({ initialSettings });

	return (
		<div
			style={{ position: 'absolute', top: 0, right: 0, zIndex: 1000 }}
			onMouseDown={(e) => e.stopPropagation()}
			onMouseMove={(e) => e.stopPropagation()}
		>
			<Leva fill flat titleBar={false} />
		</div>
	);
}
