# Photorealistic Agar Plate Rendering — Technical Strategy

## Why Your Previous Attempts Failed

### Canvas 2D
Canvas 2D has no per-pixel lighting pipeline. You can fake highlights with radial gradients per colony, but you can't compute normals, specular response, or subsurface scattering. Every colony becomes a hand-painted sprite. This doesn't scale and the results look "illustrated," not photographed.

### Canvas + PBR Materials
PBR requires a proper fragment shader pipeline with per-pixel normal computation, roughness/metallic maps, and environment lighting. Bolting PBR concepts onto Canvas 2D is architecturally wrong — you're computing in JS what should run on the GPU. The result is either too slow (CPU per-pixel math) or too approximate (baked sprites).

### PixiJS
PixiJS is a 2D sprite renderer with WebGL backend. It can do custom shaders via filters, but its architecture fights you when you need multi-texture, multi-pass rendering with custom data textures. It's optimized for compositing thousands of sprites, not computing complex material shading.

---

## The Core Insight: This Is a 2.5D Heightfield Lighting Problem

Your plate viewed top-down is essentially a **2D surface** with **height variation** (colonies are raised). The photorealism comes from:

1. **Heightfield-derived normals** → compute per-pixel surface orientation from colony height data
2. **Blinn-Phong specular** → wet agar and glossy colony surfaces have distinct specular response
3. **Subsurface scattering** → blood agar is translucent; light penetrates and scatters back reddened
4. **Material variation** → agar, colony biomass, and hemolysis zones have different optical properties
5. **Fresnel effect** → grazing angles on raised colonies reflect more light

**The right tool is raw WebGL 2.0 with custom GLSL shaders operating on data textures you generate.**

---

## Recommended Architecture

### Layer 1: Data Generation (CPU / JavaScript)

Generate these as Float32 textures (or Uint8 if precision isn't critical):

| Texture | Channels | Content |
|---|---|---|
| `colonyHeight` | R (float) | Height of deposited material, 0.0 = agar surface, 1.0 = tallest colony |
| `colonyColor` | RGBA | Albedo color of colony material at each pixel |
| `materialMask` | RGBA | R = colony density (0-1), G = hemolysis type (0=none, 0.5=α, 1.0=β), B = agar moisture, A = specular roughness |
| `agarBase` | RGB | Base agar color (blood agar red, MacConkey tan, etc.) |

**Colony height** is the critical texture. From your simulation's density grid:
- Confluent growth (high density) → height ~0.3-0.5 (smooth raised area)
- Isolated colonies → individual gaussian bumps, height ~0.2-0.8, radius 2-10 pixels
- Bare agar → 0.0
- Streak grooves (loop damage) → slight negative, e.g. -0.02

### Layer 2: WebGL Shader Pipeline

#### Single-Pass Fragment Shader (recommended for AI-tool compatibility)

Rather than multi-pass, do everything in one fragment shader. AI coding tools handle single complex shaders far better than coordinating framebuffer ping-pong.

```
Inputs:
  - u_heightMap (sampler2D)
  - u_colonyColor (sampler2D)  
  - u_materialMask (sampler2D)
  - u_agarBase (sampler2D)
  - u_lightPos (vec3) — overhead light, slightly off-center
  - u_resolution (vec2)

Per-pixel computation:
  1. Sample height at current pixel and 4 neighbors
  2. Compute normal from height gradient (Sobel or central difference)
  3. Compute diffuse lighting (N·L)
  4. Compute Blinn-Phong specular (controlled by roughness from materialMask)
  5. Compute fake SSS: blur the height/density in a small radius, 
     multiply by agar base color with red shift
  6. Compute hemolysis zone color modification
  7. Composite: albedo × (diffuse + SSS) + specular + ambient
```

### Layer 3: Post-Processing (optional second pass)

- Vignette (petri dish rim shadow)
- Subtle chromatic aberration at edges (lens effect)
- Film grain / noise for photographic quality

---

## The Shader Math

### Normal from Heightmap (most critical step)

```glsl
vec3 computeNormal(sampler2D heightMap, vec2 uv, vec2 texelSize, float strength) {
    float h_l = texture(heightMap, uv - vec2(texelSize.x, 0.0)).r;
    float h_r = texture(heightMap, uv + vec2(texelSize.x, 0.0)).r;
    float h_d = texture(heightMap, uv - vec2(0.0, texelSize.y)).r;
    float h_u = texture(heightMap, uv + vec2(0.0, texelSize.y)).r;
    
    vec3 normal = normalize(vec3(
        (h_l - h_r) * strength,
        (h_d - h_u) * strength,
        1.0
    ));
    return normal;
}
```

The `strength` parameter controls how "bumpy" the surface appears. For agar plates:
- Agar surface: strength ~0.5 (gentle undulations)
- Colony peaks: strength ~3.0-8.0 (visible dome shape)

### Blinn-Phong Specular

```glsl
vec3 lightDir = normalize(u_lightPos - vec3(uv, height));
vec3 viewDir = vec3(0.0, 0.0, 1.0); // top-down view
vec3 halfDir = normalize(lightDir + viewDir);

float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
```

**Critical parameters by material:**
| Material | Shininess | Specular Intensity |
|---|---|---|
| Wet agar surface | 60-120 | 0.4-0.6 |
| Mucoid colony (Klebsiella) | 80-150 | 0.7-0.9 |
| Glossy colony (S. aureus) | 40-80 | 0.3-0.5 |
| Matte colony (S. pyogenes) | 8-15 | 0.05-0.15 |
| Hemolysis clear zone | 100-200 | 0.5-0.7 |

### Fake Subsurface Scattering (the secret sauce)

True SSS requires multi-pass blur. For a single-pass approximation:

```glsl
// Sample neighboring pixels to approximate light diffusion
float sssRadius = 4.0; // pixels
vec3 sssAccum = vec3(0.0);
float sssWeight = 0.0;
for (float i = -2.0; i <= 2.0; i++) {
    for (float j = -2.0; j <= 2.0; j++) {
        vec2 offset = vec2(i, j) * texelSize * sssRadius;
        float neighborHeight = texture(heightMap, uv + offset).r;
        float w = exp(-(i*i + j*j) / 4.0); // Gaussian weight
        sssAccum += texture(agarBase, uv + offset).rgb * w * (1.0 - neighborHeight);
        sssWeight += w;
    }
}
sssAccum /= sssWeight;

// SSS is strongest where colony is thin/translucent
float sssIntensity = (1.0 - colonyDensity) * 0.3;
vec3 sssColor = sssAccum * vec3(1.2, 0.3, 0.2); // Red-shifted (blood agar)
```

The key insight: SSS on blood agar means **light penetrates the translucent red agar and comes back redder and softer**. Colonies block this. Where there's no colony, the agar glows warmly. Under thin deposits, you get a warmer red.

### Hemolysis Zone Rendering

```glsl
float hemoType = texture(materialMask, uv).g;
if (hemoType > 0.7) {
    // Beta hemolysis: clear zone, show underlying agar base without blood
    agarColor = mix(agarColor, vec3(0.78, 0.71, 0.55), betaIntensity); // straw/amber
} else if (hemoType > 0.3) {
    // Alpha hemolysis: green-brown tint
    agarColor = mix(agarColor, vec3(0.39, 0.43, 0.31), alphaIntensity); // olive-green
}
```

---

## The Streak-to-Colony Gradient

This is the visual transition from the reference image you need most. The gradient has 4 distinct zones:

### Zone 1: Heavy Inoculum (first quadrant)
- **Density**: >500 CFU/mm²
- **Appearance**: Confluent lawn — smooth, opaque sheet of colony material
- **Height**: Uniform ~0.3-0.5 (no individual peaks)
- **Color**: Solid colony color
- **Rendering**: Large plateau in heightmap, uniform normal, strong specular

### Zone 2: Semi-Confluent (transition area)
- **Density**: 50-500 CFU/mm²
- **Appearance**: Merging colonies, visible streak pattern, some individuality
- **Height**: Irregular terrain — merged bumps
- **Color**: Colony color visible but streak lines apparent
- **Rendering**: Noisy heightmap, overlapping gaussians

### Zone 3: Isolated Colonies (third/fourth quadrant)
- **Density**: 1-50 CFU/mm²
- **Appearance**: Individual round dots, well-separated, varying sizes
- **Height**: Individual Gaussian peaks on flat agar
- **Color**: Each colony is a discrete colored dome on red agar
- **Rendering**: Individual Gaussian splats in heightmap, surrounded by flat agar

### Zone 4: Empty Agar
- **Density**: 0
- **Appearance**: Clean red agar, glossy, possible faint streak marks
- **Height**: ~0.0, slight noise for agar texture
- **Color**: Pure agar base color
- **Rendering**: Flat heightmap with subtle Perlin noise, strong specular from wet surface

### Generating the Gradient

From your simulation's density grid, produce the heightmap:

```javascript
for (let x = 0; x < W; x++) {
  for (let y = 0; y < H; y++) {
    const density = densityGrid[x][y];
    
    if (density > LAWN_THRESHOLD) {
      // Zone 1: Confluent — smooth plateau
      heightMap[x][y] = 0.35 + noise(x, y) * 0.05;
    } else if (density > SEMICONFLUENT_THRESHOLD) {
      // Zone 2: Semi-confluent — bumpy merged terrain
      heightMap[x][y] = 0.15 + density/LAWN_THRESHOLD * 0.25 + noise(x,y) * 0.1;
    } else {
      // Zone 3-4: Individual colonies placed by Poisson seeding
      heightMap[x][y] = 0.0; // base agar
    }
  }
}

// Then stamp individual colonies as Gaussian splats
for (const colony of isolatedColonies) {
  stampGaussian(heightMap, colony.x, colony.y, colony.radius, colony.peakHeight);
}
```

---

## Implementation Approach Optimized for AI Tools

### Why WebGL + GLSL is the right choice

1. **AI coding tools understand GLSL well** — it's a well-documented, constrained language
2. **Single-file deployable** — one HTML file with inline shaders
3. **Real-time** — runs at 60fps for interactive light adjustment
4. **All the visual fidelity tools available** — normals, specular, SSS, blending

### Recommended Stack

```
HTML file
├── JavaScript
│   ├── Data texture generation (colony heightmap, color, material masks)
│   ├── WebGL 2.0 context setup
│   ├── Texture upload (Float32 textures via texImage2D)
│   └── Uniform management (light position, material params)
├── Vertex Shader (trivial: fullscreen quad)
└── Fragment Shader (the magic)
    ├── Heightmap → Normal computation
    ├── Blinn-Phong diffuse + specular
    ├── Fake SSS (neighborhood sampling)
    ├── Hemolysis zone coloring
    ├── Fresnel rim glow on colony edges
    └── Compositing + tone mapping
```

### Alternative: Three.js ShaderMaterial on a Plane

If raw WebGL is too much boilerplate, use Three.js with a `ShaderMaterial` on a `PlaneGeometry`:

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    heightMap: { value: heightTexture },
    colonyColor: { value: colorTexture },
    materialMask: { value: maskTexture },
    lightPos: { value: new THREE.Vector3(0.3, 0.3, 1.0) },
    // ...
  },
  vertexShader: vertexCode,
  fragmentShader: fragmentCode
});
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
```

Three.js handles the WebGL boilerplate (context, texture management, uniforms) while you focus entirely on the GLSL shader. **This is probably the best balance of power and AI-tool friendliness.**

---

## Key Visual Details That Make or Break Realism

### 1. The specular highlight shape
Real lab overhead fluorescent lights create **elongated rectangular** specular highlights, not circular point-light specs. Use an anisotropic or area light model, or at minimum, 2-3 point lights in a row.

### 2. The agar edge ring
Blood agar is slightly translucent at the thin edges near the petri dish rim. You see a darker ring where the agar meets the dish wall (meniscus shadow), and the agar is thinner and more translucent there.

### 3. Streak line texture
The loop doesn't just deposit bacteria — it also physically scores the agar surface, creating visible groove lines. These are subtle depressions that catch light differently. Add them as slight negative values in the heightmap along the streak path.

### 4. Colony edge glow (SSS)
The most telltale sign of a real photo vs a render: at the edges of translucent colonies, especially on blood agar, light passes through the thin colony edge and the agar beneath, creating a warm **red-orange glow** at colony margins. This is subsurface scattering in miniature.

### 5. Moisture/condensation
Fresh plates have a thin water film. This manifests as very high specularity across the entire surface — the agar acts almost like a wet mirror at glancing angles.

### 6. Colony size distribution
In real plates, colonies follow a **log-normal size distribution** — most are similar size, but a few are notably larger (from clumps of cells) and many tiny ones are scattered. Don't make them all identical.

---

## Approximate RGB Values for Key Materials (from real photographs)

| Material | RGB | Notes |
|---|---|---|
| Blood agar base (5% sheep) | (155, 35, 35) | Deep cherry-red |
| Blood agar (thin/edge) | (180, 60, 50) | More translucent, slightly orange |
| β-hemolysis clear zone | (195, 175, 130) | Straw/amber, very clear |
| α-hemolysis zone | (95, 105, 75) | Olive-green, murky |
| S. aureus colony | (210, 170, 60) | Golden-yellow |
| E. coli colony | (185, 180, 165) | Grey-white |
| K. pneumoniae colony | (190, 185, 165) | Grey-white, very wet-looking |
| S. pyogenes colony | (200, 195, 190) | Translucent white |
| Streak groove in agar | (140, 30, 30) | Slightly darker than base (shadow) |
| Specular highlight | (255, 245, 230) | Warm white (not pure white) |
| Petri dish plastic rim | (200, 200, 200) | Light grey, semi-transparent |

---

## Summary: The Minimum Viable Shader

For a convincing result, you need **at minimum**:

1. ✅ Heightmap from colony data → normals via central difference
2. ✅ Diffuse lighting (N·L) from overhead light
3. ✅ Specular highlights (Blinn-Phong, shininess varies by material)
4. ✅ Base color blending (agar + colony + hemolysis)
5. ✅ Ambient occlusion approximation (darken where colonies meet agar)
6. ⭐ Fake SSS (red glow in thin/empty areas) ← this is what makes it look *real*
7. ⭐ Fresnel rim glow on colony edges ← subtle but critical
8. ⭐ Streak groove rendering in heightmap ← sells the "it was streaked" look

Items marked ⭐ are what separate "decent" from "photorealistic."
