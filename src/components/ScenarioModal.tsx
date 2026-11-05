import React, { useState } from 'react';
import { FolderOpen, Save, Trash2, Upload, X } from 'lucide-react';
import { SavedScenario } from '../types/dmm';
import { validateAndParseScenarioJson } from '../utils/security';

interface ScenarioModalProps {
  isOpen: boolean;
  scenarios: SavedScenario[];
  activeScenarioName: string;
  onClose: () => void;
  onSaveCurrent: (name: string) => void;
  onLoadScenario: (scenario: SavedScenario) => void;
  onDeleteScenario: (id: string) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  scenarios,
  activeScenarioName,
  onClose,
  onSaveCurrent,
  onLoadScenario,
  onDeleteScenario,
}) => {
  const [nameInput, setNameInput] = useState(activeScenarioName);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onSaveCurrent(trimmed.slice(0, 80));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const validated = validateAndParseScenarioJson(text);
      onLoadScenario(validated);
      onClose();
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Invalid scenario JSON file.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Manage Transformation Scenarios"
    >
      <div className="w-full max-w-lg bg-[#0C111D] border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Transformation Scenarios & Snapshots
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Saved locally in browser storage · Import validated JSON snapshots
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current Snapshot */}
        <form onSubmit={handleSave} className="flex items-center gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Scenario name (e.g., Q4 Board AI Case)"
            className="flex-1 px-3 py-2 text-xs bg-[#06080F] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-[#3B82F6]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#3B82F6] hover:bg-blue-500 text-white rounded whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            Save Snapshot
          </button>
        </form>

        {/* Import JSON */}
        <div className="flex items-center justify-between p-3 bg-[#06080F] border border-slate-800 rounded">
          <span className="text-xs text-slate-300">Import Scenario JSON</span>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Choose File
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>

        {importError && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/60 rounded p-2.5">
            {importError}
          </div>
        )}

        {/* Saved Scenarios List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="text-xs font-medium text-slate-400">
            Saved Snapshots ({scenarios.length})
          </div>
          {scenarios.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded">
              No saved snapshots yet. Save your current audit and ROI model above.
            </div>
          ) : (
            scenarios.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between gap-3 p-3 bg-[#06080F] border border-slate-800/80 rounded"
              >
                <div>
                  <div className="text-xs font-medium text-slate-100">{sc.name}</div>
                  <div className="text-[11px] font-mono-tabular text-slate-400">
                    Sector: {sc.sector.toUpperCase()} ·{' '}
                    {new Date(sc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadScenario(sc);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteScenario(sc.id)}
                    aria-label={`Delete ${sc.name}`}
                    className="p-1 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
