/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

export const DEBUG = import.meta.env.VITE_DEBUG === "true";

// Whether to normalize the quantum state after each gate application.
// Keep true by default for robustness; can be disabled for performance
// with VITE_NORMALIZE_EACH_STEP=false.
export const NORMALIZE_EACH_STEP =
  (import.meta.env.VITE_NORMALIZE_EACH_STEP ?? "true") === "true";
