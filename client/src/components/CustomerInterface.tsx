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
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-primary to-secondary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book Sports Courts Across Kenya
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Find and book courts near you in Nairobi, Mombasa, Kisumu and beyond
          </p>
          
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Location-Aware Courts Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LocationAwareCourts 
          city={searchFilters.location} 
          sport={searchFilters.sport}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
