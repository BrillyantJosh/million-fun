import { useNostrConnection } from "@/hooks/useNostrConnection";
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const NostrStatusDialog = () => {
  const { parameters, relayStatuses, loading, error } = useNostrConnection();

  const connectedCount = relayStatuses.filter(r => r.connected).length;
  const totalRelays = relayStatuses.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Wifi className="h-5 w-5" />
          {connectedCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {connectedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Wifi className="w-6 h-6 text-primary" />
            Connected to Nostr Network
            <Badge className="bg-primary text-primary-foreground">
              {connectedCount}/{totalRelays} connected
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <p className="text-muted-foreground">Connecting to Nostr Network...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-8 border-destructive">
            <p className="text-destructive">Error: {error}</p>
          </div>
        )}

        {!loading && !error && parameters && (
          <div className="space-y-6">
            {/* Relays */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Relays: {connectedCount}/{totalRelays} connected
              </h3>
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

            <div className="grid md:grid-cols-2 gap-6">
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
        )}
      </DialogContent>
    </Dialog>
  );
};
