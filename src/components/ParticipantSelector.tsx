import { useState } from "react";
import { SimplePool } from "nostr-tools";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { NostrProfile } from "@/types/nostrProfile";

interface Participant {
  pubkey: string;
  profile: NostrProfile;
}

interface ParticipantSelectorProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  relays: string[];
  ownerPubkey: string;
}

export const ParticipantSelector = ({
  participants,
  onParticipantsChange,
  relays,
  ownerPubkey,
}: ParticipantSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Participant[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Vnesite iskalni pojem",
        variant: "destructive",
      });
      return;
    }

    if (relays.length === 0) {
      toast({
        title: "Napaka",
        description: "Ni povezanih relay-jev",
        variant: "destructive",
      });
      console.error("No relays available for search");
      return;
    }

    console.log('🔍 Searching for participants...', {
      query: searchQuery,
      relays: relays,
      relayCount: relays.length
    });

    setSearching(true);
    setSearchResults([]);

    try {
      const pool = new SimplePool();

      const filter = {
        kinds: [0],
        limit: 100, // Increased limit to get more results
      };

      console.log('📡 Querying relays with filter:', filter);
      const events = await pool.querySync(relays, filter);
      console.log(`📥 Received ${events.length} KIND 0 events`);

      const results: Participant[] = [];
      for (const event of events) {
        try {
          const profile = JSON.parse(event.content) as NostrProfile;
          
          // Search in name, display_name, about, nip05
          const searchLower = searchQuery.toLowerCase();
          if (
            profile.name?.toLowerCase().includes(searchLower) ||
            profile.display_name?.toLowerCase().includes(searchLower) ||
            profile.about?.toLowerCase().includes(searchLower) ||
            profile.nip05?.toLowerCase().includes(searchLower)
          ) {
            // Don't include owner or already added participants
            if (
              event.pubkey !== ownerPubkey &&
              !participants.some((p) => p.pubkey === event.pubkey)
            ) {
              results.push({
                pubkey: event.pubkey,
                profile,
              });
            }
          }
        } catch (error) {
          console.error("Error parsing profile:", error);
        }
      }

      pool.close(relays);

      console.log(`✅ Search completed. Found ${results.length} matching profiles`);

      if (results.length === 0) {
        toast({
          title: "Ni rezultatov",
          description: "Poskusite z drugim iskalnim pojmom",
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Napaka pri iskanju",
        description: "Poskusite znova",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = (participant: Participant) => {
    onParticipantsChange([...participants, participant]);
    setSearchResults(searchResults.filter((p) => p.pubkey !== participant.pubkey));
    toast({
      title: "Sodelavec dodan",
      description: `${participant.profile.display_name || participant.profile.name} je bil dodan projektu`,
    });
  };

  const removeParticipant = (pubkey: string) => {
    onParticipantsChange(participants.filter((p) => p.pubkey !== pubkey));
    toast({
      title: "Sodelavec odstranjen",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Project Participants
        </label>
        
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by name, display name, about, nip05..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            size="icon"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 mb-4 p-3 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Search Results:</p>
            {searchResults.map((result) => (
              <div
                key={result.pubkey}
                className="flex items-center gap-3 p-2 rounded-lg bg-background hover:bg-accent transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={result.profile.picture} />
                  <AvatarFallback>
                    {(result.profile.display_name || result.profile.name)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {result.profile.display_name || result.profile.name}
                  </p>
                  {result.profile.nip05 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {result.profile.nip05}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addParticipant(result)}
                >
                  Dodaj
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Participants */}
        {participants.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">
              Added participants ({participants.length}):
            </p>
            {participants.map((participant) => (
              <div
                key={participant.pubkey}
                className="flex items-center gap-3 p-2 rounded-lg border bg-background"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.profile.picture} />
                  <AvatarFallback>
                    {(participant.profile.display_name || participant.profile.name)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {participant.profile.display_name || participant.profile.name}
                  </p>
                  {participant.profile.nip05 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.profile.nip05}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParticipant(participant.pubkey)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
