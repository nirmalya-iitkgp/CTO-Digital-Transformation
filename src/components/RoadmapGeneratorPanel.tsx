import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { DMM_PILLARS, KOTTER_STEPS } from '../data/benchmarks';
import {
  HorizonId,
  MilestoneStatus,
  PillarId,
  PriorityLevel,
  RoadmapMilestone,
} from '../types/dmm';

interface RoadmapGeneratorPanelProps {
  milestones: RoadmapMilestone[];
  onRegenerate: () => void;
  onUpdateMilestone: (id: string, patch: Partial<RoadmapMilestone>) => void;
  onMoveMilestone: (id: string, direction: 'up' | 'down') => void;
  onAddMilestone: (item: Omit<RoadmapMilestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
}

const HORIZON_LABELS: Record<HorizonId, string> = {
  year1: 'Horizon 1 · Year 1',
  year2: 'Horizon 2 · Year 2',
  year3: 'Horizon 3 · Year 3',
};

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  planned: 'in-progress',
  'in-progress': 'completed',
  completed: 'planned',
};

export const RoadmapGeneratorPanel: React.FC<RoadmapGeneratorPanelProps> = ({
  milestones,
  onRegenerate,
  onUpdateMilestone,
  onMoveMilestone,
  onAddMilestone,
  onDeleteMilestone,
}) => {
  const [horizonFilter, setHorizonFilter] = useState<'all' | HorizonId>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState<HorizonId>('year1');
  const [timelineLabel, setTimelineLabel] = useState('Q2–Q3 Year 1');
  const [kotterStep, setKotterStep] = useState(3);
  const [pillar, setPillar] = useState<PillarId>('workflows');
  const [linkedIntervention, setLinkedIntervention] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('P1');

  const filtered =
    horizonFilter === 'all'
      ? milestones
      : milestones.filter((m) => m.horizon === horizonFilter);

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = milestones.filter((m) => m.status === 'in-progress').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddMilestone({
      title: title.trim().slice(0, 130),
      horizon,
      timelineLabel: timelineLabel.trim().slice(0, 30) || 'Q1–Q2 Year 1',
      kotterStep,
      pillar,
      linkedIntervention: linkedIntervention.trim().slice(0, 90) || 'Custom Initiative',
      priority,
      status: 'planned',
      isCustom: true,
    });
    setTitle('');
    setLinkedIntervention('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Generator Controls */}
      <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Customizable 3-Year Transformation Roadmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesized from 5-pillar maturity gaps & active AI ROI interventions · Kotter
              Change Accelerator gates
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6]" />
              Regenerate from Audit & ROI
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#3B82F6] hover:bg-blue-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Milestone
            </button>
          </div>
        </div>

        {/* Horizon Filter & Progress Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-1 p-1 bg-[#06080F] border border-slate-800 rounded-md">
            {(['all', 'year1', 'year2', 'year3'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizonFilter(h)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  horizonFilter === h
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h === 'all' ? 'All Horizons' : HORIZON_LABELS[h]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tabular text-slate-400">
            <span>Total: {milestones.length}</span>
            <span>·</span>
            <span className="text-[#3B82F6]">In Progress: {inProgressCount}</span>
            <span>·</span>
            <span className="text-[#10B981]">Completed: {completedCount}</span>
          </div>
        </div>

        {/* Add Custom Milestone Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mt-4 p-4 bg-[#06080F] border border-slate-800 rounded-md space-y-3"
          >
            <div className="text-xs font-medium text-slate-200">
              New Transformation Milestone
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Milestone title (e.g., Deploy Enterprise Vector Feature Store)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-[#3B82F6]"
              />
              <input
                type="text"
                placeholder="Linked AI Intervention or Initiative"
                value={linkedIntervention}
                onChange={(e) => setLinkedIntervention(e.target.value)}
                className="px-3 py-2 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as HorizonId)}
                aria-label="Horizon"
                className="px-2.5 py-1.5 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100"
              >
                <option value="year1">Year 1</option>
                <option value="year2">Year 2</option>
                <option value="year3">Year 3</option>
              </select>

              <input
                type="text"
                value={timelineLabel}
                onChange={(e) => setTimelineLabel(e.target.value)}
                placeholder="Q1–Q2 Year 1"
                aria-label="Timeline"
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-[#0C111D] border border-slate-700 rounded text-slate-100"
              />

              <select
                value={kotterStep}
                onChange={(e) => setKotterStep(parseInt(e.target.value, 10))}
                aria-label="Kotter Step"
                className="px-2.5 py-1.5 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100"
              >
                {KOTTER_STEPS.map((k) => (
                  <option key={k.step} value={k.step}>
                    Kotter {k.step}: {k.title}
                  </option>
                ))}
              </select>

              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value as PillarId)}
                aria-label="DMM Pillar"
                className="px-2.5 py-1.5 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100"
              >
                {DMM_PILLARS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortName}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                aria-label="Priority"
                className="px-2.5 py-1.5 text-xs bg-[#0C111D] border border-slate-700 rounded text-slate-100"
              >
                <option value="P1">P1 Critical</option>
                <option value="P2">P2 High</option>
                <option value="P3">P3 Medium</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-[#10B981] hover:bg-emerald-500 text-slate-950 rounded"
              >
                Add to Roadmap
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Interactive Prioritizable Roadmap Table */}
      <div className="bg-[#0C111D] border border-slate-800/90 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 pr-3 w-16">Order</th>
                <th className="py-2.5 px-3">Milestone & Linked AI Intervention</th>
                <th className="py-2.5 px-3">Horizon & Timeline</th>
                <th className="py-2.5 px-3">Kotter Gate</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filtered.map((item) => {
                const kotter = KOTTER_STEPS.find((k) => k.step === item.kotterStep);
                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onMoveMilestone(item.id, 'up')}
                          aria-label={`Move ${item.title} up`}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveMilestone(item.id, 'down')}
                          aria-label={`Move ${item.title} down`}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-100">{item.title}</div>
                      <div className="text-slate-400 mt-0.5">
                        Intervention: {item.linkedIntervention}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.horizon}
                          aria-label={`Horizon for ${item.title}`}
                          onChange={(e) =>
                            onUpdateMilestone(item.id, {
                              horizon: e.target.value as HorizonId,
                            })
                          }
                          className="bg-[#06080F] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="year1">Year 1</option>
                          <option value="year2">Year 2</option>
                          <option value="year3">Year 3</option>
                        </select>
                        <input
                          type="text"
                          value={item.timelineLabel}
                          aria-label={`Timeline for ${item.title}`}
                          onChange={(e) =>
                            onUpdateMilestone(item.id, {
                              timelineLabel: e.target.value.slice(0, 30),
                            })
                          }
                          className="w-24 bg-[#06080F] border border-slate-800 rounded px-2 py-1 text-xs font-mono-tabular text-slate-300"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      <span className="font-mono-tabular text-[#3B82F6]">
                        Step {item.kotterStep}
                      </span>{' '}
                      · {kotter?.phase ?? 'Change'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <select
                        value={item.priority}
                        aria-label={`Priority for ${item.title}`}
                        onChange={(e) =>
                          onUpdateMilestone(item.id, {
                            priority: e.target.value as PriorityLevel,
                          })
                        }
                        className={`bg-[#06080F] border border-slate-800 rounded px-2 py-1 text-xs font-mono-tabular font-semibold ${
                          item.priority === 'P1'
                            ? 'text-red-400'
                            : item.priority === 'P2'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMilestone(item.id, {
                            status: NEXT_STATUS[item.status],
                          })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
                          item.status === 'completed'
                            ? 'bg-emerald-950/50 border-[#10B981]/50 text-[#10B981]'
                            : item.status === 'in-progress'
                            ? 'bg-blue-950/50 border-[#3B82F6]/50 text-[#3B82F6]'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {item.status === 'completed'
                          ? 'Completed'
                          : item.status === 'in-progress'
                          ? 'In Progress'
                          : 'Planned'}
                      </button>
                    </td>

                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteMilestone(item.id)}
                        aria-label={`Delete ${item.title}`}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
