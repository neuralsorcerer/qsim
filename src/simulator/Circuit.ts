/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Gate } from "./Gate";
import { SparseQuantumState } from "./SparseQuantumState";
import { DEBUG } from "../config";

interface GateOperation {
  gate: Gate;
  qubits: number[];
  condition?: { qubit: number; value: number };
}

export class Circuit {
  numQubits: number;
  operations: GateOperation[] = [];
  initialBasisState: number;

  constructor(numQubits: number, initialBasisState: number = 0) {
    this.numQubits = numQubits;
    this.initialBasisState = initialBasisState;
  }

  private static gateArity(gate: Gate): number {
    const size = gate.size;
    const k = Math.log2(size);
    if (!Number.isFinite(k) || Math.round(k) !== k) {
      throw new Error(`Invalid gate size: ${size}. Expected power of 2.`);
    }
    return k;
  }

  private static validateArity(gate: Gate, qubits: number[]): void {
    const arity = Circuit.gateArity(gate);
    if (qubits.length !== arity) {
      throw new Error(
        `Gate expects ${arity} qubit(s), received ${qubits.length}.`
      );
    }
    if (arity > 1) {
      const uniq = new Set(qubits);
      if (uniq.size !== qubits.length) {
        throw new Error(
          `Multi-qubit gate requires distinct target qubits; received ${qubits.join(
            ","
          )}.`
        );
      }
    }
  }

  addGate(gate: Gate, qubits: number[]): void {
    if (qubits.some((q) => q >= this.numQubits || q < 0)) {
      throw new Error(
        `Qubit index out of range (Max index: ${
          this.numQubits - 1
        }, Provided: ${Math.max(...qubits)})`
      );
    }
    Circuit.validateArity(gate, qubits);

    if (DEBUG) {
      console.log(`Adding gate: ${gate.constructor.name} to qubits: ${qubits}`);
    }

    this.operations.push({ gate, qubits });
  }

  addConditionalGate(
    gate: Gate,
    qubits: number[],
    condition: { qubit: number; value: number }
  ): void {
    if (qubits.some((q) => q >= this.numQubits || q < 0)) {
      throw new Error(
        `Qubit index out of range (Max index: ${
          this.numQubits - 1
        }, Provided: ${Math.max(...qubits)})`
      );
    }
    if (condition.qubit < 0 || condition.qubit >= this.numQubits) {
      throw new Error(
        `Condition qubit out of range (Expected 0..${
          this.numQubits - 1
        }, Received: ${condition.qubit})`
      );
    }
    if (qubits.includes(condition.qubit)) {
      throw new Error(
        `Conditional qubit must be distinct from target qubits; received overlap at q${condition.qubit}.`
      );
    }
    Circuit.validateArity(gate, qubits);

    if (DEBUG) {
      console.log(
        `Adding conditional gate: ${gate.constructor.name} to qubits: ${qubits} under condition: qubit ${condition.qubit} = ${condition.value}`
      );
    }
    this.operations.push({ gate, qubits, condition });
  }

  run(): SparseQuantumState {
    const state = new SparseQuantumState(
      this.numQubits,
      this.initialBasisState
    );
    if (DEBUG) {
      console.log(
        `Running the circuit with ${this.operations.length} operations...`
      );
    }

    for (const op of this.operations) {
      try {
        if (op.condition) {
          if (DEBUG) {
            console.log(
              `Measuring qubit ${op.condition.qubit} to check condition...`
            );
          }
          const measurement = state.measure(op.condition.qubit);
          if (DEBUG) {
            console.log(
              `Measured value: ${measurement} (Condition: qubit ${op.condition.qubit} = ${op.condition.value})`
            );
          }

          if (measurement === op.condition.value) {
            if (DEBUG) {
              console.log(
                `Condition met. Applying conditional gate: ${op.gate.constructor.name} on qubits: ${op.qubits}`
              );
            }

            state.applyGate(op.gate, op.qubits);
          } else {
            if (DEBUG) {
              console.log(
                `Condition not met. Skipping gate: ${op.gate.constructor.name}`
              );
            }
          }
        } else {
          if (DEBUG) {
            console.log(
              `Applying gate: ${op.gate.constructor.name} on qubits: ${op.qubits}`
            );
          }

          state.applyGate(op.gate, op.qubits);
        }
      } catch (error) {
        console.error(
          `Error while running gate ${op.gate.constructor.name}:`,
          error
        );
        throw error;
      }
    }

    if (DEBUG) {
      console.log(`Circuit execution complete. Returning final state.`);
    }
    return state;
  }
}
