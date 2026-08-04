import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MapPin, Plus, Loader2, Trophy } from "lucide-react";

const skillLabel: Record<string, string> = { beginner: "Beginner-friendly", casual: "Casual", competitive: "Competitive", all: "All levels" };
const skillColor: Record<string, string> = { beginner: "bg-blue-100 text-blue-700", casual: "bg-green-100 text-green-700", competitive: "bg-orange-100 text-orange-700", all: "bg-gray-100 text-gray-600" };

export default function Communities() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: communities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/communities"],
    queryFn: async () => { const r = await fetch("/api/communities", { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });
  const filtered = search ? communities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.sports || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) : communities;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-bold text-gray-900">Communities</h1><p className="text-gray-600 mt-1">Find your people. Play more.</p></div>
          <Button onClick={() => setLocation("/communities/create")} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" /> Create</Button>
        </div>
        <Input placeholder="Search by name or sport..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-6 max-w-sm" />
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        : filtered.length === 0 ? <div className="text-center py-12 text-gray-500"><Users className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p>No communities yet. Start one!</p></div>
        : <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => setLocation(`/communities/${c.id}`)}>
                {c.imageUrl && <div className="h-32 bg-gray-100 overflow-hidden"><img src={c.imageUrl} className="w-full h-full object-cover" /></div>}
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${skillColor[c.skillLevel]}`}>{skillLabel[c.skillLevel]}</span>
                    {c.joinPolicy === "request" && <span className="text-xs text-gray-500">Request to join</span>}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">{(c.sports || []).map((s: string) => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.memberCount} member{c.memberCount === 1 ? "" : "s"}</span>
                    {c.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{c.area ? `${c.area}, ` : ""}{c.city}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>}
      </div>
    </div>
  );
}
