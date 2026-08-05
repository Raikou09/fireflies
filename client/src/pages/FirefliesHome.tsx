import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Sparkles } from "lucide-react";

export default function FirefliesHome() {
  const [userMode, setUserMode] = useState<"customer" | "vendor">("customer");
  const [platform] = useState<"sportsbox" | "fireflies">("fireflies");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode={userMode} setUserMode={setUserMode} platform={platform} />
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Fireflies is coming soon</h1>
          <p className="text-gray-600 text-lg">
            Events and experiences are on the way. Check back shortly — in the meantime, book courts and find players over on BookMySpot.
          </p>
        </div>
      </div>
    </div>
  );
}
