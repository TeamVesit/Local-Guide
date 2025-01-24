import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import ChatInterface from './components/ChatInterface';
import WeatherWidget from './components/WeatherWidget';
import { ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material';
import './App.css';
import './styles/guide.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff4081',
    },
  },
});

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setUserLocation({ lat: 40.7142, lng: -74.0060 });
            setError('Could not get your location. Using default location.');
            setLoading(false);
          }
        );
      } else {
        setUserLocation({ lat: 40.7142, lng: -74.0060 });
        setError('Geolocation is not supported. Using default location.');
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  const handleLocationSearch = (query) => {
    setSearchQuery(query);
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    if (place?.center) {
      setUserLocation({
        lat: place.center[1],
        lng: place.center[0]
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <div>Loading your location...</div>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="app-container">
        <main className="main-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <Map 
            location={userLocation}
            onPlaceSelect={handlePlaceSelect}
            searchQuery={searchQuery}
          />
          <WeatherWidget 
            location={userLocation}
          />
          <ChatInterface 
            selectedPlace={selectedPlace}
            userLocation={userLocation}
            onLocationSearch={handleLocationSearch}
          />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;