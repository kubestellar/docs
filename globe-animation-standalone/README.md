# KubeStellar Globe Animation - Standalone Package

This is a complete, self-contained version of the beautiful 3D globe animation from the KubeStellar login page.

## Features

- 🌍 Animated 3D globe with wireframe and grid lines
- ✨ Cosmic dust particle effects
- 🔮 Central glowing KubeStellar logo with orbital rings
- 🎯 Multiple cluster visualizations with interactive nodes
- 📡 Animated data flow connections between clusters
- 🚀 Data packets traveling along active connections
- 💫 Smooth entrance animations and hover effects
- 🎨 Beautiful color scheme with glowing effects

## Dependencies

This animation requires the following dependencies:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.96.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/three": "^0.160.0",
    "typescript": "^5.0.0"
  }
}
```

## Installation

1. Copy the entire `globe-animation-standalone` folder to your project
2. Install dependencies:
```bash
npm install three @react-three/fiber @react-three/drei
# or
yarn add three @react-three/fiber @react-three/drei
# or
pnpm add three @react-three/fiber @react-three/drei
```

## Usage

### Basic Implementation

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import NetworkGlobe from './globe-animation-standalone/NetworkGlobe';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas 
        camera={{ position: [0, 0, 12], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050a15']} />
        
        {/* Enhanced lighting */}
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
```

### With Loading State

```tsx
import { useState, useEffect, Suspense } from 'react';
import { Canvas, useProgress } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import NetworkGlobe from './globe-animation-standalone/NetworkGlobe';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-300 font-medium">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  );
}

function App() {
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
      >
        <color attach="background" args={['#050a15']} />
        
        {/* Lights */}
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
    </div>
  );
}
```

## Customization

### Modifying Clusters

Edit the `clusters` array in `NetworkGlobe.tsx`:

```tsx
const clusters = [
  { 
    name: "Your Cluster Name",
    position: [x, y, z], // 3D coordinates
    nodeCount: 6, // Number of nodes in cluster
    radius: 0.8, // Cluster size
    color: "#1a90ff", // Color
    description: "Your description"
  },
  // Add more clusters...
];
```

### Changing Colors

Edit `components/colors.ts` to customize the color scheme:

```tsx
export const COLORS = {
  primary: '#1a90ff',
  secondary: '#6236FF',
  highlight: '#00C2FF',
  // ... modify as needed
};
```

### Animation Speed

Adjust animation speeds in the respective component files:
- Globe rotation: Modify the multiplier in `globeRef.current.rotation.y = time * 0.05;`
- Cluster rotation: Change `state.clock.getElapsedTime() * 0.1`
- Auto-rotate speed: Modify `autoRotateSpeed` in OrbitControls

## File Structure

```
globe-animation-standalone/
├── README.md (this file)
├── NetworkGlobe.tsx (main globe component)
└── components/
    ├── Cluster.tsx (cluster visualization)
    ├── CosmicDust.tsx (particle effects)
    ├── DataPacket.tsx (animated data packets)
    ├── GlowingSphere.tsx (glowing sphere effect)
    ├── LogoElement.tsx (central logo)
    └── colors.ts (color scheme)
```

## Performance Tips

1. **Reduce particle count**: Lower the `count` in CosmicDust.tsx for better performance
2. **Simplify geometries**: Reduce segments in sphere/torus geometries
3. **Limit active flows**: Reduce the number of active data flows
4. **Disable features**: Comment out features like DataPackets if not needed

## Browser Compatibility

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Full support ✅
- Mobile: Supported (may have performance limitations)

## License

This code is extracted from the KubeStellar project. Please check the original project's license for usage terms.

## Credits

Original animation created for the KubeStellar project login page.
