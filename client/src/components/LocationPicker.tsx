import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Target, AlertCircle, CheckCircle } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  className?: string;
}

export function LocationPicker({ 
  onLocationSelect, 
  initialLat, 
  initialLng, 
  className = "" 
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address?: string} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Default to Nairobi center if no initial location
  const defaultLocation = { lat: -1.2921, lng: 36.8219 };

  useEffect(() => {
      // For now, we'll show a simplified location picker without Google Maps
    // This can be enhanced later with a proper mapping service
    initializeMap();
  }, []);

  const initializeMap = () => {
    // Simplified map initialization - we'll show coordinates input instead
    setIsMapLoaded(true);
  };

  const addMarker = (lat: number, lng: number) => {
    if (!map) return;

    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Add new marker
    const newMarker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      draggable: true,
      title: 'Court Location'
    });

    // Add drag listener
    newMarker.addListener('dragend', () => {
      const position = newMarker.getPosition();
      if (position) {
        handleLocationSelect(position.lat(), position.lng());
      }
    });

    setMarker(newMarker);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationSelect(lat, lng);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          handleLocationSelect(lat, lng);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enter coordinates manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  // Manual coordinate input for location marking
  const handleManualCoordinates = () => {
    const latInput = prompt('Enter Latitude (e.g., -1.2921):');
    const lngInput = prompt('Enter Longitude (e.g., 36.8219):');
    
    if (latInput && lngInput) {
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        handleLocationSelect(lat, lng);
      } else {
        alert('Please enter valid coordinates.');
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Court Location Pin
        </CardTitle>
        <p className="text-sm text-gray-600">
          Mark your court's exact location for accurate customer directions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Use My Location
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualCoordinates}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Enter Coordinates
          </Button>
          
          {selectedLocation && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Location Set
            </Badge>
          )}
        </div>

        {locationError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">{locationError}</p>
            </div>
          </div>
        )}

        {selectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Court Location Coordinates:</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="font-medium">Latitude:</span> {selectedLocation.lat.toFixed(6)}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span> {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
                {selectedLocation.address && (
                  <p className="text-green-700 mt-2">
                    <span className="font-medium">Address:</span> {selectedLocation.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Why location matters:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Customers can easily find your court with GPS navigation</li>
                <li>Shows distance to customers when they search nearby</li>
                <li>Helps with local SEO and court discovery</li>
                <li>Enables location-based booking features</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">How to set location:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>Use My Location:</strong> Automatically detect your current position</li>
                <li><strong>Enter Coordinates:</strong> Manually input latitude/longitude</li>
                <li><strong>Common Kenya coordinates:</strong> Nairobi (-1.2921, 36.8219), Mombasa (-4.0435, 39.6682)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}