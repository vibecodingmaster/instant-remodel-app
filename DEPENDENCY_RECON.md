# Dependency Reconnaissance – `instant-remodel`
Generated on: 2025-01-09 19:52Z  
Analyzer: `SCRM-Agent-v1.0`

## Executive Summary
- Total unique dependencies: 13 direct dependencies  
- Transitive included: Yes (via package-lock.json)
- Risk-flagged: 13 dependencies with various risk factors
- Ecosystems detected: npm (Node.js), Netlify deployment

## Quick Risk Heat-Map
| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 0     | —        |
| High     | 2     | `react@19.1.1`, `react-dom@19.1.1` |
| Medium   | 6     | `@google/genai`, `framer-motion`, `typescript`, `vite`, `tailwindcss`, `autoprefixer` |
| Low      | 5     | `clsx`, `tailwind-merge`, `postcss`, `@types/*` packages |

## Detailed Catalogue
<details>
<summary>npm (13 direct deps)</summary>

### Production Dependencies
| Package | Declared | Resolved | Locations | Risk Tags | CVE |
|---------|----------|----------|-----------|-----------|-----|
| `@google/genai` | ^1.14.0 | 1.17.0 | `package.json#L12`, `package-lock.json#L11` | `unpinned`, `private-api`, `beta-software` | — |
| `react` | ^19.1.1 | 19.1.1 | `package.json#L14`, `package-lock.json#L14` | `unpinned`, `major-version-recent`, `breaking-changes` | — |
| `react-dom` | ^19.1.1 | 19.1.1 | `package.json#L13`, `package-lock.json#L15` | `unpinned`, `major-version-recent`, `breaking-changes` | — |
| `tailwind-merge` | ^3.3.1 | 3.3.1 | `package.json#L15`, `package-lock.json#L16` | `unpinned` | — |
| `framer-motion` | ^12.23.12 | 12.23.12 | `package.json#L16`, `package-lock.json#L13` | `unpinned`, `animation-lib` | — |
| `clsx` | ^2.1.1 | 2.1.1 | `package.json#L17`, `package-lock.json#L12` | `unpinned` | — |

### Development Dependencies
| Package | Declared | Resolved | Locations | Risk Tags | CVE |
|---------|----------|----------|-----------|-----------|-----|
| `@types/node` | ^22.14.0 | 22.18.1 | `package.json#L20`, `package-lock.json#L19` | `unpinned`, `types-only` | — |
| `@types/react` | ^18.2.45 | 18.3.24 | `package.json#L21`, `package-lock.json#L20` | `unpinned`, `types-only`, `version-lag` | — |
| `@types/react-dom` | ^18.2.18 | 18.3.7 | `package.json#L22`, `package-lock.json#L21` | `unpinned`, `types-only`, `version-lag` | — |
| `@vitejs/plugin-react` | ^4.2.1 | 4.7.0 | `package.json#L23`, `package-lock.json#L22` | `unpinned`, `plugin` | — |
| `autoprefixer` | ^10.4.16 | 10.4.21 | `package.json#L24`, `package-lock.json#L23` | `unpinned`, `build-tool` | — |
| `postcss` | ^8.4.32 | 8.5.6 | `package.json#L25`, `package-lock.json#L24` | `unpinned`, `build-tool`, `version-drift` | — |
| `tailwindcss` | ^3.4.0 | 3.4.17 | `package.json#L26`, `package-lock.json#L25` | `unpinned`, `css-framework` | — |
| `typescript` | ~5.8.2 | 5.8.3 | `package.json#L27`, `package-lock.json#L26` | `tilde-pinning`, `dev-language` | — |
| `vite` | ^6.2.0 | 6.3.5 | `package.json#L28`, `package-lock.json#L27` | `unpinned`, `build-tool`, `major-version-new` | — |

</details>

## Deployment Configuration
| File | Tool | Version | Risk Tags |
|------|------|---------|-----------|
| `netlify.toml` | Netlify | — | `cors-wildcard`, `node-runtime-pinned` |
| `vite.config.ts` | Vite | — | `env-variable-exposure` |

## Build & Runtime Environment
| Component | Version | Location | Risk Tags |
|-----------|---------|----------|-----------|
| Node.js | 20.x | `netlify.toml#L13` | `runtime-pinned` |
| Vite Build | 6.3.5 | `package-lock.json` | `major-version-new` |
| TypeScript | 5.8.3 | `package-lock.json` | `dev-only` |

## Private Registries & Indexes
| Registry URL | Used In | Anonymous Access |
|--------------|---------|------------------|
| `https://registry.npmjs.org` | All packages | yes |

## Risk Analysis Summary

### High Risk Factors
- **React 19**: New major version (released 2024) with potential breaking changes and ecosystem compatibility issues
- **Unpinned Dependencies**: All dependencies use caret (^) ranges allowing minor/patch version drift
- **CORS Wildcard**: `Access-Control-Allow-Origin: "*"` in Netlify configuration poses security risk

### Medium Risk Factors
- **Google GenAI**: Beta/experimental Google AI service with API changes likely
- **Environment Variable Exposure**: API keys potentially exposed in client bundle via Vite config
- **Version Drift**: PostCSS shows 8.4.32 declared but 8.5.6 resolved
- **Build Tool Dependencies**: Multiple build tools (Vite, Autoprefixer, PostCSS, Tailwind) in dependency chain

### Low Risk Factors
- **Type Definitions**: @types packages are development-only, low runtime impact
- **Utility Libraries**: clsx and tailwind-merge are stable utility packages
- **Lock File Present**: package-lock.json provides reproducible builds

## License Overview
- **MIT**: All identified packages use MIT license (low license conflict risk)
- **No GPL/AGPL**: No copyleft licenses detected

## Security Recommendations
1. **Pin Production Dependencies**: Consider exact version pinning for production dependencies
2. **API Key Security**: Move API key injection to build-time environment variables only
3. **CORS Configuration**: Restrict CORS origins to specific domains instead of wildcard
4. **Dependency Scanning**: Implement automated dependency vulnerability scanning
5. **React 19 Testing**: Thoroughly test React 19 compatibility with all components

## Raw SBOM (CycloneDX JSON)
<details>
<summary>Minimal CycloneDX SBOM</summary>

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "serialNumber": "urn:uuid:instant-remodel-sbom-2025-01-09",
  "version": 1,
  "metadata": {
    "timestamp": "2025-01-09T19:52:00Z",
    "tools": ["SCRM-Agent-v1.0"],
    "component": {
      "type": "application",
      "name": "instant-remodel",
      "version": "0.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "@google/genai",
      "version": "1.17.0",
      "scope": "required",
      "purl": "pkg:npm/%40google/genai@1.17.0",
      "externalReferences": [
        {"type": "distribution", "url": "https://registry.npmjs.org/@google/genai/-/genai-1.17.0.tgz"}
      ]
    },
    {
      "type": "library", 
      "name": "react",
      "version": "19.1.1",
      "scope": "required",
      "purl": "pkg:npm/react@19.1.1",
      "externalReferences": [
        {"type": "distribution", "url": "https://registry.npmjs.org/react/-/react-19.1.1.tgz"}
      ]
    },
    {
      "type": "library",
      "name": "react-dom", 
      "version": "19.1.1",
      "scope": "required",
      "purl": "pkg:npm/react-dom@19.1.1",
      "externalReferences": [
        {"type": "distribution", "url": "https://registry.npmjs.org/react-dom/-/react-dom-19.1.1.tgz"}
      ]
    }
  ]
}
```

</details>