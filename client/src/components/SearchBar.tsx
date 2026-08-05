import { useState } from "react";
import { MapPin, Volleyball, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBarProps {
  onSearch?: (filters: { location: string; sport: string }, query?: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [location, setLocation] = useState("Nairobi");
  const [sport, setSport] = useState("All Sports");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch?.({ location, sport }, searchQuery);
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
    "Pickleball",
    "Padel",
    "Golf"
  ];

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        <div className="relative md:col-span-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Court name, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 md:h-11"
              data-testid="input-search-query"
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="pl-10 h-10 md:h-11" data-testid="select-location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city} data-testid={`option-location-${city}`}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Sport</label>
          <div className="relative">
            <Volleyball className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="pl-10 h-10 md:h-11" data-testid="select-sport-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sportOption) => (
                  <SelectItem key={sportOption} value={sportOption} data-testid={`option-sport-${sportOption}`}>
                    {sportOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-end">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-lg transform transition hover:scale-105 h-10 md:h-11"
            onClick={handleSearch}
            data-testid="button-search"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Find Courts</span>
            <span className="sm:hidden">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
