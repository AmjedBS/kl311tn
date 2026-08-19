import { useState } from 'react';

type Location = {
  lat: string;
  lng: string;
};

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude.toFixed(4),
          lng: longitude.toFixed(4),
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Failed to get location. Please allow location permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearLocation = () => setLocation(null);

  return { location, isLocating, getLocation, clearLocation };
}