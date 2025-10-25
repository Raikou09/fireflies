import { useState } from "react";
import Navigation from "@/components/Navigation";
import EventsCustomerInterface from "@/components/EventsCustomerInterface";
import EventsVendorInterface from "@/components/EventsVendorInterface";

export default function FirefliesHome() {
  const [userMode, setUserMode] = useState<"customer" | "vendor">("customer");
  const [platform] = useState<"sportsbox" | "fireflies">("fireflies");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode={userMode} setUserMode={setUserMode} platform={platform} />
      
      {userMode === "customer" ? (
        <EventsCustomerInterface />
      ) : (
        <EventsVendorInterface />
      )}
    </div>
  );
}
