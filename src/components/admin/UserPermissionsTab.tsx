import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Search, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchNostrProfiles } from "@/lib/nostrSearch";

type ProjectTypeRole = 'enhancement' | 'agreement' | 'awareness';

interface UserRole {
  id: string;
  nostr_hex_id: string;
  project_type: ProjectTypeRole;
  created_at: string;
  created_by: string | null;
}

interface NostrSearchResult {
  pubkey: string;
  name?: string;
  display_name?: string;
  picture?: string;
}

const PROJECT_TYPES: { value: ProjectTypeRole; label: string }[] = [
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'awareness', label: 'Awareness' },
];

export const UserPermissionsTab = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newNostrHexId, setNewNostrHexId] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ProjectTypeRole[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NostrSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NostrSearchResult | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_project_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Debounced search
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowSearchResults(true);
        try {
          const results = await searchNostrProfiles(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleSelectUser = (user: NostrSearchResult) => {
    setSelectedUser(user);
    setNewNostrHexId(user.pubkey);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setNewNostrHexId("");
  };

  const handleTypeToggle = (type: ProjectTypeRole) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleAddPermission = async () => {
    if (!newNostrHexId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Nostr Hex ID or search for a user",
        variant: "destructive",
      });
      return;
    }

    if (selectedTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one project type",
        variant: "destructive",
      });
      return;
    }

    // Validate hex format (64 characters, hex only)
    const hexRegex = /^[a-f0-9]{64}$/i;
    if (!hexRegex.test(newNostrHexId.trim())) {
      toast({
        title: "Validation Error",
        description: "Nostr Hex ID must be a 64-character hexadecimal string",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Insert all selected types
      const inserts = selectedTypes.map(type => ({
        nostr_hex_id: newNostrHexId.trim().toLowerCase(),
        project_type: type,
      }));

      const { error } = await supabase
        .from('user_project_roles')
        .insert(inserts);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Warning",
            description: "Some permissions already exist for this user",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: `Added ${selectedTypes.length} permission(s) for user`,
        });
      }

      // Reset form
      setNewNostrHexId("");
      setSelectedTypes([]);
      setSelectedUser(null);
      
      // Refresh list
      fetchRoles();
    } catch (err) {
      console.error('Error adding permission:', err);
      toast({
        title: "Error",
        description: "Failed to add permission",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_project_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permission removed",
      });

      fetchRoles();
    } catch (err) {
      console.error('Error deleting permission:', err);
      toast({
        title: "Error",
        description: "Failed to remove permission",
        variant: "destructive",
      });
    }
  };

  // Group roles by nostr_hex_id for better display
  const groupedRoles = roles.reduce((acc, role) => {
    if (!acc[role.nostr_hex_id]) {
      acc[role.nostr_hex_id] = [];
    }
    acc[role.nostr_hex_id].push(role);
    return acc;
  }, {} as Record<string, UserRole[]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Permission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add User Permission
          </CardTitle>
          <CardDescription>
            Grant users access to additional project types. All users can create "Inspiration" projects by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Search User by Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or display name..."
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="relative">
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Searching relays...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found matching "{searchQuery}"
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.pubkey}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.picture} alt={user.name || 'User'} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.display_name || user.name || 'Unknown'}
                          </p>
                          {user.name && user.display_name && user.name !== user.display_name && (
                            <p className="text-xs text-muted-foreground truncate">@{user.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono">
                            {user.pubkey.substring(0, 12)}...{user.pubkey.substring(user.pubkey.length - 6)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected User Display */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.picture} alt={selectedUser.name || 'User'} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {selectedUser.display_name || selectedUser.name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedUser.pubkey}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                Clear
              </Button>
            </div>
          )}

          {/* Manual Hex ID Input */}
          {!selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="nostrHexId">Or Enter Nostr Hex ID Manually</Label>
              <Input
                id="nostrHexId"
                value={newNostrHexId}
                onChange={(e) => setNewNostrHexId(e.target.value)}
                placeholder="e.g., 18a908e89354fb2d142d864bfcbea7a7ed4486c8fb66b746fcebe66ed372115e"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                64-character hexadecimal public key of the user
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Project Types</Label>
            <div className="flex flex-wrap gap-4">
              {PROJECT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <label
                    htmlFor={type.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleAddPermission} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Permission
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Permissions
          </CardTitle>
          <CardDescription>
            {Object.keys(groupedRoles).length} user(s) with additional permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedRoles).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No user permissions configured yet. All users can create "Inspiration" projects by default.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nostr Hex ID</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedRoles).map(([hexId, userRoles]) => (
                  <TableRow key={hexId}>
                    <TableCell className="font-mono text-xs">
                      {hexId.substring(0, 16)}...{hexId.substring(hexId.length - 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Inspiration</Badge>
                        {userRoles.map((role) => (
                          <Badge key={role.id} variant="default" className="text-xs">
                            {role.project_type.charAt(0).toUpperCase() + role.project_type.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(userRoles[0].created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {userRoles.map((role) => (
                          <Button
                            key={role.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePermission(role.id)}
                            title={`Remove ${role.project_type}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
