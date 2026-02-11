import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Box } from '@react-three/drei';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        
        {/* Temporary test object - I'll replace this with Splat later */}
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="hotpink" />
        </Box>
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} />
        
        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
