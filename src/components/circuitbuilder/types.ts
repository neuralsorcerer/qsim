/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import type { Gate } from "../../simulator/Gate";

export type HistoryOp = {
  gateName: string;
  qubits: number[];
  params?: number[];
  condition?: { qubit: number; value: number };
};

export const opToLabel = (op: HistoryOp) => {
  const params = op.params ?? [];
  const base = `${op.gateName}${params.length ? `(${params.join(",")})` : ""}`;
  const target =
    op.qubits.length === 1
      ? ` on Qubit: ${op.qubits[0]}`
      : ` on Qubits: ${op.qubits.join(", ")}`;
  const cond = op.condition
    ? ` [if q${op.condition.qubit}=${op.condition.value}]`
    : "";
  return base + target + cond;
};

export const errorMessageFrom = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

export type GateFactoryMap = { [key: string]: (...args: number[]) => Gate };
