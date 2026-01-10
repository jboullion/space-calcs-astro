# SRM Lab - Copilot Instructions

## Project Overview
MATLAB-based solid rocket motor (SRM) internal ballistics simulator. Computes chamber pressure, thrust, and performance metrics using a fixed-step RK4 solver with quasi-steady nozzle flow.

## Architecture & Data Flow

```
RunSimulation.m (entry point)
    → makeMotorConfig()     # Creates empty cfg struct template
    → runMotor(cfg)         # Main orchestrator
        → validateMotorConfig(cfg)
        → geo_stack(cfg)    # Builds geometry function from grain stack
        → assembleNozzle(cfg)  # Manual or auto-sized nozzle
        → deriveMotorFields(cfg)
        → simulateMotor(cfg)   # RK4 time integration
        → computeMotorSummary() + printMotorSummary() + plotoutput()
```

## Core Concepts

### Configuration Struct (`cfg`)
All simulation parameters flow through a single `cfg` struct with sub-structs:
- `cfg.grain` - Motor case dimensions, free volume
- `cfg.stack` - Cell array of grain segment structs (see below)
- `cfg.noz` - Nozzle geometry and mode (`"manual"` or `"auto"`)
- `cfg.prop` - Propellant properties (burn rate `a`, exponent `n`, `gamma`, `Tc_K`, etc.)
- `cfg.num` - Numerics (`dt`, `tmax`)

### Grain Geometry System
Grains are defined as a cell array of segment structs in `cfg.stack`:
```matlab
cfg.stack = { 
    struct("type","finocyl", "L",0.15, "Ro",0.025, "Ri",0.01, "Nf",6, "finDepth",0.006, "finThick",0.004, "inhibitEnds",true),
    struct("type","bates", "L",0.15, "Ro",0.025, "Ri",0.013, "inhibitEnds",true)
};
```

To add a new grain type:
1. Create `geo_<type>_segment.m` returning struct with fields: `Ab`, `Vc`, `dVdx`, `Ap`, `done`
2. Add case to switch in [geo_stack.m](../geo_stack.m) `evalStack()` function

### Nozzle Sizing
- `cfg.noz.mode = "manual"` - Uses `throat_diameter_m` and `exit_diameter_m` directly
- `cfg.noz.mode = "auto"` - Sizes throat to achieve `targetPc_Pa` at initial burn area

## Key Conventions

### Units
All internal calculations use SI units:
- Lengths: meters (`_m` suffix)
- Pressure: Pascals (`_Pa` suffix)  
- Temperature: Kelvin (`_K` suffix)
- Molar mass: kg/mol (`_kgmol` suffix)

### Burn Rate Law
Saint-Venant/Vieille law: `r_dot = a * Pc^n` where `a` and `n` come from `cfg.prop`

### Physical Constants
- `g0 = 9.80665` - Standard gravity (hardcoded in multiple files)
- `R = 8.314462618` - Universal gas constant J/mol-K

## Running Simulations
```matlab
% In MATLAB command window:
RunSimulation   % Runs with parameters defined in that script
```

## Validation Pattern
[validateMotorConfig.m](../validateMotorConfig.m) uses helper functions:
- `mustHave(cfg, field)` - Check struct field exists
- `mustBeFinitePositive(val, name)` - Validate numeric constraints
- Stack segments require: `type`, `L`, `Ro`, `Ri` with `Ri < Ro`

## Output Structure
`simulateMotor` returns `out` struct with time histories:
- `t`, `Pc`, `F`, `Ab`, `Vc`, `rdot`, `mdot_gen`, `mdot_noz`, `Ap`
