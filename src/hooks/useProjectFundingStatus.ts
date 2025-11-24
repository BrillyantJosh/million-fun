import { useState, useEffect } from "react";
import { useProjectSupports } from "./useProjectSupports";
import { useAppSettings } from "./useAppSettings";
import { NostrProject } from "./useAllProjects";

export interface ProjectFundingStatus {
  isFullyFunded: boolean;
  remainingAmount: number;
  totalRaised: number;
  maxGoal: number;
  currency: string;
  isOverLimit: boolean;
  loading: boolean;
  error: string | null;
  hasLimit: boolean; // True for Inspiration/Enhancement, false for Agreement/Awareness
}

export const useProjectFundingStatus = (
  project: NostrProject | null
): ProjectFundingStatus => {
  const { stats, loading: supportsLoading } = useProjectSupports(project?.id || "");
  const { data: settings, isLoading: settingsLoading } = useAppSettings();

  const [status, setStatus] = useState<ProjectFundingStatus>({
    isFullyFunded: false,
    remainingAmount: 0,
    totalRaised: 0,
    maxGoal: 0,
    currency: "EUR",
    isOverLimit: false,
    loading: true,
    error: null,
    hasLimit: true,
  });

  useEffect(() => {
    if (!project) {
      setStatus({
        isFullyFunded: false,
        remainingAmount: 0,
        totalRaised: 0,
        maxGoal: 0,
        currency: "EUR",
        isOverLimit: false,
        loading: false,
        error: "Project not found",
        hasLimit: true,
      });
      return;
    }

    if (supportsLoading || settingsLoading) {
      setStatus((prev) => ({ ...prev, loading: true }));
      return;
    }

    // Calculate total raised from stats
    const totalRaised = stats?.totalRaised || 0;

    const projectGoal = parseFloat(project.fiatGoal);
    const projectType = project.projectType;

    // Determine if project has funding limit
    const hasLimit = projectType === "Inspiration" || projectType === "Enhancement";

    let maxGoal = projectGoal;
    let isOverLimit = false;

    // Only apply limits for Inspiration and Enhancement
    if (hasLimit && settings) {
      const maxAllowed =
        projectType === "Inspiration"
          ? settings.financing_inspirations
          : settings.enhancing_current_system;

      maxGoal = Math.min(projectGoal, maxAllowed);
      isOverLimit = projectGoal > maxAllowed;
    }

    const remainingAmount = Math.max(0, maxGoal - totalRaised);
    const isFullyFunded = totalRaised >= maxGoal;

    setStatus({
      isFullyFunded,
      remainingAmount,
      totalRaised,
      maxGoal,
      currency: project.currency,
      isOverLimit,
      loading: false,
      error: null,
      hasLimit,
    });
  }, [project, stats, supportsLoading, settings, settingsLoading]);

  return status;
};
