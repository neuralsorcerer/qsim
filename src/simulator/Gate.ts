/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { ComplexNumber } from "./Complex";
import { Matrix, matrix } from "mathjs";

export class Gate {
  matrix: Matrix;
  size: number;

  constructor(matrixData: ComplexNumber[][]) {
    this.size = matrixData.length;
    this.matrix = matrix(
      matrixData.map((row) => row.map((c) => c.toMathJSComplex()))
    );
  }

  static Diffusion(numQubits: number): Gate {
    const size = 1 << numQubits;
    const factor = 2 / size;
    const matrixData: ComplexNumber[][] = [];

    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const value =
          i === j ? new ComplexNumber(factor - 1) : new ComplexNumber(factor);
        row.push(value);
      }
      matrixData.push(row);
    }

    return new Gate(matrixData);
  }

  static Hadamard(): Gate {
    const factor = 1 / Math.sqrt(2);
    return new Gate([
      [new ComplexNumber(factor, 0), new ComplexNumber(factor, 0)],
      [new ComplexNumber(factor, 0), new ComplexNumber(-factor, 0)],
    ]);
  }

  static PauliX(): Gate {
    return new Gate([
      [new ComplexNumber(0), new ComplexNumber(1)],
      [new ComplexNumber(1), new ComplexNumber(0)],
    ]);
  }

  static PauliY(): Gate {
    return new Gate([
      [new ComplexNumber(0), new ComplexNumber(0, -1)],
      [new ComplexNumber(0, 1), new ComplexNumber(0)],
    ]);
  }

  static PauliZ(): Gate {
    return new Gate([
      [new ComplexNumber(1), new ComplexNumber(0)],
      [new ComplexNumber(0), new ComplexNumber(-1)],
    ]);
  }

  static CNOT(): Gate {
    return new Gate([
      [
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(1),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
      ],
    ]);
  }

  static Swap(): Gate {
    return new Gate([
      [
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(1),
      ],
    ]);
  }

  static Toffoli(): Gate {
    const size = 8;
    const matrixData: ComplexNumber[][] = [];
    for (let i = 0; i < size; i++) {
      const row = Array(size).fill(new ComplexNumber(0));
      row[i] = new ComplexNumber(1);
      matrixData.push(row);
    }
    matrixData[6][6] = new ComplexNumber(0);
    matrixData[6][7] = new ComplexNumber(1);
    matrixData[7][6] = new ComplexNumber(1);
    matrixData[7][7] = new ComplexNumber(0);
    return new Gate(matrixData);
  }

  static ControlledPhaseShift(theta: number): Gate {
    return new Gate([
      [
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(1),
        new ComplexNumber(0),
      ],
      [
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(0),
        new ComplexNumber(Math.cos(theta), Math.sin(theta)),
      ],
    ]);
  }

  static Oracle(numQubits: number, targetState: number): Gate {
    const size = 1 << numQubits;
    const matrixData: ComplexNumber[][] = [];
    for (let i = 0; i < size; i++) {
      const value = i === targetState ? -1 : 1;
      const row = Array(size).fill(new ComplexNumber(0));
      row[i] = new ComplexNumber(value);
      matrixData.push(row);
    }
    return new Gate(matrixData);
  }

  static RX(theta: number): Gate {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return new Gate([
      [new ComplexNumber(c), new ComplexNumber(0, -s)],
      [new ComplexNumber(0, -s), new ComplexNumber(c)],
    ]);
  }

  static RY(theta: number): Gate {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return new Gate([
      [new ComplexNumber(c), new ComplexNumber(-s)],
      [new ComplexNumber(s), new ComplexNumber(c)],
    ]);
  }

  static RZ(theta: number): Gate {
    const half = theta / 2;
    return new Gate([
      [
        new ComplexNumber(Math.cos(-half), Math.sin(-half)),
        new ComplexNumber(0),
      ],
      [new ComplexNumber(0), new ComplexNumber(Math.cos(half), Math.sin(half))],
    ]);
  }
}
