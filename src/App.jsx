import React, { Suspense, useEffect, useRef, useState } from 'react';
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
  const isAnimating = useRef(false);
  const frameCount = useRef(0);
  const MAX_FRAMES = 120; // ~2 seconds at 60fps

  useEffect(() => {
    targetPos.current.set(...targetPosition);
    targetLook.current.set(...targetLookAt);
    isAnimating.current = true;
    frameCount.current = 0;
  }, [targetPosition, targetLookAt]);

  useFrame((state) => {
    if (!isAnimating.current) return;

    frameCount.current++;

    state.camera.position.lerp(targetPos.current, 0.05);
    
    const lookAtPoint = new Vector3();
    state.camera.getWorldDirection(lookAtPoint);
    lookAtPoint.multiplyScalar(10).add(state.camera.position);
    lookAtPoint.lerp(targetLook.current, 0.05);
    state.camera.lookAt(lookAtPoint);

    // Stop animating once close enough or after max frames
    const distance = state.camera.position.distanceTo(targetPos.current);
    if (distance < 0.01 || frameCount.current > MAX_FRAMES) {
      isAnimating.current = false;
    }
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

  const [currentView, setCurrentView] = useState('front');
  const [input, setInput] = useState('');

  // Helper to extract text from a message's parts
  const getMessageText = (message) => {
    if (!message.parts) return '';
    return message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  };

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    onFinish: ({ message }) => {
      const text = getMessageText(message);
      console.log('AI raw response:', text);

      const trySetView = (viewName) => {
        const key = viewName?.toLowerCase();
        if (key && waypoints[key]) {
          console.log('Setting camera to:', key);
          setCurrentView(key);
          return true;
        }
        return false;
      };

      try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(clean);
        trySetView(parsed.view);
      } catch {
        const match = text.match(/"view"\s*:\s*"([^"]+)"/i);
        if (match) trySetView(match[1]);
      }
    }
  });

  const isLoading = status === 'streaming' || status === 'loading';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };
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
          {messages.map((m, i) => {
            const text = getMessageText(m);
            // Try to show only the "message" field from JSON responses
            let displayText = text;
            try {
              const clean = text.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(clean);
              if (parsed.message) displayText = parsed.message;
            } catch { /* show raw text */ }

            return (
              <div key={i} style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: m.role === 'user' ? '#2563eb' : '#374151'
              }}>
                <strong>{m.role === 'user' ? 'You' : 'AI Guide'}:</strong>
                <div>{displayText}</div>
              </div>
            );
          })}
          {isLoading && (
            <div style={{ opacity: 0.6, fontStyle: 'italic' }}>
              🎥 Moving camera...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
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