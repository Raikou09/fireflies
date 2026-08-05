import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, MapPin, Loader2, Check, Clock, Send, Trash2 } from "lucide-react";

const skillLabel: Record<string, string> = { beginner: "Beginner-friendly", casual: "Casual", competitive: "Competitive", all: "All levels" };

export default function CommunityDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const myId = (user as any)?.id;

  const { data: c, isLoading } = useQuery<any>({
    queryKey: [`/api/communities/${id}`],
    queryFn: async () => { const r = await fetch(`/api/communities/${id}`, { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
    refetchInterval: 6000,
  });

  const inv = () => qc.invalidateQueries({ queryKey: [`/api/communities/${id}`] });

  const { data: allMatches = [] } = useQuery<any[]>({
    queryKey: ["community-matches", id],
    queryFn: async () => { const r = await fetch("/api/matches", { credentials: "include" }); return r.ok ? r.json() : []; },
    refetchInterval: 6000,
  });
  const communityMatches = allMatches.filter((m: any) => m.communityId === id);

  const [draft, setDraft] = useState("");
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["community-chat", id],
    queryFn: async () => { const r = await fetch(`/api/communities/${id}/messages`, { credentials: "include" }); return r.ok ? r.json() : []; },
    refetchInterval: 4000,
  });
  const sendM = useMutation({
    mutationFn: async (text: string) => { const r = await fetch(`/api/communities/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ message: text }) }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => { setDraft(""); qc.invalidateQueries({ queryKey: ["community-chat", id] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMsgM = useMutation({
    mutationFn: async (messageId: string) => { const r = await fetch(`/api/communities/${id}/messages/${messageId}`, { method: "DELETE", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-chat", id] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const joinM = useMutation({ mutationFn: async () => { const r = await fetch(`/api/communities/${id}/join`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); }, onSuccess: (d) => { inv(); toast({ title: d.status === "pending" ? "Request sent — awaiting approval" : "You joined!" }); }, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const leaveM = useMutation({ mutationFn: async () => { const r = await fetch(`/api/communities/${id}/leave`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); }, onSuccess: () => { inv(); toast({ title: "You left the community" }); }, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const approveM = useMutation({ mutationFn: async (targetUserId: string) => { const r = await fetch(`/api/communities/${id}/approve/${targetUserId}`, { method: "POST", credentials: "include" }); if (!r.ok) { const e = await r.json(); throw new Error(e.message); } return r.json(); }, onSuccess: () => { inv(); toast({ title: "Member approved" }); }, onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }) });

  if (isLoading) return <div className="min-h-screen bg-gray-50"><Navigation userMode="customer" setUserMode={() => {}} /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div></div>;
  if (!c) return <div className="min-h-screen bg-gray-50"><Navigation userMode="customer" setUserMode={() => {}} /><div className="text-center py-20 text-gray-500">Community not found</div></div>;

  const isMember = c.members.some((m: any) => m.userId === myId);
  const isPending = c.pendingMembers?.some((m: any) => m.userId === myId);
  const isCreator = c.creatorId === myId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-4" onClick={() => setLocation("/communities")}>← All communities</Button>
        <Card className="overflow-hidden">
          {c.imageUrl && <div className="h-48 bg-gray-100 overflow-hidden"><img src={c.imageUrl} className="w-full h-full object-cover" /></div>}
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">{skillLabel[c.skillLevel]}</span>
              {c.joinPolicy === "request" && <span className="text-xs text-gray-500">Request to join</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
            {c.description && <p className="text-gray-600 mt-2">{c.description}</p>}
            <div className="flex flex-wrap gap-1 mt-3">{(c.sports || []).map((s: string) => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}</div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.memberCount} member{c.memberCount === 1 ? "" : "s"}</span>
              {c.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{c.area ? `${c.area}, ` : ""}{c.city}</span>}
            </div>

            <div className="mt-5">
              {!isMember && !isPending && <Button className="w-full bg-green-600 hover:bg-green-700" disabled={joinM.isPending} onClick={() => joinM.mutate()}>{joinM.isPending ? "..." : c.joinPolicy === "open" ? "Join Community" : "Request to Join"}</Button>}
              {isPending && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center text-orange-800 text-sm flex items-center justify-center gap-2"><Clock className="h-4 w-4" />Request pending approval</div>}
              {isMember && !isCreator && <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled={leaveM.isPending} onClick={() => leaveM.mutate()}>{leaveM.isPending ? "..." : "Leave Community"}</Button>}
              {isCreator && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-800 text-sm">You're the creator of this community</div>}
            </div>

            {isCreator && c.pendingMembers?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pending requests</h3>
                <div className="space-y-2">
                  {c.pendingMembers.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-2 text-sm">{m.profileImageUrl ? <img src={m.profileImageUrl} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-200" />}{m.firstName} {m.lastName}</span>
                      <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700" disabled={approveM.isPending} onClick={() => approveM.mutate(m.userId)}><Check className="h-4 w-4 mr-1" />Approve</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isMember && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Community Matches</h3>
                  <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => setLocation(`/matches/create?community=${id}`)}>+ Create Match</Button>
                </div>
                {communityMatches.length === 0 ? (
                  <p className="text-sm text-gray-500">No matches yet. Create one for the community!</p>
                ) : (
                  <div className="space-y-2">
                    {communityMatches.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => setLocation(`/matches/${m.id}`)}>
                        <div>
                          <span className="text-sm font-medium">{m.sport}</span>
                          <span className="text-xs text-gray-500 ml-2">{m.matchDate} · {m.startTime}</span>
                        </div>
                        <span className="text-xs text-gray-500">{m.filledSpots}/{m.totalSpots} · KES {Number(m.pricePerSpot).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isMember && (
              <div className="mt-6" data-testid="community-chat">
                <h3 className="font-semibold text-gray-900 mb-2">Community Chat</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto p-3 space-y-2 bg-gray-50">
                    {messages.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No messages yet. Say hi!</p>
                    ) : messages.map((m: any) => (
                      <div key={m.id} className="group flex items-start gap-2">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-gray-700">{m.firstName} {m.lastName}</span>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.message}</p>
                        </div>
                        {(m.userId === myId || isCreator) && (
                          <button onClick={() => deleteMsgM.mutate(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity mt-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-t p-2 bg-white">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) sendM.mutate(draft.trim()); }}
                      placeholder="Type a message..."
                      maxLength={1000}
                      className="flex-1 text-sm px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" disabled={sendM.isPending || !draft.trim()} onClick={() => sendM.mutate(draft.trim())}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Messages are kept for 7 days.</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Members ({c.memberCount})</h3>
              <div className="grid grid-cols-2 gap-2">
                {c.members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    {m.profileImageUrl ? <img src={m.profileImageUrl} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-200" />}
                    <span className="truncate">{m.firstName} {m.lastName}</span>
                    {m.role === "creator" && <span className="text-xs text-green-600 ml-auto">Creator</span>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
