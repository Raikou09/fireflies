import { useState } from "react";
import { Search, MapPin, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const EVENT_TYPES = [
  "All Events",
  "Concert",
  "Sports Event",
  "Theater",
  "Conference",
  "Festival",
  "Comedy Show",
  "Exhibition",
  "Workshop",
  "Other"
];

const CITIES = [
  "All Cities",
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret"
];

const DATE_FILTERS = [
  "All Dates",
  "Today",
  "This Weekend",
  "This Week",
  "This Month",
  "Next Month"
];

interface EventSearchBarProps {
  onSearch: (filters: { city: string; eventType: string; dateFilter: string }, query?: string) => void;
}

export default function EventSearchBar({ onSearch }: EventSearchBarProps) {
  const [city, setCity] = useState("All Cities");
  const [eventType, setEventType] = useState("All Events");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch({ city, eventType, dateFilter }, searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            City
          </label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger data-testid="select-city" className="w-full">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c} data-testid={`option-city-${c.toLowerCase().replace(/\s/g, '-')}`}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Tag className="w-4 h-4" />
            Event Type
          </label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger data-testid="select-event-type" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type} data-testid={`option-event-type-${type.toLowerCase().replace(/\s/g, '-')}`}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            When
          </label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger data-testid="select-date-filter" className="w-full">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map((date) => (
                <SelectItem key={date} value={date} data-testid={`option-date-${date.toLowerCase().replace(/\s/g, '-')}`}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Query */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Search className="w-4 h-4" />
            Search
          </label>
          <Input
            data-testid="input-event-search"
            type="text"
            placeholder="Event name, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button 
        data-testid="button-search-events"
        onClick={handleSearch} 
        className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold py-2.5"
      >
        <Search className="w-4 h-4 mr-2" />
        Search Events
      </Button>
    </div>
  );
}
