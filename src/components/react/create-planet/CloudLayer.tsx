import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';

// Enhanced cloud shader material with layer type support
class CloudMaterial extends THREE.ShaderMaterial {
	constructor() {
		super({
			uniforms: {
				cloudSeed: { value: 1.0 },
				cloudScale: { value: 1.0 },
				cloudDensity: { value: 0.5 },
				cloudColor: { value: new THREE.Color(1, 1, 1) },
				time: { value: 0.0 },
				rotationSpeed: { value: 0.1 },
				layerType: { value: 0 }, // 0 for puffy, 1 for sharp/stratus
				baseHeight: { value: 1.0 },
				stratusDetail: { value: 2.0 },
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
			fragmentShader: `
                uniform float cloudSeed;
                uniform float cloudScale;
                uniform float cloudDensity;
                uniform vec3 cloudColor;
                uniform float time;
                uniform float rotationSpeed;
                uniform float layerType;
                uniform float baseHeight;
                uniform float stratusDetail;

                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;

                // [Previous noise functions remain the same]
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);

                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);

                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                vec3 rotateY(vec3 v, float angle) {
                    float s = sin(angle);
                    float c = cos(angle);
                    mat3 m = mat3(
                        c, 0, s,
                        0, 1, 0,
                        -s, 0, c
                    );
                    return m * v;
                }

                vec3 rotateZ(vec3 v, float angle) {
                    float s = sin(angle);
                    float c = cos(angle);
                    mat3 m = mat3(
                        c, -s, 0,
                        s, c, 0,
                        0, 0, 1
                    );
                    return m * v;
                }

                void main() {
                    float noise = 0.0;
                    vec3 coords = normalize(vPosition) * cloudScale;
                    
                    float t1 = time * rotationSpeed;
                    float t2 = time * rotationSpeed * 0.7;
                    float t3 = time * rotationSpeed * 0.3;
                    
                    vec3 rotatedCoords = rotateY(coords, t1);
                    
                    if (layerType < 0.5) {
                        // Puffy cumulus-style clouds
                        vec3 layer1 = rotateZ(rotatedCoords, t2 * 0.5);
                        noise += snoise(layer1 * 1.0) * 0.5;
                        noise += snoise(layer1 * 2.0) * 0.25;
                        
                        vec3 layer2 = rotateY(coords, -t2 * 0.3);
                        noise += snoise(layer2 * 3.0) * 0.125;
                        noise += snoise(layer2 * 4.0) * 0.0625;
                        
                        vec3 layer3 = rotateZ(coords, t3 * 0.2);
                        noise += snoise(layer3 * 0.5) * 0.35;
                    } else {
                        // Sharp/stratus-style clouds
                        vec3 baseCoords = rotatedCoords * stratusDetail;
                        
                        // Create more linear, stretched patterns
                        float baseNoise = snoise(baseCoords + vec3(t1 * 0.2, 0.0, 0.0));
                        float heightVar = snoise(baseCoords * 0.5 + vec3(0.0, t2 * 0.1, 0.0));
                        
                        // Combine with height variation for layered effect
                        noise = baseNoise * 0.6 + heightVar * 0.4;
                        
                        // Add sharp transitions
                        noise = smoothstep(0.2, 0.8, noise);
                        
                        // Layer detail
                        noise += snoise(baseCoords * 3.0) * 0.15;
                    }
                    
                    // Add variety based on seed
                    vec3 seedOffset = vec3(
                        sin(cloudSeed * 0.1),
                        cos(cloudSeed * 0.1),
                        sin(cloudSeed * 0.2)
                    );
                    noise += snoise(rotatedCoords * 2.0 + seedOffset) * 0.15;
                    
                    // Normalize and adjust contrast
                    noise = (noise + 1.0) * 0.5;
                    noise = smoothstep(1.0 - cloudDensity, 1.0, noise);
                    
                    // Apply band-based fade for stratus clouds using spherical coordinates
                    if (layerType > 0.5) {
                        // Calculate latitude from normalized position
                        float latitude = acos(normalize(vPosition).y);
                        // Create multiple bands with smooth transitions
                        float band = cos(latitude * 3.0 + time * 0.1);
                        float bandFade = smoothstep(-0.2, 0.2, band);
                        noise *= bandFade;
                    }
                    
                    gl_FragColor = vec4(cloudColor, noise * 0.5);
                }
            `,
			transparent: true,
			side: THREE.FrontSide,
		});
	}
}

extend({ CloudMaterial });

export interface CloudLayerProps {
	radius: number;
	effectiveSurfaceRadius?: number;
	cloudSeed: number;
	cloudScale?: number;
	cloudDensity?: number;
	cloudColor?: string;
	rotationSpeed?: number;
	layerType?: 'puffy' | 'stratus';
	baseHeight?: number;
	stratusDetail?: number;
}

export default function CloudLayer({
	radius,
	effectiveSurfaceRadius,
	cloudSeed = Math.random() * 100,
	cloudScale = 1.0,
	cloudDensity = 0.5,
	cloudColor = '#ffffff',
	rotationSpeed = 0.1,
	layerType = 'puffy',
	baseHeight = 1.0,
	stratusDetail = 2.0,
}: CloudLayerProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<CloudMaterial>(null);
	const [time, setTime] = useState(0);

	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
	const cloudRadius = effectiveSurfaceRadius || visualRadius * 1.04;
	const color = useMemo(() => new THREE.Color(cloudColor), [cloudColor]);

	useFrame((state) => {
		setTime(state.clock.getElapsedTime());
	});

	useFrame(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.cloudSeed.value = cloudSeed;
			materialRef.current.uniforms.cloudScale.value = cloudScale;
			materialRef.current.uniforms.cloudDensity.value = cloudDensity;

			if (layerType == 'puffy') {
				materialRef.current.uniforms.cloudDensity.value /= 2;
			}

			materialRef.current.uniforms.cloudColor.value = color;
			materialRef.current.uniforms.time.value = time;
			materialRef.current.uniforms.rotationSpeed.value =
				rotationSpeed / 10;
			materialRef.current.uniforms.layerType.value =
				layerType === 'stratus' ? 1.0 : 0.0;
			materialRef.current.uniforms.baseHeight.value = baseHeight;
			materialRef.current.uniforms.stratusDetail.value = stratusDetail;
		}
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[cloudRadius, 64, 64]} />
			{/* @ts-ignore */}
			<cloudMaterial ref={materialRef} />
		</mesh>
	);
}
