import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import type { AtmosphereProperties } from './types';

const fragmentShader = `
uniform float time;
uniform vec3 baseColor;
uniform float bandCount;
uniform float turbulence;
uniform float rotationSpeeds[8];
uniform vec3 bandColors[8];
uniform float bandEdgeTurbulence;
uniform float vortexStrength;
uniform float bandBlending;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// Helper functions remain the same
vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float swirlNoise(vec2 uv, float rotation) {
    float noise1 = noise(rotate(uv, rotation));
    float noise2 = noise(rotate(uv * 2.0, -rotation * 0.5));
    float noise3 = noise(rotate(uv * 4.0, rotation * 0.25));
    
    return noise1 * 0.5 + noise2 * 0.25 + noise3 * 0.25;
}

// New function for fine texture detail
float microDetail(vec2 uv, float seed) {
    float fine1 = noise(uv * 50.0 + seed);
    float fine2 = noise(uv * 100.0 - seed);
    float fine3 = noise(uv * 200.0 + seed * 2.0);
    
    return fine1 * 0.5 + fine2 * 0.3 + fine3 * 0.2;
}

// Color variation function
vec3 colorVariation(vec3 baseColor, float variation) {
    // Convert to HSL-like space for better control
    float maxC = max(max(baseColor.r, baseColor.g), baseColor.b);
    float minC = min(min(baseColor.r, baseColor.g), baseColor.b);
    float l = (maxC + minC) / 2.0;
    
    // Apply variation while preserving color relationships
    vec3 colorShift = baseColor + (variation - 0.5) * 0.1;
    return mix(baseColor, colorShift, 0.5);
}

void main() {
    float latitude = acos(normalize(vPosition).y);
    float normalizedLat = latitude / 3.14159;
    
    float bandIndexRaw = normalizedLat * bandCount;
    float bandIndex = floor(bandIndexRaw);
    int bandI = int(mod(bandIndex, 8.0));
    
    float bandFraction = fract(bandIndexRaw);
    
    // Basic rotation for the band
    float rotation = time * rotationSpeeds[bandI] * 0.1;
    vec2 rotatedUv = vec2(vUv.x + rotation, vUv.y);
    
    // Latitude-dependent turbulence
    float latitudeFactor = sin(latitude * 2.0);
    float turbulenceStrength = mix(0.3, 1.0, latitudeFactor);
    
    // Multiple layers of swirling turbulence
    vec2 turbUv = rotatedUv * 10.0;
    float swirl1 = swirlNoise(turbUv, rotation + bandIndex);
    float swirl2 = swirlNoise(turbUv * 2.0, -rotation * 0.5 + bandIndex * 0.2);
    float localTurbulence = mix(swirl1, swirl2, 0.5) * turbulenceStrength;
    
    // Fine texture detail
    float microTexture = microDetail(rotatedUv, float(bandI) + time * 0.1);
    
    // Edge and vortex patterns
    float edgeNoise = noise(rotatedUv * 20.0 + vec2(time * 0.1, 0.0));
    float edgePattern = smoothstep(0.4, 0.6, abs(bandFraction - 0.5) * 2.0);
    edgePattern = mix(edgePattern, edgePattern * (1.0 + edgeNoise * bandEdgeTurbulence), 0.7);
    
    float vortexNoise = noise(rotatedUv * 15.0 + vec2(time * 0.05, bandIndex));
    float vortexPattern = smoothstep(0.3, 0.7, vortexNoise) * vortexStrength;
    vortexPattern *= (1.0 - abs(bandFraction - 0.5) * 2.0);
    
    // Enhanced color blending with micro variations
    vec3 bandColor = bandColors[bandI];
    bandColor = colorVariation(bandColor, microTexture);
    
    vec3 color = bandColor;
    if(bandI < 7) {
        float blend = smoothstep(0.3, 0.7, bandFraction);
        blend = mix(blend, blend * (1.0 + edgePattern), bandBlending);
        
        vec3 nextColor = colorVariation(bandColors[bandI + 1], microTexture);
        color = mix(color, nextColor, blend);
    }
    
    // Apply all texture and turbulence effects
    vec3 turbColor = mix(color, color * (1.0 + edgePattern * 0.3), 0.5);
    turbColor = mix(turbColor, turbColor * (0.8 + localTurbulence * 0.4), turbulenceStrength);
    turbColor = mix(turbColor, turbColor * (0.95 + microTexture * 0.1), 0.7);
    color = mix(turbColor, color * (1.0 + vortexPattern * 0.2), 0.6);
    
    // Enhanced lighting with depth
    float lightIntensity = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
    float depthFactor = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    lightIntensity = mix(lightIntensity, 
                        lightIntensity * (1.0 + edgePattern * 0.2 + localTurbulence * 0.1), 
                        0.4);
    
    // Add subtle depth darkening
    color *= 0.6 + lightIntensity * 0.4;
    color = mix(color, color * 0.8, depthFactor * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
}`;

// Custom shader material for gas giant bands
class GasGiantMaterial extends THREE.ShaderMaterial {
	constructor() {
		super({
			uniforms: {
				time: { value: 0 },
				baseColor: { value: new THREE.Color() },
				bandCount: { value: 8.0 },
				turbulence: { value: 0.5 },
				rotationSpeeds: {
					value: [1.0, 1.2, 0.8, 1.1, 0.9, 1.3, 0.7, 1.0],
				},
				bandColors: {
					value: [
						new THREE.Color('#C88B3A'),
						new THREE.Color('#B87A30'),
						new THREE.Color('#D89C4A'),
						new THREE.Color('#A86920'),
						new THREE.Color('#C88B3A'),
						new THREE.Color('#B87A30'),
						new THREE.Color('#D89C4A'),
						new THREE.Color('#A86920'),
					],
				},
				bandEdgeTurbulence: { value: 0.5 }, // Controls amount of turbulence at band edges
				vortexStrength: { value: 0.3 }, // Controls strength of vortex formations
				bandBlending: { value: 0.4 }, // Controls how much bands blend together
			},
			vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
			fragmentShader: fragmentShader,
		});
	}
}

// Register the custom material
extend({ GasGiantMaterial });

interface GasGiantAtmosphereProps {
	radius: number;
	atmosphere: AtmosphereProperties;
}

export default function GasGiantAtmosphere({
	radius,
	atmosphere,
}: GasGiantAtmosphereProps) {
	const materialRef = useRef<GasGiantMaterial>(null);
	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);

	// Create colors based on atmosphere composition and temperature
	const colors = useMemo(() => {
		const baseColor = new THREE.Color(atmosphere.customColor || '#C88B3A');
		const temp = atmosphere.temperature;

		// Adjust hue and saturation based on temperature and composition
		const hsl: THREE.HSL = { h: 0, s: 0, l: 0 };
		baseColor.getHSL(hsl);

		// Create variations for bands
		return Array.from({ length: 8 }, (_, i) => {
			const newColor = new THREE.Color();
			const offset = (i % 2) * 0.1 - 0.05;
			newColor.setHSL(
				hsl.h + offset,
				hsl.s * (0.8 + Math.random() * 0.4),
				hsl.l * (0.9 + Math.random() * 0.2),
			);
			return newColor;
		});
	}, [atmosphere.customColor, atmosphere.temperature]);

	// Animation loop
	useFrame((state) => {
		if (materialRef.current) {
			materialRef.current.uniforms.time.value =
				state.clock.getElapsedTime();
			materialRef.current.uniforms.bandColors.value = colors;
			materialRef.current.uniforms.turbulence.value = 0.5;
		}
	});

	return (
		<>
			{/* Main gas layer */}
			<mesh>
				<sphereGeometry args={[visualRadius, 64, 64]} />
				{/* @ts-ignore */}
				<gasGiantMaterial ref={materialRef} />
			</mesh>

			{/* Outer atmosphere glow */}
			<mesh>
				<sphereGeometry args={[visualRadius * 1.02, 64, 64]} />
				<meshPhysicalMaterial
					color={atmosphere.customColor || '#C88B3A'}
					transparent={true}
					opacity={0.3}
					depthWrite={false}
					side={THREE.BackSide}
					blending={THREE.AdditiveBlending}
				/>
			</mesh>
		</>
	);
}
