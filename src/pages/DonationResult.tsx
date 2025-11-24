import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

interface RelayResult {
  relay: string;
  success: boolean;
  error?: string;
}

interface DonationResultData {
  txid: string;
  total_amount: number;
  fee: number;
  nostr_event_id: string | null;
  nostr_results: RelayResult[];
  electrum_success: boolean;
}

export default function DonationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as DonationResultData;

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>No Result Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const successfulRelays = result.nostr_results?.filter(r => r.success).length || 0;
  const totalRelays = result.nostr_results?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Donation Successful!</h1>
            <p className="text-muted-foreground">
              Your donation has been processed and broadcasted
            </p>
          </div>

          {/* Electrum Broadcast Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.electrum_success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                Electrum Blockchain Broadcast
              </CardTitle>
              <CardDescription>
                LANA transaction broadcasted to Electrum servers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Amount:</div>
                <div className="font-mono">{(result.total_amount / 100000000).toFixed(8)} LANA</div>
                
                <div className="text-muted-foreground">Fee:</div>
                <div className="font-mono">{(result.fee / 100000000).toFixed(8)} LANA</div>
                
                <div className="text-muted-foreground">Transaction ID:</div>
                <div className="font-mono text-xs break-all">{result.txid}</div>
              </div>
              
              <a
                href={`https://explorer.lanacoin.com/tx/${result.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                View on Explorer <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>

          {/* Nostr Relay Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {successfulRelays > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                Nostr Relay Broadcast
              </CardTitle>
              <CardDescription>
                Support event published to {successfulRelays}/{totalRelays} relays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.nostr_event_id && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Event ID:</div>
                  <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                    {result.nostr_event_id}
                  </div>
                </div>
              )}

              {result.nostr_results && result.nostr_results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Relay Status:</div>
                  {result.nostr_results.map((relayResult, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {relayResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm font-mono">{relayResult.relay}</span>
                      </div>
                      {!relayResult.success && relayResult.error && (
                        <span className="text-xs text-destructive">{relayResult.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-donations")}>
              View My Donations
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
