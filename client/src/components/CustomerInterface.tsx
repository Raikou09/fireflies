import { useState } from "react";
import SearchBar from "./SearchBar";
import { LocationAwareCourts } from "./LocationAwareCourts";

export default function CustomerInterface() {
  const [searchFilters, setSearchFilters] = useState({ 
    location: "Nairobi", 
    sport: "All Sports" 
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (filters: { location: string; sport: string }, query?: string) => {
    setSearchFilters(filters);
    if (query !== undefined) {
      setSearchQuery(query);
    }
  };

  return (
    <div className="customer-interface">
      {/* Hero Section with Search - Mobile Optimized */}
      <section className="bg-gradient-to-br from-primary to-secondary py-8 md:py-12 px-3 md:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 leading-tight">
            Book Sports Courts Across Kenya
          </h1>
          <p className="text-base md:text-xl text-blue-100 mb-6 md:mb-8 px-2">
            Find and book courts near you in Nairobi, Mombasa, Kisumu and beyond
          </p>
          
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Location-Aware Courts Grid - Mobile Optimized */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8">
        <LocationAwareCourts 
          city={searchFilters.location} 
          sport={searchFilters.sport}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
