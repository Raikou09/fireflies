import { useState } from "react";
import Navigation from "@/components/Navigation";
import CustomerInterface from "@/components/CustomerInterface";
import VendorInterface from "@/components/VendorInterface";

export default function Home() {
  const [userMode, setUserMode] = useState<"customer" | "vendor">("customer");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode={userMode} setUserMode={setUserMode} />
      
      {userMode === "customer" ? (
        <CustomerInterface />
      ) : (
        <VendorInterface />
      )}
    </div>
  );
}
