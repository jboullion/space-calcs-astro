/// <reference types="@react-three/fiber" />

import { MeshStandardMaterial } from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			meshStandardMaterial: ReactThreeFiber.Object3DNode<
				MeshStandardMaterial,
				typeof MeshStandardMaterial
			>;
		}
	}
}
