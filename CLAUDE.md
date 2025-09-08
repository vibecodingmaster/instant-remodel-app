# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Architecture

This is a Vite-based React application using TypeScript that provides AI-powered room remodeling through Google's Gemini API. The application uses a secure backend proxy architecture to protect API credentials.

### Key Technology Stack
- **Frontend**: React 19 with TypeScript
- **Bundler**: Vite 7.1.5 with @vitejs/plugin-react
- **Styling**: Tailwind CSS 3.4.0
- **Animations**: Framer Motion 12.23.12
- **AI Integration**: Google GenAI 1.14.0 (@google/genai)
- **Deployment**: Netlify with serverless functions

### Architecture Overview

**Secure API Proxy Pattern:**
- Frontend calls `/api/generate` endpoint (no direct API key exposure)
- Backend serverless function (`api/generate.ts`) securely handles Gemini API calls
- API key stored as `GEMINI_API_KEY` environment variable on server

**Core Application Flow:**
1. User uploads room images via file input
2. User selects style from predefined options (Modern, Scandinavian, Industrial, Bohemian, Farmhouse, Minimalist)
3. Frontend calls secure backend proxy at `/api/generate`
4. Backend processes images through Gemini API with style-specific prompts
5. Generated images displayed in polaroid-style cards with drag-and-drop functionality
6. Album creation feature combines multiple generated images into a photo album layout

### Project Structure

```
/
├── api/
│   └── generate.ts          # Netlify serverless function for Gemini API proxy
├── components/
│   ├── ui/
│   │   └── draggable-card.tsx  # Reusable draggable card component
│   ├── Footer.tsx           # Application footer
│   └── PolaroidCard.tsx     # Styled image display with drag functionality
├── lib/
│   ├── albumUtils.ts        # Canvas-based album page generation utilities
│   └── utils.ts             # General utility functions (clsx wrapper)
├── services/
│   └── geminiService.ts     # Frontend service for secure API calls
├── App.tsx                  # Main application component
├── index.tsx               # React application entry point
└── index.html              # HTML template
```

### Key Components and Services

**App.tsx**: Main application container managing state for uploaded images, generated results, and UI interactions. Implements responsive design with different layouts for mobile/desktop.

**services/geminiService.ts**: Frontend service that makes secure calls to `/api/generate`. Includes comprehensive error handling and user-friendly error messages.

**api/generate.ts**: Netlify serverless function that:
- Validates input parameters
- Calls Google Gemini API securely
- Implements fallback prompts when content is blocked
- Returns processed image data as base64 data URLs

**lib/albumUtils.ts**: Canvas-based utility for generating photo album pages from multiple generated images, with proper image loading and high-resolution output.

**components/PolaroidCard.tsx**: Interactive image display component with:
- Polaroid-style styling
- Framer Motion animations
- Drag-and-drop functionality
- Loading and error states

### Environment Configuration

Required environment variables:
- `GEMINI_API_KEY`: Google Gemini API key (get from https://aistudio.google.com/app/apikey)

Development setup:
1. Copy `.env.example` to `.env.local`
2. Add your Gemini API key to `.env.local`

### Deployment Configuration

**Netlify Configuration** (`netlify.toml`):
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Functions directory: `api`
- Node runtime: 20.x
- API proxy redirects configured for `/api/*` routes
- CORS headers configured for API endpoints

**Path Alias**: `@/*` maps to project root directory (configured in both `vite.config.ts` and `tsconfig.json`)

### Styling and Fonts

- Custom fonts: Caveat and Permanent Marker (cursive fonts for playful UI)
- Tailwind content paths include all TypeScript/JavaScript files in components and lib directories
- Custom button classes defined in App.tsx for consistent styling across the application