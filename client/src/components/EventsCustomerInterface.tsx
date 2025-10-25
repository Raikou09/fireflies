import { useState } from "react";
import EventSearchBar from "./EventSearchBar";
import EventsGrid from "./EventsGrid";

export default function EventsCustomerInterface() {
  const [searchFilters, setSearchFilters] = useState({ 
    city: "All Cities", 
    eventType: "All Events",
    dateFilter: "All Dates"
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (filters: { city: string; eventType: string; dateFilter: string }, query?: string) => {
    setSearchFilters(filters);
    if (query !== undefined) {
      setSearchQuery(query);
    }
  };

  return (
    <div className="events-customer-interface">
      {/* Hero Section with Search - Mobile Optimized */}
      <section className="bg-gradient-to-br from-orange-600 to-pink-600 py-8 md:py-12 px-3 md:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 leading-tight">
            Discover Amazing Events Across Kenya
          </h1>
          <p className="text-base md:text-xl text-orange-100 mb-6 md:mb-8 px-2">
            Find concerts, sports events, theater shows, and conferences in Nairobi, Mombasa, Kisumu and beyond
          </p>
          
          <EventSearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Events Grid - Mobile Optimized */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8">
        <EventsGrid 
          city={searchFilters.city} 
          eventType={searchFilters.eventType}
          dateFilter={searchFilters.dateFilter}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
