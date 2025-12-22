import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserSession } from "@/lib/auth";

export type ProjectTypeRole = 'enhancement' | 'agreement' | 'awareness';

// All project types - Inspiration is always available
const ALL_PROJECT_TYPES = ['Inspiration', 'Enhancement', 'Agreement', 'Awareness'] as const;

export const useUserProjectPermissions = () => {
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['Inspiration']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      
      const session = getUserSession();
      if (!session?.nostrHexId) {
        // Not logged in - only Inspiration available
        setAllowedTypes(['Inspiration']);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_project_roles')
          .select('project_type')
          .eq('nostr_hex_id', session.nostrHexId);

        if (error) {
          console.error('Error fetching user permissions:', error);
          setAllowedTypes(['Inspiration']);
          setIsLoading(false);
          return;
        }

        // Start with Inspiration (always available)
        const types: string[] = ['Inspiration'];

        // Add additional permitted types
        if (data) {
          for (const role of data) {
            const capitalizedType = role.project_type.charAt(0).toUpperCase() + role.project_type.slice(1);
            if (!types.includes(capitalizedType)) {
              types.push(capitalizedType);
            }
          }
        }

        // Sort to maintain consistent order
        const sortedTypes = ALL_PROJECT_TYPES.filter(type => types.includes(type));
        setAllowedTypes(sortedTypes);
      } catch (err) {
        console.error('Error in useUserProjectPermissions:', err);
        setAllowedTypes(['Inspiration']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return { allowedTypes, isLoading };
};
