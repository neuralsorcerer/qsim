/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useEffect, useRef } from "react";
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

  const BlochSphere: React.FC<{ theta: number; phi: number; ez: number }> = ({
    theta,
    phi,
    ez,
  }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const current = mountRef.current;
      if (!current) return;

      current.innerHTML = "";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(300, 300);
      current.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(3, 3, 3).normalize();
      scene.add(light);

      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        wireframe: true,
        opacity: 0.5,
        transparent: true,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(sphere);

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
          `Bloch Sphere - ez: ${ez.toFixed(4)}, Color: ${color.toString(16)}`
        );
      }

      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);

      const direction = new THREE.Vector3(x, y, z);

      const arrowHelper = new THREE.ArrowHelper(
        direction.normalize(),
        new THREE.Vector3(0, 0, 0),
        1.0,
        color
      );
      scene.add(arrowHelper);

      const axesHelper = new THREE.AxesHelper(1.5);
      scene.add(axesHelper);

      camera.position.set(0, 0, 3);
      camera.lookAt(0, 0, 0);

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        current.removeChild(renderer.domElement);
        controls.dispose();
      };
    }, [theta, phi, ez]);

    return <div ref={mountRef} className="bloch-sphere" />;
  };

  return (
    <div className="space-y-8">
      <div className="w-full p-6 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-2">
          Measurement Results
        </h3>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-300">State</th>
                <th className="px-6 py-3 border-b-2 border-gray-300 w-full">
                  Probability
                </th>
                {counts && (
                  <th className="px-6 py-3 border-b-2 border-gray-300">
                    Counts
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-medium">
              {results.map((probability, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition ease-in-out"
                >
                  <td className="px-6 py-4 border-b">
                    {formatBinaryState(index)}
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-blue-200 rounded">
                        <div
                          className="h-2 bg-blue-600 rounded"
                          style={{
                            width: `${(probability * 100).toFixed(2)}%`,
                          }}
                        />
                      </div>
                      <span>{(probability * 100).toFixed(2)}%</span>
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
        <div className="w-full p-6 bg-white shadow-lg rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-2">
            Bloch Sphere Visualization
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {qubitStates.map(({ theta, phi, ez }, qubitIndex) => (
              <div key={`qubit-${qubitIndex}`} className="w-full">
                <h4 className="font-bold text-gray-600 mb-2">
                  {formatBinaryState(qubitIndex)}
                </h4>
                <BlochSphere theta={theta} phi={phi} ez={ez} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumStateVisualizer;
