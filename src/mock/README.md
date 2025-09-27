# Mock Data Configuration

This directory contains mock data and configuration for testing the historical weather API without making actual API calls.

## Usage

To enable mock mode for historical weather data:

1. Set the environment variable `REACT_APP_USE_MOCK=true`
2. Ensure you're running in development mode (`NODE_ENV=development`)

### Environment Setup

Create a `.env.local` file in the project root:

```bash
REACT_APP_USE_MOCK=true
```

Or run the development server with the environment variable:

```bash
REACT_APP_USE_MOCK=true npm start
```

## Configuration

The mock configuration is located in `src/mock/config.ts`:

- `enableHistoricalWeatherMock`: Enables/disables mock mode (automatically set based on environment variables)
- `historicalWeatherMockFile`: The mock data file to use (default: `weather_cache_historical_small.json`)

## Mock Data Files

- `weather_cache_historical_small.json`: Sample historical weather data from Shanghai (31.247803, 121.5) for September 1-25, 2025

## How It Works

When mock mode is enabled:

1. The `getHistoricalWeather` function in `openMeteoWeatherService` checks if mock mode is enabled
2. If enabled, it loads and returns data from the mock file instead of making an API call
3. If mock data loading fails, it automatically falls back to the real API
4. Console logs will show 🎭 when mock mode is active

## Benefits

- Avoid API rate limits during development
- Work offline
- Consistent test data
- Faster development iteration
- No risk of API errors during local testing

## Adding New Mock Data

To add new mock data:

1. Create a new JSON file in this directory with the same structure as existing files
2. Update `mockConfig.historicalWeatherMockFile` in `config.ts` to point to your new file
3. Ensure the JSON structure matches the `OpenMeteoHistoricalData` interface