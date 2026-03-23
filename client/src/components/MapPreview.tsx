import { ExternalLink } from "lucide-react";

interface MapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  className?: string;
}

export function MapPreview({ lat, lng, address, className = "" }: MapPreviewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      {apiKey ? (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x200&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`}
            alt={address ? `Map showing ${address}` : "Court location map"}
            className="w-full h-40 object-cover"
          />
        </a>
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Map preview unavailable
        </div>
      )}
      <div className="flex items-center justify-between p-3 bg-gray-50 text-sm">
        <span className="text-gray-600 truncate flex-1 mr-2">
          {address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
        </span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap font-medium"
          data-testid="link-get-directions"
        >
          <ExternalLink className="h-3 w-3" />
          Get Directions
        </a>
      </div>
    </div>
  );
}
