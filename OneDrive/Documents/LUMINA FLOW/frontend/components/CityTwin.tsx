'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useState, useMemo } from 'react';

interface Vehicle {
    id: number;
    x: number;
    z: number;
    speed: number;
    direction: number;
    conf?: number;
    type?: string;
}

function CameraController() {
    useFrame((state) => {
        const scrollY = window.scrollY;
        const maxScroll = window.innerHeight;
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

        const startPos = new THREE.Vector3(0, 120, 100);
        const endPos = new THREE.Vector3(0, 8, 25);

        state.camera.position.lerpVectors(startPos, endPos, progress * 0.8);
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

interface TrafficData {
    system_status: string;
    vehicles: Vehicle[];
}

function TrafficStream({ setSignalStatus }: { setSignalStatus: (status: string) => void }) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/traffic');
        ws.onopen = () => console.log('Connected to Traffic Stream');
        ws.onmessage = (event) => {
            try {
                const raw = JSON.parse(event.data);
                // Handle both old (array) and new (object) formats for robustness
                if (Array.isArray(raw)) {
                    setVehicles(raw);
                } else {
                    setVehicles(raw.vehicles || []);
                    if (raw.system_status) setSignalStatus(raw.system_status);
                }
            } catch (e) {
                console.error('Parse Error', e);
            }
        };
        return () => ws.close();
    }, [setSignalStatus]);

    // Optimization: Reuse geometries and materials where possible (React Three Fiber handles some auto-instancing but manual is better for thousands. 
    // For < 100 vehicles, simple components are fine but we strip expensive effects).

    return (
        <group>
            {vehicles.map((v, i) => (
                <group key={i} position={[v.x, 2, v.z]} rotation={[0, v.x > 0 ? 0 : Math.PI, 0]}>
                    {/* Simplified Vehicle Body - Standard Material is much cheaper than Physical */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[2.2, 1.2, 4.5]} />
                        <meshStandardMaterial
                            color="#111"
                            roughness={0.4}
                            metalness={0.6}
                        />
                    </mesh>

                    {/* Headlights - simplified to meshBasicMaterial */}
                    <mesh position={[0.8, 0, 2.3]}>
                        <boxGeometry args={[0.5, 0.2, 0.1]} />
                        <meshBasicMaterial color="#00F0FF" />
                    </mesh>
                    <mesh position={[-0.8, 0, 2.3]}>
                        <boxGeometry args={[0.5, 0.2, 0.1]} />
                        <meshBasicMaterial color="#00F0FF" />
                    </mesh>

                    {/* Taillights */}
                    <mesh position={[0.8, 0, -2.3]}>
                        <boxGeometry args={[0.5, 0.2, 0.1]} />
                        <meshBasicMaterial color="#FF0033" />
                    </mesh>
                    <mesh position={[-0.8, 0, -2.3]}>
                        <boxGeometry args={[0.5, 0.2, 0.1]} />
                        <meshBasicMaterial color="#FF0033" />
                    </mesh>

                    {/* AI Label - Kept but ensure font is standard if custom fails */}
                    {v.conf && (
                        <Text
                            position={[0, 3, 0]}
                            fontSize={0.6}
                            color="#00F0FF"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {`ID:${i}`}
                        </Text>
                    )}
                </group>
            ))}
        </group>
    );
}

function Buildings({ signalStatus }: { signalStatus: string }) {
    const buildings = useMemo(() => {
        return [...Array(40)].map((_, i) => ({
            position: [
                (i % 8 - 4) * 45 + (Math.random() - 0.5) * 15,
                (Math.random() * 30 + 10) / 2,
                (Math.floor(i / 8) - 4) * 45 + (Math.random() - 0.5) * 15
            ] as [number, number, number],
            height: Math.random() * 30 + 10,
            width: Math.random() * 5 + 8,
            depth: Math.random() * 5 + 8,
        }));
    }, []);

    // Tower color based on signal status
    const towerColor = signalStatus === 'RED' ? '#FF0033' : '#00F0FF';

    return (
        <group>
            {buildings.map((b, i) => (
                <mesh key={i} position={b.position} castShadow receiveShadow>
                    <boxGeometry args={[b.width, b.height, b.depth]} />
                    <meshStandardMaterial
                        color="#050505"
                        metalness={0.5}
                        roughness={0.2}
                    />
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(b.width, b.height, b.depth)]} />
                        <lineBasicMaterial color="#00F0FF" linewidth={1} opacity={0.05} transparent />
                    </lineSegments>
                </mesh>
            ))}
            {/* Central Monolith / Tower - Responsive to Signal */}
            <mesh position={[0, 40, 0]}>
                <boxGeometry args={[15, 80, 15]} />
                <meshStandardMaterial
                    color={signalStatus === 'RED' ? '#220000' : '#020202'}
                    metalness={0.8}
                    roughness={0.2}
                    emissive={towerColor}
                    emissiveIntensity={0.5}
                />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(15, 80, 15)]} />
                    <lineBasicMaterial color={towerColor} linewidth={2} opacity={0.8} transparent />
                </lineSegments>
            </mesh>
        </group>
    );
}

export default function CityTwin() {
    const [signalStatus, setSignalStatus] = useState<string>("GREEN");

    return (
        <div className="absolute inset-0 z-0 bg-lumina-black w-full h-full">
            {/* Performance Optimization: Clamp pixel ratio, disable expensive shadows if needed */}
            <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 100, 100], fov: 45 }}>
                <CameraController />
                <fog attach="fog" args={['#000000', 20, 200]} />
                <ambientLight intensity={0.5} />
                <pointLight
                    position={[50, 50, 50]}
                    intensity={1}
                    color={signalStatus === 'RED' ? '#FF0033' : '#00F0FF'}
                    distance={200}
                    decay={2}
                />

                {/* Reduced star count for performance */}
                <Stars radius={200} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

                {/* City Grid & Ground */}
                <gridHelper args={[400, 80, '#1a1a1a', '#0a0a0a']} position={[0, -0.1, 0]} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
                    <planeGeometry args={[500, 500]} />
                    <meshStandardMaterial color="#000000" roughness={0.5} metalness={0.5} />
                </mesh>

                <Buildings signalStatus={signalStatus} />
                <TrafficStream setSignalStatus={setSignalStatus} />

                {/* Post-processing removed for performance per user request */}
            </Canvas>
        </div>
    );
}
