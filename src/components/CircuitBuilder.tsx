/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Circuit } from "../simulator/Circuit";
import { ComplexNumber } from "../simulator/Complex";
import { Button } from "./Button";
import { DEBUG } from "../config";
import { toPng } from "dom-to-image-more";

import { gateMap } from "./circuitbuilder/gateMap";
import type { HistoryOp } from "./circuitbuilder/types";
import { errorMessageFrom } from "./circuitbuilder/types";
import GatePalette from "./circuitbuilder/GatePalette";
import InitialStateControls from "./circuitbuilder/InitialStateControls";
import Presets from "./circuitbuilder/Presets";
import DiagramPanel from "./circuitbuilder/DiagramPanel";
import RunPanel from "./circuitbuilder/RunPanel";
import PersistencePanel from "./circuitbuilder/PersistencePanel";
import { Helmet } from "react-helmet-async";

const CircuitBuilder: React.FC = () => {
  const [numQubits, setNumQubits] = useState<number>(2);
  const [inputValue, setInputValue] = useState<string>("2");
  const [initialBasisState, setInitialBasisState] = useState<number>(0);
  const [circuit, setCircuit] = useState<Circuit>(new Circuit(2, 0));

  const [selectedGate, setSelectedGate] = useState<string>("");
  const [qubitsInput, setQubitsInput] = useState<string>("");
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
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      if (w < 480) return 8;
      if (w < 768) return 12;
    }
    return 16;
  });

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

  const parseQubits = useCallback((): number[] => {
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
  }, [qubitsInput]);

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
    parseQubits,
    numQubits,
    useCondition,
    conditionQubit,
    oracleTargetState,
  ]);

  const applyHistoryToCircuit = useCallback(
    (c: Circuit, history: HistoryOp[]) => {
      history.forEach((op) => {
        const gateFactory = gateMap[op.gateName];
        if (!gateFactory) return;
        const gate = gateFactory(...(op.params ?? []));
        if (op.condition) c.addConditionalGate(gate, op.qubits, op.condition);
        else c.addGate(gate, op.qubits);
      });
    },
    []
  );

  const rebuildFromHistory = useCallback(
    (qCount: number, initState: number, operations: HistoryOp[]) => {
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
    },
    [applyHistoryToCircuit]
  );

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
  }, [rebuildFromHistory]);

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

  return (
    <>
      <Helmet>
        <title>Quantum Circuit Builder — QSim</title>
        <meta
          name="description"
          content="Build quantum circuits with gates like Hadamard, CNOT, RX/RY/RZ, Toffoli, Oracle, and Diffusion. Run simulations, export results, and share your designs."
        />
        <link
          rel="canonical"
          href="https://quantumsimulator.in/circuit-builder"
        />
        <meta property="og:title" content="Quantum Circuit Builder — QSim" />
        <meta
          property="og:description"
          content="Build and simulate quantum circuits in your browser with QSim."
        />
        <meta
          property="og:image"
          content="https://quantumsimulator.in/logo.png"
        />
        <meta
          property="og:url"
          content="https://quantumsimulator.in/circuit-builder"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://quantumsimulator.in/logo.png"
        />
      </Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "QSim — Quantum Circuit Builder",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            url: "https://quantumsimulator.in/circuit-builder",
            image: "https://quantumsimulator.in/logo.png",
            description:
              "Build quantum circuits with gates like Hadamard, CNOT, RX/RY/RZ, Toffoli, Oracle, and Diffusion. Run simulations, export results, and share your designs.",
          }),
        }}
      />

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
          Oracle/Diffusion) can be slow and may temporarily hang your browser
          tab. Consider saving/exporting your circuit first.
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
            <GatePalette
              selectedGate={selectedGate}
              setSelectedGate={setSelectedGate}
              parseQubits={parseQubits}
            />
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
                  Width inferred from selected qubits. Value clamped to [0, 2^w
                  - 1].
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

        <InitialStateControls
          numQubits={numQubits}
          initialBasisState={initialBasisState}
          binaryInitial={binaryInitial}
          formatKet={formatKet}
          onChangeInitial={(v) => rebuildFromHistory(numQubits, v, gateHistory)}
          onToggleBit={(i) =>
            rebuildFromHistory(
              numQubits,
              initialBasisState ^ (1 << i),
              gateHistory
            )
          }
        />

        <Presets onApply={applyPreset} />

        <DiagramPanel
          numQubits={numQubits}
          visibleHistory={visibleHistory}
          colStart={colStart}
          hoveredCol={hoveredCol}
          setHoveredCol={setHoveredCol}
          onRemoveAt={handleRemoveGateAt}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          canRemoveLast={canRemoveLast}
          canReset={canResetCircuit}
          onRemoveLast={handleRemoveLastGate}
          onReset={handleResetCircuit}
          onExportPNG={handleExportPNG}
          circuitDiagramRef={circuitDiagramRef}
        />

        <PersistencePanel
          onSave={handleSaveCircuit}
          onLoad={handleLoadCircuit}
          onExportJSON={handleExportCircuit}
          onImportJSON={handleImportClick}
          onShare={handleShare}
          fileInputRef={fileInputRef}
          onFileChange={handleImportCircuit}
        />

        {errorMessage && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded border bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
          >
            {errorMessage}
          </div>
        )}

        <RunPanel
          numQubits={numQubits}
          results={results}
          counts={counts}
          qubitStates={qubitStates}
          numShots={numShots}
          setNumShots={setNumShots}
          onRun={handleRunCircuit}
          canExportCSV={Boolean(amplitudes)}
          onExportCSV={handleExportCSV}
        />
      </div>
    </>
  );
};

export default CircuitBuilder;
