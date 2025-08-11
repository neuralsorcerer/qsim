/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";
import { Button } from "../Button";
import CircuitDiagram from "./CircuitDiagram";
import type { HistoryOp } from "./types";

export type DiagramPanelProps = {
  numQubits: number;
  visibleHistory: HistoryOp[];
  colStart: number;
  hoveredCol: number | null;
  setHoveredCol: (col: number | null) => void;
  onRemoveAt: (index: number) => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  pageSize: number;
  setPageSize: (n: number) => void;
  canRemoveLast: boolean;
  canReset: boolean;
  onRemoveLast: () => void;
  onReset: () => void;
  onExportPNG: () => void;
  circuitDiagramRef: React.RefObject<HTMLDivElement>;
};

const DiagramPanel: React.FC<DiagramPanelProps> = ({
  numQubits,
  visibleHistory,
  colStart,
  hoveredCol,
  setHoveredCol,
  onRemoveAt,
  page,
  setPage,
  totalPages,
  pageSize,
  setPageSize,
  canRemoveLast,
  canReset,
  onRemoveLast,
  onReset,
  onExportPNG,
  circuitDiagramRef,
}) => {
  return (
    <section aria-labelledby="diagram-title" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2
          id="diagram-title"
          className="text-lg font-semibold text-foreground"
        >
          Circuit diagram
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <button
            className="px-2 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            « First
          </button>
          <button
            className="px-2 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            ‹ Prev
          </button>
          <span className="px-2">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="px-2 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next ›
          </button>
          <button
            className="px-2 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            Last »
          </button>
          <label className="ml-2 text-xs text-muted-foreground">Cols</label>
          <select
            className="border rounded px-2 py-1 bg-background text-foreground"
            value={pageSize}
            onChange={(e) => {
              const s = Math.max(4, parseInt(e.target.value, 10) || 16);
              setPageSize(s);
              setPage(0);
            }}
          >
            {[8, 16, 24, 32, 40].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className="w-full p-3 bg-card rounded border shadow-sm"
        ref={circuitDiagramRef}
      >
        <CircuitDiagram
          numQubits={numQubits}
          visibleHistory={visibleHistory}
          colStart={colStart}
          hoveredCol={hoveredCol}
          setHoveredCol={setHoveredCol}
          onRemoveAt={onRemoveAt}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="destructive"
          onClick={onRemoveLast}
          disabled={!canRemoveLast}
          aria-disabled={!canRemoveLast}
          title="Remove last gate"
        >
          Remove last gate
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={!canReset}
          aria-disabled={!canReset}
          title="Reset circuit"
        >
          Reset circuit
        </Button>
        <Button
          variant="outline"
          onClick={onExportPNG}
          title="Export circuit diagram as PNG"
        >
          Export PNG
        </Button>
      </div>
    </section>
  );
};

export default DiagramPanel;
