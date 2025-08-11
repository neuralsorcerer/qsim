/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";

export type InitialStateControlsProps = {
  numQubits: number;
  initialBasisState: number;
  binaryInitial: string;
  formatKet: (full: string, maxVisible?: number) => string;
  onChangeInitial: (value: number) => void;
  onToggleBit: (qubit: number) => void;
};

const InitialStateControls: React.FC<InitialStateControlsProps> = ({
  numQubits,
  initialBasisState,
  binaryInitial,
  formatKet,
  onChangeInitial,
  onToggleBit,
}) => {
  return (
    <section aria-labelledby="initial-state-title" className="space-y-3">
      <h2
        id="initial-state-title"
        className="text-lg font-semibold text-foreground"
      >
        Initial basis state
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label
            className="block text-sm font-medium mb-1 text-muted-foreground"
            htmlFor="initial-state-int"
          >
            Integer value
          </label>
          <input
            id="initial-state-int"
            type="number"
            min={0}
            max={(1 << numQubits) - 1}
            className="border border-input rounded-lg p-2 w-full text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={initialBasisState}
            onChange={(e) => {
              let v = parseInt(e.target.value, 10);
              if (!Number.isFinite(v)) v = 0;
              v = Math.max(0, Math.min((1 << numQubits) - 1, v));
              onChangeInitial(v);
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            |{formatKet(binaryInitial, 48)}⟩ ({initialBasisState})
          </p>
        </div>
        <div className="md:col-span-2 min-w-0">
          <label className="block text-sm font-medium mb-1 text-muted-foreground">
            Per-qubit bit toggles
          </label>
          <div
            className="flex flex-row items-center gap-2 overflow-x-auto p-2 border rounded bg-muted/30"
            role="group"
            aria-label="Toggle individual qubit bits"
          >
            {Array.from({ length: numQubits }).map((_, i) => {
              const bit = (initialBasisState >> i) & 1;
              return (
                <button
                  key={`bit-${i}`}
                  type="button"
                  className={`px-2 py-1 text-xs rounded border min-w-[56px] ${
                    bit ? "bg-primary/20 border-primary/40" : "bg-background"
                  }`}
                  onClick={() => onToggleBit(i)}
                  title={`Toggle q${i} bit`}
                >
                  q{i}: {bit}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InitialStateControls;
