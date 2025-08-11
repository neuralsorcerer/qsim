/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Gate } from "../../simulator/Gate";
import type { GateFactoryMap } from "./types";

export const gateMap: GateFactoryMap = {
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
