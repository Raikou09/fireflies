import { useState } from "react";
import { MapPin, Volleyball, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBarProps {
  onSearch?: (filters: { location: string; sport: string }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [location, setLocation] = useState("Nairobi");
  const [sport, setSport] = useState("All Sports");

  const handleSearch = () => {
    onSearch?.({ location, sport });
  };

  const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];
  const sports = [
    "All Sports", 
    "Football", 
    "Basketball", 
    "Volleyball", 
    "Tennis", 
    "Netball", 
    "Rugby", 
    "Cricket", 
    "Badminton", 
    "Table Tennis", 
    "Swimming", 
    "Athletics", 
    "Hockey", 
    "Handball", 
    "Squash",
    "Boxing"
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="pl-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
          <div className="relative">
            <Volleyball className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="pl-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sportOption) => (
                  <SelectItem key={sportOption} value={sportOption}>
                    {sportOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-end">
          <Button 
            className="w-full bg-primary text-white hover:bg-green-700"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4 mr-2" />
            Search Courts
          </Button>
        </div>
      </div>
    </div>
  );
}
