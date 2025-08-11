/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { ComplexNumber } from "./Complex";
import { Gate } from "./Gate";
import { DEBUG } from "../config";
import { NORMALIZE_EACH_STEP } from "../config";

export class SparseQuantumState {
  numQubits: number;
  amplitudes: Map<number, ComplexNumber>;
  normalizeEachStep: boolean;

  constructor(
    numQubits: number,
    initialBasisState: number = 0,
    normalizeEachStep?: boolean
  ) {
    this.numQubits = numQubits;
    this.amplitudes = new Map();
    this.normalizeEachStep =
      normalizeEachStep === undefined ? NORMALIZE_EACH_STEP : normalizeEachStep;
    const maxIndex = (1 << numQubits) - 1;
    if (initialBasisState < 0 || initialBasisState > maxIndex) {
      throw new Error(
        `Initial basis state out of range. Expected 0..${maxIndex}, received ${initialBasisState}.`
      );
    }
    this.amplitudes.set(initialBasisState, new ComplexNumber(1, 0));
    if (DEBUG) {
      console.log(
        `Initialized quantum state with ${numQubits} qubits at |${initialBasisState
          .toString(2)
          .padStart(numQubits, "0")}⟩.`
      );
    }
  }

  applyGate(gate: Gate, targetQubits: number[]): void {
    const newAmplitudes = new Map<number, ComplexNumber>();
    const numTargetStates = 1 << targetQubits.length;
    if (DEBUG) {
      console.log(
        `Applying ${gate.constructor.name} to qubits ${targetQubits}`
      );
    }

    for (const [stateIndex, amplitude] of this.amplitudes.entries()) {
      let basisIndex = 0;
      for (let k = 0; k < targetQubits.length; k++) {
        const bit = (stateIndex >> targetQubits[k]) & 1;
        basisIndex |= bit << k;
      }
      for (let i = 0; i < numTargetStates; i++) {
        const gateElement = gate.matrix.get([i, basisIndex]);
        if (gateElement.re === 0 && gateElement.im === 0) continue;

        const newStateIndex = this.applyGateToBasisState(
          stateIndex,
          targetQubits,
          i
        );
        const product = amplitude.mul(
          ComplexNumber.fromMathJSComplex(gateElement)
        );

        if (DEBUG) {
          console.log(
            `\tTransition: |${stateIndex
              .toString(2)
              .padStart(this.numQubits, "0")}⟩ -> |${newStateIndex
              .toString(2)
              .padStart(
                this.numQubits,
                "0"
              )}⟩ with amplitude ${product.toString()}`
          );
        }

        if (!newAmplitudes.has(newStateIndex)) {
          newAmplitudes.set(newStateIndex, product);
        } else {
          newAmplitudes.set(
            newStateIndex,
            newAmplitudes.get(newStateIndex)!.add(product)
          );
        }
      }
    }

    this.amplitudes = newAmplitudes;
    if (this.normalizeEachStep) {
      this.normalize();
    }

    if (DEBUG) {
      console.log(`State after applying ${gate.constructor.name}:`);
      for (const [state, amp] of this.amplitudes.entries()) {
        console.log(
          `|${state
            .toString(2)
            .padStart(this.numQubits, "0")}⟩: ${amp.toString()}`
        );
      }
    }
  }

  applyGateToBasisState(
    stateIndex: number,
    targetQubits: number[],
    targetStateIndex: number
  ): number {
    let newStateIndex = stateIndex;

    for (let i = 0; i < targetQubits.length; i++) {
      const qubit = targetQubits[i];
      const bit = (targetStateIndex >> i) & 1;

      if (bit === 0) {
        newStateIndex &= ~(1 << qubit);
      } else {
        newStateIndex |= 1 << qubit;
      }
    }

    return newStateIndex;
  }

  measure(qubit: number): number {
    let prob0 = 0;

    for (const [stateIndex, amplitude] of this.amplitudes.entries()) {
      const bit = (stateIndex >> qubit) & 1;
      const prob = amplitude.abs() ** 2;
      if (bit === 0) {
        prob0 += prob;
      }
    }

    const rand = Math.random();
    const outcome = rand < prob0 ? 0 : 1;

    if (DEBUG) {
      console.log(`Measured qubit ${qubit}: outcome ${outcome}`);
    }

    for (const stateIndex of Array.from(this.amplitudes.keys())) {
      const bit = (stateIndex >> qubit) & 1;
      if (bit !== outcome) {
        this.amplitudes.delete(stateIndex);
      }
    }

    this.normalize();
    return outcome;
  }

  measureAll(): number[] {
    const measurements: number[] = [];
    for (let qubit = 0; qubit < this.numQubits; qubit++) {
      measurements.push(this.measure(qubit));
    }
    return measurements;
  }

  normalize(): void {
    let norm = 0;
    for (const amplitude of this.amplitudes.values()) {
      norm += amplitude.abs() ** 2;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      throw new Error("Normalization error: total probability is zero.");
    }

    for (const [stateIndex, amplitude] of this.amplitudes.entries()) {
      this.amplitudes.set(
        stateIndex,
        new ComplexNumber(amplitude.re / norm, amplitude.im / norm)
      );
    }
  }
}
