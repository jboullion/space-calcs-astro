# Space Calcs - AI Coding Agent Instructions

## Project Overview
Space Calcs is a collection of **interactive space science calculators** built with Astro (SSG) and a hybrid Vue/React architecture. The site generates static pages with client-side interactivity—no server-side computation. Target audience: space enthusiasts, students, and professionals.

**Live site:** https://spacecalcs.com  
**License:** GNU v3.0

## Architecture & Framework Choices

### Astro Pages (Static Site Generation)
- **All pages** are `.astro` files in `src/pages/` or `src/pages/calcs/`
- Astro handles routing automatically: `src/pages/calcs/delta-v.astro` → `/calcs/delta-v`
- Each calculator page follows this pattern:
  ```astro
  ---
  import Layout from "../../layouts/Layout.astro";
  import Hero from "../../components/calcs/Hero.astro";
  import CalculatorComponent from "../../components/vue/calculator-name/Component.vue";
  // or React: import Component from "../../components/react/calculator-name/Component.tsx";
  ---
  
  <Layout title={title} description={description}>
    <div class="container">
      <Hero title={title} description={description} />
      <CalculatorComponent client:load />  <!-- Vue -->
      <!-- or <ReactComponent client:load /> for React -->
    </div>
  </Layout>
  ```

### Vue vs React Component Strategy
- **Legacy calculators:** Vue 3 (Composition API) in `src/components/vue/`
- **New calculators:** React 18+ in `src/components/react/` (preferred for new work)
- **Decision criteria:** React preferred for 3D visualizations (React Three Fiber), complex state management, or when porting existing React codebases
- **Hydration directives:**
  - `client:load` — Hydrate immediately on page load (most common)
  - `client:only` — Never server-render, only run on client (use for Google Maps, incompatible libs)

### Component Organization Pattern
Each calculator gets its own folder with self-contained logic:
```
src/components/vue/delta-v/
  ├── DeltaV.vue           # Main component
  ├── constants.ts         # Physics constants, defaults
  ├── helpers.ts           # Calculation functions
  ├── types.ts             # TypeScript interfaces
  └── DeltaVMap.vue        # Sub-components (optional)
```

For React calculators using context:
```
src/components/react/create-planet/
  ├── CreatePlanet.tsx           # Wrapper with provider
  ├── PlanetContext.tsx          # Context + hooks
  ├── CreatePlanetForm.tsx       # Form inputs
  ├── CreatePlanetVisualization.tsx  # 3D rendering
  └── CreatePlanetResults.tsx    # Results display
```

## Calculator Registry System

**All calculators must be registered** in `src/utils/calculator-list.ts`:
```typescript
{
  id: 'calculator-slug',
  name: 'Display Name',
  description: 'Brief description for SEO and homepage',
  categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
  link: '/calcs/calculator-slug',
  sponsor?: 'Name',  // Optional sponsor credit
  sponsorImg?: '/images/sponsors/name.png'
}
```
This powers:
- Homepage calculator grid
- Sitemap generation (`astro.config.mjs`)
- SEO metadata
- Navigation/search features

## Path Aliases (Vite Config)
Defined in `astro.config.mjs`:
```typescript
'@': './src'
'@components': './src/components'
'@lib': './src/lib'
'@utils': './src/utils'
'@types': './src/types'
'@images': './src/assets/images'
```
**However:** Current codebase uses relative imports (`../../`). Use these when extending existing patterns, but aliases are available if refactoring.

## Key Development Workflows

### Running Dev Server
```bash
npm run dev          # Start at http://localhost:4321
npm run build        # Production build
npm run preview      # Preview production build locally
```

### Prebuild Script (Launch Pads Data)
- **Runs automatically before every build:** `npm run prebuild`
- Fetches live data from Space Devs API → `public/launch-pads-data.json`
- Manual update: `npm run update-launch-pads`
- Fallback file exists: `public/launch-pads-data-fallback.json`
- Script location: `src/scripts/fetch-launch-pads.js`

### Styling System
- **Bootstrap 5** (dark theme via `data-bs-theme="dark"`)
- Global CSS in `src/styles/`:
  - `bootstrap.min.css` — Framework base
  - `calculators.css` — Calculator-specific styles (forms, results)
  - `global.css` — Site-wide utilities
  - `colors.css` — Custom color variables
  - `buttons.css` — Button overrides
- **No CSS modules or styled-components** — use Bootstrap classes + custom CSS
- FontAwesome icons via CDN (solid, brands)

### Form Components (Vue Reusable Inputs)
Located in `src/components/vue/forms/`:
- `NumberInput.vue` — Labeled number input with unit display
- `CheckboxInput.vue` — Checkbox with optional tooltip
- `SelectInput.vue` — Dropdown select
- `Tooltip.vue` — Info tooltip helper
- **Usage pattern:**
  ```vue
  <NumberInput
    id="payload-mass"
    label="Payload Mass"
    v-model="formData.payloadMass"
    unit="mt"
    tooltip="Optional help text"
  />
  ```

### 3D Visualization Stack
- **React Three Fiber** (`@react-three/fiber`) + Three.js for 3D graphics
- **@react-three/drei** — Utility components (OrbitControls, etc.)
- **Shader support:** `.vert` and `.frag` files handled by Vite plugin in `astro.config.mjs`
- **Example:** See `src/components/react/create-planet/CreatePlanetVisualization.tsx`

### State Management
- **Vue calculators:** Reactive `ref()` or `reactive()` (Composition API)
- **React calculators:** Context API pattern (see PlanetContext.tsx)
- **Global state (minimal):** Nanostores (`nanostores` library)
  - Example: `src/utils/store.ts` — User auth state
  - Usage in Vue: `import { useStore } from '@nanostores/vue'`

## Authentication (Supabase - Optional Feature)
- Supabase client: `src/lib/supabaseClient.ts`
- Environment variables: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- Auth components: `src/components/vue/auth/` (Login, SignUp, Account)
- Most calculators work **without authentication** — it's for saved configurations/profiles only

## Testing & Validation Approach

### No Formal Test Suite
- **Validation strategy:** Compare outputs against known physics equations or reference implementations
- For numerical engines (e.g., SRM simulator), create test cases in `src/components/react/srmlab/matlab/` comparing TypeScript vs MATLAB outputs
- Manual testing via dev server

### Debugging Tips
- Use browser DevTools for client-side React/Vue debugging
- Astro dev server provides fast HMR
- Check network tab for failed data fetches (launch pads API)
- Console errors often indicate hydration mismatches (check `client:load` vs `client:only`)

## Adding a New Calculator (Step-by-Step)

1. **Choose framework:** React (preferred for new calcs) or Vue (match existing patterns)

2. **Create component folder:**
   ```
   src/components/react/new-calculator/
   └── NewCalculator.tsx
   ```

3. **Create Astro page:**
   ```astro
   // src/pages/calcs/new-calculator.astro
   ---
   import Layout from "../../layouts/Layout.astro";
   import Hero from "../../components/calcs/Hero.astro";
   import NewCalculator from "../../components/react/new-calculator/NewCalculator.tsx";
   
   const title = "Calculator Name";
   const description = "SEO description";
   ---
   
   <Layout title={title} description={description}>
     <div class="container">
       <Hero title={title} description={description} />
       <NewCalculator client:load />
     </div>
   </Layout>
   ```

4. **Register in calculator-list.ts:**
   ```typescript
   {
     id: 'new-calculator',
     name: 'Calculator Name',
     description: 'Brief description',
     categories: [categories[ROCKET_CAT]],
     link: '/calcs/new-calculator',
   }
   ```

5. **Test locally:** `npm run dev` → `http://localhost:4321/calcs/new-calculator`

## Common Patterns & Conventions

### Calculator Layout Structure
```html
<div class="row calculator">
  <div class="col-lg-4">
    <!-- Form inputs (left panel) -->
  </div>
  <div class="col-lg-8">
    <!-- Results/visualization (right panel) -->
  </div>
</div>
```

### TypeScript Interfaces
Define calculation types in component folder:
```typescript
// src/components/vue/delta-v/types.ts
export interface RocketFormData {
  payloadMass: number;
  rocketMass: number;
  fuelMass: number;
  specificImpulse: number;
}
```

### Physics Constants
Store in `constants.ts` within calculator folder:
```typescript
export const G = 6.674e-11;  // Gravitational constant
export const g0 = 9.80665;   // Standard gravity
```

### Number Formatting
Use helper functions for consistent display:
```typescript
// Add commas to large numbers
function addCommas(num: number): string {
  return num.toLocaleString();
}

// Scientific notation for very large/small values
function formatNumber(value: number, precision = 2): string {
  if (Math.abs(value) < 0.01 || Math.abs(value) > 999999) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
}
```

## Project-Specific Quirks

### GLSL Shader Loading
- Vite plugin in `astro.config.mjs` transforms `.vert`/`.frag` files to strings
- Import directly: `import vertexShader from './shader.vert';`

### Google Charts (Legacy)
- Used in older Vue calculators (e.g., drake-equation)
- Type definitions: `src/types/google-charts.d.ts`
- Load via CDN, not npm package

### References Component Pattern
Each calculator includes citation links:
```astro
<References references={references} />
```
Where `references` is `Reference[]` array (defined in `src/types/types.ts`)

### Bootstrap Form Validation
Custom validation script in `Layout.astro`:
```javascript
var forms = document.querySelectorAll('.needs-validation');
// ... Bootstrap validation setup
```


## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build static site
npm run preview                # Preview production build

# Data Updates
npm run update-launch-pads     # Fetch latest launch pad data

# Linting
npm run lint:fix               # Fix ESLint issues
```

## When in Doubt

1. **Check existing calculators** — `src/pages/calcs/` and `src/components/vue/` or `react/`
2. **Follow Bootstrap patterns** — Use responsive grid, form-control classes
3. **Keep calculations pure** — Separate logic (helpers.ts) from UI components
4. **Test with real data** — Use known physics values to validate outputs
5. **Document assumptions** — Add comments for equations, constants, and simplifications
