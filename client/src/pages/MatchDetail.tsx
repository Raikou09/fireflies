import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, MapPin, Calendar, Clock, Loader2, CheckCircle } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [phone, setPhone] = useState("");

  const { data: match, isLoading } = useQuery<any>({
    queryKey: [`/api/matches/${id}`],
    queryFn: async () => { const r = await fetch(`/api/matches/${id}`, { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
    refetchInterval: 4000,
  });

  const { data: payStatus } = useQuery<any>({
    queryKey: [`/api/matches/${id}/payment-status`],
    queryFn: async () => { const r = await fetch(`/api/matches/${id}/payment-status`, { credentials: "include" }); return r.ok ? r.json() : null; },
    enabled: !!match && match.status === "full",
    refetchInterval: 4000,
  });

  const myId = (user as any)?.id;
  const iAmIn = match?.participants?.some((p: any) => p.userId === myId);
  const iPaid = payStatus?.status === "paid";

  const joinMutation = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/join`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/matches/${id}`] }); toast({ title: "You joined the match!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/leave`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/matches/${id}`] }); toast({ title: "You left the match" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const payMutation = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ phone }) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to pay your share." }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const triggerEarlyM = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/trigger-early`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/matches/${id}`] }); toast({ title: "Started early — players are confirming" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const confirmM = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/confirm`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/matches/${id}`] }); toast({ title: "You're confirmed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const dropM = useMutation({
    mutationFn: async () => { const r = await fetch(`/api/matches/${id}/drop`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/matches/${id}`] }); toast({ title: "You dropped out" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="min-h-screen bg-gray-50"><Navigation userMode="customer" setUserMode={() => {}} /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div></div>;
  if (!match) return <div className="min-h-screen bg-gray-50"><Navigation userMode="customer" setUserMode={() => {}} /><div className="text-center py-20 text-gray-500">Match not found</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Button variant="ghost" className="mb-4" onClick={() => setLocation("/matches")}>← Back to matches</Button>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">{match.sport}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${match.status === "confirmed" ? "bg-blue-100 text-blue-700" : match.status === "full" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>{match.status}</span>
            </div>
            <CardTitle className="text-2xl">{match.courtName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{match.courtArea}, {match.courtCity}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{match.matchDate}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{match.startTime} ({match.duration}h)</span>
            </div>
            {match.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{match.notes}</p>}

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1 text-sm font-medium text-gray-700"><Users className="h-4 w-4" />Players ({match.filledSpots}/{match.totalSpots})</span>
                <span className="text-lg font-bold text-green-600">KES {Number(match.pricePerSpot).toFixed(0)}/person</span>
              </div>
              <div className="space-y-2">
                {match.participants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {p.profileImageUrl ? <img src={p.profileImageUrl} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-200" />}
                      {p.firstName} {p.lastName}
                    </span>
                    {p.paymentStatus === "paid" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
                {Array.from({ length: match.spotsRemaining }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-400"><div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300" />Open spot</div>
                ))}
              </div>
            </div>

            {match.status === "confirmed" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-blue-800">Match confirmed & court booked!</p>
              </div>
            ) : match.status === "confirming" ? (
              (() => {
                const me = match.participants.find((p: any) => p.userId === myId);
                const active = match.participants.filter((p: any) => p.confirmStatus !== "dropped");
                const confirmedCount = active.filter((p: any) => p.confirmStatus === "confirmed").length;
                const droppedCount = match.participants.filter((p: any) => p.confirmStatus === "dropped").length;
                return (
                  <div className="space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                      The creator started early. Your share is now <strong>KES {Number(match.pricePerSpot).toFixed(0)}</strong>. Confirm to lock your spot.
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-700 font-medium">{confirmedCount}/{active.length} confirmed</span>
                      {droppedCount > 0 && <span className="text-red-600">{droppedCount} dropped</span>}
                    </div>
                    {me && me.confirmStatus === "dropped" ? (
                      <div className="bg-gray-50 border rounded-lg p-3 text-center text-gray-500 text-sm">You dropped out of this match</div>
                    ) : me && me.confirmStatus === "confirmed" ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-800 text-sm">You've confirmed — waiting for the rest</div>
                    ) : me ? (
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={confirmM.isPending} onClick={() => confirmM.mutate()}>{confirmM.isPending ? "..." : `Confirm — KES ${Number(match.pricePerSpot).toFixed(0)}`}</Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700" disabled={dropM.isPending} onClick={() => dropM.mutate()}>Drop out</Button>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ) : !iAmIn ? (
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled={joinMutation.isPending || match.spotsRemaining <= 0} onClick={() => joinMutation.mutate()}>
                {match.spotsRemaining <= 0 ? "Match Full" : joinMutation.isPending ? "Joining..." : "Join this Match (free)"}
              </Button>
            ) : match.status === "full" && !iPaid ? (
              <div className="space-y-2">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">All spots filled! Everyone pays their share to confirm the booking.</div>
                <Input placeholder="M-Pesa phone (2547...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button className="w-full bg-green-600 hover:bg-green-700" disabled={payMutation.isPending || !phone} onClick={() => payMutation.mutate()}>
                  {payMutation.isPending ? "Sending..." : `Pay KES ${Number(match.pricePerSpot).toFixed(0)}`}
                </Button>
              </div>
            ) : iPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-800 font-medium">You've paid! Waiting for others…</div>
            ) : (
              <div className="space-y-2">
                {match.creatorId === myId && match.status === "open" && match.filledSpots >= 1 && (
                  <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={triggerEarlyM.isPending} onClick={() => triggerEarlyM.mutate()}>
                    {triggerEarlyM.isPending ? "..." : `Start now with ${match.filledSpots} player${match.filledSpots === 1 ? "" : "s"}`}
                  </Button>
                )}
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled={leaveMutation.isPending} onClick={() => leaveMutation.mutate()}>
                  {leaveMutation.isPending ? "Leaving..." : "Leave Match"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
