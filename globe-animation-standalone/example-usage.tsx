/**
 * Example Usage of the Globe Animation
 * 
 * This file shows different ways to implement the globe animation
 * in your React application.
 */

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import NetworkGlobe from './NetworkGlobe';

// ============================================
// Example 1: Simple Implementation
// ============================================
export function SimpleGlobeExample() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f1c' }}>
      <Canvas 
        camera={{ position: [0, 0, 12], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050a15']} />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
        <pointLight position={[0, 5, 5]} intensity={0.5} color="#00C2FF" />
        <pointLight position={[5, 0, 5]} intensity={0.4} color="#FF5E84" />
        <pointLight position={[-5, 0, -5]} intensity={0.4} color="#FFD166" />
        
        <NetworkGlobe isLoaded={true} />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.3}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

// ============================================
// Example 2: With Loading State
// ============================================
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        color: '#00C2FF'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid rgba(26, 144, 255, 0.2)',
          borderTop: '4px solid #1a90ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ margin: 0, fontWeight: '500' }}>
          {progress.toFixed(0)}% loaded
        </p>
      </div>
    </Html>
  );
}

export function GlobeWithLoadingExample() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f1c' }}>
      <Canvas 
        camera={{ position: [0, 0, 12], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050a15']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
        <pointLight position={[0, 5, 5]} intensity={0.5} color="#00C2FF" />
        <pointLight position={[5, 0, 5]} intensity={0.4} color="#FF5E84" />
        <pointLight position={[-5, 0, -5]} intensity={0.4} color="#FFD166" />
        
        <Suspense fallback={<Loader />}>
          <NetworkGlobe isLoaded={isLoaded} />
        </Suspense>
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.3}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
      
      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Example 3: In a Card/Container
// ============================================
export function GlobeInContainerExample() {
  return (
    <div style={{
      padding: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0a0f1c'
    }}>
      <div style={{
        width: '800px',
        height: '600px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 194, 255, 0.3)',
        border: '1px solid rgba(26, 144, 255, 0.3)'
      }}>
        <Canvas 
          camera={{ position: [0, 0, 12], fov: 40 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#050a15']} />
          
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
          <pointLight position={[0, 5, 5]} intensity={0.5} color="#00C2FF" />
          
          <NetworkGlobe isLoaded={true} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.3}
            minDistance={8}
            maxDistance={20}
          />
        </Canvas>
      </div>
    </div>
  );
}

// ============================================
// Example 4: Half-Screen Layout (for login pages)
// ============================================
export function GlobeHalfScreenExample() {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      background: '#0a0f1c'
    }}>
      {/* Left side - Globe Animation */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas 
          camera={{ position: [0, 0, 12], fov: 40 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#050a15']} />
          
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
          <pointLight position={[0, 5, 5]} intensity={0.5} color="#00C2FF" />
          <pointLight position={[5, 0, 5]} intensity={0.4} color="#FF5E84" />
          <pointLight position={[-5, 0, -5]} intensity={0.4} color="#FFD166" />
          
          <NetworkGlobe isLoaded={true} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.3}
            minDistance={8}
            maxDistance={20}
          />
        </Canvas>
      </div>
      
      {/* Right side - Your content (e.g., login form) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3c 100%)'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          width: '100%',
          color: 'white'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            color: '#00C2FF'
          }}>
            Your Content Here
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '2rem'
          }}>
            Add your login form or other content on this side.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Example 5: Background Animation
// ============================================
export function GlobeAsBackgroundExample() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Globe as background */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0
      }}>
        <Canvas 
          camera={{ position: [0, 0, 12], fov: 40 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#050a15']} />
          
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
          <pointLight position={[0, 5, 5]} intensity={0.5} color="#00C2FF" />
          
          <NetworkGlobe isLoaded={true} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.3}
          />
        </Canvas>
      </div>
      
      {/* Content overlay */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px'
      }}>
        <div style={{
          background: 'rgba(10, 15, 28, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          border: '1px solid rgba(26, 144, 255, 0.3)',
          color: 'white'
        }}>
          <h1 style={{ color: '#00C2FF' }}>Your Content</h1>
          <p>The globe animation is now a beautiful animated background!</p>
        </div>
      </div>
    </div>
  );
}

// Default export
export default GlobeWithLoadingExample;
