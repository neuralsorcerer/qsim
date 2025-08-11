/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";
import { Button } from "../Button";

export type PersistencePanelProps = {
  onSave: () => void;
  onLoad: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onShare: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
};

const PersistencePanel: React.FC<PersistencePanelProps> = ({
  onSave,
  onLoad,
  onExportJSON,
  onImportJSON,
  onShare,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <section className="space-y-2" aria-label="Persistence actions">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="success"
          onClick={onSave}
          title="Save circuit to browser storage"
        >
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={onLoad}
          title="Load circuit from browser storage"
        >
          Load
        </Button>
        <Button
          variant="outline"
          onClick={onExportJSON}
          title="Export circuit JSON"
        >
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={onImportJSON}
          title="Import circuit JSON"
        >
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          variant="secondary"
          onClick={onShare}
          title="Copy shareable URL"
        >
          Share URL
        </Button>
      </div>
    </section>
  );
};

export default PersistencePanel;
