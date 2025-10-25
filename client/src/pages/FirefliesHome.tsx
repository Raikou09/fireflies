import { useState } from "react";
import Navigation from "@/components/Navigation";
import EventsCustomerInterface from "@/components/EventsCustomerInterface";

export default function FirefliesHome() {
  const [userMode, setUserMode] = useState<"customer" | "vendor">("customer");
  const [platform] = useState<"sportsbox" | "fireflies">("fireflies");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode={userMode} setUserMode={setUserMode} platform={platform} />
      
      {userMode === "customer" ? (
        <EventsCustomerInterface />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Host Your Event
            </h1>
            <p className="text-xl text-gray-600">
              Create and manage your events with Fireflies
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold mb-4">Vendor Dashboard</h2>
            <p className="text-gray-600">
              Event management features are under development. Check back soon!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
