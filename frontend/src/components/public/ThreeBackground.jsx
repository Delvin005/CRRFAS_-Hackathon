/* eslint-disable react-hooks/purity */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Preload } from '@react-three/drei';
import * as THREE from 'three';

// An animated node network representing connected campuses and resources
const NetworkNodes = () => {
    const pointsRef = useRef();
    const linesRef = useRef();

    // Generate random nodes
    const particleCount = 100;
    const { positions, colors, connections } = useMemo(() => {
        const p = new Float32Array(particleCount * 3);
        const c = new Float32Array(particleCount * 3);
        const color = new THREE.Color('#0DF5E3'); // ZencampuZ Cyan

        for (let i = 0; i < particleCount; i++) {
            // Spread nodes in a sphere
            const r = 15;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(Math.random() * 2 - 1);

            p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            p[i * 3 + 2] = r * Math.cos(phi);

            c[i * 3] = color.r;
            c[i * 3 + 1] = color.g;
            c[i * 3 + 2] = color.b;
        }

        // Generate lines between close nodes
        const lines = [];
        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                const dx = p[i * 3] - p[j * 3];
                const dy = p[i * 3 + 1] - p[j * 3 + 1];
                const dz = p[i * 3 + 2] - p[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 4.5) {
                    lines.push(
                        p[i * 3], p[i * 3 + 1], p[i * 3 + 2],
                        p[j * 3], p[j * 3 + 1], p[j * 3 + 2]
                    );
                }
            }
        }

        return {
            positions: p,
            colors: c,
            connections: new Float32Array(lines)
        };
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        // Slow majestic rotation
        if (pointsRef.current && linesRef.current) {
            pointsRef.current.rotation.y = time * 0.05;
            pointsRef.current.rotation.x = time * 0.02;
            linesRef.current.rotation.y = time * 0.05;
            linesRef.current.rotation.x = time * 0.02;

            // Subtle pulse
            pointsRef.current.position.y = Math.sin(time * 0.5) * 0.5;
            linesRef.current.position.y = Math.sin(time * 0.5) * 0.5;
        }
    });

    return (
        <group>
            {/* Particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.15} vertexColors transparent opacity={0.8} />
            </points>

            {/* Connecting Lines */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={connections.length / 3} array={connections} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color="#0DF5E3" transparent opacity={0.15} />
            </lineSegments>
        </group>
    );
};

export default function ThreeBackground() {
    return (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-60">
            {/* Gradient overlay to blend with bg */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-crrfas-bg z-10"></div>

            <Canvas dpr={[1, 1.5]}>
                <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={45} />
                <fog attach="fog" args={['#0a0b10', 10, 30]} />
                <ambientLight intensity={0.5} />
                <NetworkNodes />
                <Preload all />
            </Canvas>
        </div>
    );
}
