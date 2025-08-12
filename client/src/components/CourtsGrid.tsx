import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, Filter, Map } from "lucide-react";
import BookingModal from "./BookingModal";
import type { CourtWithDetails } from "@shared/schema";

interface CourtsGridProps {
  filters: { city: string; sport: string };
}

export default function CourtsGrid({ filters }: CourtsGridProps) {
  const [selectedCourt, setSelectedCourt] = useState<CourtWithDetails | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: courts = [], isLoading, refetch } = useQuery<CourtWithDetails[]>({
    queryKey: ["/api/courts", filters.city, filters.sport],
    refetchInterval: false,
    staleTime: 0,
  });



  const handleBookCourt = (court: CourtWithDetails) => {
    setSelectedCourt(court);
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Courts in {filters.city}
            </h2>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Button>
            </div>
          </div>


          {courts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No courts found. Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court: CourtWithDetails) => (
                <Card 
                  key={court.id} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleBookCourt(court)}
                >
                  <img 
                    src={court.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250"} 
                    alt={court.name}
                    className="w-full h-48 object-cover"
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>
                      <span className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4" />
                        <span className="ml-1 text-sm font-medium">{court.rating || "4.5"}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {court.area}, {court.city}
                    </p>
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {court.availableSports?.slice(0, 3).map((sport, index) => (
                          <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            {sport}
                          </span>
                        ))}
                        {court.availableSports?.length > 3 && (
                          <span className="text-gray-500 text-xs">+{court.availableSports.length - 3} more</span>
                        )}
                      </div>
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {court.openingTime} - {court.closingTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">KES {court.hourlyRate}</span>
                        <span className="text-sm text-gray-500">/hour</span>
                      </div>
                      <Button 
                        className="bg-primary text-white hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookCourt(court);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <BookingModal
        court={selectedCourt}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedCourt(null);
        }}
      />
    </>
  );
}
