import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// ── Spinning ring ─────────────────────────────────────────────────────────────
const Ring = ({ radius, tube, speed, color, opacity, axis = 'z' }) => {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (axis === 'z') ref.current.rotation.z += delta * speed;
    if (axis === 'x') ref.current.rotation.x += delta * speed;
    if (axis === 'y') ref.current.rotation.y += delta * speed;
  });
  return (
    <Torus ref={ref} args={[radius, tube, 16, 80]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={opacity}
        wireframe={false}
      />
    </Torus>
  );
};

const Core = ({ isListening }) => {
  const ref = useRef();
  const color = isListening ? '#00ff88' : '#00d4ff';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t   = clock.getElapsedTime();
    const spd = isListening ? 4 : 2;
    const amp = isListening ? 0.12 : 0.06;
    const sc  = 1 + Math.sin(t * spd) * amp;
    ref.current.scale.setScalar(sc);
    ref.current.material.emissiveIntensity = 0.6 + Math.sin(t * spd) * 0.4;
  });

  return (
    <Sphere ref={ref} args={[0.32, 32, 32]}>
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        distort={isListening ? 0.35 : 0.15}
        speed={isListening ? 4 : 1.5}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
};

// ── Orbiting particles ────────────────────────────────────────────────────────
const Particles = ({ count = 60, isListening }) => {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 0.75 + Math.random() * 0.5;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * (isListening ? 0.8 : 0.3);
    ref.current.rotation.x = clock.getElapsedTime() * (isListening ? 0.4 : 0.15);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={isListening ? '#00ff88' : '#00d4ff'}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
};

// ── Scene ─────────────────────────────────────────────────────────────────────
const Scene = ({ isListening }) => {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 2, 2]} intensity={1} color="#00d4ff" />
      <pointLight position={[-2, -2, -2]} intensity={0.5} color="#00ff88" />

      <group ref={groupRef}>
        {/* Outer rings */}
        <Ring radius={0.9} tube={0.008} speed={0.8}  color="#00d4ff" opacity={0.6} axis="z" />
        <Ring radius={0.9} tube={0.008} speed={-0.5} color="#00d4ff" opacity={0.3} axis="x" />
        <Ring radius={0.75} tube={0.01} speed={1.2}  color="#0099cc" opacity={0.5} axis="y" />
        <Ring radius={0.6} tube={0.012} speed={-1.5} color="#00ff88" opacity={isListening ? 0.8 : 0.2} axis="z" />

        {/* Particles */}
        <Particles count={80} isListening={isListening} />

        {/* Core */}
        <Core isListening={isListening} />
      </group>
    </>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
const ArcReactor3D = ({ isListening = false, size = 160 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        cursor: 'grab',
        userSelect: 'none',
        filter: `drop-shadow(0 0 ${isListening ? 20 : 12}px ${isListening ? 'rgba(0,255,136,0.5)' : 'rgba(0,212,255,0.4)'})`,
        transition: 'filter 0.4s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene isListening={isListening} />
      </Canvas>
    </div>
  );
};

export default ArcReactor3D;
