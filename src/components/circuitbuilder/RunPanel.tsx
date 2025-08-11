/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";
import QuantumStateVisualizer from "../QuantumStateVisualizer";
import { Button } from "../Button";

export type RunPanelProps = {
  numQubits: number;
  results: number[] | null;
  counts: number[] | null;
  qubitStates: { theta: number; phi: number; ez: number; r: number }[];
  numShots: number;
  setNumShots: (v: number) => void;
  onRun: () => void;
  canExportCSV: boolean;
  onExportCSV: () => void;
};

const RunPanel: React.FC<RunPanelProps> = ({
  numQubits,
  results,
  counts,
  qubitStates,
  numShots,
  setNumShots,
  onRun,
  canExportCSV,
  onExportCSV,
}) => {
  return (
    <section aria-labelledby="run-title" className="space-y-3">
      <div className="flex items-end gap-3 flex-wrap">
        <h2 id="run-title" className="text-lg font-semibold text-foreground">
          Run simulation
        </h2>
        <label className="text-sm text-muted-foreground">
          Shots
          <input
            type="number"
            min={1}
            className="ml-2 border rounded px-2 py-1 w-24 bg-background text-foreground"
            value={numShots}
            onChange={(e) => {
              let v = parseInt(e.target.value, 10);
              if (!Number.isFinite(v)) v = 1;
              v = Math.max(1, v);
              setNumShots(v);
            }}
          />
        </label>
        <Button onClick={onRun} title="Run the circuit">
          Run
        </Button>
        <Button
          variant="outline"
          onClick={onExportCSV}
          disabled={!canExportCSV}
          aria-disabled={!canExportCSV}
          title="Export amplitudes CSV (run first)"
        >
          Export CSV
        </Button>
      </div>

      {results && (
        <QuantumStateVisualizer
          numQubits={numQubits}
          results={results}
          counts={counts}
          qubitStates={qubitStates}
        />
      )}
    </section>
  );
};

export default RunPanel;
