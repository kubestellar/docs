# Quick Start Guide - Globe Animation

Get the beautiful KubeStellar globe animation running in your project in 5 minutes!

## 🚀 Super Quick Setup

### Step 1: Copy the folder
Copy the entire `globe-animation-standalone` folder to your project.

### Step 2: Install dependencies
```bash
npm install three @react-three/fiber @react-three/drei
```

### Step 3: Use it in your app
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import NetworkGlobe from './globe-animation-standalone/NetworkGlobe';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 40 }}>
        <color attach="background" args={['#050a15']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6236FF" />
        <NetworkGlobe isLoaded={true} />
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}
```

### That's it! 🎉

You should now see the beautiful animated globe in your application.

## 📖 More Examples

Check out `example-usage.tsx` for 5 different implementation examples:
1. Simple full-screen implementation
2. With loading state
3. In a container/card
4. Half-screen layout (perfect for login pages)
5. As a background animation

## 🎨 Customization

### Change colors
Edit `components/colors.ts`:
```tsx
export const COLORS = {
  primary: '#YOUR_COLOR',
  secondary: '#YOUR_COLOR',
  // ... etc
};
```

### Add/remove clusters
Edit the `clusters` array in `NetworkGlobe.tsx`:
```tsx
const clusters = [
  { 
    name: "My Cluster",
    position: [2, 3, 1],
    nodeCount: 6,
    radius: 0.8,
    color: "#1a90ff",
    description: "Description here"
  },
  // Add more...
];
```

### Adjust animation speed
- Globe rotation: Find `time * 0.05` in NetworkGlobe.tsx and adjust the multiplier
- Auto-rotate: Change `autoRotateSpeed={0.3}` in OrbitControls
- Data flows: Edit the interval time in the `useEffect` (currently 4000ms)

## 🔧 Troubleshooting

**Problem**: Nothing appears
- Make sure you have a dark background color
- Check that all dependencies are installed
- Ensure the Canvas has width and height

**Problem**: Performance issues
- Reduce particle count in CosmicDust.tsx
- Lower the nodeCount in clusters
- Reduce the number of segments in geometries

**Problem**: TypeScript errors
- Make sure you have `@types/react` and `@types/three` installed
- Check your tsconfig.json includes the folder

## 💡 Pro Tips

1. **For production**: Consider lazy-loading the Canvas component
2. **Mobile**: Test on mobile devices and adjust particle counts for performance
3. **Accessibility**: Add loading states and fallbacks
4. **Customization**: The animation is fully customizable - explore each component!

## 📦 What's Included

```
globe-animation-standalone/
├── NetworkGlobe.tsx          # Main component
├── components/
│   ├── Cluster.tsx           # Cluster visualization with nodes
│   ├── CosmicDust.tsx        # Particle effects
│   ├── DataPacket.tsx        # Animated data packets
│   ├── GlowingSphere.tsx     # Glowing sphere effect
│   ├── LogoElement.tsx       # Central logo with rings
│   └── colors.ts             # Color theme
├── example-usage.tsx         # 5 implementation examples
├── README.md                 # Full documentation
├── QUICKSTART.md            # This file
└── package.json             # Dependencies list
```

## 🎯 Next Steps

1. ✅ Get the basic animation working
2. 📱 Test on different devices
3. 🎨 Customize colors and clusters
4. 🚀 Integrate with your application
5. 💫 Add your own features!

## 🆘 Need Help?

- Check the full README.md for detailed documentation
- Look at example-usage.tsx for implementation examples
- Each component file has comments explaining its functionality

Happy coding! 🌟
