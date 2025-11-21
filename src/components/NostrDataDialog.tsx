import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LanaSystemParameters, RelayStatus } from "@/types/nostr";
import { useEffect, useState } from "react";

const SESSION_STORAGE_KEY = 'lana_system_parameters';

export const NostrDataDialog = () => {
  const [parameters, setParameters] = useState<LanaSystemParameters | null>(null);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);

  useEffect(() => {
    const loadSessionData = () => {
      const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setParameters(data.parameters);
        setRelayStatuses(data.relayStatuses);
      }
    };

    loadSessionData();
    
    // Listen for storage changes
    window.addEventListener('storage', loadSessionData);
    return () => window.removeEventListener('storage', loadSessionData);
  }, []);

  if (!parameters) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Database className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Nostr KIND 38888 Podatki</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Ni shranjenih podatkov v Session Storage
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const connectedCount = relayStatuses.filter(r => r.connected).length;
  const totalRelays = relayStatuses.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Database className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
            {connectedCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Nostr KIND 38888 - Shranjeni Podatki</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Connection Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Povezava z Nostr mrežo</h3>
              <Badge className="bg-primary text-primary-foreground">
                {connectedCount}/{totalRelays} povezano
              </Badge>
            </div>
          </div>

          {/* Relays */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Relay-i:</h4>
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

          {/* Exchange Rates */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Menjalni tečaji:</h4>
            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
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
            <h4 className="font-semibold mb-3 text-foreground">Sistemske informacije:</h4>
            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Split:</span>
                <span className="font-medium text-foreground">{parameters.split}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verzija:</span>
                <span className="font-medium text-foreground">{parameters.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Veljavno od:</span>
                <span className="font-medium text-foreground">
                  {new Date(parseInt(parameters.valid_from) * 1000).toLocaleDateString('sl-SI')}
                </span>
              </div>
            </div>
          </div>

          {/* Electrum Servers */}
          {parameters.electrum && parameters.electrum.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Electrum strežniki:</h4>
              <div className="space-y-2">
                {parameters.electrum.map((server, idx) => (
                  <div key={idx} className="bg-secondary/50 p-3 rounded-lg">
                    <code className="text-sm text-foreground">{server.host}:{server.port}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trusted Signers */}
          <div>
            <h4 className="font-semibold mb-3 text-foreground">🔑 Zaupanja vredni podpisniki:</h4>
            <div className="space-y-3">
              {Object.entries(parameters.trusted_signers).map(([key, pubkeys]) => (
                <div key={key} className="bg-secondary/30 p-4 rounded-lg">
                  <h5 className="font-semibold text-foreground mb-2">{key}:</h5>
                  {pubkeys.length > 0 ? (
                    <div className="space-y-1">
                      {pubkeys.map((pubkey, idx) => (
                        <code key={idx} className="text-xs text-muted-foreground block break-all">
                          {pubkey}
                        </code>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Ni definiranih podpisnikov</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Session Storage Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Podatki so shranjeni v Session Storage in se osvežijo ob vsakem nalaganju strani.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
