import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MapPin, Calendar, Clock, Plus, Loader2 } from "lucide-react";

export default function Matches() {
  const [, setLocation] = useLocation();
  const [sportFilter, setSportFilter] = useState("");

  const { data: matches = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const res = await fetch("/api/matches", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const filtered = sportFilter
    ? matches.filter((m) => m.sport.toLowerCase().includes(sportFilter.toLowerCase()))
    : matches;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Players</h1>
            <p className="text-gray-600 mt-1">Join an open match or create your own</p>
          </div>
          <Button onClick={() => setLocation("/matches/create")} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" /> Create Match
          </Button>
        </div>

        <Input placeholder="Filter by sport..." value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="mb-6 max-w-sm" />

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No open matches right now. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m) => (
              <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/matches/${m.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">{m.sport}</span>
                        <span className="text-sm text-gray-500">{m.spotsRemaining} spot{m.spotsRemaining === 1 ? "" : "s"} left</span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">{m.courtName}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{m.courtArea}, {m.courtCity}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{m.matchDate}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{m.startTime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">KES {Number(m.pricePerSpot).toFixed(0)}</p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: `${(m.filledSpots / m.totalSpots) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" />{m.filledSpots}/{m.totalSpots}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
