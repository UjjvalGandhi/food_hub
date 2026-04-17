export interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
}

export async function getCurrentWeather(city: string = "New Delhi"): Promise<WeatherData> {
  // In a real application, you would call a weather API here (e.g., OpenWeatherMap)
  // For this demonstration, we'll return a simulated weather based on the current hour.
  
  const hour = new Date().getHours();
  
  // Simulated logic:
  // Night: Clear/Cold
  // Day: Clear/Hot
  // Afternoon: Sunny
  
  if (hour >= 20 || hour <= 5) {
    return {
      condition: "Clear",
      temperature: 18,
      description: "Moderate Night"
    };
  } else if (hour >= 11 && hour <= 16) {
    return {
      condition: "Hot",
      temperature: 35,
      description: "Sunny Afternoon"
    };
  } else {
    return {
      condition: "Clear",
      temperature: 25,
      description: "Pleasant"
    };
  }
}
