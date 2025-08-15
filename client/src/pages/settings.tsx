import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [vapiPrivateKey, setVapiPrivateKey] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [defaultCustomerNumber, setDefaultCustomerNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const headers: Record<string, string> = authHeader();
        const res = await fetch("/api/settings", { headers });
        if (!res.ok) return;
        const data = await res.json();
        setVapiPrivateKey(data?.vapiPrivateKey || "");
        setAssistantId(data?.assistantId || "");
        setPhoneNumberId(data?.phoneNumberId || "");
        setDefaultCustomerNumber(data?.defaultCustomerNumber || "");
      } catch {}
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", ...authHeader() };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({ vapiPrivateKey, assistantId, phoneNumberId, defaultCustomerNumber }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");
      toast({ title: "Saved", description: "Settings updated" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>VAPI Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={save}>
              <div>
                <Label>VAPI Private Key</Label>
                <Input value={vapiPrivateKey} onChange={(e) => setVapiPrivateKey(e.target.value)} />
              </div>
              <div>
                <Label>Assistant ID</Label>
                <Input value={assistantId} onChange={(e) => setAssistantId(e.target.value)} />
              </div>
              <div>
                <Label>Phone Number ID</Label>
                <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
              </div>
              <div>
                <Label>Default Customer Number</Label>
                <Input value={defaultCustomerNumber} onChange={(e) => setDefaultCustomerNumber(e.target.value)} />
              </div>
              <Button disabled={loading}>{loading ? "Saving..." : "Save Settings"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) return {} as Record<string, string>;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}


