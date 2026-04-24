# Ubica2 Design System (Interface Design)

## 🎨 Intent & Feel
- **Intent:** Explorador Urbano Profesional.
- **Feel:** Orgánico pero de alta precisión. Cálido, denso y sofisticado.

## 🧱 Token Architecture

### 🌓 Theme Primitives (Auto-adaptive)
| Token | Light Value | Dark Value | Role |
| :--- | :--- | :--- | :--- |
| `--ink-primary` | `#0f172a` | `#f8fafc` | Main readable text |
| `--ink-secondary`| `#475569` | `#94a3b8` | Metadata and descriptors |
| `--ink-muted` | `#94a3b8` | `#475569` | Placeholders and disabled |
| `--ink-on-primary` | `#ffffff` | `#0f172a` | Text on primary actions |
| `--surface-main` | `#fcfcfd` | `#0f172a` | Page background |
| `--surface-card` | `#ffffff` | `#1e293b` | Component background |
| `--surface-soft` | `#f8fafc` | `#334155` | Secondary surfaces / subtle shifts |
| `--border-quiet` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | Standard separation |
| `--identity-glow`| `#6366f1` | `#818cf8` | Brand primary |
| `--identity-glow-hover`| `#4f46e5` | `#6366f1` | Brand hover state |
| `--identity-surface`| `rgba(99, 102, 241, 0.1)` | `rgba(129, 140, 248, 0.15)` | Brand subtle background |

### 📐 Spacing & Geometry
- **Base Unit:** `4px`
- **Scale:** `4, 8, 12, 16, 24, 32, 48, 64`
- **Radius:** `sm: 8px, md: 12px, lg: 24px, pill: 100px`

### 🌑 Depth Strategy
- **Approach:** Layered Shadows (approachable but professional).
- **Control Shadow:** `0 1px 2px 0 rgba(0,0,0,0.05)`
- **Presence Shadow:** `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)`

### 🖋️ Typography
- **Display:** `Fraunces` (Títulos, Headers de sección). tracking: `-0.02em`.
- **Sans:** `Manrope` (Cuerpo, Labels, Controles).
- **Weight Progression:** `400 (Body), 600 (Semidark), 700 (Bold), 800 (Display Weight)`.

## 🔄 Interaction States
- **Hover:** `TranslateY(-1px)` + `Identity Surface Background`.
- **Active / Primary Push:** `TranslateY(0)` + `Scale(0.98)`.
- **Focus:** `2px ring` using `--identity-glow` with `4px offset`.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (elegant, natural motion).

## 📦 Component Patterns

### Cards
```scss
.card {
  background: var(--surface-card);
  border: 1px solid var(--border-quiet);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}
```

### Primary Button
```scss
.btn-primary {
  background: var(--identity-glow);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  
  &:hover {
    background: var(--identity-glow-hover);
    transform: translateY(-1px);
  }
}
```

### Ghost Button
```scss
.btn-ghost {
  background: var(--surface-soft);
  color: var(--ink-primary);
  border: 1px solid var(--border-quiet);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  
  &:hover {
    background: var(--border-quiet);
  }
}
```

### Form Inputs
```scss
input, select, textarea {
  background: var(--surface-main);
  color: var(--ink-primary);
  border: 1px solid var(--border-quiet);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  
  &:focus {
    outline: none;
    border-color: var(--identity-glow);
    box-shadow: 0 0 0 3px var(--identity-surface);
  }
  
  &::placeholder {
    color: var(--ink-muted);
  }
}
```

### Error/Success States
```scss
.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.success {
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}
```

## 🎯 Animation Guidelines
- **Page Load:** `fadeUp` animation for smooth entrance.
- **Duration:** `0.2s - 0.5s` for micro-interactions, `0.8s` for page-level.
- **Easing:** Always use `cubic-bezier(0.16, 1, 0.3, 1)`.

## 🚫 Rejections (Never use)
- `!important` color overrides.
- Pure black `#000` or Pure white cards on white backgrounds.
- Default browser `<select>` or `<input>`.
- Hard-coded hex colors instead of design tokens.
- `var(--text-main)`, `var(--text-soft)`, `var(--bg-soft)` - use tokens from this system.
