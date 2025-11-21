import { useNostrConnection } from "@/hooks/useNostrConnection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";

export const NostrNetworkStatus = () => {
  const { parameters, relayStatuses, loading, error } = useNostrConnection();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className="animate-pulse">
            <p className="text-muted-foreground">Connecting to Nostr Network...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 border-destructive">
          <p className="text-destructive">Error: {error}</p>
        </Card>
      </div>
    );
  }

  if (!parameters) return null;

  const connectedCount = relayStatuses.filter(r => r.connected).length;
  const totalRelays = relayStatuses.length;

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wifi className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Connected to Nostr Network</h2>
          </div>
          <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
            {connectedCount}/{totalRelays} connected
          </Badge>
        </div>

        <div className="space-y-8">
          {/* Relays */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">relays: {connectedCount}/{totalRelays} connected</h3>
            <div className="space-y-2">
              {relayStatuses.map((relay) => (
                <div key={relay.url} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${relay.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <code className="text-sm text-foreground">{relay.url}</code>
                  </div>
                  {relay.latency && (
                    <span className="text-sm font-medium text-green-500">{relay.latency}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Exchange Rates */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Exchange Rates:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EUR:</span>
                  <span className="font-medium text-foreground">{parameters.fx.EUR.toFixed(4)} per LANA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USD:</span>
                  <span className="font-medium text-foreground">{parameters.fx.USD.toFixed(4)} per LANA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GBP:</span>
                  <span className="font-medium text-foreground">{parameters.fx.GBP.toFixed(4)} per LANA</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">System Info:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Split:</span>
                  <span className="font-medium text-foreground">{parameters.split}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium text-foreground">{parameters.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid from:</span>
                  <span className="font-medium text-foreground">
                    {new Date(parseInt(parameters.valid_from) * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Signers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">🔑 Trusted Signers</h3>
            <div className="space-y-3">
              {Object.entries(parameters.trusted_signers).map(([key, pubkeys]) => (
                <div key={key} className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">{key}:</h4>
                  {pubkeys.length > 0 ? (
                    <div className="space-y-1">
                      {pubkeys.map((pubkey, idx) => (
                        <code key={idx} className="text-xs text-muted-foreground block break-all">
                          {pubkey}
                        </code>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No signers defined</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
