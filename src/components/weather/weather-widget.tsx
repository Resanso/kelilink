"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  weathercode: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-6.9744&longitude=107.6303&current_weather=true&timezone=Asia%2FBangkok"
        );
        const data = await res.json();
        setWeather({
          temperature: data.current_weather.temperature,
          weathercode: data.current_weather.weathercode,
        });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) return <div className="text-xs text-muted-foreground">Loading weather...</div>;
  if (!weather) return null;

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2 || code === 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌤️";
  };

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
      <span className="text-lg">{getWeatherIcon(weather.weathercode)}</span>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold text-foreground">{weather.temperature}°C</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Bandung</span>
      </div>
    </div>
  );
}
