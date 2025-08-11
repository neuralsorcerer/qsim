/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Circuit } from "../simulator/Circuit";
import { Gate } from "../simulator/Gate";
import { ComplexNumber } from "../simulator/Complex";
import QuantumStateVisualizer from "./QuantumStateVisualizer";
import { Button } from "./Button";
import { DEBUG } from "../config";
import { toPng } from "dom-to-image-more";

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

type HistoryOp = {
  gateName: string;
  qubits: number[];
  params?: number[];
  condition?: { qubit: number; value: number };
};

const opToLabel = (op: HistoryOp) => {
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

const errorMessageFrom = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const CircuitBuilder: React.FC = () => {
  const [numQubits, setNumQubits] = useState<number>(2);
  const [inputValue, setInputValue] = useState<string>("2");
  const [initialBasisState, setInitialBasisState] = useState<number>(0);
  const [circuit, setCircuit] = useState<Circuit>(new Circuit(2, 0));

  const [selectedGate, setSelectedGate] = useState<string>("");
  const [qubitsInput, setQubitsInput] = useState<string>(""); // comma-separated
  const [angle, setAngle] = useState<number>(Math.PI / 2);
  const [oracleTargetState, setOracleTargetState] = useState<number>(0);

  const [useCondition, setUseCondition] = useState<boolean>(false);
  const [conditionQubit, setConditionQubit] = useState<number>(0);
  const [conditionValue, setConditionValue] = useState<0 | 1>(0);

  const [gateHistory, setGateHistory] = useState<HistoryOp[]>([]);

  const [results, setResults] = useState<number[] | null>(null);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [numShots, setNumShots] = useState<number>(1024);
  const [qubitStates, setQubitStates] = useState<
    { theta: number; phi: number; ez: number; r: number }[]
  >([]);
  const [amplitudes, setAmplitudes] = useState<
    | { index: number; re: number; im: number; phase: number; prob: number }[]
    | null
  >(null);

  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const circuitDiagramRef = useRef<HTMLDivElement>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const binaryInitial = useMemo(
    () => initialBasisState.toString(2).padStart(numQubits, "0"),
    [initialBasisState, numQubits]
  );
  const formatKet = (full: string, maxVisible = 16) =>
    full.length <= maxVisible ? full : `${full.slice(0, 8)}…${full.slice(-8)}`;

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(16);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(gateHistory.length, 1) / pageSize)),
    [gateHistory.length, pageSize]
  );
  const colStart = page * pageSize;
  const visibleHistory = useMemo(
    () => gateHistory.slice(colStart, colStart + pageSize),
    [gateHistory, colStart, pageSize]
  );

  const canRemoveLast = gateHistory.length > 0;
  const canResetCircuit = gateHistory.length > 0;

  const parseQubits = (): number[] => {
    const trimmed = qubitsInput.trim();
    if (!trimmed) return [];
    const seen = new Set<number>();
    const out: number[] = [];
    for (const part of trimmed.split(",")) {
      const n = parseInt(part.trim(), 10);
      if (!Number.isFinite(n)) continue;
      if (!seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  };

  const canAddGate = useMemo(() => {
    if (!selectedGate) return false;
    let qubits = parseQubits();
    if (selectedGate === "Diffusion" && qubits.length === 0) {
      qubits = Array.from({ length: numQubits }, (_, i) => i);
    }

    const singleQubit = [
      "Hadamard",
      "PauliX",
      "PauliY",
      "PauliZ",
      "RX",
      "RY",
      "RZ",
    ];
    const twoQubit = ["CNOT", "Swap", "ControlledPhaseShift"];
    const threeQubit = ["Toffoli"];

    if (singleQubit.includes(selectedGate)) {
      if (qubits.length !== 1) return false;
    } else if (twoQubit.includes(selectedGate)) {
      if (qubits.length !== 2) return false;
    } else if (threeQubit.includes(selectedGate)) {
      if (qubits.length !== 3) return false;
    } else if (selectedGate === "Oracle" || selectedGate === "Diffusion") {
      if (qubits.length < 1) return false;
    }

    if (qubits.some((q) => q < 0 || q >= numQubits)) return false;
    if (useCondition && qubits.includes(conditionQubit)) return false;

    if (selectedGate === "Oracle") {
      const width = qubits.length;
      if (width < 1) return false;
      const maxTarget = (1 << width) - 1;
      if (oracleTargetState < 0 || oracleTargetState > maxTarget) return false;
    }

    return true;
  }, [
    selectedGate,
    qubitsInput,
    numQubits,
    useCondition,
    conditionQubit,
    oracleTargetState,
  ]);

  const applyHistoryToCircuit = (c: Circuit, history: HistoryOp[]) => {
    history.forEach((op) => {
      const gateFactory = gateMap[op.gateName];
      if (!gateFactory) return;
      const gate = gateFactory(...(op.params ?? []));
      if (op.condition) c.addConditionalGate(gate, op.qubits, op.condition);
      else c.addGate(gate, op.qubits);
    });
  };

  const rebuildFromHistory = (
    qCount: number,
    initState: number,
    operations: HistoryOp[]
  ) => {
    const newCircuit = new Circuit(qCount, initState);
    applyHistoryToCircuit(newCircuit, operations);
    setNumQubits(qCount);
    setInputValue(String(qCount));
    setInitialBasisState(initState);
    setCircuit(newCircuit);
    setGateHistory(operations);
    setResults(null);
    setCounts(null);
    setQubitStates([]);
    setAmplitudes(null);
    setPage(0);
    setErrorMessage("");
  };

  const handleAddGate = () => {
    try {
      if (!canAddGate) {
        setErrorMessage("Select a gate and valid target qubit indices first.");
        return;
      }
      if (!selectedGate) {
        setErrorMessage("Please select a gate.");
        return;
      }

      let qubits = parseQubits();

      if (selectedGate === "Diffusion" && qubits.length === 0) {
        qubits = Array.from({ length: numQubits }, (_, i) => i);
      }

      const singleQubit = [
        "Hadamard",
        "PauliX",
        "PauliY",
        "PauliZ",
        "RX",
        "RY",
        "RZ",
      ];
      const twoQubit = ["CNOT", "Swap", "ControlledPhaseShift"];
      const threeQubit = ["Toffoli"];

      if (singleQubit.includes(selectedGate)) {
        if (qubits.length !== 1) {
          setErrorMessage("This gate requires exactly 1 qubit.");
          return;
        }
      } else if (twoQubit.includes(selectedGate)) {
        if (qubits.length !== 2) {
          setErrorMessage("This gate requires exactly 2 qubits.");
          return;
        }
      } else if (threeQubit.includes(selectedGate)) {
        if (qubits.length !== 3) {
          setErrorMessage("This gate requires exactly 3 qubits.");
          return;
        }
      } else if (selectedGate === "Oracle" || selectedGate === "Diffusion") {
        if (qubits.length < 1) {
          setErrorMessage("Please specify one or more qubits for this gate.");
          return;
        }
      }

      if (qubits.some((q) => q < 0 || q >= numQubits)) {
        setErrorMessage(`Qubits must be between 0 and ${numQubits - 1}.`);
        return;
      }

      if (useCondition && qubits.includes(conditionQubit)) {
        setErrorMessage(
          "Conditional qubit cannot be among the target qubits. Choose a different condition qubit."
        );
        return;
      }

      const gateFactory = gateMap[selectedGate];
      if (!gateFactory) {
        setErrorMessage(`Invalid gate: ${selectedGate}`);
        return;
      }

      let params: number[] | undefined = undefined;
      if (["RX", "RY", "RZ", "ControlledPhaseShift"].includes(selectedGate)) {
        params = [angle];
      } else if (selectedGate === "Oracle") {
        const width = qubits.length;
        const maxTarget = (1 << width) - 1;
        const tgt = Math.max(0, Math.min(oracleTargetState, maxTarget));
        params = [width, tgt];
      } else if (selectedGate === "Diffusion") {
        const width = qubits.length;
        params = [width];
      }

      const gate = gateFactory(...(params ?? []));
      const historyOp: HistoryOp = { gateName: selectedGate, qubits, params };
      const newCircuit = new Circuit(numQubits, initialBasisState);
      applyHistoryToCircuit(newCircuit, gateHistory);

      if (useCondition) {
        const cond = { qubit: conditionQubit, value: conditionValue } as const;
        newCircuit.addConditionalGate(gate, qubits, cond);
        historyOp.condition = cond;
      } else {
        newCircuit.addGate(gate, qubits);
      }

      const prevLen = gateHistory.length;
      setCircuit(newCircuit);
      setGateHistory((prev) => [...prev, historyOp]);
      setErrorMessage("");
      setResults(null);
      setCounts(null);
      setQubitStates([]);
      setAmplitudes(null);
      setPage(Math.floor(prevLen / pageSize));
    } catch (e: unknown) {
      setErrorMessage(errorMessageFrom(e) || "Failed to add gate.");
    }
  };

  const handleRunCircuit = () => {
    try {
      const stateSize = 1 << numQubits;
      const deepCircuit = gateHistory.length > 128;
      if (stateSize >= 1 << 18 || deepCircuit) {
        const proceed = window.confirm(
          `Warning: This run may be very slow and could hang your tab.\n\n` +
            `Qubits: ${numQubits} (state size = ${stateSize.toLocaleString()})\n` +
            `Depth: ${gateHistory.length}\n\n` +
            `Do you want to proceed?`
        );
        if (!proceed) return;
      }

      const finalState = circuit.run();

      const rawProbs = Array.from({ length: 1 << numQubits }, (_, i) => {
        const amp = finalState.amplitudes.get(i) || new ComplexNumber(0, 0);
        return amp.abs() ** 2;
      });
      const total = rawProbs.reduce((a, b) => a + b, 0);
      const probs = total > 0 ? rawProbs.map((p) => p / total) : rawProbs;
      setResults(probs);

      const countsArray = Array(1 << numQubits).fill(0);
      for (let shot = 0; shot < numShots; shot++) {
        const r = Math.random();
        let acc = 0;
        let picked = false;
        for (let i = 0; i < probs.length; i++) {
          acc += probs[i];
          if (r < acc) {
            countsArray[i]++;
            picked = true;
            break;
          }
        }
        if (!picked) countsArray[probs.length - 1]++;
      }
      setCounts(countsArray);

      const newQubitStates = Array.from(
        { length: numQubits },
        (_, qubitIndex) => {
          let ex = 0,
            ey = 0,
            ez = 0;
          for (let stateIndex = 0; stateIndex < 1 << numQubits; stateIndex++) {
            const amp =
              finalState.amplitudes.get(stateIndex) || new ComplexNumber(0, 0);
            const bit = (stateIndex >> qubitIndex) & 1;
            if (bit === 0) {
              const flipped = stateIndex ^ (1 << qubitIndex);
              const ampFlip =
                finalState.amplitudes.get(flipped) || new ComplexNumber(0, 0);
              const coeff = amp.conjugate().mul(ampFlip);
              ex += coeff.re;
              ey += coeff.im;
            }
            ez += amp.abs() ** 2 * (bit === 0 ? 1 : -1);
          }
          ex *= 2;
          ey *= 2;
          const r = Math.sqrt(ex * ex + ey * ey + ez * ez);
          const theta = r > 0 ? Math.acos(ez / r) : 0;
          const phi = r > 0 ? Math.atan2(ey, ex) : 0;
          if (DEBUG) {
            console.log(
              `q${qubitIndex}: ex=${ex.toFixed(4)}, ey=${ey.toFixed(
                4
              )}, ez=${ez.toFixed(4)}, r=${r.toFixed(4)}`
            );
          }
          return { theta, phi, ez, r: Math.min(1, r) };
        }
      );
      setQubitStates(newQubitStates);

      const amps = Array.from({ length: 1 << numQubits }, (_, i) => {
        const a = finalState.amplitudes.get(i) || new ComplexNumber(0, 0);
        return {
          index: i,
          re: a.re,
          im: a.im,
          phase: a.arg(),
          prob: a.abs() ** 2,
        };
      });
      setAmplitudes(amps);

      setErrorMessage("");
    } catch (e: unknown) {
      console.error("Run error", e);
      setErrorMessage(errorMessageFrom(e) || "Failed to run circuit.");
    }
  };

  const handleRemoveLastGate = () => {
    if (gateHistory.length === 0) return;
    const newHistory = gateHistory.slice(0, gateHistory.length - 1);
    rebuildFromHistory(numQubits, initialBasisState, newHistory);
  };

  const handleRemoveGateAt = (index: number) => {
    if (index < 0 || index >= gateHistory.length) return;
    const newHistory = gateHistory.filter((_, i) => i !== index);
    rebuildFromHistory(numQubits, initialBasisState, newHistory);
  };

  const handleResetCircuit = () => {
    rebuildFromHistory(numQubits, initialBasisState, []);
  };

  const handleSaveCircuit = () => {
    try {
      const data = { numQubits, initialBasisState, operations: gateHistory };
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
        initialBasisState?: number;
        operations: HistoryOp[];
      } = JSON.parse(saved);
      rebuildFromHistory(
        parsed.numQubits,
        parsed.initialBasisState ?? 0,
        parsed.operations
      );
      setErrorMessage("Circuit loaded from browser storage.");
    } catch {
      setErrorMessage("Failed to load saved circuit.");
    }
  };

  const handleExportCircuit = () => {
    try {
      const data = { numQubits, initialBasisState, operations: gateHistory };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qsim-circuit.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Export failed.");
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportCircuit: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "{}");
        const parsed: {
          numQubits: number;
          initialBasisState?: number;
          operations: HistoryOp[];
        } = JSON.parse(text);
        rebuildFromHistory(
          parsed.numQubits,
          parsed.initialBasisState ?? 0,
          parsed.operations
        );
        setErrorMessage("Circuit imported.");
      } catch {
        setErrorMessage("Failed to import circuit.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleShare = async () => {
    try {
      const data = { numQubits, initialBasisState, operations: gateHistory };
      const json = JSON.stringify(data);
      const encoded = encodeURIComponent(btoa(json));
      const url = new URL(window.location.href);
      url.searchParams.set("c", encoded);
      await navigator.clipboard.writeText(url.toString());
      setErrorMessage("Sharable URL copied to clipboard.");
    } catch {
      setErrorMessage("Failed to generate share URL.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("c");
    if (!dataParam) return;
    try {
      const json = atob(decodeURIComponent(dataParam));
      const parsed: {
        numQubits: number;
        initialBasisState?: number;
        operations: HistoryOp[];
      } = JSON.parse(json);
      rebuildFromHistory(
        parsed.numQubits,
        parsed.initialBasisState ?? 0,
        parsed.operations
      );
      setErrorMessage("Circuit loaded from URL.");
    } catch {
      setErrorMessage("Failed to load circuit from URL.");
    }
  }, []);

  const handleExportPNG = async () => {
    if (!circuitDiagramRef.current) return;
    try {
      const dataUrl = await toPng(circuitDiagramRef.current, {
        cacheBust: true,
        width: circuitDiagramRef.current.scrollWidth,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "circuit.png";
      a.click();
    } catch (e: unknown) {
      console.error(e);
      setErrorMessage("PNG export failed.");
    }
  };

  const handleExportCSV = () => {
    if (!amplitudes) {
      setErrorMessage("Run the circuit first to export CSV.");
      return;
    }
    try {
      const header = ["index", "state", "real", "imag", "phase", "prob"].join(
        ","
      );
      const rows = amplitudes.map((a) =>
        [
          String(a.index),
          `|${a.index.toString(2).padStart(numQubits, "0")}⟩`,
          a.re.toPrecision(10),
          a.im.toPrecision(10),
          a.phase.toPrecision(10),
          a.prob.toPrecision(10),
        ].join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "amplitudes.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("CSV export failed.");
    }
  };

  const applyPreset = (preset: "Bell" | "GHZ_3" | "All-H" | "Grover_2") => {
    if (preset === "Bell") {
      const ops: HistoryOp[] = [
        { gateName: "Hadamard", qubits: [0] },
        { gateName: "CNOT", qubits: [0, 1] },
      ];
      rebuildFromHistory(2, 0, ops);
      return;
    }
    if (preset === "GHZ_3") {
      const ops: HistoryOp[] = [
        { gateName: "Hadamard", qubits: [0] },
        { gateName: "CNOT", qubits: [0, 1] },
        { gateName: "CNOT", qubits: [1, 2] },
      ];
      rebuildFromHistory(3, 0, ops);
      return;
    }
    if (preset === "All-H") {
      const ops: HistoryOp[] = Array.from({ length: numQubits }, (_, i) => ({
        gateName: "Hadamard",
        qubits: [i],
      }));
      rebuildFromHistory(numQubits, 0, ops);
      return;
    }
    if (preset === "Grover_2") {
      const ops: HistoryOp[] = [
        { gateName: "Hadamard", qubits: [0] },
        { gateName: "Hadamard", qubits: [1] },
        { gateName: "Oracle", qubits: [0, 1], params: [2, 3] },
        { gateName: "Diffusion", qubits: [0, 1], params: [2] },
      ];
      rebuildFromHistory(2, 0, ops);
      return;
    }
  };

  const renderCircuitDiagram = () => {
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
      <div className="overflow-x-auto" ref={circuitDiagramRef}>
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
                      (op.gateName === "Oracle" ||
                        op.gateName === "Diffusion") &&
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
                            <span className="text-xs font-semibold">
                              {token}
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
                      onClick={() => handleRemoveGateAt(colStart + colIndex)}
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
            No gates added yet. Select a gate and qubit(s), then click "Add
            Gate".
          </div>
        )}
      </div>
    );
  };

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
    <div className="max-w-7xl mx-auto p-8 bg-card rounded-lg shadow-lg mt-10 space-y-8 border">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-foreground">
        Quantum Circuit Builder{" "}
        <span className="text-primary">(Experimental)</span>
      </h1>

      <div
        role="note"
        aria-label="Performance disclaimer"
        className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200"
      >
        Warning: Quantum simulation scales exponentially with qubits (2^n
        states). Large qubit counts, deep circuits, or wide operations (e.g.,
        Oracle/Diffusion) can be slow and may temporarily hang your browser tab.
        Consider saving/exporting your circuit first.
      </div>

      <div
        className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground min-w-0"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="px-2 py-1 rounded bg-muted border">
          Qubits: {numQubits}
        </span>
        <span className="px-2 py-1 rounded bg-muted border">
          Gates: {gateHistory.length}
        </span>
        <span
          className="px-2 py-1 rounded bg-muted border font-mono max-w-[min(60vw,360px)] overflow-hidden text-ellipsis whitespace-nowrap"
          title={`Initial = |${binaryInitial}⟩ (${initialBasisState})`}
        >
          Initial: |{formatKet(binaryInitial, 24)}⟩ ({initialBasisState})
        </span>
        {results ? (
          <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/30 text-emerald-700 dark:text-emerald-300">
            Results ready
          </span>
        ) : (
          <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-amber-800 dark:text-amber-300">
            Awaiting run
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-5 lg:grid-cols-6 mb-2 min-w-0">
        <div className="min-w-0">
          <label
            className="block font-bold text-xl mb-2 text-foreground"
            htmlFor="qubit-count"
          >
            Number of Qubits:
          </label>
          <input
            id="qubit-count"
            type="number"
            min={1}
            className="border border-input rounded-lg p-3 w-full text-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              const n = parseInt(value, 10);
              if (!Number.isFinite(n) || n < 1) {
                setErrorMessage(
                  "Enter a positive integer for number of qubits."
                );
                return;
              }
              if (n === numQubits) return;
              const newInit = Math.min(initialBasisState, (1 << n) - 1);
              const filteredOps = gateHistory.filter((op) =>
                op.qubits.every((q) => q >= 0 && q < n)
              );
              if (filteredOps.length !== gateHistory.length) {
                setErrorMessage(
                  "Some gates were removed because they referenced out-of-range qubits."
                );
              } else {
                setErrorMessage("");
              }
              rebuildFromHistory(n, newInit, filteredOps);
            }}
          />
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
            {quickSelect(
              "CP",
              "ControlledPhaseShift",
              "Controlled Phase Shift (θ)"
            )}
            {quickSelect("Oracle", "Oracle", "Oracle (marked state)")}
            {quickSelect("Diffusion", "Diffusion", "Diffusion")}
          </div>
        </div>

        <div className="md:col-span-4 lg:col-span-5 space-y-4 min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
            <div className="min-w-0">
              <label
                className="block text-sm font-medium mb-1 text-muted-foreground"
                htmlFor="qubits-input"
              >
                Qubits to target (comma-separated)
              </label>
              <input
                id="qubits-input"
                type="text"
                placeholder="e.g., 0 or 0,1"
                className="border border-input rounded-lg p-2 w-full text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={qubitsInput}
                onChange={(e) => setQubitsInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Gate: {selectedGate || "(none)"}
              </p>
            </div>

            <div className="min-w-0">
              <label
                className="block text-sm font-medium mb-1 text-muted-foreground"
                htmlFor="angle-input"
              >
                Angle θ (rad)
              </label>
              <input
                id="angle-input"
                type="number"
                step={0.01}
                className="border border-input rounded-lg p-2 w-full text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={angle}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAngle(Number.isFinite(v) ? v : 0);
                }}
                disabled={
                  !["RX", "RY", "RZ", "ControlledPhaseShift"].includes(
                    selectedGate
                  )
                }
                aria-disabled={
                  !["RX", "RY", "RZ", "ControlledPhaseShift"].includes(
                    selectedGate
                  )
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used for RX, RY, RZ, and Controlled Phase Shift.
              </p>
            </div>

            <div className="min-w-0">
              <label
                className="block text-sm font-medium mb-1 text-muted-foreground"
                htmlFor="oracle-target"
              >
                Oracle marked state (int)
              </label>
              <input
                id="oracle-target"
                type="number"
                min={0}
                className="border border-input rounded-lg p-2 w-full text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={oracleTargetState}
                onChange={(e) => {
                  const width = Math.max(1, parseQubits().length || 1);
                  const max = (1 << width) - 1;
                  let v = parseInt(e.target.value, 10);
                  if (!Number.isFinite(v)) v = 0;
                  v = Math.max(0, Math.min(max, v));
                  setOracleTargetState(v);
                }}
                disabled={selectedGate !== "Oracle"}
                aria-disabled={selectedGate !== "Oracle"}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Width inferred from selected qubits. Value clamped to [0, 2^w -
                1].
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={useCondition}
                onChange={(e) => setUseCondition(e.target.checked)}
              />
              Conditional (measure qubit equals value)
            </label>
            <label className="text-sm text-muted-foreground">
              Qubit
              <input
                type="number"
                className="ml-2 border rounded px-2 py-1 w-20 bg-background text-foreground"
                min={0}
                max={Math.max(0, numQubits - 1)}
                value={conditionQubit}
                onChange={(e) => {
                  let v = parseInt(e.target.value, 10);
                  if (!Number.isFinite(v)) v = 0;
                  v = Math.max(0, Math.min(numQubits - 1, v));
                  setConditionQubit(v);
                }}
                disabled={!useCondition}
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Value
              <select
                className="ml-2 border rounded px-2 py-1 bg-background text-foreground"
                value={conditionValue}
                onChange={(e) =>
                  setConditionValue(
                    (parseInt(e.target.value, 10) || 0) as 0 | 1
                  )
                }
                disabled={!useCondition}
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </label>

            <Button
              className="ml-auto"
              onClick={handleAddGate}
              disabled={!canAddGate}
              aria-disabled={!canAddGate}
              title={
                canAddGate
                  ? "Add gate to circuit"
                  : "Select gate and valid qubits first"
              }
            >
              Add Gate
            </Button>
          </div>
        </div>
      </div>

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
                rebuildFromHistory(numQubits, v, gateHistory);
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
                    onClick={() =>
                      rebuildFromHistory(
                        numQubits,
                        initialBasisState ^ (1 << i),
                        gateHistory
                      )
                    }
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

      <section aria-labelledby="presets-title" className="space-y-2">
        <h2
          id="presets-title"
          className="text-lg font-semibold text-foreground"
        >
          Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => applyPreset("Bell")}
          >
            Bell (2)
          </button>
          <button
            className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => applyPreset("GHZ_3")}
          >
            GHZ (3)
          </button>
          <button
            className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => applyPreset("All-H")}
          >
            All-H
          </button>
          <button
            className="px-3 py-1 rounded border bg-muted hover:bg-muted/70"
            onClick={() => applyPreset("Grover_2")}
          >
            Grover (2)
          </button>
        </div>
      </section>

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
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ‹ Prev
            </button>
            <span className="px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="px-2 py-1 rounded border bg-muted hover:bg-muted/70"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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
        <div className="w-full p-3 bg-card rounded border shadow-sm">
          {renderCircuitDiagram()}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleRemoveLastGate}
            disabled={!canRemoveLast}
            aria-disabled={!canRemoveLast}
            title="Remove last gate"
          >
            Remove last gate
          </Button>
          <Button
            variant="outline"
            onClick={handleResetCircuit}
            disabled={!canResetCircuit}
            aria-disabled={!canResetCircuit}
            title="Reset circuit"
          >
            Reset circuit
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPNG}
            title="Export circuit diagram as PNG"
          >
            Export PNG
          </Button>
        </div>
      </section>

      <section className="space-y-2" aria-label="Persistence actions">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="success"
            onClick={handleSaveCircuit}
            title="Save circuit to browser storage"
          >
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={handleLoadCircuit}
            title="Load circuit from browser storage"
          >
            Load
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCircuit}
            title="Export circuit JSON"
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={handleImportClick}
            title="Import circuit JSON"
          >
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportCircuit}
          />
          <Button
            variant="secondary"
            onClick={handleShare}
            title="Copy shareable URL"
          >
            Share URL
          </Button>
        </div>
      </section>

      {errorMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded border bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
        >
          {errorMessage}
        </div>
      )}

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
          <Button onClick={handleRunCircuit} title="Run the circuit">
            Run
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!amplitudes}
            aria-disabled={!amplitudes}
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
    </div>
  );
};

export default CircuitBuilder;
