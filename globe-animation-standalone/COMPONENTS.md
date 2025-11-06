# Globe Animation Components Reference

This document describes all the visual elements in the globe animation.

## 🌍 Main Components

### 1. NetworkGlobe (Main Component)
**File**: `NetworkGlobe.tsx`

The orchestrator component that brings everything together.

**Features**:
- Central wireframe globe (3.5 unit radius)
- Grid lines (8 horizontal + 8 vertical torus rings)
- Progressive reveal animation
- Rotation and scaling animations
- Props: `isLoaded` (boolean) - controls animation state

**Animation Details**:
- Globe rotation: Y-axis at 0.05 speed
- Globe wobble: X-axis sine wave
- Scale animation: Grows from 0.5 to 1.0 on load
- Animation progress: 0 to 1 over time

---

### 2. CosmicDust
**File**: `components/CosmicDust.tsx`

Background particle system creating a cosmic atmosphere.

**Features**:
- 500 particles by default
- Spherical distribution (radius 5-15 units)
- Continuous rotation
- Color: `#00C2FF` (bright blue)
- Size: 0.05 units
- Opacity: 0.6

**Customization**:
```tsx
const count = 500; // Change particle count
```

---

### 3. GlowingSphere
**File**: `components/GlowingSphere.tsx`

Creates a glowing sphere effect with multiple layers.

**Layers**:
1. Core sphere (size × 1.0) - Solid color
2. Inner bright glow (size × 0.8) - White, 70% opacity
3. Outer glow (size × 1.2) - Color, 30% opacity

**Animation**:
- Pulsing scale effect (10% variation)
- Speed: 2.0 (configurable via intensity prop)

**Props**:
```tsx
interface GlowingSphereProps {
  position?: [number, number, number];
  color: string;
  size?: number;        // Default: 0.3
  intensity?: number;   // Default: 1.0
}
```

---

### 4. LogoElement
**File**: `components/LogoElement.tsx`

Central animated logo representing KubeStellar.

**Components**:
1. **Central Sphere**: Purple glowing sphere (0.25 units)
2. **Three Orbital Rings**:
   - Ring 1 (0.6 radius): Primary blue
   - Ring 2 (0.7 radius): Highlight cyan
   - Ring 3 (0.5 radius): Accent pink
3. **8 Orbiting Particles**: Alternating cyan/yellow colors

**Animations**:
- Group rotation: Y-axis at 0.2 speed
- Group tilt: Z-axis sine wave
- Individual ring rotations at different speeds
- Emissive intensity: 0.5

---

### 5. Cluster
**File**: `components/Cluster.tsx`

Represents a cluster of nodes in 3D space.

**Features**:
- Spherical boundary (wireframe, 20% opacity)
- Multiple nodes arranged in Fibonacci sphere pattern
- Random node activation (1/3 of nodes every 3 seconds)
- Billboard text label with description
- Hover effects (scale up to 105%)
- Inter-node connections

**Props**:
```tsx
interface ClusterProps {
  position?: [number, number, number];
  name: string;
  nodeCount: number;      // Number of nodes
  radius: number;         // Cluster size
  color: string;          // Theme color
  description?: string;   // Shown on hover
}
```

**Node Colors**:
- Inactive: Cluster color
- Active: Green (`#00E396`)
- Active nodes have emissive glow

---

### 6. DataPacket
**File**: `components/DataPacket.tsx`

Animated sphere traveling along connection paths.

**Features**:
- Main sphere (0.08 units default)
- Trail of 20 particles
- Smooth interpolation along path
- Auto-loop when reaching end

**Props**:
```tsx
interface DataPacketProps {
  path: [number, number, number][];
  speed?: number;        // Default: 1
  color?: string;        // Default: "#00E396"
  size?: number;         // Default: 0.08
}
```

**Animation**:
- Speed: 0.005 × speed per frame
- Trail opacity: 60%
- Trail size: 80% of main packet

---

## 🎨 Color Scheme

**File**: `components/colors.ts`

```tsx
primary:      '#1a90ff'  // Main blue
secondary:    '#6236FF'  // Purple accent
highlight:    '#00C2FF'  // Bright cyan
success:      '#00E396'  // Green (active states)
background:   '#0a0f1c'  // Dark background
accent1:      '#FF5E84'  // Pink accent
accent2:      '#FFD166'  // Yellow accent
aiTraining:   '#B83FF7'  // Bright purple
aiInference:  '#00D6E4'  // Bright cyan
```

---

## 🎭 Animation Timings

| Element | Type | Speed/Duration |
|---------|------|----------------|
| Globe rotation | Continuous | 0.05 rad/sec |
| Globe wobble | Sine wave | 0.2 rad/sec amplitude |
| Central logo | Rotation | 0.2 rad/sec |
| Orbital rings | Various | 0.2-0.5 rad/sec |
| Cluster rotation | Continuous | 0.1 rad/sec |
| Node activation | Interval | Every 3 seconds |
| Data flow update | Interval | Every 4 seconds |
| Data packet | Linear | 0.005 × speed |
| Loading animation | Progressive | ~100 frames |
| Cosmic dust | Continuous | 0.05 rad/sec |

---

## 📏 Size Reference

```
Globe radius:           3.5 units
Cluster positions:      ~3 units from center
Cluster radius:         0.6-1.0 units
Node size:             0.08 units
Central sphere:        0.25 units
Orbital ring radius:   0.5-0.7 units
Data packet:           0.08 units
Cosmic dust:           0.05 units

Camera position:       [0, 0, 12]
Camera FOV:            40 degrees
Min zoom distance:     8 units
Max zoom distance:     20 units
```

---

## 🎬 Data Flow Types

The animation supports different types of data flows with unique colors:

| Type | Color | Usage |
|------|-------|-------|
| control | Purple (#6236FF) | Control plane to clusters |
| model | Bright Purple (#B83FF7) | AI model deployment |
| inference | Bright Cyan (#00D6E4) | Inference requests |
| data | Green (#00E396) | General data transfer |

---

## 💡 Performance Considerations

**High Impact**:
- Particle count (CosmicDust)
- Number of clusters
- Nodes per cluster
- Active data flows

**Medium Impact**:
- Geometry segments
- Number of lights
- Wireframe complexity

**Low Impact**:
- Animation speeds
- Color changes
- Text labels

**Optimization Tips**:
1. Reduce CosmicDust count to 200-300 for mobile
2. Lower geometry segments (e.g., 32 → 16)
3. Limit simultaneous data packets
4. Use `dpr={[1, 2]}` for responsive pixel ratio

---

## 🎮 Interactive Features

**OrbitControls Configuration**:
```tsx
enableZoom: true
enablePan: false
autoRotate: true
autoRotateSpeed: 0.3
minDistance: 8
maxDistance: 20
maxPolarAngle: Math.PI * 0.8
minPolarAngle: Math.PI * 0.2
enableDamping: true
dampingFactor: 0.05
```

**Cluster Hover Effects**:
- Scale increases to 105%
- Opacity increases (15% → 25%)
- Emissive intensity increases (0.1 → 0.3)
- Description text appears

---

## 🔄 State Management

**NetworkGlobe State**:
```tsx
activeFlows: number[]      // Currently active data connections
animationProgress: number  // 0-1, controls reveal animation
```

**Cluster State**:
```tsx
activeNodes: number[]      // Currently highlighted nodes
hovered: boolean          // Mouse hover state
```

**DataPacket State**:
```tsx
progress: number          // 0-1, position along path
```

This reference should help you understand exactly how the animation works and how to customize it!
