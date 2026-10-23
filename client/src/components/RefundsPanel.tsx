import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

const money = (a: any) => "KES " + Number(a).toLocaleString("en-KE", { maximumFractionDigits: 2 });

export default function RefundsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: refunds = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/refunds"],
    queryFn: async () => {
      const r = await fetch("/api/admin/refunds", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 5000,
  });

  const processM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/refunds/${id}/process`, { method: "POST", credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Reversal sent", description: "M-Pesa will confirm shortly." });
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/refunds"] });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setConfirmId(null); },
  });

  const pending = refunds.filter((r: any) => r.status === "pending" || r.status === "failed");
  const done = refunds.filter((r: any) => r.status === "sent" || r.status === "processing");

  const badge = (s: string) => {
    const map: any = {
      pending: ["bg-orange-100 text-orange-700", Clock, "Pending"],
      processing: ["bg-blue-100 text-blue-700", RefreshCw, "Processing"],
      sent: ["bg-green-100 text-green-700", CheckCircle, "Refunded"],
      failed: ["bg-red-100 text-red-700", XCircle, "Failed"],
    };
    const [cls, Icon, label] = map[s] || ["bg-gray-100 text-gray-600", AlertCircle, s];
    return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}><Icon className="h-3 w-3" />{label}</span>;
  };

  return (
    <Card className="mb-6 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-orange-600" />
          Refunds
          {pending.length > 0 && <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{pending.length} to process</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : refunds.length === 0 ? (
          <p className="text-sm text-gray-500">No refunds yet. When a customer cancels more than 2 hours before their slot, a full refund appears here for you to send.</p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{money(r.amount)}</span>
                        <span className="text-sm text-gray-600">to {r.customerPhone}</span>
                        {badge(r.status)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {r.reason || "Cancellation refund"} · receipt {r.originalReceipt || "—"}
                        {r.failureReason ? ` · last error: ${r.failureReason}` : ""}
                      </div>
                    </div>
                    {confirmId === r.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" disabled={processM.isPending} onClick={() => processM.mutate(r.id)}>
                          {processM.isPending ? "Sending…" : `Send ${money(r.amount)}`}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 flex-shrink-0" onClick={() => setConfirmId(r.id)}>
                        {r.status === "failed" ? "Retry refund" : "Process refund"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {done.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent</div>
                <div className="space-y-1">
                  {done.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium">{money(r.amount)}</span>
                        <span className="text-gray-500 truncate">to {r.customerPhone}</span>
                      </div>
                      {badge(r.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
