import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  User,
  Sparkles,
  ChevronRight,
  X,
  ListTodo,
  History,
  FileCheck,
  CalendarCheck,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  Layers,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { Project, ProjectStatus, Milestone, MilestoneStatus, ProjectTask, DailyLog, DailyLogHealth } from '../types';
import { formatINR, formatDate, formatPhoneNumber } from '../lib/formatters';
import { createGoogleCalendarUrl } from '../utils/calendarSync';
import { api } from '../lib/api';

// Common Quick Presets for Milestones
const COMMON_MILESTONE_PRESETS = [
  'Booking is done',
  'Advance is paid',
  'The preparations of the designing of the stage is finalized',
  'Flower sourcing & wholesale conditioning',
  'On-site scaffolding & structure setup',
  'Main stage & entrance floral styling',
  'Final client walkthrough & lighting check',
  'The reception is over',
  'Post-event teardown & props return',
  'Final invoice settlement & review',
];

interface ProjectsViewProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onUpdateMilestone: (
    projectId: string,
    mIndex: number,
    payload: {
      status?: string;
      notes?: string;
      completedDate?: string;
      name?: string;
      dueDate?: string;
      responsiblePerson?: string;
    }
  ) => Promise<void>;
  onAddCustomMilestone?: (
    projectId: string,
    payload: {
      name: string;
      status?: string;
      dueDate?: string;
      responsiblePerson?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteMilestone?: (projectId: string, mIndex: number) => Promise<void>;
  onAddDailyUpdate: (
    projectId: string,
    payload: { updateText: string; projectStatus?: string; nextAction?: string; addedBy?: string }
  ) => Promise<void>;
  onAddTask: (projectId: string, payload: { title: string; assignedTo?: string; dueDate?: string }) => Promise<void>;
  onUpdateTaskStatus: (projectId: string, taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<void>;
  onOpenNewProjectModal: () => void;
  onOpenNewInvoiceModal?: (projectId: string) => void;
  onOpenPaymentModal?: (projectId: string) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onUpdateMilestone,
  onAddCustomMilestone,
  onDeleteMilestone,
  onAddDailyUpdate,
  onAddTask,
  onUpdateTaskStatus,
  onOpenNewProjectModal,
  onOpenNewInvoiceModal,
  onOpenPaymentModal,
  onUpdateProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

  // Quick milestone accordion for cards
  const [cardExpandedMilestoneId, setCardExpandedMilestoneId] = useState<string | null>(null);

  // Daily update modal state
  const [showDailyUpdateModal, setShowDailyUpdateModal] = useState(false);
  const [dailyUpdateText, setDailyUpdateText] = useState('');
  const [dailyUpdateHealth, setDailyUpdateHealth] = useState<DailyLogHealth>('ON_TRACK');
  const [dailyNextAction, setDailyNextAction] = useState('');
  const [dailyAddedBy, setDailyAddedBy] = useState('Admin');
  const [isSubmittingDaily, setIsSubmittingDaily] = useState(false);

  // New task inline state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Milestone edit modal state
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
  const [milestoneNameInput, setMilestoneNameInput] = useState('');
  const [milestoneStatusInput, setMilestoneStatusInput] = useState<MilestoneStatus>('IN_PROGRESS');
  const [milestoneNotesInput, setMilestoneNotesInput] = useState('');
  const [milestoneDueDateInput, setMilestoneDueDateInput] = useState('');
  const [milestoneAssigneeInput, setMilestoneAssigneeInput] = useState('');
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Add custom milestone modal state
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneStatus, setNewMilestoneStatus] = useState<MilestoneStatus>('NOT_STARTED');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [newMilestoneAssignee, setNewMilestoneAssignee] = useState('');
  const [newMilestoneNotes, setNewMilestoneNotes] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Effective selected project
  const activeProjectId = selectedProjectId || localSelectedId;
  const selectedProject = projects.find((p) => p.id === activeProjectId);

  const handleSelect = (id: string | null) => {
    setLocalSelectedId(id);
    onSelectProject(id);
  };

  const handleProjectStatusChange = async (projectId: string, status: string) => {
    try {
      await api.updateProject(projectId, { status: status as any });
      if (onUpdateProject) await onUpdateProject(projectId, { status: status as any });
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  const handleProjectDateChange = async (projectId: string, eventDate: string) => {
    try {
      await api.updateProject(projectId, { eventDate });
      if (onUpdateProject) await onUpdateProject(projectId, { eventDate });
    } catch (err) {
      console.error('Failed to update project date:', err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.venue.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePostDailyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !dailyUpdateText.trim()) return;
    setIsSubmittingDaily(true);
    try {
      await onAddDailyUpdate(selectedProject.id, {
        updateText: dailyUpdateText.trim(),
        projectStatus: dailyUpdateHealth,
        nextAction: dailyNextAction.trim(),
        addedBy: dailyAddedBy,
      });
      setDailyUpdateText('');
      setDailyNextAction('');
      setShowDailyUpdateModal(false);
    } finally {
      setIsSubmittingDaily(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      await onAddTask(selectedProject.id, {
        title: newTaskTitle.trim(),
        assignedTo: newTaskAssignee || selectedProject.assignedStaff,
      });
      setNewTaskTitle('');
    } finally {
      setIsAddingTask(false);
    }
  };

  // Quick 1-click status toggle (Achieved vs In Progress vs Not Started)
  const handleQuickToggleMilestoneStatus = async (projectId: string, mIndex: number, currentStatus: MilestoneStatus) => {
    const nextStatus: MilestoneStatus =
      currentStatus === 'COMPLETED' ? 'NOT_STARTED' : currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : 'COMPLETED';
    
    await onUpdateMilestone(projectId, mIndex, {
      status: nextStatus,
      completedDate: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
    });
  };

  // Direct status dropdown change
  const handleDirectMilestoneStatusChange = async (projectId: string, mIndex: number, newStatus: string) => {
    await onUpdateMilestone(projectId, mIndex, {
      status: newStatus,
      completedDate: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
    });
  };

  // Open Edit Milestone Modal with prefilled data
  const handleOpenEditMilestoneModal = (mIndex: number) => {
    if (!selectedProject || !selectedProject.milestones[mIndex]) return;
    const m = selectedProject.milestones[mIndex];
    setEditingMilestoneIndex(mIndex);
    setMilestoneNameInput(m.name);
    setMilestoneStatusInput(m.status);
    setMilestoneNotesInput(m.notes || '');
    setMilestoneDueDateInput(m.dueDate || '');
    setMilestoneAssigneeInput(m.responsiblePerson || selectedProject.assignedStaff || '');
  };

  // Save edits to milestone
  const handleSaveMilestoneEdits = async () => {
    if (!selectedProject || editingMilestoneIndex === null) return;
    setIsSavingMilestone(true);
    try {
      await onUpdateMilestone(selectedProject.id, editingMilestoneIndex, {
        name: milestoneNameInput.trim() || undefined,
        status: milestoneStatusInput,
        notes: milestoneNotesInput,
        dueDate: milestoneDueDateInput || undefined,
        responsiblePerson: milestoneAssigneeInput || undefined,
        completedDate: milestoneStatusInput === 'COMPLETED' ? new Date().toISOString() : undefined,
      });
      setEditingMilestoneIndex(null);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  // Handle Add Custom Milestone
  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestoneName.trim()) return;
    setIsAddingMilestone(true);
    try {
      if (onAddCustomMilestone) {
        await onAddCustomMilestone(selectedProject.id, {
          name: newMilestoneName.trim(),
          status: newMilestoneStatus,
          dueDate: newMilestoneDueDate || selectedProject.eventDate,
          responsiblePerson: newMilestoneAssignee || selectedProject.assignedStaff,
          notes: newMilestoneNotes.trim() || undefined,
        });
      } else {
        // Fallback to update with newly constructed array
        const updated = [
          ...selectedProject.milestones,
          {
            id: `m-custom-${Date.now()}`,
            name: newMilestoneName.trim(),
            status: newMilestoneStatus,
            dueDate: newMilestoneDueDate || selectedProject.eventDate,
            responsiblePerson: newMilestoneAssignee || selectedProject.assignedStaff,
            notes: newMilestoneNotes.trim() || undefined,
            completedDate: newMilestoneStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
          },
        ];
        await onUpdateMilestone(selectedProject.id, selectedProject.milestones.length, {
          name: newMilestoneName.trim(),
          status: newMilestoneStatus,
        });
      }
      setNewMilestoneName('');
      setNewMilestoneNotes('');
      setShowAddMilestoneModal(false);
    } finally {
      setIsAddingMilestone(false);
    }
  };

  // Handle Delete Milestone
  const handleDeleteMilestoneClick = async (mIndex: number) => {
    if (!selectedProject) return;
    if (confirm(`Are you sure you want to remove the milestone "${selectedProject.milestones[mIndex]?.name}"?`)) {
      if (onDeleteMilestone) {
        await onDeleteMilestone(selectedProject.id, mIndex);
      }
    }
  };

  return (
    <div className="space-y-8 pb-16 text-slate-900 selection:bg-rose-200">
      {/* 1. TOP SUSPENDED CAPSULE HEADER */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="suspended-cable flex flex-col items-center">
          <div className="glass-header-pill px-8 py-2.5 flex items-center gap-3 shadow-xl hover:scale-102 transition-all">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Projects & Staging
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#831843] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. MASTER FLOATING GLASS SCREEN CONTAINER */}
      <div className="glass-screen p-5 sm:p-7 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Project Execution & Milestones
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 font-bold shadow-xs">
                {projects.length} Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Track and toggle stage achievements (Booking Done, Advance Paid, Stage Finalized, Reception Over), on-site logs, and financials.
            </p>
          </div>

          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#831843]/20 transition-all cursor-pointer w-fit hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

      {/* Clean Global Search Bar */}
      <div className="p-4 rounded-2xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, venue, Bangalore area, or client..."
            className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
          />
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isSelected = activeProjectId === project.id;
            const completedCount = project.milestones?.filter((m) => m.status === 'COMPLETED').length || 0;
            const totalMilestones = project.milestones?.length || 0;
            const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
            const isCardExpanded = cardExpandedMilestoneId === project.id;

            return (
              <div
                key={project.id}
                className={`p-5 rounded-2xl transition-all relative glass-card ${
                  isSelected
                    ? 'border-[#831843] ring-2 ring-[#831843]/20 shadow-xl'
                    : 'hover:border-[#831843]/50 shadow-md hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {/* Top badges & In-line Changeable Status Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      {project.id}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100/90 text-[#831843] font-bold border border-rose-200/80 shadow-xs">
                      {project.eventType}
                    </span>
                  </div>

                  {/* Changeable Status Dropdown for Every Project */}
                  <select
                    value={project.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleProjectStatusChange(project.id, e.target.value)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none shadow-xs ${
                      project.status === 'PLANNING'
                        ? 'bg-amber-100/90 text-amber-950 border-amber-300'
                        : project.status === 'IN_PROGRESS'
                        ? 'bg-blue-100/90 text-blue-950 border-blue-300'
                        : project.status === 'EVENT_DAY'
                        ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                        : project.status === 'COMPLETED'
                        ? 'bg-purple-100/90 text-purple-950 border-purple-300'
                        : 'glass-subtle text-slate-800 border-white/60'
                    }`}
                  >
                    <option value="PLANNING">🟡 PLANNING</option>
                    <option value="IN_PROGRESS">🔵 IN PROGRESS</option>
                    <option value="EVENT_DAY">🟢 EVENT DAY</option>
                    <option value="COMPLETED">🟣 COMPLETED</option>
                    <option value="CANCELLED">⚪ CANCELLED</option>
                  </select>
                </div>

                {/* Project Title & Venue */}
                <div className="mt-3">
                  <h3
                    onClick={() => handleSelect(project.id)}
                    className="font-extrabold text-slate-950 text-base hover:text-[#831843] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{project.name}</span>
                    <span className="text-xs font-bold text-[#831843] flex items-center gap-1 group">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Calendar className="w-3.5 h-3.5 text-[#831843]" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Event Date:</span>
                      <input
                        type="date"
                        value={project.eventDate || ''}
                        onChange={(e) => handleProjectDateChange(project.id, e.target.value)}
                        className="text-xs font-semibold text-slate-900 glass-input rounded px-1.5 py-0.5 focus:outline-none focus:border-[#831843] cursor-pointer"
                        title="Click to edit event date"
                      />
                    </div>
                    <span>·</span>
                    <span className="flex items-center gap-1 truncate text-slate-700 font-medium max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-[#831843] shrink-0" />
                      {project.venue}
                    </span>
                  </div>
                </div>

                {/* Milestone Progress Bar with Interactive Click & Achieved Counter */}
                <div className="mt-4 pt-3 border-t border-white/60">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-[#831843]" />
                      <span>
                        Stage: <strong className="text-slate-950">{project.milestones?.[project.currentMilestoneIndex]?.name || 'In Progress'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-lg glass-subtle text-slate-800 font-extrabold shadow-xs">
                        {completedCount} / {totalMilestones} Achieved ({progressPercent}%)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardExpandedMilestoneId(isCardExpanded ? null : project.id);
                        }}
                        className="text-[11px] font-bold text-[#831843] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{isCardExpanded ? 'Hide' : 'Change'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isCardExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Stepper bar */}
                  <div className="grid grid-cols-8 gap-1.5">
                    {project.milestones?.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        title={`${m.name}: ${m.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickToggleMilestoneStatus(project.id, idx, m.status);
                        }}
                        className={`h-2.5 rounded-full transition-all cursor-pointer hover:opacity-80 ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-600 shadow-xs'
                            : idx === project.currentMilestoneIndex
                            ? 'bg-amber-500 ring-2 ring-amber-400/40'
                            : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Expandable Quick Milestone Checklist on the Card */}
                  {isCardExpanded && (
                    <div className="mt-3 p-3 rounded-2xl glass-subtle border border-white/80 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pb-1 border-b border-white/60">
                        <span>Click checkbox to mark milestone as achieved:</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelect(project.id);
                            setShowAddMilestoneModal(true);
                          }}
                          className="text-[#831843] hover:underline flex items-center gap-1 text-[10px]"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Milestone</span>
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {project.milestones?.map((m, idx) => {
                          const isAchieved = m.status === 'COMPLETED';
                          return (
                            <div
                              key={m.id || idx}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                                isAchieved
                                  ? 'bg-emerald-50/80 text-emerald-950 border border-emerald-200 font-semibold'
                                  : 'glass-card text-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => handleQuickToggleMilestoneStatus(project.id, idx, m.status)}
                              >
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                    isAchieved ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white/80 hover:border-slate-400'
                                  }`}
                                >
                                  {isAchieved && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className={isAchieved ? 'line-through text-slate-600' : 'text-slate-900 font-medium'}>
                                  {m.name}
                                </span>
                              </div>

                              <select
                                value={m.status}
                                onChange={(e) => handleDirectMilestoneStatusChange(project.id, idx, e.target.value)}
                                className={`text-[10px] font-bold rounded-lg px-1.5 py-0.5 border cursor-pointer ${
                                  isAchieved
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : m.status === 'IN_PROGRESS'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'glass-subtle text-slate-700 border-slate-200'
                                }`}
                              >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Achieved</option>
                                <option value="DELAYED">Delayed</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial summary bar */}
                <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Project Value</span>
                    <span className="font-black text-slate-950">{formatINR(project.projectValue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Received</span>
                    <span className="font-bold text-emerald-800">{formatINR(project.totalReceived)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">Outstanding</span>
                    <span className="font-bold text-rose-700">{formatINR(project.outstandingBalance)}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center rounded-3xl glass-card border border-dashed border-slate-300">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm">No projects matching the selected filter</p>
          </div>
        )}
      </div>
      </div>

      {/* FULL PROJECT DETAIL MODAL / DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-full glass-modal border-l border-white/80 shadow-2xl flex flex-col overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/60 glass-panel flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-950">{selectedProject.name}</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 shadow-xs">
                    {selectedProject.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2">
                  <span>Customer: {selectedProject.customerName}</span>
                  <span>·</span>
                  <span>Event Date: {formatDate(selectedProject.eventDate)}</span>
                  <span>·</span>
                  <span>Venue: {selectedProject.venue}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-sync-project-gcal"
                  onClick={() => {
                    if (selectedProject) {
                      const url = createGoogleCalendarUrl({
                        title: `Z S EVENTS: ${selectedProject.name} - ${selectedProject.customerName}`,
                        startDate: selectedProject.eventDate,
                        location: `${selectedProject.venue}, Bangalore`,
                        description: `Z S EVENTS Floral Production & Decor\nClient: ${selectedProject.customerName} (${selectedProject.phone})\nEvent Type: ${selectedProject.eventType}\nProject Value: ₹${selectedProject.projectValue.toLocaleString('en-IN')}\nVenue: ${selectedProject.venue}\nStatus: ${selectedProject.status}`,
                      });
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn-secondary text-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sync Google Cal</span>
                </button>
                <button
                  onClick={() => setShowDailyUpdateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Daily Log</span>
                </button>
                <button
                  onClick={() => handleSelect(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/40 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* 1. Milestone Progression Master Section */}
              <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#831843]" />
                      <span>Project Milestones & Staging Progression</span>
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Change achieved milestones with a single click, customize stage descriptions, or add new client milestones.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMilestoneModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-102"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  </div>
                </div>

                {/* Milestone Visual Stepper Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {selectedProject.milestones?.map((m, idx) => {
                    const isCompleted = m.status === 'COMPLETED';
                    const isCurrent = idx === selectedProject.currentMilestoneIndex;
                    return (
                      <div
                        key={m.id || idx}
                        className={`p-3 rounded-2xl border transition-all relative flex flex-col justify-between ${
                          isCompleted
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                            : isCurrent
                            ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 text-amber-950 font-bold'
                            : 'glass-card text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                            <span>Step {idx + 1}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditMilestoneModal(idx);
                              }}
                              className="text-slate-400 hover:text-[#831843] cursor-pointer"
                              title="Edit milestone name & notes"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="font-bold text-xs leading-tight mb-2 line-clamp-2 text-slate-900">
                            {m.name}
                          </div>
                        </div>

                        {/* Quick 1-click toggle button */}
                        <button
                          type="button"
                          onClick={() => handleQuickToggleMilestoneStatus(selectedProject.id, idx, m.status)}
                          className={`w-full py-1 px-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              : isCurrent
                              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                              : 'glass-btn-secondary text-slate-800'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Achieved</span>
                            </>
                          ) : (
                            <span>Mark Achieved</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Milestone Detailed Checklist & Editor Table */}
                <div className="glass-card rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-white/40 border-b border-white/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Client Milestone Stage Checklist ({selectedProject.milestones?.filter((m) => m.status === 'COMPLETED').length || 0} of {selectedProject.milestones?.length || 0} Achieved)
                    </span>
                    <span className="text-xs font-bold text-[#831843]">
                      Click checkbox to toggle achievement
                    </span>
                  </div>

                  <div className="divide-y divide-white/60">
                    {selectedProject.milestones?.map((m, idx) => {
                      const isAchieved = m.status === 'COMPLETED';
                      return (
                        <div
                          key={m.id || idx}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isAchieved ? 'bg-emerald-50/30' : 'hover:bg-white/40'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleMilestoneStatus(selectedProject.id, idx, m.status)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 sm:mt-0 ${
                                isAchieved
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'border-2 border-slate-300 bg-white/80 hover:border-[#831843]'
                              }`}
                              title="Toggle Achieved"
                            >
                              {isAchieved && <Check className="w-4 h-4 stroke-[3]" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-500">#{idx + 1}</span>
                                <span className={`text-sm font-bold ${isAchieved ? 'text-emerald-950 font-black' : 'text-slate-950'}`}>
                                  {m.name}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isAchieved
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                      : m.status === 'IN_PROGRESS'
                                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                                      : m.status === 'DELAYED'
                                      ? 'bg-rose-100 text-rose-900 border-rose-200'
                                      : 'glass-subtle text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {m.status.replace('_', ' ')}
                                </span>
                              </div>
                              {m.notes && (
                                <p className="text-xs text-slate-600 mt-1 pl-6 italic">
                                  "{m.notes}"
                                </p>
                              )}
                              {m.completedDate && (
                                <p className="text-[11px] text-emerald-700 mt-0.5 pl-6 font-semibold">
                                  Achieved on {formatDate(m.completedDate)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* Status Selector Dropdown */}
                            <select
                              value={m.status}
                              onChange={(e) => handleDirectMilestoneStatusChange(selectedProject.id, idx, e.target.value)}
                              className="text-xs font-bold rounded-xl px-2.5 py-1.5 glass-input text-slate-900 cursor-pointer focus:outline-none focus:border-[#831843]"
                            >
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Achieved / Done</option>
                              <option value="DELAYED">Delayed</option>
                            </select>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditMilestoneModal(idx)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white/40 cursor-pointer transition-colors"
                              title="Edit milestone name or notes"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button (if more than 1 milestone) */}
                            {(selectedProject.milestones?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestoneClick(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove this milestone"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Two-Column Grid: Daily Log + Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (7 cols): Chronological Daily Project Log */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-3xl glass-card space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#831843]" />
                        <h3 className="font-extrabold text-slate-950 text-sm">
                          Daily Project Logs & History
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowDailyUpdateModal(true)}
                        className="text-xs font-bold text-[#831843] hover:underline cursor-pointer"
                      >
                        + Post Log
                      </button>
                    </div>

                    <div className="divide-y divide-white/60 space-y-3">
                      {selectedProject.dailyUpdates && selectedProject.dailyUpdates.length > 0 ? (
                        selectedProject.dailyUpdates.map((log) => (
                          <div key={log.id} className="pt-3 first:pt-0 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-950">{formatDate(log.date)}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.projectStatus === 'ON_TRACK'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : log.projectStatus === 'ATTENTION_NEEDED'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {log.projectStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium">
                              {log.updateText}
                            </p>
                            {log.nextAction && (
                              <div className="text-[11px] text-slate-700 glass-subtle p-2 rounded-xl border border-white/60 font-medium">
                                <strong>Next:</strong> {log.nextAction}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">By {log.addedBy}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 font-medium">
                          No daily updates recorded yet. Click "+ Daily Log" above to record site progress.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right (5 cols): Project Tasks */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-3xl glass-card space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-[#831843]" />
                        <h3 className="font-extrabold text-slate-950 text-sm">
                          Tasks & Checklists
                        </h3>
                      </div>
                    </div>

                    {/* Inline add task */}
                    <form onSubmit={handleCreateTask} className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add quick task..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
                      />
                      <button
                        type="submit"
                        disabled={isAddingTask || !newTaskTitle.trim()}
                        className="px-3 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isAddingTask ? '...' : '+'}
                      </button>
                    </form>

                    <div className="divide-y divide-white/60 space-y-2">
                      {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                        selectedProject.tasks.map((task) => (
                          <div key={task.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={task.status === 'DONE'}
                                onChange={(e) =>
                                  onUpdateTaskStatus(
                                    selectedProject.id,
                                    task.id,
                                    e.target.checked ? 'DONE' : 'TODO'
                                  )
                                }
                                className="w-4 h-4 rounded text-[#831843] focus:ring-[#831843] cursor-pointer"
                              />
                              <span
                                className={`font-medium ${
                                  task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">{task.assignedTo?.split(' ')[0]}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                          No tasks created yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Financial Summary Card */}
              <div className="p-5 rounded-3xl glass-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#831843]" />
                    <span>Financial Overview</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {onOpenNewInvoiceModal && (
                      <button
                        onClick={() => onOpenNewInvoiceModal(selectedProject.id)}
                        className="px-3 py-1.5 rounded-xl glass-btn-secondary text-slate-900 text-xs font-bold cursor-pointer"
                      >
                        + Create GST Invoice
                      </button>
                    )}
                    {onOpenPaymentModal && (
                      <button
                        onClick={() => onOpenPaymentModal(selectedProject.id)}
                        className="px-3 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold cursor-pointer shadow-md"
                      >
                        + Record Payment
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/60">
                  <div className="p-4 rounded-2xl glass-subtle">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Project Value</span>
                    <div className="text-xl font-black text-slate-950 mt-1">{formatINR(selectedProject.projectValue)}</div>
                  </div>
                  <div className="p-4 rounded-2xl glass-subtle">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Total Received (Paid)</span>
                    <div className="text-xl font-black text-emerald-800 mt-1">{formatINR(selectedProject.totalReceived)}</div>
                  </div>
                  <div className="p-4 rounded-2xl glass-subtle">
                    <span className="text-[10px] uppercase font-bold text-rose-700">Outstanding Balance</span>
                    <div className="text-xl font-black text-rose-700 mt-1">{formatINR(selectedProject.outstandingBalance)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST DAILY PROJECT UPDATE MODAL */}
      {showDailyUpdateModal && selectedProject && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-modal rounded-3xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Post Daily Project Update</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowDailyUpdateModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handlePostDailyUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Today's Progress / Update Text *</label>
                <textarea
                  required
                  value={dailyUpdateText}
                  onChange={(e) => setDailyUpdateText(e.target.value)}
                  placeholder="e.g. Stage floral structure assembled. 1200 avalanche roses arrived in cold storage from Ooty..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Project Health Status</label>
                  <select
                    value={dailyUpdateHealth}
                    onChange={(e) => setDailyUpdateHealth(e.target.value as DailyLogHealth)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                  >
                    <option value="ON_TRACK">On Track (Green)</option>
                    <option value="ATTENTION_NEEDED">Attention Needed (Yellow)</option>
                    <option value="DELAYED">Delayed (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Updated By</label>
                  <input
                    type="text"
                    value={dailyAddedBy}
                    onChange={(e) => setDailyAddedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-semibold focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Next Action</label>
                <input
                  type="text"
                  value={dailyNextAction}
                  onChange={(e) => setDailyNextAction(e.target.value)}
                  placeholder="e.g. Venue gate clearance pass and misting flowers at 6:00 AM..."
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDailyUpdateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDaily}
                  className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary text-white cursor-pointer shadow-md"
                >
                  {isSubmittingDaily ? 'Posting...' : 'Save Daily Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MILESTONE DETAILS MODAL (Change Milestone Name, Status, Notes, Dates) */}
      {editingMilestoneIndex !== null && selectedProject && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-modal rounded-3xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">
                  Change Milestone Details
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {selectedProject.name} · Step {editingMilestoneIndex + 1}
                </p>
              </div>
              <button onClick={() => setEditingMilestoneIndex(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Milestone Name / Stage Description *</label>
                <input
                  type="text"
                  required
                  value={milestoneNameInput}
                  onChange={(e) => setMilestoneNameInput(e.target.value)}
                  placeholder="e.g. Advance is paid, Booking is done, Stage is finalized..."
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                />
              </div>

              {/* Preset quick buttons */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Quick Name Presets:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {COMMON_MILESTONE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMilestoneNameInput(preset)}
                      className="px-2 py-1 rounded-xl text-[10px] font-semibold glass-subtle hover:bg-rose-50 hover:text-[#831843] border border-white/60 cursor-pointer text-slate-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Status</label>
                  <select
                    value={milestoneStatusInput}
                    onChange={(e) => setMilestoneStatusInput(e.target.value as MilestoneStatus)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Achieved / Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={milestoneDueDateInput}
                    onChange={(e) => setMilestoneDueDateInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Milestone Notes & Specifics</label>
                <textarea
                  value={milestoneNotesInput}
                  onChange={(e) => setMilestoneNotesInput(e.target.value)}
                  placeholder="e.g. ₹50,000 received via IMPS, stage CAD drawing approved by bride..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingMilestoneIndex(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingMilestone}
                onClick={handleSaveMilestoneEdits}
                className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary text-white cursor-pointer shadow-md"
              >
                {isSavingMilestone ? 'Saving...' : 'Save Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM MILESTONE MODAL */}
      {showAddMilestoneModal && selectedProject && (
        <div className="fixed inset-0 z-60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-modal rounded-3xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#831843]" />
                  <span>Add Client Milestone</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowAddMilestoneModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddMilestoneSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder="e.g. Advance is paid, Reception is over, Stage finalized..."
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                />
              </div>

              {/* Preset quick buttons */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Choose from Standard Presets:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {COMMON_MILESTONE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewMilestoneName(preset)}
                      className="px-2 py-1 rounded-xl text-[10px] font-semibold glass-subtle hover:bg-rose-50 hover:text-[#831843] border border-white/60 cursor-pointer text-slate-700 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Initial Status</label>
                  <select
                    value={newMilestoneStatus}
                    onChange={(e) => setNewMilestoneStatus(e.target.value as MilestoneStatus)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-bold focus:outline-none focus:border-[#831843]"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Achieved (Done)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newMilestoneDueDate}
                    onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium focus:outline-none focus:border-[#831843]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Notes / Description (Optional)</label>
                <textarea
                  value={newMilestoneNotes}
                  onChange={(e) => setNewMilestoneNotes(e.target.value)}
                  placeholder="Provide any additional details or requirements for this stage..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl glass-input text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#831843]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMilestone || !newMilestoneName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary text-white cursor-pointer shadow-md"
                >
                  {isAddingMilestone ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
