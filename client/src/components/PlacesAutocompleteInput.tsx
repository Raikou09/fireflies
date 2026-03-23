import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface PlacesAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (result: PlaceResult) => void;
  placeholder?: string;
  id?: string;
  "data-testid"?: string;
}

export function PlacesAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing an address...",
  id,
  "data-testid": dataTestId,
}: PlacesAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptStatus = useGoogleMapsScript();

  useEffect(() => {
    if (scriptStatus !== "ready") return;
    if (!inputRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "ke" },
      fields: ["formatted_address", "geometry", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const address = place.formatted_address || place.name || inputRef.current?.value || "";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      onChange(address);
      onPlaceSelect({ address, lat, lng });
    });

    autocompleteRef.current = autocomplete;
  }, [scriptStatus]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        data-testid={dataTestId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={scriptStatus === "loading" ? "Loading address search..." : placeholder}
      />
      {scriptStatus === "error" && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-gray-400 mt-1">
          Address suggestions unavailable — type address manually.
        </p>
      )}
    </div>
  );
}
