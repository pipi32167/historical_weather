# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start development server (runs on http://localhost:3000)
- `npm run build` - Build the project for production
- `npm test` - Run tests in interactive watch mode
- `npm run eject` - Eject from Create React App (irreversible)

### TypeScript
- TypeScript compilation happens automatically during `npm start` and `npm run build`
- No separate typecheck command needed - CRA handles it

### Testing
- `npm test -- --testNamePattern="specific test"` - Run a specific test
- `npm test -- --watchAll=false` - Run tests once without watch mode

## Project Architecture

This is a React TypeScript application bootstrapped with Create React App. The project follows standard CRA conventions:

- **Entry point**: `src/index.tsx` - renders the main App component
- **Main component**: `src/App.tsx` - currently displays the default CRA template
- **Styling**: Uses CSS files (App.css, index.css) and follows standard React CSS patterns
- **Testing**: Uses Jest and React Testing Library (@testing-library/react, @testing-library/jest-dom)
- **Build system**: Uses react-scripts which abstracts webpack, Babel, and TypeScript compilation
- **Type checking**: Configured with strict TypeScript settings in tsconfig.json

### Key Dependencies
- React 19.1.1 with TypeScript support
- TypeScript 5.9.2
- @types packages for React, Node, and Jest
- React Testing Library for component testing
- Web Vitals for performance monitoring

### TypeScript Configuration
- Uses strict mode with comprehensive type checking
- JSX transform: `react-jsx` (modern JSX transform)
- Module resolution: Node.js style
- Target: ES5 for broad browser compatibility
- Includes type definitions for React, DOM, and testing libraries

### Code Style Requirements
- Use explicit return types for React components (`React.ReactElement`)
- Import React when using JSX (for compatibility)
- Use proper TypeScript types for DOM manipulation and event handlers
- Type all props interfaces and function parameters

The application is currently in its initial state with the default CRA template converted to TypeScript and has not been customized for the historical weather use case yet.

## API Guidelines

### Open Meteo API
- **Always use date ranges**: All Open Meteo API calls should use date range parameters (`start_date` and `end_date`) rather than single date requests for consistency and efficiency