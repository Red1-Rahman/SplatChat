import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { Splat } from '@react-three/drei';
import { useChat } from '@ai-sdk/react';
import { Vector3 } from 'three';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ 
        color: 'white', 
        fontSize: '24px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        {progress.toFixed(0)}% loaded
      </div>
    </Html>
  );
}

function CameraController({ targetPosition, targetLookAt }) {
  const targetPos = useRef(new Vector3(...targetPosition));
  const targetLook = useRef(new Vector3(...targetLookAt));

  useEffect(() => {
    targetPos.current.set(...targetPosition);
    targetLook.current.set(...targetLookAt);
  }, [targetPosition, targetLookAt]);

  useFrame((state) => {
    state.camera.position.lerp(targetPos.current, 0.05);
    
    const lookAtPoint = new Vector3();
    state.camera.getWorldDirection(lookAtPoint);
    lookAtPoint.multiplyScalar(10).add(state.camera.position);
    lookAtPoint.lerp(targetLook.current, 0.05);
    
    state.camera.lookAt(lookAtPoint);
  });

  return null;
}

export default function App() {
  const waypoints = {
    front: { position: [0, 2, 5], target: [0, 0, 0] },
    side: { position: [5, 1, 0], target: [0, 0, 0] },
    top: { position: [0, 8, 0], target: [0, 0, 0] },
    detail: { position: [1, 0.5, 1.5], target: [0, 0, 0] }
  };

  const [currentView, setCurrentView] = React.useState('front');
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      console.log('AI Response:', message.content);
      try {
        const parsed = JSON.parse(message.content);
        console.log('Parsed JSON:', parsed);
        
        if (parsed.view && waypoints[parsed.view]) {
          console.log('Setting view to:', parsed.view);
          setCurrentView(parsed.view);
          message.content = parsed.message || message.content;
        }
        
      } catch (error) {
        console.log('JSON parse error, trying regex:', error);
        const jsonMatch = message.content.match(/\{[^}]*"view"\s*:\s*"(\w+)"[^}]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.view && waypoints[parsed.view]) {
              console.log('Regex matched view:', parsed.view);
              setCurrentView(parsed.view);
              message.content = parsed.message || message.content.replace(/\{.*\}/g, '').trim();
            }
          } catch (e) {
            console.error('Regex parse failed:', e);
          }
        }
      }
    }
  });
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        
        <Suspense fallback={<Loader />}>
          <Splat 
            src="https://huggingface.co/cakewalk/splat-data/resolve/main/nike.splat" 
            scale={1}
            position={[0, 0, 0]}
          />
        </Suspense>
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} />
        
        <OrbitControls makeDefault />
        <Environment preset="city" />
        <CameraController 
          targetPosition={waypoints[currentView].position}
          targetLookAt={waypoints[currentView].target}
        />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: '350px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          height: '200px',
          overflowY: 'auto',
          marginBottom: '15px',
          paddingRight: '10px'
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: m.role === 'user' ? '#2563eb' : '#374151'
            }}>
              <strong>{m.role === 'user' ? 'You' : 'AI Guide'}:</strong>
              <div>{m.content}</div>
            </div>
          ))}
          {isLoading && (
            <div style={{ opacity: 0.6, fontStyle: 'italic' }}>
              🎥 Moving camera...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to show you something..."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#1f2937',
              color: 'white'
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: isLoading ? '#666' : '#10b981',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </form>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 20,
        color: 'white',
        fontSize: '12px',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
      }}>
        Developed by <a 
          href="https://redwan-rahman.netlify.app" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#10b981', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Redwan Rahman
        </a>
      </div>
    </div>
  );
}