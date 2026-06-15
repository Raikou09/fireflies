import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Trash2, Plus, UserCheck } from "lucide-react";

export default function AdminManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const { data: admins = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      const res = await fetch("/api/admin/admins", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: showPanel,
  });

  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin added", description: newEmail + " can now access the Ops Center." });
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(email)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            Admin Management
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowPanel(!showPanel)}>
            {showPanel ? "Hide" : "Manage Admins"}
          </Button>
        </div>
      </CardHeader>
      {showPanel && (
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="newadmin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newEmail && addMutation.mutate(newEmail)}
            />
            <Button onClick={() => newEmail && addMutation.mutate(newEmail)}
              disabled={addMutation.isPending || !newEmail}
              className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {admins.map((admin: any) => (
              <div key={admin.email} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${admin.role === "owner" ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="text-sm font-medium">{admin.email}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${admin.role === "owner" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"}`}>
                    {admin.role}
                  </span>
                </div>
                {admin.role !== "owner" && (
                  <Button variant="ghost" size="sm"
                    onClick={() => removeMutation.mutate(admin.email)}
                    disabled={removeMutation.isPending}
                    className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
