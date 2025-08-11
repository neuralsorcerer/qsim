/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";
import { opToLabel, type HistoryOp } from "./types";

export type CircuitDiagramProps = {
  numQubits: number;
  visibleHistory: HistoryOp[];
  colStart: number;
  hoveredCol: number | null;
  setHoveredCol: (col: number | null) => void;
  onRemoveAt: (index: number) => void;
};

const CircuitDiagram: React.FC<CircuitDiagramProps> = ({
  numQubits,
  visibleHistory,
  colStart,
  hoveredCol,
  setHoveredCol,
  onRemoveAt,
}) => {
  const columns = visibleHistory.length;

  const isBetween = (op: HistoryOp, q: number) => {
    if (op.qubits.length <= 1) return false;
    const top = Math.min(...op.qubits);
    const bot = Math.max(...op.qubits);
    return q > top && q < bot;
  };

  const gateToken = (op: HistoryOp): string => {
    const p = op.params ?? [];
    switch (op.gateName) {
      case "RX":
      case "RY":
      case "RZ":
        return `${op.gateName}(${(p[0] ?? 0).toFixed(2)})`;
      case "ControlledPhaseShift":
        return `CP(${(p[0] ?? 0).toFixed(2)})`;
      case "Oracle":
        return `Oracle${p.length ? `(${p.join(",")})` : ""}`;
      case "Diffusion":
        return `Diff${p.length ? `(${p.join(",")})` : ""}`;
      default:
        return op.gateName;
    }
  };

  const colHighlight = (colIndex: number) =>
    hoveredCol === colIndex ? " bg-amber-50" : "";

  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse">
        <caption className="sr-only">
          Quantum circuit diagram showing qubits as rows and gates as columns
        </caption>
        <thead>
          <tr>
            <th className="px-4 py-2 border bg-muted text-center text-foreground transition-colors">
              Qubit
            </th>
            {columns > 0 &&
              Array.from({ length: columns }).map((_, i) => (
                <th
                  key={i}
                  className={`px-4 py-2 border bg-muted text-center transition-colors${colHighlight(
                    i
                  )}`}
                  onMouseEnter={() => setHoveredCol(i)}
                  onMouseLeave={() => setHoveredCol(null)}
                  title={`Gate #${colStart + i + 1}`}
                >
                  {colStart + i + 1}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numQubits }).map((_, q) => (
            <tr key={`row-${q}`}>
              <td className="px-4 py-2 border text-center font-medium text-foreground">
                q{q}
              </td>
              {columns > 0 &&
                Array.from({ length: columns }).map((_, colIndex) => {
                  const op = visibleHistory[colIndex];
                  if (!op)
                    return (
                      <td
                        key={`c-${q}-${colIndex}`}
                        className={`px-2 py-1 border text-center${colHighlight(
                          colIndex
                        )}`}
                      />
                    );

                  if (isBetween(op, q)) {
                    return (
                      <td
                        key={`c-${q}-${colIndex}`}
                        className={`px-2 py-1 border align-middle${colHighlight(
                          colIndex
                        )}`}
                      >
                        <div
                          className="flex items-stretch justify-center relative"
                          style={{ minHeight: 28 }}
                        >
                          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                        </div>
                      </td>
                    );
                  }

                  const includes = op.qubits.includes(q);
                  if (!includes)
                    return (
                      <td
                        key={`c-${q}-${colIndex}`}
                        className={`px-2 py-1 border text-center${colHighlight(
                          colIndex
                        )}`}
                      />
                    );

                  const token = gateToken(op);
                  const commonCellProps: React.TdHTMLAttributes<HTMLTableCellElement> =
                    {
                      title: opToLabel(op),
                    };

                  if (op.gateName === "CNOT" && op.qubits.length === 2) {
                    const [control, target] = op.qubits;
                    if (q === control)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-lg leading-none">•</span>
                          </div>
                        </td>
                      );
                    if (q === target)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-xs font-semibold">X</span>
                          </div>
                        </td>
                      );
                  }

                  if (op.gateName === "Swap" && op.qubits.length === 2) {
                    return (
                      <td
                        key={`c-${q}-${colIndex}`}
                        className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                          colIndex
                        )}`}
                        {...commonCellProps}
                      >
                        <div
                          className="relative flex items-center justify-center"
                          style={{ minHeight: 28 }}
                        >
                          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                          <span className="text-sm">⟷</span>
                        </div>
                      </td>
                    );
                  }

                  if (op.gateName === "Toffoli" && op.qubits.length === 3) {
                    const [c1, c2, t] = op.qubits;
                    if (q === c1 || q === c2)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-lg leading-none">•</span>
                          </div>
                        </td>
                      );
                    if (q === t)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-xs font-semibold">X</span>
                          </div>
                        </td>
                      );
                  }

                  if (
                    op.gateName === "ControlledPhaseShift" &&
                    op.qubits.length === 2
                  ) {
                    const [control, target] = op.qubits;
                    if (q === control)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-lg leading-none">•</span>
                          </div>
                        </td>
                      );
                    if (q === target)
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center gap-1"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-xs">θ</span>
                            {op.params?.length ? (
                              <span className="text-[10px] text-gray-700">
                                ({op.params[0]?.toFixed(2)})
                              </span>
                            ) : null}
                          </div>
                        </td>
                      );
                  }

                  if (
                    (op.gateName === "Oracle" || op.gateName === "Diffusion") &&
                    op.qubits.length > 1
                  ) {
                    const top = Math.min(...op.qubits);
                    if (q === top) {
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/20 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                            <span className="text-xs font-semibold">
                              {gateToken(op)}
                            </span>
                            {op.condition ? (
                              <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] px-1 py-0.5 rounded border">
                                if q{op.condition.qubit}={op.condition.value}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      );
                    }
                    if (op.qubits.includes(q)) {
                      return (
                        <td
                          key={`c-${q}-${colIndex}`}
                          className={`px-2 py-1 text-center border bg-accent/10 relative${colHighlight(
                            colIndex
                          )}`}
                          {...commonCellProps}
                        >
                          <div
                            className="relative flex items-center justify-center"
                            style={{ minHeight: 28 }}
                          >
                            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-primary/40 top-0 bottom-0" />
                          </div>
                        </td>
                      );
                    }
                  }

                  if (op.qubits.length === 1 && op.qubits[0] === q) {
                    return (
                      <td
                        key={`c-${q}-${colIndex}`}
                        className={`px-2 py-1 text-center border bg-primary/10 text-foreground relative${colHighlight(
                          colIndex
                        )}`}
                        {...commonCellProps}
                      >
                        <div
                          className="relative flex items-center justify-center"
                          style={{ minHeight: 28 }}
                        >
                          <span className="text-xs font-semibold">{token}</span>
                          {op.condition ? (
                            <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] px-1 py-0.5 rounded border">
                              if q{op.condition.qubit}={op.condition.value}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`c-${q}-${colIndex}`}
                      className={`px-2 py-1 border text-center${colHighlight(
                        colIndex
                      )}`}
                    />
                  );
                })}
            </tr>
          ))}
          {columns > 0 && (
            <tr>
              <td className="px-4 py-2 border text-right text-xs text-muted-foreground">
                Remove
              </td>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={`rm-${colIndex}`}
                  className={`px-2 py-1 border text-center transition-colors${colHighlight(
                    colIndex
                  )}`}
                >
                  <button
                    className="px-2 py-0.5 text-xs rounded border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive"
                    onClick={() => onRemoveAt(colStart + colIndex)}
                    title={`Remove gate #${colStart + colIndex + 1}`}
                    aria-label={`Remove gate #${colStart + colIndex + 1}${
                      visibleHistory[colIndex]
                        ? `: ${opToLabel(visibleHistory[colIndex])}`
                        : ""
                    }`}
                    onMouseEnter={() => setHoveredCol(colIndex)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    ✕
                  </button>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      {columns === 0 && (
        <div className="text-sm text-muted-foreground p-3">
          No gates added yet. Select a gate and qubit(s), then click "Add Gate".
        </div>
      )}
    </div>
  );
};

export default CircuitDiagram;
