import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Circle, Sphere, Stars } from '@react-three/drei';

function BlockNode({ position, scale = 1, isGenesis = false }) {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh position={position} ref={meshRef} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isGenesis ? "#36b37e" : "#5ba3e6"}
          wireframe={true}
          emissive={isGenesis ? "#36b37e" : "#5ba3e6"}
          emissiveIntensity={0.5}
        />
        <Sphere args={[0.3, 16, 16]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
      </mesh>
    </Float>
  );
}

function ChainLinks() {
  const points1 = [[-2, 0, 0], [0, 1.5, -1]];
  const points2 = [[0, 1.5, -1], [2, 0, 0]];
  const points3 = [[2, 0, 0], [4, -1.5, -1]];

  return (
    <group>
      <Line points={points1} color="#5ba3e6" lineWidth={2} dashed={true} dashScale={5} />
      <Line points={points2} color="#5ba3e6" lineWidth={2} dashed={true} dashScale={5} />
      <Line points={points3} color="#5ba3e6" lineWidth={2} dashed={true} dashScale={5} />
    </group>
  );
}

export function BlockchainScene() {
  return (
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [1, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Stars radius={10} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <group position={[-1, 0, 0]}>
          <BlockNode position={[-2, 0, 0]} isGenesis={true} scale={1.2} />
          <BlockNode position={[0, 1.5, -1]} scale={0.9} />
          <BlockNode position={[2, 0, 0]} scale={1} />
          <BlockNode position={[4, -1.5, -1]} scale={0.8} />
          <ChainLinks />
        </group>
      </Canvas>
    </div>
  );
}
