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

### Component Development Guidelines

#### Multilingual Support (i18n)
**CRITICAL**: All new components must support internationalization:

1. **Import and Use Translation Hook**:
   ```typescript
   import { useTranslation } from 'react-i18next';
   const { t, i18n } = useTranslation();
   ```

2. **Never Use Hardcoded Text**:
   - Replace all user-facing text with translation keys
   - Use descriptive, hierarchical keys: `t('component.action.description')`
   - Add translation keys to both `zh-CN.json` and `en-US.json`

3. **Handle Dynamic Content**:
   ```typescript
   // Use interpolation for dynamic values
   {t('location.dataRangeValue', { count: 10, start: 2020, end: 2024 })}
   
   // For arrays/lists, create individual keys
   const monthKeys = ['january', 'february', ...];
   const monthName = t(`time.${monthKeys[index]}`);
   ```

4. **Language-Aware API Calls**:
   - Pass `i18n.language` to services that support localization
   - Handle language-specific data formatting
   - Cache API results per language when necessary

#### Component Integration and Interoperability
**CRITICAL**: All components must integrate seamlessly with the existing ecosystem:

1. **State Management Integration**:
   ```typescript
   // Always use global stores for shared state
   import { useLocationStore } from '../store/locationStore';
   const { currentLocation, setCurrentLocation } = useLocationStore();
   
   // Emit changes to parent components via callbacks
   onLocationChange?.(newLocation);
   ```

2. **Prop Interface Design**:
   ```typescript
   interface ComponentProps {
     // Always include callback props for state changes
     onDataChange?: (data: DataType) => void;
     onLocationChange?: (location: Location) => void;
     
     // Support external control
     defaultValue?: ValueType;
     controlled?: boolean;
   }
   ```

3. **Event Propagation**:
   - Use standard event patterns for user interactions
   - Support both controlled and uncontrolled component modes
   - Emit events that other components can subscribe to

4. **Data Flow Requirements**:
   ```typescript
   // Components must react to global state changes
   useEffect(() => {
     // Re-fetch data when location changes
     loadData();
   }, [currentLocation]);
   
   // Components must update global state appropriately
   const handleSelectionChange = (newValue) => {
     setGlobalState(newValue);
     onSelectionChange?.(newValue);
   };
   ```

5. **Cross-Component Communication**:
   - Use shared stores for persistent state (location, preferences)
   - Use prop callbacks for immediate parent-child communication
   - Use context for deep component tree communication
   - Emit custom events for loose coupling when needed

6. **Performance Considerations**:
   ```typescript
   // Wrap functions that may be used as dependencies
   const stableFunction = useCallback(() => {
     // function logic
   }, [dependencies]);
   
   // Memoize expensive computations
   const computedValue = useMemo(() => {
     return expensiveComputation(data);
   }, [data]);
   ```

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

## Internationalization (i18n)

### Implementation
- **Library**: react-i18next + i18next + i18next-browser-languagedetector
- **Supported Languages**: Chinese (zh-CN) and English (en-US)
- **Default Language**: Chinese (zh-CN)
- **Language Detection**: Browser language → localStorage → Navigator → HTML tag

### File Structure
```
src/i18n/
├── index.ts              # i18n configuration
└── locales/
    ├── zh-CN.json        # Chinese translations
    └── en-US.json        # English translations
```

### Usage Guidelines
1. **Import useTranslation hook**:
   ```typescript
   import { useTranslation } from 'react-i18next';
   const { t } = useTranslation();
   ```

2. **Use translation keys**:
   ```typescript
   // Simple translation
   {t('app.title')}
   
   // With interpolation
   {t('homepage.trendDescription', { date: formatDate(date), count: data.length })}
   ```

3. **Language Switcher**: Available in header component
   - Hover/click to show language options
   - Saves selection to localStorage
   - Immediately updates all translated text

### Translation Key Categories
- `app.*` - General application terms
- `navigation.*` - Navigation menu items
- `location.*` - Location-related terms
- `weather.*` - Weather data terms
- `time.*` - Time and date related terms
- `analysis.*` - Data analysis terms
- `homepage.*` - Homepage specific terms
- `errors.*` - Error messages and retry logic
- `language.*` - Language switcher terms

### Adding New Translations
1. Add new keys to both `zh-CN.json` and `en-US.json`
2. Use dot notation for nested organization
3. Use interpolation for dynamic values: `{{variable}}`
4. Keep keys descriptive and organized by feature/component