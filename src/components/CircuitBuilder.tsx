/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useState, useRef } from "react";
import { Circuit } from "../simulator/Circuit";
import { Gate } from "../simulator/Gate";
import QuantumStateVisualizer from "./QuantumStateVisualizer";
import { ComplexNumber } from "../simulator/Complex";
import { DEBUG } from "../config";
import { Button } from "./Button";

const CircuitBuilder: React.FC = () => {
  const [numQubits, setNumQubits] = useState(1);
  const [inputValue, setInputValue] = useState(numQubits.toString());
  const [circuit, setCircuit] = useState(new Circuit(numQubits));
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [qubitsInput, setQubitsInput] = useState("");
  const [gates, setGates] = useState<string[]>([]);
  const [gateHistory, setGateHistory] = useState<
    { gateName: string; qubits: number[]; params?: number[] }[]
  >([]);
  const [results, setResults] = useState<number[] | null>(null);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [numShots, setNumShots] = useState(1024);
  const [qubitStates, setQubitStates] = useState<
    {
      theta: number;
      phi: number;
      ez: number;
    }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gateMap: { [key: string]: (...args: number[]) => Gate } = {
    Hadamard: Gate.Hadamard,
    PauliX: Gate.PauliX,
    PauliY: Gate.PauliY,
    PauliZ: Gate.PauliZ,
    RX: Gate.RX,
    RY: Gate.RY,
    RZ: Gate.RZ,
    CNOT: Gate.CNOT,
    Swap: Gate.Swap,
    Toffoli: Gate.Toffoli,
    ControlledPhaseShift: Gate.ControlledPhaseShift,
    Oracle: Gate.Oracle,
    Diffusion: Gate.Diffusion,
  };

  const handleAddGate = () => {
    const qubits = qubitsInput
      .split(",")
      .map((q) => parseInt(q.trim()))
      .filter((q) => !isNaN(q));

    if (qubits.length === 0) {
      setErrorMessage("Please specify at least one qubit.");
      return;
    }

    if (qubits.some((q) => q >= numQubits || q < 0)) {
      setErrorMessage(
        `Index out of range (Max index: ${numQubits - 1}, Provided: ${Math.max(
          ...qubits
        )})`
      );
      return;
    }

    if (new Set(qubits).size !== qubits.length) {
      setErrorMessage("Duplicate qubits are not allowed.");
      return;
    }

    const gateFunc = gateMap[selectedGate];
    if (gateFunc) {
      if (
        ["Hadamard", "PauliX", "PauliY", "PauliZ", "RX", "RY", "RZ"].includes(
          selectedGate
        )
      ) {
        let angle = 0;
        if (["RX", "RY", "RZ"].includes(selectedGate)) {
          const input = window.prompt(
            `Enter angle for ${selectedGate} (radians):`,
            "0"
          );
          angle = input ? parseFloat(input) : 0;
        }
        qubits.forEach((qubit) => {
          const gate =
            ["RX", "RY", "RZ"].includes(selectedGate) && angle !== undefined
              ? gateFunc(angle)
              : gateFunc();
          circuit.addGate(gate, [qubit]);
          setGates((prevGates) => [
            ...prevGates,
            ["RX", "RY", "RZ"].includes(selectedGate)
              ? `${selectedGate}(${angle}) on Qubit: ${qubit}`
              : `${selectedGate} on Qubit: ${qubit}`,
          ]);
          setGateHistory((prev) => [
            ...prev,
            ["RX", "RY", "RZ"].includes(selectedGate)
              ? { gateName: selectedGate, qubits: [qubit], params: [angle] }
              : { gateName: selectedGate, qubits: [qubit] },
          ]);
        });
      } else if (
        [
          "CNOT",
          "Swap",
          "Toffoli",
          "ControlledPhaseShift",
          "Oracle",
          "Diffusion",
        ].includes(selectedGate) &&
        qubits.length > 1
      ) {
        if (selectedGate === "ControlledPhaseShift") {
          const angleInput = window.prompt(
            "Enter angle for ControlledPhaseShift (radians):",
            "0"
          );
          const angle = angleInput ? parseFloat(angleInput) : 0;
          const gate = gateFunc(angle);
          circuit.addGate(gate, qubits);
          setGates((prevGates) => [
            ...prevGates,
            `${selectedGate}(${angle}) on Qubits: ${qubits.join(", ")}`,
          ]);
          setGateHistory((prev) => [
            ...prev,
            { gateName: selectedGate, qubits, params: [angle] },
          ]);
        } else {
          const gate =
            selectedGate === "Oracle"
              ? gateFunc(qubits.length, 0)
              : selectedGate === "Diffusion"
              ? gateFunc(qubits.length)
              : gateFunc();
          circuit.addGate(gate, qubits);
          setGates((prevGates) => [
            ...prevGates,
            `${selectedGate} on Qubits: ${qubits.join(", ")}`,
          ]);
          setGateHistory((prev) => [
            ...prev,
            { gateName: selectedGate, qubits },
          ]);
        }
      } else if (selectedGate === "Diffusion") {
        const gate = gateFunc(numQubits);
        const targetQubits = Array.from({ length: numQubits }, (_, i) => i);
        circuit.addGate(gate, targetQubits);
        setGates((prevGates) => [
          ...prevGates,
          `${selectedGate} on all qubits`,
        ]);
        setGateHistory((prev) => [
          ...prev,
          { gateName: selectedGate, qubits: targetQubits, params: [numQubits] },
        ]);
      } else {
        setErrorMessage(`${selectedGate} requires at least two qubits.`);
        return;
      }

      setQubitsInput("");
      setErrorMessage("");
      setResults(null);
      setCounts(null);
      setQubitStates([]);
    } else {
      setErrorMessage(`Invalid gate: ${selectedGate}`);
    }
  };

  const handleRunCircuit = () => {
    try {
      const finalState = circuit.run();

      const newQubitStates = Array.from(
        { length: numQubits },
        (_, qubitIndex) => {
          let ex = 0;
          let ey = 0;
          let ez = 0;

          for (let stateIndex = 0; stateIndex < 1 << numQubits; stateIndex++) {
            const amplitude =
              finalState.amplitudes.get(stateIndex) || new ComplexNumber(0, 0);
            const bit = (stateIndex >> qubitIndex) & 1;

            if (bit === 0) {
              const flippedStateIndex = stateIndex ^ (1 << qubitIndex);
              const flippedAmplitude =
                finalState.amplitudes.get(flippedStateIndex) ||
                new ComplexNumber(0, 0);

              const coeff = amplitude.conjugate().mul(flippedAmplitude);

              ex += coeff.re;
              ey += coeff.im;
            }

            ez += amplitude.abs() ** 2 * (bit === 0 ? 1 : -1);
          }

          ex *= 2;
          ey *= 2;

          const norm = Math.sqrt(ex ** 2 + ey ** 2 + ez ** 2);
          if (norm > 0) {
            ex /= norm;
            ey /= norm;
            ez /= norm;
          }

          const theta = Math.acos(ez);
          const phi = Math.atan2(ey, ex);

          if (DEBUG) {
            console.log(
              `Qubit ${qubitIndex}: ex=${ex.toFixed(4)}, ey=${ey.toFixed(
                4
              )}, ez=${ez.toFixed(4)}, theta=${theta.toFixed(
                4
              )}, phi=${phi.toFixed(4)}`
            );
          }

          return { theta, phi, ez };
        }
      );

      const probs = Array.from({ length: 1 << numQubits }, (_, stateIndex) => {
        const amplitude =
          finalState.amplitudes.get(stateIndex) || new ComplexNumber(0, 0);
        return amplitude.abs() ** 2;
      });
      setResults(probs);
      const countsArray = Array(1 << numQubits).fill(0);
      for (let shot = 0; shot < numShots; shot++) {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < probs.length; i++) {
          cumulative += probs[i];
          if (rand < cumulative) {
            countsArray[i]++;
            break;
          }
        }
      }
      setCounts(countsArray);
      setQubitStates(newQubitStates);
      setErrorMessage("");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Circuit run error:", error.message);
        setErrorMessage(`Error: ${error.message}`);
      } else {
        setErrorMessage("An unknown error occurred while running the circuit.");
      }
    }
  };

  const handleRemoveLastGate = () => {
    if (gates.length === 0) return;

    const newGates = [...gates];
    newGates.pop();
    setGates(newGates);
    setGateHistory((prev) => prev.slice(0, prev.length - 1));

    const newCircuit = new Circuit(numQubits);
    circuit.operations.forEach((op, index) => {
      if (index < newGates.length) {
        newCircuit.addGate(op.gate, op.qubits);
      }
    });
    setCircuit(newCircuit);
    setResults(null);
    setCounts(null);
    setQubitStates([]);
  };

  const handleResetCircuit = () => {
    const newCircuit = new Circuit(numQubits);
    setCircuit(newCircuit);
    setGates([]);
    setGateHistory([]);
    setResults(null);
    setCounts(null);
    setQubitStates([]);
    setErrorMessage("");
  };

  const handleSaveCircuit = () => {
    const data = {
      numQubits,
      operations: gateHistory,
    };
    try {
      localStorage.setItem("savedCircuit", JSON.stringify(data));
      setErrorMessage("Circuit saved to browser storage.");
    } catch {
      setErrorMessage("Failed to save circuit.");
    }
  };

  const handleLoadCircuit = () => {
    const saved = localStorage.getItem("savedCircuit");
    if (!saved) {
      setErrorMessage("No saved circuit found.");
      return;
    }

    try {
      const parsed: {
        numQubits: number;
        operations: { gateName: string; qubits: number[]; params?: number[] }[];
      } = JSON.parse(saved);
      const newCircuit = new Circuit(parsed.numQubits);
      const newGates: string[] = [];
      parsed.operations.forEach((op) => {
        const gateFunc = gateMap[op.gateName];
        if (gateFunc) {
          const params = op.params ?? [];
          const gate = gateFunc(...params);
          newCircuit.addGate(gate, op.qubits);
          if (op.qubits.length === 1) {
            if (params.length > 0) {
              newGates.push(
                `${op.gateName}(${params.join(",")}) on Qubit: ${op.qubits[0]}`
              );
            } else {
              newGates.push(`${op.gateName} on Qubit: ${op.qubits[0]}`);
            }
          } else {
            if (params.length > 0) {
              newGates.push(
                `${op.gateName}(${params.join(
                  ","
                )}) on Qubits: ${op.qubits.join(", ")}`
              );
            } else {
              newGates.push(
                `${op.gateName} on Qubits: ${op.qubits.join(", ")}`
              );
            }
          }
        }
      });
      setNumQubits(parsed.numQubits);
      setInputValue(parsed.numQubits.toString());
      setCircuit(newCircuit);
      setGates(newGates);
      setGateHistory(parsed.operations);
      setResults(null);
      setCounts(null);
      setQubitStates([]);
      setErrorMessage("Circuit loaded from browser storage.");
    } catch {
      setErrorMessage("Failed to load circuit.");
    }
  };

  const handleExportCircuit = () => {
    const data = {
      numQubits,
      operations: gateHistory,
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "circuit.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Failed to export circuit.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCircuit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: {
          numQubits: number;
          operations: {
            gateName: string;
            qubits: number[];
            params?: number[];
          }[];
        } = JSON.parse(text);
        const newCircuit = new Circuit(parsed.numQubits);
        const newGates: string[] = [];
        parsed.operations.forEach((op) => {
          const gateFunc = gateMap[op.gateName];
          if (gateFunc) {
            const params = op.params ?? [];
            const gate = gateFunc(...params);
            newCircuit.addGate(gate, op.qubits);
            if (op.qubits.length === 1) {
              if (params.length > 0) {
                newGates.push(
                  `${op.gateName}(${params.join(",")}) on Qubit: ${
                    op.qubits[0]
                  }`
                );
              } else {
                newGates.push(`${op.gateName} on Qubit: ${op.qubits[0]}`);
              }
            } else {
              if (params.length > 0) {
                newGates.push(
                  `${op.gateName}(${params.join(
                    ","
                  )}) on Qubits: ${op.qubits.join(", ")}`
                );
              } else {
                newGates.push(
                  `${op.gateName} on Qubits: ${op.qubits.join(", ")}`
                );
              }
            }
          }
        });
        setNumQubits(parsed.numQubits);
        setInputValue(parsed.numQubits.toString());
        setCircuit(newCircuit);
        setGates(newGates);
        setGateHistory(parsed.operations);
        setResults(null);
        setCounts(null);
        setQubitStates([]);
        setErrorMessage("Circuit imported from file.");
      } catch {
        setErrorMessage("Failed to import circuit.");
      }
    };
    reader.readAsText(file);
  };

  const renderCircuitDiagram = () => {
    const columns = Math.max(gates.length, 1);

    return (
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 border bg-gray-100 text-center">
                Qubit
              </th>
              {Array.from({ length: columns }).map((_, index) => (
                <th
                  key={index}
                  className="px-4 py-2 border bg-gray-100 text-center"
                >
                  {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numQubits }).map((_, qubitIndex) => (
              <tr key={qubitIndex}>
                <td className="px-4 py-2 border text-center font-medium">
                  q{qubitIndex}
                </td>
                {Array.from({ length: columns }).map((_, columnIndex) => {
                  const gateDescription = gates[columnIndex];
                  const involvedQubits = gateDescription
                    ?.match(/\d+/g)
                    ?.map((q) => parseInt(q));

                  const gateType = gateDescription?.split(" ")[0];

                  if (involvedQubits && involvedQubits.includes(qubitIndex)) {
                    if (gateType === "CNOT") {
                      const controlQubit = involvedQubits[0];
                      const targetQubit = involvedQubits[1];

                      if (controlQubit === qubitIndex)
                        return (
                          <td
                            key={columnIndex}
                            className="px-2 py-1 text-center border bg-purple-100"
                          >
                            •
                          </td>
                        );
                      if (targetQubit === qubitIndex)
                        return (
                          <td
                            key={columnIndex}
                            className="px-2 py-1 text-center border bg-purple-100"
                          >
                            X
                          </td>
                        );
                    } else if (gateType === "Swap") {
                      return (
                        <td
                          key={columnIndex}
                          className="px-2 py-1 text-center border bg-purple-100"
                        >
                          ⟷
                        </td>
                      );
                    } else if (gateType === "Toffoli") {
                      const controlQubit1 = involvedQubits[0];
                      const controlQubit2 = involvedQubits[1];
                      const targetQubit = involvedQubits[2];

                      if (
                        controlQubit1 === qubitIndex ||
                        controlQubit2 === qubitIndex
                      )
                        return (
                          <td
                            key={columnIndex}
                            className="px-2 py-1 text-center border bg-purple-100"
                          >
                            •
                          </td>
                        );
                      if (targetQubit === qubitIndex)
                        return (
                          <td
                            key={columnIndex}
                            className="px-2 py-1 text-center border bg-purple-100"
                          >
                            X
                          </td>
                        );
                    } else if (gateType === "ControlledPhaseShift") {
                      return (
                        <td
                          key={columnIndex}
                          className="px-2 py-1 text-center border bg-purple-100"
                        >
                          θ
                        </td>
                      );
                    } else {
                      return (
                        <td
                          key={columnIndex}
                          className="px-2 py-1 text-center border bg-purple-100"
                        >
                          {gateType}
                        </td>
                      );
                    }
                  }

                  if (gateDescription?.includes(`Qubit: ${qubitIndex}`)) {
                    return (
                      <td
                        key={columnIndex}
                        className="px-2 py-1 text-center border bg-blue-100"
                      >
                        {gateType}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={columnIndex}
                      className="px-2 py-1 border text-center"
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10 space-y-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
        Quantum Circuit Builder{" "}
        <span className="text-primary">(Experimental)</span>
      </h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div>
          <label className="block font-bold text-xl mb-2 text-gray-700">
            Number of Qubits:
          </label>
          <input
            type="number"
            min="1"
            className="border-2 border-blue-300 rounded-lg p-3 w-full text-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              const num = parseInt(value);
              if (!isNaN(num) && num >= 1) {
                setNumQubits(num);
                const newCircuit = new Circuit(num);
                setCircuit(newCircuit);
                setGates([]);
                setResults(null);
                setQubitStates([]);
                setErrorMessage("");
              } else {
                setErrorMessage("Please enter a valid number. (>= 1)");
              }
            }}
          />
        </div>

        <div>
          <label className="block font-bold text-xl mb-2 text-gray-700">
            Select Gate:
          </label>
          <select
            className="border-2 border-blue-300 rounded-lg p-3 w-full text-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
          >
            <option value="">Select a gate</option>
            {Object.keys(gateMap).map((gate) => (
              <option key={gate} value={gate}>
                {gate}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-xl mb-2 text-gray-700">
            Target Qubits:
          </label>
          <input
            type="text"
            className="border-2 border-blue-300 rounded-lg p-3 w-full text-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
            value={qubitsInput}
            onChange={(e) => setQubitsInput(e.target.value)}
            placeholder="e.g., 0,1"
          />
        </div>
        <div>
          <label className="block font-bold text-xl mb-2 text-gray-700">
            Shots:
          </label>
          <input
            type="number"
            min="1"
            className="border-2 border-blue-300 rounded-lg p-3 w-full text-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
            value={numShots}
            onChange={(e) => setNumShots(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Button
          onClick={handleAddGate}
          className="flex-1 bg-blue-500 text-white py-3 rounded-lg shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50"
          disabled={
            !selectedGate ||
            qubitsInput.trim() === "" ||
            parseInt(inputValue) < 1
          }
        >
          Add Gate
        </Button>

        <Button
          onClick={handleRemoveLastGate}
          className="flex-1 bg-yellow-500 text-white py-3 rounded-lg shadow-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
          disabled={gates.length === 0}
        >
          Remove Last Gate
        </Button>

        <Button
          onClick={handleRunCircuit}
          className="flex-1 bg-green-500 text-white py-3 rounded-lg shadow-lg hover:bg-green-600 transition-all disabled:opacity-50"
          disabled={circuit.operations.length === 0}
        >
          Run Circuit
        </Button>

        <Button
          onClick={handleResetCircuit}
          className="flex-1 bg-red-500 text-white py-3 rounded-lg shadow-lg hover:bg-red-600 transition-all"
          disabled={circuit.operations.length === 0 && gates.length === 0}
        >
          Reset Circuit
        </Button>

        <Button
          onClick={handleSaveCircuit}
          className="flex-1 bg-purple-500 text-white py-3 rounded-lg shadow-lg hover:bg-purple-600 transition-all"
          disabled={gates.length === 0}
        >
          Save Circuit
        </Button>

        <Button
          onClick={handleLoadCircuit}
          className="flex-1 bg-indigo-500 text-white py-3 rounded-lg shadow-lg hover:bg-indigo-600 transition-all"
        >
          Load Circuit
        </Button>

        <Button
          onClick={handleExportCircuit}
          className="flex-1 bg-teal-500 text-white py-3 rounded-lg shadow-lg hover:bg-teal-600 transition-all"
          disabled={gates.length === 0}
        >
          Export Circuit
        </Button>

        <Button
          onClick={handleImportClick}
          className="flex-1 bg-pink-500 text-white py-3 rounded-lg shadow-lg hover:bg-pink-600 transition-all"
        >
          Import Circuit
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleImportCircuit}
      />

      {gates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Added Gates</h2>
          <ul className="list-disc list-inside">
            {gates.map((gate, index) => (
              <li key={index} className="text-lg text-gray-600">
                {gate}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Circuit Visualization
            </h2>
            {renderCircuitDiagram()}
          </div>
        </div>
      )}

      {results && qubitStates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Measurement Results and Bloch Sphere Visualization
          </h2>
          <QuantumStateVisualizer
            numQubits={numQubits}
            results={results}
            counts={counts}
            qubitStates={qubitStates}
          />
        </div>
      )}

      {errorMessage && (
        <div className="text-red-500 mt-4 text-center">{errorMessage}</div>
      )}
    </div>
  );
};

export default CircuitBuilder;
