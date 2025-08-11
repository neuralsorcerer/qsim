/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DEBUG } from "../config";

interface QuantumStateVisualizerProps {
  numQubits: number;
  results: number[];
  counts?: number[] | null;
  qubitStates: {
    theta: number;
    phi: number;
    ez: number;
    r: number;
  }[];
}

const QuantumStateVisualizer: React.FC<QuantumStateVisualizerProps> = ({
  numQubits,
  results,
  counts,
  qubitStates,
}) => {
  const formatBinaryState = (index: number): string => {
    return `|${index.toString(2).padStart(numQubits, "0")}⟩`;
  };

  const [angleUnit, setAngleUnit] = useState<"rad" | "deg">("rad");
  const formatAngle = (rad: number, unit: "rad" | "deg") =>
    unit === "deg"
      ? `${((rad * 180) / Math.PI).toFixed(3)}°`
      : `${rad.toFixed(3)} rad`;

  const [showBloch, setShowBloch] = useState(true);
  const DEFAULT_CAP = 12;
  const [renderCap, setRenderCap] = useState<number>(DEFAULT_CAP);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const displayedIndices = useMemo(() => {
    return Array.from(
      { length: Math.min(qubitStates.length, renderCap) },
      (_, i) => i
    );
  }, [qubitStates.length, renderCap]);

  type BlochProps = {
    theta: number;
    phi: number;
    ez: number;
    r: number;
    unit: "rad" | "deg";
  };
  const BlochSphereBase: React.FC<BlochProps> = ({
    theta,
    phi,
    ez,
    r,
    unit,
  }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const current = mountRef.current;
      if (!current) return;

      current.innerHTML = "";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio ?? 1);

      const setSize = (dim: number) => {
        const size = Math.max(180, Math.min(360, Math.floor(dim)));
        renderer.setSize(size, size, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      };

      setSize(current.clientWidth || 300);
      current.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(3, 3, 3).normalize();
      scene.add(light);

      const blochGroup = new THREE.Group();
      blochGroup.rotation.x = -Math.PI / 2;
      scene.add(blochGroup);

      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        wireframe: true,
        opacity: 0.5,
        transparent: true,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      blochGroup.add(sphere);

      const makeCircleLine = (
        points: Array<[number, number, number]>,
        color: number,
        opacity = 0.35
      ) => {
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
          const [px, py, pz] = points[i];
          positions[i * 3 + 0] = px;
          positions[i * 3 + 1] = py;
          positions[i * 3 + 2] = pz;
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity,
        });
        const line = new THREE.LineLoop(geom, mat);
        return { line, geom, mat };
      };

      const SEG = 128;
      const circlePoints = (f: (t: number) => [number, number, number]) =>
        Array.from({ length: SEG }, (_, i) => {
          const t = (i / SEG) * Math.PI * 2;
          return f(t);
        });

      const eq = makeCircleLine(
        circlePoints((t) => [Math.cos(t), Math.sin(t), 0]),
        0x8888ff
      );
      blochGroup.add(eq.line);

      const merXZ = makeCircleLine(
        circlePoints((t) => [Math.cos(t), 0, Math.sin(t)]),
        0x88ff88,
        0.3
      );
      blochGroup.add(merXZ.line);

      const merYZ = makeCircleLine(
        circlePoints((t) => [0, Math.cos(t), Math.sin(t)]),
        0xff8888,
        0.3
      );
      blochGroup.add(merYZ.line);

      const makeLabelSprite = (text: string, color = "#ffffff") => {
        const dpr = (window.devicePixelRatio || 1) as number;
        const cw = 128 * dpr;
        const ch = 64 * dpr;
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cw, ch);
        ctx.font =
          "24px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 64, 32);
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.35, 0.175, 1);
        return {
          sprite,
          dispose: () => {
            tex.dispose();
            mat.dispose();
          },
        };
      };

      const xLbl = makeLabelSprite("X", "#ff5555");
      xLbl.sprite.position.set(1.2, 0, 0);
      const yLbl = makeLabelSprite("Y", "#55ff55");
      yLbl.sprite.position.set(0, 1.2, 0);
      const zLbl = makeLabelSprite("Z", "#5590ff");
      zLbl.sprite.position.set(0, 0, 1.2);
      blochGroup.add(xLbl.sprite, yLbl.sprite, zLbl.sprite);

      let color: number;
      const epsilon = 0.05;
      if (Math.abs(ez - 1) < epsilon) {
        color = 0x00ff00;
      } else if (Math.abs(ez + 1) < epsilon) {
        color = 0xff0000;
      } else {
        color = 0xffff00;
      }

      if (DEBUG) {
        console.log(
          `Bloch Sphere - ez: ${ez.toFixed(4)}, r: ${r.toFixed(
            4
          )}, Color: ${color.toString(16)}`
        );
      }

      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);

      const direction = new THREE.Vector3(x, y, z);

      const arrowHelper = new THREE.ArrowHelper(
        direction.normalize(),
        new THREE.Vector3(0, 0, 0),
        Math.max(0, Math.min(1, r)),
        color
      );
      blochGroup.add(arrowHelper);

      const projLen = Math.max(0, Math.min(1, Math.sin(theta) * r));
      const projDir = new THREE.Vector3(
        Math.cos(phi),
        Math.sin(phi),
        0
      ).normalize();
      const projArrow = new THREE.ArrowHelper(
        projDir,
        new THREE.Vector3(0, 0, 0),
        projLen,
        0x3399ff
      );
      blochGroup.add(projArrow);

      const thetaSteps = Math.max(
        8,
        Math.floor((64 * Math.abs(theta)) / Math.PI)
      );
      const thetaPts = new Float32Array((thetaSteps + 1) * 3);
      const rArc = 1.02;
      for (let i = 0; i <= thetaSteps; i++) {
        const t = (i / thetaSteps) * theta;
        const px = rArc * Math.sin(t) * Math.cos(phi);
        const py = rArc * Math.sin(t) * Math.sin(phi);
        const pz = rArc * Math.cos(t);
        thetaPts[i * 3 + 0] = px;
        thetaPts[i * 3 + 1] = py;
        thetaPts[i * 3 + 2] = pz;
      }
      const thetaGeom = new THREE.BufferGeometry();
      thetaGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(thetaPts, 3)
      );
      const thetaMat = new THREE.LineBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.7,
      });
      const thetaLine = new THREE.Line(thetaGeom, thetaMat);
      blochGroup.add(thetaLine);
      const thetaLbl = makeLabelSprite("θ", "#ffcc00");
      {
        const endIdx = thetaSteps * 3;
        const lx = thetaPts[endIdx + 0] * 1.06;
        const ly = thetaPts[endIdx + 1] * 1.06;
        const lz = thetaPts[endIdx + 2] * 1.06;
        thetaLbl.sprite.position.set(lx, ly, lz);
        thetaLbl.sprite.scale.set(0.25, 0.125, 1);
        blochGroup.add(thetaLbl.sprite);
      }

      const phiSteps = Math.max(8, Math.floor((64 * Math.abs(phi)) / Math.PI));
      const phiPts = new Float32Array((phiSteps + 1) * 3);
      for (let i = 0; i <= phiSteps; i++) {
        const a = (i / Math.max(1, phiSteps)) * phi;
        const px = rArc * Math.cos(a);
        const py = rArc * Math.sin(a);
        phiPts[i * 3 + 0] = px;
        phiPts[i * 3 + 1] = py;
        phiPts[i * 3 + 2] = 0;
      }
      const phiGeom = new THREE.BufferGeometry();
      phiGeom.setAttribute("position", new THREE.BufferAttribute(phiPts, 3));
      const phiMat = new THREE.LineBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.7,
      });
      const phiLine = new THREE.Line(phiGeom, phiMat);
      blochGroup.add(phiLine);
      const phiLbl = makeLabelSprite("φ", "#66ccff");
      {
        const endIdx = phiSteps * 3;
        const lx = phiPts[endIdx + 0] * 1.06;
        const ly = phiPts[endIdx + 1] * 1.06;
        const lz = 0;
        phiLbl.sprite.position.set(lx, ly, lz);
        phiLbl.sprite.scale.set(0.25, 0.125, 1);
        blochGroup.add(phiLbl.sprite);
      }

      const axesHelper = new THREE.AxesHelper(1.5);
      blochGroup.add(axesHelper);

      camera.position.set(0, 0, 3);
      camera.lookAt(0, 0, 0);

      let rafId = 0;
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      let ro: ResizeObserver | null = null;
      const onResize = () => setSize(current.clientWidth || 300);
      if (typeof ResizeObserver !== "undefined") {
        const roLocal: ResizeObserver = new ResizeObserver(
          (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
              const cw = entry.contentRect?.width || current.clientWidth || 300;
              setSize(cw);
            }
          }
        );
        roLocal.observe(current);
        ro = roLocal;
      } else {
        window.addEventListener("resize", onResize);
      }

      return () => {
        cancelAnimationFrame(rafId);
        controls.dispose();
        sphereGeometry.dispose();
        if (Array.isArray(sphereMaterial)) {
          sphereMaterial.forEach((m) => m.dispose());
        } else {
          sphereMaterial.dispose();
        }
        eq.geom.dispose();
        (eq.mat as THREE.Material).dispose?.();
        merXZ.geom.dispose();
        (merXZ.mat as THREE.Material).dispose?.();
        merYZ.geom.dispose();
        (merYZ.mat as THREE.Material).dispose?.();
        xLbl.dispose();
        yLbl.dispose();
        zLbl.dispose();
        thetaGeom.dispose();
        (thetaMat as THREE.Material).dispose?.();
        phiGeom.dispose();
        (phiMat as THREE.Material).dispose?.();
        thetaLbl.dispose();
        phiLbl.dispose();
        renderer.dispose();
        if (ro) {
          ro.disconnect();
        } else {
          window.removeEventListener("resize", onResize);
        }
        if (current.contains(renderer.domElement)) {
          current.removeChild(renderer.domElement);
        }
      };
    }, [theta, phi, ez, r]);

    const info = (
      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-x-2">
        <span title={`theta = ${formatAngle(theta, unit)}`}>
          θ:{" "}
          {unit === "deg"
            ? ((theta * 180) / Math.PI).toFixed(3)
            : theta.toFixed(3)}
        </span>
        <span title={`phi = ${formatAngle(phi, unit)}`}>
          φ:{" "}
          {unit === "deg" ? ((phi * 180) / Math.PI).toFixed(3) : phi.toFixed(3)}
        </span>
        <span>r: {r.toFixed(3)}</span>
        <span>ez: {ez.toFixed(3)}</span>
      </div>
    );

    return (
      <div>
        <div ref={mountRef} className="bloch-sphere" />
        {info}
      </div>
    );
  };
  const MemoBlochSphere = React.memo(BlochSphereBase);

  const LazyBlochSphere: React.FC<BlochProps> = (props) => {
    const [visible, setVisible] = useState(false);
    const holderRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const el = holderRef.current;
      if (!el) return;
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry && entry.isIntersecting) {
              setVisible(true);
              io.disconnect();
            }
          },
          { threshold: 0.1 }
        );
        io.observe(el);
        return () => io.disconnect();
      } else {
        setVisible(true);
      }
    }, []);

    return (
      <div ref={holderRef} className="w-full">
        {visible ? (
          <MemoBlochSphere {...props} />
        ) : (
          <div className="border rounded bg-muted/50" style={{ height: 240 }} />
        )}
      </div>
    );
  };

  const Legend = () => (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-3 h-3 rounded-sm"
          style={{ background: "#00ff00" }}
        />{" "}
        |0⟩
      </div>
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-3 h-3 rounded-sm"
          style={{ background: "#ff0000" }}
        />{" "}
        |1⟩
      </div>
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-3 h-3 rounded-sm"
          style={{ background: "#ffff00" }}
        />{" "}
        superposition
      </div>
    </div>
  );

  const isCollapsed = (i: number) => collapsed.has(i);
  const toggleCollapsed = (i: number) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const collapseAll = () => setCollapsed(new Set(displayedIndices));
  const expandAll = () => setCollapsed(new Set());

  return (
    <div className="space-y-8">
      <div className="w-full p-6 bg-card shadow-lg rounded-lg border">
        <h3 className="text-xl font-bold text-foreground mb-6 border-b pb-2">
          Measurement Results
        </h3>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="bg-muted text-muted-foreground uppercase text-sm leading-normal">
              <tr>
                <th className="px-6 py-3 border-b">State</th>
                <th className="px-6 py-3 border-b w-full">Probability</th>
                {counts && <th className="px-6 py-3 border-b">Counts</th>}
              </tr>
            </thead>
            <tbody className="text-foreground/90 text-sm font-medium">
              {results.map((probability, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 border-b">
                    {formatBinaryState(index)}
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-primary/20 rounded">
                        <div
                          className="h-2 bg-primary rounded"
                          style={{
                            width: `${(probability * 100).toFixed(2)}%`,
                          }}
                        />
                      </div>
                      <span className="text-foreground">
                        {(probability * 100).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  {counts && (
                    <td className="px-6 py-4 border-b text-center">
                      {counts[index] ?? 0}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qubitStates.length > 0 && (
        <div className="w-full p-6 bg-card shadow-lg rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-foreground border-b pb-2">
              Bloch Sphere Visualization
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Legend />
              <label className="text-xs text-muted-foreground ml-2">
                Angles
              </label>
              <select
                className="border rounded px-2 py-1 text-xs bg-background text-foreground"
                value={angleUnit}
                onChange={(e) =>
                  setAngleUnit((e.target.value as "rad" | "deg") || "rad")
                }
              >
                <option value="rad">Radians</option>
                <option value="deg">Degrees</option>
              </select>
              <label className="text-xs text-muted-foreground ml-3">
                Render
              </label>
              <select
                className="border rounded px-2 py-1 text-xs bg-background text-foreground"
                value={renderCap}
                onChange={(e) =>
                  setRenderCap(
                    Math.max(1, parseInt(e.target.value, 10) || DEFAULT_CAP)
                  )
                }
              >
                {[4, 8, 12, 16, 24, 32].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button
                onClick={collapseAll}
                className="px-2 py-1 text-xs rounded border bg-muted hover:bg-muted/70 text-foreground"
                title="Collapse all Bloch spheres"
              >
                Collapse all
              </button>
              <button
                onClick={expandAll}
                className="px-2 py-1 text-xs rounded border bg-muted hover:bg-muted/70 text-foreground"
                title="Expand all Bloch spheres"
              >
                Expand all
              </button>
              <button
                onClick={() => setShowBloch((s) => !s)}
                className="px-2 py-1 text-xs rounded border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                title="Show/Hide Bloch spheres"
              >
                {showBloch ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {!showBloch && (
            <div className="text-sm text-muted-foreground">
              Bloch spheres hidden.
            </div>
          )}

          {showBloch && numQubits > renderCap && (
            <div className="text-xs text-muted-foreground mb-2">
              Rendering first {renderCap} of {numQubits} qubits for performance.
            </div>
          )}

          {showBloch && (
            <div
              id="bloch-grid"
              className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
            >
              {displayedIndices.map((qubitIndex) => {
                const { theta, phi, ez, r } = qubitStates[qubitIndex];
                const collapsedState = isCollapsed(qubitIndex);
                return (
                  <div
                    key={`qubit-${qubitIndex}`}
                    className="w-full border rounded-md p-3 bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-muted-foreground">
                        q{qubitIndex}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          title={`theta = ${formatAngle(theta, angleUnit)}`}
                        >
                          θ:{" "}
                          {angleUnit === "deg"
                            ? ((theta * 180) / Math.PI).toFixed(3)
                            : theta.toFixed(3)}
                        </span>
                        <span title={`phi = ${formatAngle(phi, angleUnit)}`}>
                          φ:{" "}
                          {angleUnit === "deg"
                            ? ((phi * 180) / Math.PI).toFixed(3)
                            : phi.toFixed(3)}
                        </span>
                        <span>r: {r.toFixed(3)}</span>
                        <span>ez: {ez.toFixed(3)}</span>
                        <button
                          onClick={() => toggleCollapsed(qubitIndex)}
                          className="ml-2 px-2 py-0.5 rounded border bg-muted hover:bg-muted/70 text-foreground"
                        >
                          {collapsedState ? "Expand" : "Collapse"}
                        </button>
                      </div>
                    </div>
                    {!collapsedState ? (
                      <LazyBlochSphere
                        theta={theta}
                        phi={phi}
                        ez={ez}
                        r={r}
                        unit={angleUnit}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Collapsed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuantumStateVisualizer;
