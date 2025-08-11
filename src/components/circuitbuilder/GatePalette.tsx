/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";

export type GatePaletteProps = {
  selectedGate: string;
  setSelectedGate: (gate: string) => void;
  parseQubits: () => number[];
};

const GatePalette: React.FC<GatePaletteProps> = ({
  selectedGate,
  setSelectedGate,
  parseQubits,
}) => {
  const quickSelect = (label: string, value: string, title?: string) => {
    const qs = parseQubits();
    const isSingle = [
      "Hadamard",
      "PauliX",
      "PauliY",
      "PauliZ",
      "RX",
      "RY",
      "RZ",
    ].includes(value);
    const isTwo = ["CNOT", "Swap", "ControlledPhaseShift"].includes(value);
    const isThree = value === "Toffoli";
    const isOracle = value === "Oracle";
    const isDiff = value === "Diffusion";

    const canUse = isDiff
      ? true
      : isSingle
      ? qs.length === 1
      : isTwo
      ? qs.length === 2
      : isThree
      ? qs.length === 3
      : isOracle
      ? qs.length >= 1
      : true;

    const colorClass = isDiff
      ? "border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100"
      : isOracle
      ? "border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100"
      : ["RX", "RY", "RZ"].includes(value)
      ? "border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
      : isTwo
      ? "border-violet-300 text-violet-800 bg-violet-50 hover:bg-violet-100"
      : isThree
      ? "border-fuchsia-300 text-fuchsia-800 bg-fuchsia-50 hover:bg-fuchsia-100"
      : "border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100";

    return (
      <button
        key={value}
        className={`px-2 py-1 text-xs rounded border shadow-sm transition-colors ${colorClass} ${
          selectedGate === value ? "ring-1 ring-primary" : ""
        } ${!canUse ? "opacity-50 cursor-not-allowed" : ""}`}
        title={title || String(value)}
        aria-label={`Select gate ${title || String(value)}`}
        aria-pressed={selectedGate === value}
        disabled={!canUse}
        onClick={() => {
          if (!canUse) return;
          setSelectedGate(String(value));
        }}
        type="button"
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {quickSelect("H", "Hadamard", "Hadamard")}
      {quickSelect("X", "PauliX", "Pauli-X")}
      {quickSelect("Y", "PauliY", "Pauli-Y")}
      {quickSelect("Z", "PauliZ", "Pauli-Z")}
      {quickSelect("RX", "RX", "RX(θ)")}
      {quickSelect("RY", "RY", "RY(θ)")}
      {quickSelect("RZ", "RZ", "RZ(θ)")}
      {quickSelect("CNOT", "CNOT", "CNOT")}
      {quickSelect("Swap", "Swap", "Swap")}
      {quickSelect("Toffoli", "Toffoli", "Toffoli")}
      {quickSelect("CP", "ControlledPhaseShift", "Controlled Phase Shift (θ)")}
      {quickSelect("Oracle", "Oracle", "Oracle (marked state)")}
      {quickSelect("Diffusion", "Diffusion", "Diffusion")}
    </div>
  );
};

export default GatePalette;
