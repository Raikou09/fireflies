import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SPORTS = ["Football", "Basketball", "Cricket", "Tennis", "Badminton", "Volleyball", "Netball", "Swimming", "Athletics", "Pickleball", "Padel", "Golf"];

export default function CreateCommunity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", sports: [] as string[], skillLevel: "all", city: "", area: "", joinPolicy: "open" });
  const [uploading, setUploading] = useState(false);

  const toggleSport = (s: string) => setForm((f) => ({ ...f, sports: f.sports.includes(s) ? f.sports.filter((x) => x !== s) : [...f.sports, s] }));

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/objects/upload-file", { method: "POST", body: fd, credentials: "include" });
      if (!r.ok) throw new Error("Upload failed");
      const d = await r.json(); setForm((f) => ({ ...f, imageUrl: d.url }));
    } catch { toast({ title: "Image upload failed", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/communities", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json();
    },
    onSuccess: (c) => { toast({ title: "Community created!" }); setLocation(`/communities/${c.id}`); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader><CardTitle className="text-2xl">Create a Community</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Name</Label><Input placeholder="e.g. Nairobi Sunday Ballers" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} placeholder="What's your community about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Cover Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-24 rounded-lg object-cover" />}
            </div>
            <div>
              <Label>Sports</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SPORTS.map((s) => <button key={s} type="button" onClick={() => toggleSport(s)} className={`text-sm px-3 py-1 rounded-full border ${form.sports.includes(s) ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"}`}>{s}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Skill Level</Label>
                <Select value={form.skillLevel} onValueChange={(v) => setForm({ ...form, skillLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All levels</SelectItem><SelectItem value="beginner">Beginner-friendly</SelectItem><SelectItem value="casual">Casual</SelectItem><SelectItem value="competitive">Competitive</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Join Policy</Label>
                <Select value={form.joinPolicy} onValueChange={(v) => setForm({ ...form, joinPolicy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open (anyone joins)</SelectItem><SelectItem value="request">Request to join</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input placeholder="Nairobi" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Area</Label><Input placeholder="Westlands" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocation("/communities")}>Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!form.name || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
