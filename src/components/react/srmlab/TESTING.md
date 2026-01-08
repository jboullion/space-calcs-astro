# SRM Simulator - Testing & Validation Plan

## Overview
This document outlines the testing strategy to validate the TypeScript/React implementation against the MATLAB reference implementation.

## Test Status

### ✅ Phase 1 Complete - UI Implementation
- [x] PropellantSelector component
- [x] GrainStackBuilder with add/remove/reorder
- [x] NozzleConfig with auto-sizing
- [x] SRMVisualization with 3D grain rendering
- [x] SRMForm and integration

### ✅ Phase 2 Complete - Numerical Engine
- [x] Math library (bisection, trapz, root finding)
- [x] Nozzle calculations (Mach solver, mass flow, Cf)
- [x] Geometry functions (BATES, Finocyl)
- [x] RK4 integrator (simulator.ts)
- [x] Integration into UI

### ✅ Phase 3 In Progress - Enhanced Metrics
- [x] Added 9 new metrics to SimulationOutput interface
- [x] Implemented motor designation (NAR/TRA class)
- [x] Volume loading calculation
- [x] Initial/Peak Kn tracking
- [x] Port-to-throat ratio
- [x] Mass flux calculations
- [x] Enhanced results display
- [x] Added 4 Plotly charts (thrust, pressure, Kn, burn area)

### 🔄 Phase 5 Pending - Validation Testing

## Test Cases

### Test Case 1: Multi-Segment Motor (MATLAB RunSimulation.m)

**Configuration:**
```
Case Inner Diameter: 50.8mm (2")
Free Volume: 300 cm³

Grain Stack:
1. Finocyl Segment
   - Length: 152.4mm
   - Outer Radius: 25.4mm
   - Inner Radius: 10mm
   - Fins: 6 fins
   - Fin Depth: 6mm
   - Fin Thickness: 4mm
   
2. BATES Segment
   - Length: 152.4mm
   - Outer Radius: 25.4mm
   - Inner Radius: 12.7mm

Propellant: Blue Thunder
- Density: 1625.09 kg/m³
- a = 6.9947e-5
- n = 0.321
- Gamma = 1.235
- Tc = 2616.5 K
- M = 0.022959 kg/mol

Nozzle: Auto-sized targeting 2000 psi (13.79 MPa)
```

**Expected MATLAB Outputs** (to be filled after running MATLAB):
```
Total Impulse: ___ N·s
Peak Pressure: ___ MPa (___ psi)
Peak Thrust: ___ N
Average Thrust: ___ N
Burn Time: ___ s
Delivered Isp: ___ s
Propellant Mass: ___ kg
Initial Kn: ___
Peak Kn: ___
Motor Class: ___
```

**Validation Steps:**
1. Run MATLAB `RunSimulation.m` script
2. Record all outputs from `computeMotorSummary.m`
3. Configure identical motor in browser UI
4. Run simulation and record TypeScript outputs
5. Calculate percentage errors for each metric

**Success Criteria:**
- Total Impulse error < 0.5%
- Peak Pressure error < 0.1%
- Peak Thrust error < 0.1%
- Burn Time error < 1%
- All other metrics error < 2%

### Test Case 2: Simple BATES Motor

**Configuration:**
```
Case Inner Diameter: 50.8mm
Free Volume: 100 cm³
Grain: Single BATES
   - Length: 150mm
   - Outer Radius: 25.4mm
   - Inner Radius: 12.7mm
Propellant: Blue Thunder
Nozzle: Manual
   - Throat Diameter: 12mm
   - Exit Diameter: 60mm
```

**Purpose:** Simpler configuration for debugging geometry calculations

### Test Case 3: Pure Finocyl Motor

**Configuration:**
```
Case Inner Diameter: 50.8mm
Free Volume: 200 cm³
Grain: Single Finocyl
   - Length: 152.4mm
   - Outer Radius: 25.4mm
   - Inner Radius: 10mm
   - Fins: 6 fins
   - Fin Depth: 6mm
   - Fin Thickness: 4mm
Propellant: KNDX
Nozzle: Auto-sized targeting 1500 psi
```

**Purpose:** Validate Finocyl geometry and KNDX propellant

### Test Case 4: Edge Cases

1. **Very small throat (high Kn):**
   - BATES grain, 8mm throat → Should show high pressure, fast burn

2. **Very large throat (low Kn):**
   - BATES grain, 20mm throat → Should show low pressure, slow burn

3. **Instant ignition vs staged:**
   - Compare motors with/without end inhibition

## Validation Checklist

### Geometry Functions
- [ ] BATES initial burn area matches MATLAB `geo_bates_segment.m`
- [ ] Finocyl initial burn area matches MATLAB `geo_finocyl_segment.m`
- [ ] Regression depth tracking correct (check at t=0.5s intervals)
- [ ] Volume consumed calculation matches propellant mass

### Nozzle Calculations
- [ ] Mach number from area ratio matches MATLAB `nozzleMachFromAreaRatio.m`
- [ ] Mass flow rate matches MATLAB `nozzleMassFlow.m`
- [ ] Thrust coefficient (Cf) matches MATLAB `nozzleCf.m`
- [ ] Throat choked flow condition verified

### Integration & Physics
- [ ] RK4 timestep stability (try 0.1ms, 1ms, 10ms)
- [ ] Chamber pressure curve shape matches MATLAB
- [ ] Thrust curve profile matches MATLAB
- [ ] Burn time within 1% of MATLAB
- [ ] Total impulse (area under thrust curve) matches MATLAB

### Post-Processing Metrics
- [ ] Total Impulse (trapz of thrust curve)
- [ ] Average Thrust (total impulse / burn time)
- [ ] Peak Pressure and time of peak
- [ ] Peak Thrust and time of peak
- [ ] Delivered Isp matches MATLAB
- [ ] Volume Loading % matches MATLAB
- [ ] Initial Kn matches MATLAB
- [ ] Peak Kn matches MATLAB
- [ ] Port/Throat Ratio correct
- [ ] Mass Flux calculations match
- [ ] Motor Designation correct (NAR/TRA class)

## Testing Procedure

### Step 1: Run MATLAB Reference
```matlab
cd matlab/
RunSimulation  % Run test case
% Record all outputs
```

### Step 2: Run TypeScript Implementation
1. Open browser to http://localhost:4321/calcs/srm-simulator
2. Select "Blue Thunder" propellant
3. Add Finocyl segment: L=152.4mm, Ro=25.4mm, Ri=10mm, 6 fins (6mm x 4mm)
4. Add BATES segment: L=152.4mm, Ro=25.4mm, Ri=12.7mm
5. Set case diameter: 50.8mm
6. Set free volume: 300 cm³
7. Set nozzle to auto-size mode, target 2000 psi
8. Click "Run Simulation"
9. Record all results

### Step 3: Use validation.ts Script
```typescript
import { runValidationTest } from './tests/validation.ts';
runValidationTest();
```

### Step 4: Compare Results
Create comparison table:
| Metric | MATLAB | TypeScript | Error % | Pass? |
|--------|--------|------------|---------|-------|
| Total Impulse | | | | |
| Peak Pressure | | | | |
| Peak Thrust | | | | |
| ... | | | | |

## Known Differences

### Acceptable Variations
- Numerical integration tolerance (RK4 vs ODE45)
- Floating point rounding (< 1e-10)
- Timestep selection (1ms fixed vs adaptive)

### Potential Issues to Watch
1. **Burn surface area calculation:** Fin slot geometry complex
2. **Nozzle choking conditions:** Ensure proper subsonic/supersonic handling
3. **Propellant regression:** Non-linear burn rate law
4. **Chamber free volume:** Include nozzle convergent section?

## Debugging Tools

### Console Logging
Add to simulator.ts for detailed debugging:
```typescript
if (i % 100 === 0) { // Every 100ms
  console.log(`t=${state[0].toFixed(3)}s, Pc=${(state[1]/1e6).toFixed(2)}MPa, Ab=${Ab.toFixed(4)}m², Kn=${Kn.toFixed(2)}`);
}
```

### Export Data
Add CSV export function to compare timestep-by-timestep:
```typescript
function exportCSV(results: SimulationOutput) {
  const rows = results.t.map((t, i) => 
    `${t},${results.Pc[i]},${results.F[i]},${results.Ab[i]},${results.Kn[i]}`
  );
  const csv = 'Time,Pressure,Thrust,BurnArea,Kn\n' + rows.join('\n');
  // Download or copy to clipboard
}
```

### Visualization Comparison
Overlay MATLAB and TypeScript plots:
1. Export MATLAB results to JSON
2. Load in browser
3. Add MATLAB trace to Plotly charts in different color
4. Visual inspection of curve alignment

## Performance Benchmarks

Target performance (as measured):
- Simulation execution: < 200ms for 3-second burn
- Chart rendering: < 500ms
- UI responsiveness: < 50ms input lag
- Memory usage: < 50MB for results storage

## Automated Testing (Future Work)

### Unit Tests (Jest/Vitest)
```typescript
describe('Geometry Functions', () => {
  test('BATES initial burn area', () => {
    const result = geoBatesSegment(0, ...);
    expect(result.Ab).toBeCloseTo(expectedValue, 6);
  });
});

describe('Nozzle Functions', () => {
  test('Mach from area ratio', () => {
    const mach = machFromAreaRatio(5, 1.24);
    expect(mach).toBeCloseTo(2.925, 3);
  });
});
```

### Integration Tests
```typescript
describe('Full Simulation', () => {
  test('Simple BATES motor matches reference', () => {
    const results = simulateMotor(testConfig);
    expect(results.totalImpulse).toBeCloseTo(referenceImpulse, -1); // 0.5% tolerance
  });
});
```

## Test Results Log

### Run 1: [Date]
- Configuration: Multi-segment (Test Case 1)
- MATLAB Total Impulse: ___ N·s
- TypeScript Total Impulse: ___ N·s
- Error: ___%
- Status: ⏳ Pending

### Run 2: [Date]
- Configuration: Simple BATES (Test Case 2)
- ...

## Next Steps

1. ✅ Fix TypeScript compilation errors
2. ⏳ Run MATLAB RunSimulation.m and record outputs
3. ⏳ Configure same motor in browser UI and compare
4. ⏳ Document error percentages
5. ⏳ If errors > tolerance, debug and fix
6. ⏳ Add more test cases (KNDX, KNSB, KNSU propellants)
7. ⏳ Create automated test suite
8. ⏳ Add unit conversion display (Imperial units)

## References

MATLAB files:
- `matlab/RunSimulation.m` - Test case runner
- `matlab/simulateMotor.m` - Reference integrator
- `matlab/computeMotorSummary.m` - Post-processing metrics
- `matlab/geo_*.m` - Geometry functions
- `matlab/nozzle*.m` - Nozzle calculations

TypeScript files:
- `src/components/react/srmlab/lib/simulator.ts` - Main simulator
- `src/components/react/srmlab/lib/geometry.ts` - Grain geometry
- `src/components/react/srmlab/lib/nozzle.ts` - Nozzle calculations
- `src/components/react/srmlab/tests/validation.ts` - Test scripts
