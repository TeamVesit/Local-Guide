import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Tabs, 
  Tab,
  IconButton
} from '@mui/material';
import { 
  WbSunny, 
  Cloud, 
  Opacity, 
  Air,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import axios from 'axios';

const WEATHER_API_KEY = "e1d3ab5bb0c4e56da12b73fc016424a0";

function WeatherWidget({ location }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!location) return;

    const fetchWeatherData = async () => {
      try {
        // Current weather
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        setWeather(weatherResponse.data);

        // 5-day forecast
        const forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        setForecast(forecastResponse.data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeatherData();
  }, [location]);

  if (!weather) return null;

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <WbSunny />;
      case 'clouds':
        return <Cloud />;
      case 'rain':
        return <Opacity />;
      default:
        return <WbSunny />;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="weather-widget">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Weather</Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
          {getWeatherIcon(weather.weather[0].main)}
          <Typography variant="h4">
            {Math.round(weather.main.temp)}°C
          </Typography>
        </Box>

        <Typography>
          {weather.weather[0].main}
        </Typography>

        {expanded && (
          <>
            <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
              <Typography variant="body2">
                Humidity: {weather.main.humidity}%
              </Typography>
              <Typography variant="body2">
                Wind: {weather.wind.speed} m/s
              </Typography>
              <Typography variant="body2">
                Feels like: {Math.round(weather.main.feels_like)}°C
              </Typography>
            </Box>

            {forecast && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">5-Day Forecast</Typography>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
                  {forecast.list
                    .filter((item, index) => index % 8 === 0)
                    .slice(0, 5)
                    .map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          textAlign: 'center',
                          p: 1,
                          minWidth: 60,
                          borderRadius: 1,
                          bgcolor: 'rgba(0,0,0,0.04)'
                        }}
                      >
                        <Typography variant="caption">
                          {formatDate(item.dt)}
                        </Typography>
                        {getWeatherIcon(item.weather[0].main)}
                        <Typography variant="body2">
                          {Math.round(item.main.temp)}°C
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default WeatherWidget;