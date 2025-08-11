/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";

export type PresetsProps = {
  onApply: (preset: "Bell" | "GHZ_3" | "All-H" | "Grover_2") => void;
};

const Presets: React.FC<PresetsProps> = ({ onApply }) => {
  return (
    <section aria-labelledby="presets-title" className="space-y-2">
      <h2 id="presets-title" className="text-lg font-semibold text-foreground">
        Presets
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
          onClick={() => onApply("Bell")}
        >
          Bell (2)
        </button>
        <button
          className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
          onClick={() => onApply("GHZ_3")}
        >
          GHZ (3)
        </button>
        <button
          className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
          onClick={() => onApply("All-H")}
        >
          All-H
        </button>
        <button
          className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
          onClick={() => onApply("Grover_2")}
        >
          Grover (2)
        </button>
      </div>
    </section>
  );
};

export default Presets;
