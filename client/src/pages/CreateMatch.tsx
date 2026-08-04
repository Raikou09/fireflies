import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateMatch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const communityId = new URLSearchParams(window.location.search).get("community") || undefined;
  const [form, setForm] = useState({ courtId: "", sport: "", matchDate: "", startTime: "", duration: "1", totalSpots: "", notes: "" });

  const { data: courts = [] } = useQuery<any[]>({
    queryKey: ["/api/courts"],
    queryFn: async () => { const r = await fetch("/api/courts", { credentials: "include" }); return r.ok ? r.json() : []; },
  });

  const selectedCourt = courts.find((c) => c.id === form.courtId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/matches", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ ...form, duration: parseInt(form.duration), totalSpots: parseInt(form.totalSpots), communityId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: (match) => { toast({ title: "Match created!" }); setLocation(`/matches/${match.id}`); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canSubmit = form.courtId && form.sport && form.matchDate && form.startTime && form.totalSpots;
  const estPerSpot = selectedCourt && form.totalSpots
    ? ((Number(selectedCourt.hourlyRate) * parseInt(form.duration || "1")) / parseInt(form.totalSpots)).toFixed(0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader><CardTitle className="text-2xl">Create a Match</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Court</Label>
              <Select value={form.courtId} onValueChange={(v) => setForm({ ...form, courtId: v, sport: "" })}>
                <SelectTrigger><SelectValue placeholder="Select a court" /></SelectTrigger>
                <SelectContent>{courts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.area}, {c.city}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedCourt && (
              <div>
                <Label>Sport</Label>
                <Select value={form.sport} onValueChange={(v) => setForm({ ...form, sport: v })}>
                  <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                  <SelectContent>{(selectedCourt.availableSports || []).map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.matchDate} onChange={(e) => setForm({ ...form, matchDate: e.target.value })} /></div>
              <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration (hours)</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3].map((h) => <SelectItem key={h} value={String(h)}>{h} hour{h>1?"s":""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Total Players</Label><Input type="number" min="2" placeholder="e.g. 8" value={form.totalSpots} onChange={(e) => setForm({ ...form, totalSpots: e.target.value })} /></div>
            </div>
            <div><Label>Notes (optional)</Label><Input placeholder="e.g. friendly game, all levels welcome" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {estPerSpot && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center"><p className="text-sm text-gray-600">Each player pays</p><p className="text-2xl font-bold text-green-600">KES {estPerSpot}</p></div>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocation("/matches")}>Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? "Creating..." : "Create Match"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
