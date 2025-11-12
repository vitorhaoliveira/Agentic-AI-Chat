import type { WeatherData } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';

const logger = createLogger('weather-tool');

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Region
  admin2?: string; // County/District
}

interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

// Weather code descriptions (WMO Weather interpretation codes)
const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function normalizeLocation(location: string): string {
  // Remove acentos e normaliza
  return location
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function geocodeLocation(location: string): Promise<GeocodingResult> {
  const normalized = normalizeLocation(location);
  
  // Only prioritize Brazil if query explicitly mentions Brazilian-specific terms
  const brazilianStates = ['bahia', 'sao paulo', 'rio de janeiro', 'parana', 'minas gerais', 'ceara', 'pernambuco', 'santa catarina', 'goias', 'maranhao'];
  const brazilianCities = ['salvador', 'brasilia', 'fortaleza', 'recife', 'curitiba', 'manaus', 'belo horizonte', 'porto alegre', 'campinas', 'guarulhos'];
  
  const normalizedLower = normalized.toLowerCase();
  
  // Check if it's a Brazilian state (not just a city)
  const isBrazilianState = brazilianStates.some(state => normalizedLower === state || normalizedLower.includes(state + ' '));
  // Check if explicitly mentions Brazil
  const mentionsBrazil = normalizedLower.includes('brazil') || normalizedLower.includes('brasil');
  // Check if it's a uniquely Brazilian city
  const isUniqueBrazilianCity = brazilianCities.some(city => normalizedLower === city || normalizedLower.includes(city));
  
  const shouldPrioritizeBrazil = isBrazilianState || mentionsBrazil || isUniqueBrazilianCity;
  
  try {
    // Search with Portuguese language for better results
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalized)}&count=5&language=pt&format=json`;
    let response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API returned status ${response.status}: ${response.statusText}`);
    }
    
    let data = (await response.json()) as { results?: GeocodingResult[]; error?: boolean; reason?: string };

    // Check for API errors
    if (data.error || data.reason) {
      throw new Error(`Geocoding API error: ${data.reason || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      // If no results and it's a Brazilian city, try with "Brazil" suffix
      if (shouldPrioritizeBrazil) {
        url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalized + ' Brazil')}&count=5&language=pt&format=json`;
        response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Geocoding API returned status ${response.status}: ${response.statusText}`);
        }
        
        data = (await response.json()) as { results?: GeocodingResult[]; error?: boolean; reason?: string };
        
        if (data.error || data.reason) {
          throw new Error(`Geocoding API error: ${data.reason || 'Unknown error'}`);
        }
      }
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`Location "${location}" not found. Try using just the city name.`);
      }
    }

    if (data.results && data.results.length > 0) {
      // Only prioritize Brazil if we detected Brazilian-specific terms
      if (shouldPrioritizeBrazil) {
        const brazilResult = data.results.find(r => 
          r.country === 'Brazil' || 
          r.country === 'Brasil' ||
          r.country === 'BR'
        );
        
        if (brazilResult) {
          return brazilResult;
        }
      }
      
      // Use the most relevant result (first one)
      return data.results[0];
    }

    throw new Error(`Location "${location}" not found. Try using just the city name.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage, location: normalized }, 'Geocoding failed');
    throw error;
  }
}

export async function getWeather(location: string): Promise<WeatherData> {
  logger.info({ location }, 'Fetching weather data');

  try {
    // First, geocode the location
    const geo = await geocodeLocation(location);
    logger.debug({ location, latitude: geo.latitude, longitude: geo.longitude }, 'Location geocoded');

    // Then get the weather
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = (await response.json()) as WeatherResponse & { error?: boolean; reason?: string };

    // Check for API errors
    if (data.error || data.reason) {
      throw new Error(`Weather API error: ${data.reason || 'Unknown error'}`);
    }

    // Validate response structure
    if (!data.current) {
      throw new Error('Weather API returned invalid response: missing current data');
    }

    if (typeof data.current.temperature_2m !== 'number' ||
        typeof data.current.relative_humidity_2m !== 'number' ||
        typeof data.current.wind_speed_10m !== 'number' ||
        typeof data.current.weather_code !== 'number') {
      throw new Error('Weather API returned invalid response: missing required fields');
    }

    const weatherCode = data.current.weather_code;
    const conditions = weatherDescriptions[weatherCode] || 'Unknown';

    // Build comprehensive location string with city, state, country
    let locationParts = [geo.name];
    
    // Add state/region if available (e.g., "Salvador, Bahia, Brazil")
    if (geo.admin1 && geo.admin1 !== geo.name) {
      locationParts.push(geo.admin1);
    }
    
    // Add country if not already included
    if (!locationParts.join(', ').includes(geo.country)) {
      locationParts.push(geo.country);
    }
    
    const locationStr = locationParts.join(', ');

    // Round values for better readability
    const temperature = Math.round(data.current.temperature_2m * 10) / 10; // 1 decimal place
    const humidity = Math.round(data.current.relative_humidity_2m);
    const windSpeed = Math.round(data.current.wind_speed_10m * 10) / 10; // 1 decimal place

    const weatherData = {
      location: locationStr,
      temperature,
      conditions,
      humidity,
      windSpeed,
    };

    logger.info({ location: locationStr, temperature, conditions }, 'Weather data fetched successfully');

    return weatherData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ 
      error: errorMessage, 
      errorStack,
      location 
    }, 'Failed to fetch weather data');
    throw new Error(`Failed to get weather for "${location}": ${errorMessage}`);
  }
}

