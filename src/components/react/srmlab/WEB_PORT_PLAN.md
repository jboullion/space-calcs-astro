# SRM Lab Web Port - Implementation Plan

## Project Goal
Convert MATLAB solid rocket motor simulator to a React/Astro web application with TypeScript. Deploy as client-side static site—no server-side computation required.

## Technical Assessment Summary

### Feasibility: ✅ Excellent
- **No MATLAB toolbox dependencies** - Pure numerical code
- **Lightweight computation** - ~5M FLOPs per simulation, <100ms runtime in browser
- **Clean architecture** - Well-structured, modular code (~1,500 lines to port)
- **Standard algorithms** - RK4 integration, closed-form gas dynamics, simple root-finding

### Key Technical Decisions
- **Computation**: Client-side JavaScript (no WebAssembly needed initially)
- **Charting**: Plotly.js (interactive pan/zoom/export)
- **3D Visualization**: React Three Fiber for grain geometry preview
- **Propellant Data**: Scraped OpenMotor database + custom entry option
- **State Management**: React hooks + Web Workers for non-blocking simulation

---

## Phase 1: Core Numerical Engine (3-4 days)

### 1.1 Create TypeScript Project Structure
```
src/
├── lib/
│   ├── core/
│   │   ├── simulator.ts           # RK4 integrator
│   │   ├── types.ts               # MotorConfig, SimulationOutput interfaces
│   │   └── constants.ts           # g0, R, unit conversions
│   ├── nozzle/
│   │   ├── massFlow.ts            # Choked flow calculation
│   │   ├── thrustCoefficient.ts   # Cf calculation
│   │   ├── thrust.ts              # Thrust from Cf
│   │   └── machSolver.ts          # Area ratio → Mach number
│   ├── geometry/
│   │   ├── stack.ts               # Grain stack combiner
│   │   ├── segments/
│   │   │   ├── bates.ts
│   │   │   ├── finocyl.ts
│   │   │   └── types.ts           # GrainSegment interface
│   │   └── validator.ts
│   ├── math/
│   │   ├── rootFinding.ts         # Bisection/Brent's method
│   │   └── integration.ts         # Trapezoidal rule
│   └── analysis/
│       ├── summary.ts             # Post-processing metrics
│       └── units.ts               # Conversion utilities
└── data/
    └── propellants.ts             # Propellant database
```

### 1.2 Port Critical Files (Priority Order)

**Day 1-2: Core Engine**
1. `simulator.ts` ← simulateMotor.m
   - Implement RK4 fixed-step integrator
   - Use `Float64Array` for time histories
   - State vector: `[x, Pc]` (burn depth, chamber pressure)

2. `nozzle/` modules
   - `massFlow.ts` ← nozzleMassFlow.m (5 lines)
   - `thrustCoefficient.ts` ← nozzleCfIdeal.m (20 lines)
   - `thrust.ts` ← nozzleThrustFromCf.m (25 lines)
   - `machSolver.ts` ← machFromAreaRatio.m (needs root-finder)

3. `math/rootFinding.ts`
   - Implement bisection or Brent's method (~100 lines)
   - Replace MATLAB's `fzero` for Mach number solver
   - Target tolerance: 1e-8

**Day 3: Geometry System**
4. `geometry/stack.ts` ← geo_stack.m
   - Maintain closure pattern: `const geoFcn = (x: number) => evalStack(x)`
   - Combine multiple segments with `Ab`, `Vc`, `dVdx`, `Ap` aggregation

5. `geometry/segments/bates.ts` ← geo_bates_segment.m
   - Cylindrical grain with optional end burning
   - Interface: `{ Ab, Vc, dVdx, Ap, done }`

6. `geometry/segments/finocyl.ts` ← geo_finocyl_segment.m
   - Fin-stabilized cylindrical grain
   - Handle fin regression and slot area calculations

**Day 4: Configuration & Validation**
7. `types.ts` - Define TypeScript interfaces:
   ```typescript
   interface MotorConfig {
     grain: {
       case_inner_diameter_m: number;
       free_volume_m3: number;
     };
     stack: GrainSegment[];
     noz: {
       mode: 'manual' | 'auto';
       throat_diameter_m: number;
       exit_diameter_m: number;
       Cd: number;
       Pa: number;
       auto?: {
         targetPc_Pa: number;
         targetEps?: number;
       };
     };
     prop: PropellantProperties;
     num: {
       dt: number;
       tmax: number;
     };
   }
   ```

8. `validator.ts` ← validateMotorConfig.m
   - Use Zod for runtime validation (optional but recommended)
   - Replicate `mustBeFinitePositive`, `mustHave` checks

9. Port remaining config functions:
   - `assembleNozzle.ts` ← assembleNozzle.m
   - `deriveMotorFields.ts` ← deriveMotorFields.m
   - `defaults.ts` ← makeMotorConfig.m

---

## Phase 2: Propellant Database (1 day)

### 2.1 Scrape OpenMotor Propellant Data
- Extract from OpenMotor repository: `openMotor/propellant/*.yaml` or JSON
- Convert to TypeScript constants with interface:
  ```typescript
  interface Propellant {
    name: string;
    density_kgm3: number;
    a: number;              // Burn rate coefficient
    n: number;              // Pressure exponent
    gamma: number;          // Specific heat ratio
    Tc_K: number;           // Chamber temperature
    M_kgmol: number;        // Molar mass
    Pmin_Pa?: number;
    Pmax_Pa?: number;
    description?: string;
  }
  
  export const PROPELLANTS: Record<string, Propellant> = {
    'KNDX': { ... },
    'KNSB': { ... },
    'Blue Thunder': { ... },
    // ... more presets
  };
  ```

### 2.2 Propellant Selector Component
- Dropdown with preset propellants
- "Custom" option to override any field
- Display c* and Isp estimates based on selection

---

## Phase 3: Analysis & Post-Processing (2 days)

### 3.1 Summary Metrics
Port computeMotorSummary.m → `analysis/summary.ts`:
- Total impulse (trapz integration)
- Burn time (5% peak Pc threshold)
- Average/peak chamber pressure
- Initial/peak Kn ratio
- Delivered Isp
- Volume loading fraction
- Port-to-throat ratio
- Mass flux calculations

### 3.2 Unit Conversions
Create `analysis/units.ts`:
- Pa ↔ psi
- N ↔ lbf
- m ↔ inches
- kg/m² ↔ lb/in²
- Display both SI and Imperial units in results

---

## Phase 4: React UI Components (4-5 days)

### 4.1 Motor Configuration Form (`components/MotorConfigForm.tsx`)

**Sections:**
1. **Motor Case**
   - Inner diameter (inches/mm)
   - Free volume (cm³)

2. **Propellant Selector**
   - Dropdown: Common propellants from database
   - Expandable "Advanced" section for custom properties
   - Display computed c* estimate

3. **Grain Stack Builder** (Form + 3D Preview)
   - **Left Panel**: Form Interface
     - "Add Segment" button with type selector (BATES, Finocyl)
     - Each segment card shows:
       - Type dropdown
       - Length, Ro (outer radius), Ri (inner radius)
       - Finocyl-specific: Nf (fins), finDepth, finThick
       - Inhibit ends checkbox
       - Drag handle for reordering
       - Remove button
   - **Right Panel**: React Three Fiber 3D Visualization
     - Live 3D cutaway view of grain stack
     - Color-code different segment types
     - Show port area, fins, inhibited surfaces
     - Rotate/zoom controls

4. **Nozzle Configuration**
   - Mode toggle: Manual / Auto-size
   - **Manual**: Throat diameter, exit diameter
   - **Auto**: Target chamber pressure, expansion ratio (or optimize)
   - Discharge coefficient Cd
   - Ambient pressure Pa

5. **Simulation Settings**
   - Time step dt (ms)
   - Max simulation time (s)

**Form State Management:**
```typescript
const [config, setConfig] = useState<MotorConfig>(defaultConfig);
const updateGrainStack = (index: number, updates: Partial<GrainSegment>) => {
  // ... immutable update logic
};
```

### 4.2 3D Grain Visualization (`components/GrainVisualization.tsx`)

**Using React Three Fiber:**
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function GrainVisualization({ stack }: { stack: GrainSegment[] }) {
  return (
    <Canvas camera={{ position: [0.15, 0.15, 0.15] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <OrbitControls />
      
      {stack.map((segment, i) => (
        <GrainSegmentMesh key={i} segment={segment} position={[0, computeZPosition(stack, i), 0]} />
      ))}
      
      {/* Case cylinder (transparent) */}
      <mesh>
        <cylinderGeometry args={[caseRadius, caseRadius, totalLength, 32]} />
        <meshStandardMaterial transparent opacity={0.2} color="#888" />
      </mesh>
    </Canvas>
  );
}
```

**Segment Rendering:**
- BATES: Cylinder with inner port hole, optional end caps (if not inhibited)
- Finocyl: Cylinder + radial fin extrusions from port
- Color scheme: Propellant = tan/orange, inhibited = gray, port = transparent

### 4.3 Simulation Execution Hook (`hooks/useSimulation.ts`)

```typescript
export function useSimulation() {
  const [results, setResults] = useState<SimulationOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runSimulation = useCallback(async (config: MotorConfig) => {
    setIsRunning(true);
    setProgress(0);

    // Run in Web Worker to avoid blocking UI
    const worker = new Worker(
      new URL('../workers/simulator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage({ type: 'RUN', config });
    
    worker.onmessage = (e) => {
      if (e.data.type === 'PROGRESS') {
        setProgress(e.data.progress);
      } else if (e.data.type === 'COMPLETE') {
        setResults(e.data.results);
        setIsRunning(false);
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error('Simulation error:', err);
      setIsRunning(false);
      worker.terminate();
    };
  }, []);

  return { results, runSimulation, isRunning, progress };
}
```

### 4.4 Results Visualization (`components/ResultsChart.tsx`)

**Using Plotly.js:**
```typescript
import Plot from 'react-plotly.js';

export function ResultsChart({ output }: { output: SimulationOutput }) {
  const { t, Pc, F } = output;

  return (
    <Plot
      data={[
        {
          x: t,
          y: Pc.map(p => p / 1e6), // Convert Pa → MPa
          name: 'Chamber Pressure',
          yaxis: 'y1',
          type: 'scatter',
          line: { color: 'rgb(55, 128, 191)' }
        },
        {
          x: t,
          y: F,
          name: 'Thrust',
          yaxis: 'y2',
          type: 'scatter',
          line: { color: 'rgb(255, 127, 14)' }
        }
      ]}
      layout={{
        title: 'Motor Performance',
        xaxis: { title: 'Time (s)' },
        yaxis: { title: 'Pressure (MPa)', side: 'left' },
        yaxis2: {
          title: 'Thrust (N)',
          side: 'right',
          overlaying: 'y'
        },
        showlegend: true,
        hovermode: 'x unified'
      }}
      config={{
        displayModeBar: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'motor_performance',
          height: 600,
          width: 1000
        }
      }}
    />
  );
}
```

**Additional Plots** (Tabs/Accordion):
- Burn area vs time
- Kn ratio vs time
- Mass flux vs time
- Optional: Port area evolution for each segment

### 4.5 Summary Table (`components/SummaryTable.tsx`)

Display computed metrics in organized sections:

**Performance Metrics**
- Total Impulse (N·s)
- Average Thrust (N)
- Peak Thrust (N)
- Delivered Isp (s)
- Burn Time (s)

**Pressure & Kn**
- Average Chamber Pressure (psi / MPa)
- Peak Chamber Pressure (psi / MPa)
- Initial Kn
- Peak Kn

**Geometry**
- Total Propellant Mass (kg / lb)
- Volume Loading (%)
- Propellant Length (mm / in)
- Port/Throat Ratio

**Mass Flux** (if applicable)
- Peak port mass flux (kg/m²·s and lb/in²·s)
- Per-segment flux values

**Export Options:**
- Copy as CSV
- Download as JSON
- Generate PDF report (future enhancement)

---

## Phase 5: Testing & Validation (2-3 days)

### 5.1 Create Test Suite
Compare TypeScript implementation against MATLAB reference outputs:

**Test Cases:**
1. **Simple BATES grain** - Single segment, manual nozzle
2. **Multi-segment stack** - BATES + Finocyl, test segment combining
3. **Auto-sized nozzle** - Verify throat sizing algorithm
4. **Finocyl complex geometry** - Test fin area/perimeter calculations
5. **Edge cases** - Near-burnout behavior, very short/long burns

**Validation Criteria:**
- Chamber pressure time history: <0.1% error
- Total impulse: <0.5% error
- Burn time: <1% error
- Summary metrics: <1% error

### 5.2 Unit Tests
- Root-finder convergence (machSolver)
- Geometry calculations at various x values
- Nozzle flow equations
- Trapezoidal integration accuracy

### 5.3 Integration Tests
- Full simulation run matches MATLAB output
- Web Worker communication reliable
- Configuration validation catches invalid inputs

---

## Phase 6: Deployment & Polish (1-2 days)

### 6.1 Astro Integration
Create Astro page wrapping React app:

```astro
---
// src/pages/srm-simulator.astro
import Layout from '../layouts/Layout.astro';
import MotorSimulator from '../components/MotorSimulator';
---

<Layout title="SRM Simulator">
  <main>
    <h1>Solid Rocket Motor Simulator</h1>
    <MotorSimulator client:load />
  </main>
</Layout>
```

### 6.2 Performance Optimization
- Lazy-load Plotly.js (code splitting)
- Lazy-load React Three Fiber components
- Preload Web Worker
- Use `useMemo` for expensive derivations
- Debounce 3D preview updates during form input

### 6.3 Responsive Design
- Mobile layout: Stack form + 3D view vertically
- Tablet: Side-by-side with collapsible panels
- Desktop: Full multi-panel layout

### 6.4 Deploy to Vercel/Netlify
```bash
# Build static site
npm run build

# Deploy
vercel deploy --prod
# or
netlify deploy --prod
```

**Environment:**
- Static site generation (no server needed)
- Edge caching for propellant database
- Fast global CDN delivery

---

## Technology Stack Summary

### Core
- **TypeScript** - Type safety for numerical code
- **React 18+** - UI framework
- **Astro 4+** - Static site generation

### Visualization
- **Plotly.js** - Interactive charts
- **React Three Fiber + Three.js** - 3D grain preview
- **@react-three/drei** - R3F helpers (OrbitControls, etc.)

### Utilities
- **Zod** (optional) - Runtime validation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Development
- **Vite** - Build tool (via Astro)
- **Vitest** - Unit testing
- **Playwright** (optional) - E2E testing

---

## Effort Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| **Phase 1**: Core Engine | 3-4 days | Medium |
| **Phase 2**: Propellant DB | 1 day | Low |
| **Phase 3**: Analysis | 2 days | Low |
| **Phase 4**: React UI | 4-5 days | Medium-High |
| **Phase 5**: Testing | 2-3 days | Medium |
| **Phase 6**: Deployment | 1-2 days | Low |
| **Total** | **13-17 days** | **Medium** |

**Single developer estimate**. Can parallelize if team available (e.g., one dev on engine, one on UI).

---

## Success Criteria

✅ **Functional Parity**
- All MATLAB features ported (BATES, Finocyl, manual/auto nozzle)
- Numerical accuracy within 0.1% of MATLAB outputs

✅ **Performance**
- Simulation completes in <100ms
- UI remains responsive (Web Workers)
- Initial page load <2s

✅ **User Experience**
- Intuitive grain stack builder
- Real-time 3D preview
- Interactive result charts
- Mobile-friendly responsive design

✅ **Deployment**
- Static site hosted on Vercel/Netlify
- No server-side dependencies
- Fast global delivery via CDN

---

## Future Enhancements (Post-MVP)

1. **Additional Grain Types**
   - Rod-and-tube
   - Star grains
   - Custom geometry upload

2. **Optimization Tools**
   - Parameter sweep (vary Ri, L, etc.)
   - Multi-objective optimization (maximize Isp, minimize peak Pc)
   - Export design matrix

3. **Advanced Analysis**
   - Stability analysis (L* criterion)
   - Erosive burning model
   - Throat erosion prediction

4. **Collaboration Features**
   - Save/load motor designs
   - Share designs via URL
   - Community motor library

5. **Export Options**
   - OpenMotor `.ork` format compatibility
   - RASP `.eng` file export
   - PDF technical report generation

---

## Getting Started Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git repository initialized
- [ ] Astro project scaffold created

### Phase 1 Start
- [ ] Copy MATLAB files to reference folder
- [ ] Create TypeScript project structure
- [ ] Install dependencies: `npm install three @react-three/fiber @react-three/drei plotly.js react-plotly.js`
- [ ] Set up testing framework
- [ ] Create first test case (simple BATES run from MATLAB)

### Development Workflow
1. Port MATLAB function
2. Write unit test
3. Validate against MATLAB output
4. Integrate into larger system
5. Repeat

---

## Contact & Questions

For technical questions about the MATLAB codebase, refer to:
- Original repository documentation
- OpenMotor comparison screenshots
- `.github/copilot-instructions.md` for architecture details

**Ready to start implementation!** 🚀
