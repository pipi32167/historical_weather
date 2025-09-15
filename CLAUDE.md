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

### API Caching
- **Persistent localStorage caching**: All API requests are automatically cached to localStorage for persistence across page refreshes
- **Cache TTL settings**:
  - Historical data: 7 days (data doesn't change)
  - Geocoding results: 7 days (stable location data)  
  - Current weather: 10 minutes (frequently changing data)
  - Forecast data: 1 hour (moderately changing data)
  - Search results: 30 minutes (user experience optimization)
- **Storage management**: 
  - Maximum cache size: 50MB
  - Automatic cleanup of oldest items when storage limit reached
  - Automatic cleanup of expired items every minute
  - Fallback to memory-only mode if localStorage unavailable
- **Cache keys**: Automatically generated based on coordinates, dates, parameters, and API endpoint
- **Error handling**: Corrupted cache entries are automatically removed

### API Rate Limiting & Retry Strategy
- **Maximum retry limit**: All API calls must implement a maximum of 3 retries to prevent rate limiting (429 errors)
- **Exponential backoff**: Use exponential backoff for retries (1s, 2s, 4s delays)
- **Retry state management**: Track retry counts and provide user feedback during retry attempts
- **Graceful failure**: After max retries, provide clear error messages and manual retry options

## React Development Best Practices

### Preventing Infinite Render Loops
**CRITICAL**: This codebase has experienced multiple instances of infinite render loops causing excessive API calls. Follow these guidelines strictly:

#### Common Causes of Infinite Loops:
1. **useEffect dependency arrays with unstable references**:
   - Objects, arrays, or functions created inline in dependency arrays
   - Store setters (like Zustand setters) that change on every render
   - Component state that gets updated inside the useEffect

2. **State updates triggering their own useEffect**:
   - Setting state inside useEffect that is listed as a dependency
   - Updating location/data that triggers the same useEffect to run again

#### Prevention Strategies:
1. **Wrap functions with useCallback**:
   ```typescript
   const stableFunction = useCallback(() => {
     // function logic
   }, [dependencies]);
   ```

2. **Minimize useEffect dependencies**:
   - Only include values that actually need to trigger the effect
   - Use eslint-disable when dependencies are stable but ESLint complains
   - Prefer multiple focused useEffects over one complex one

3. **Guard against unnecessary re-runs**:
   ```typescript
   useEffect(() => {
     if (shouldRun && !isAlreadyRunning) {
       // effect logic
     }
   }, [shouldRun, isAlreadyRunning]);
   ```

4. **State initialization patterns**:
   - Check if state is already initialized before making API calls
   - Use flags like `isInitialized` to prevent repeated initialization
   - Reset state flags when conditions change (location, date, etc.)

#### Warning Signs:
- Console showing repeated API calls
- Network tab showing continuous requests
- 429 (Rate Limit) errors from APIs
- Browser becoming unresponsive
- React DevTools showing excessive re-renders

#### Testing for Infinite Loops:
- Monitor network tab during development
- Watch console for repeated log messages
- Use React DevTools Profiler to identify excessive renders
- Test with different user flows (location changes, date changes, page refresh)

#### Specific Examples from This Project:

**❌ WRONG - Causes infinite loop:**
```typescript
useEffect(() => {
  if (latitude && longitude) {
    // This updates currentLocation, which is in dependencies
    setCurrentLocation(newLocation);
  }
}, [latitude, longitude, currentLocation, setCurrentLocation]);
```

**✅ CORRECT - Prevents infinite loop:**
```typescript
useEffect(() => {
  if (latitude && longitude && !locationInitialized) {
    setCurrentLocation(newLocation);
    setLocationInitialized(true);
  }
}, [latitude, longitude, locationInitialized]); // eslint-disable-line react-hooks/exhaustive-deps
```

**❌ WRONG - Multiple state updates trigger re-renders:**
```typescript
useEffect(() => {
  loadData(); // This calls API and updates state
}, [selectedDate, currentLocation]); // Runs every time location changes

useEffect(() => {
  setCurrentLocation(newLoc); // This triggers the above useEffect
}, [geolocation]);
```

**✅ CORRECT - Guard against unnecessary calls:**
```typescript
useEffect(() => {
  if (locationInitialized && currentLocation) {
    loadData();
  }
}, [selectedDate, currentLocation, locationInitialized]);

useEffect(() => {
  if (!locationInitialized && geolocation) {
    setCurrentLocation(newLoc);
    setLocationInitialized(true);
  }
}, [geolocation, locationInitialized]);
```