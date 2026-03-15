import { useEffect, useState } from "react";
import {
  Cog,
  Plus,
  Gamepad2,
  Trash2,
  Clock,
  Zap,
  Monitor,
  Battery,
  Calendar,
  X,
  Play,
  Loader2,
  BellOff,
} from "lucide-react";
import { useAutomationStore } from "../stores/automationStore";
import type { AutomationRule, AutomationTrigger, AutomationAction } from "../lib/types";

type TriggerIconMap = Record<string, typeof Cog>;

const TRIGGER_ICONS: TriggerIconMap = {
  ProcessLaunched: Gamepad2,
  ProcessClosed: Gamepad2,
  PowerSourceChanged: Battery,
  Schedule: Calendar,
  FullscreenDetected: Monitor,
  Manual: Play,
};

interface PresetRuleConfig {
  name: string;
  description: string;
  icon: typeof Cog;
  rule: AutomationRule;
}

const PRESET_RULES: PresetRuleConfig[] = [
  {
    name: "Auto Gaming Mode",
    description: "Apply the Gaming profile when a game launches, revert when it closes",
    icon: Gamepad2,
    rule: {
      id: "preset-auto-gaming",
      name: "Auto Gaming Mode when game launches",
      enabled: true,
      trigger: { ProcessLaunched: { process_name: "*.exe" } },
      actions: [{ ApplyProfile: { profile_id: "gaming" } }],
      revert_actions: [{ RevertProfile: { profile_id: "gaming" } }],
    },
  },
  {
    name: "Battery Mode",
    description: "Switch to battery-optimized settings when unplugged",
    icon: Battery,
    rule: {
      id: "preset-battery-mode",
      name: "Battery Mode when unplugged",
      enabled: true,
      trigger: { PowerSourceChanged: { on_battery: true } },
      actions: [{ ApplyProfile: { profile_id: "battery" } }],
      revert_actions: [{ RevertProfile: { profile_id: "battery" } }],
    },
  },
  {
    name: "Do Not Disturb in Fullscreen",
    description: "Enable DND when a fullscreen app is detected",
    icon: BellOff,
    rule: {
      id: "preset-dnd-fullscreen",
      name: "Do Not Disturb in fullscreen",
      enabled: true,
      trigger: "FullscreenDetected",
      actions: ["EnableDND"],
      revert_actions: ["DisableDND"],
    },
  },
  {
    name: "Weekly Cleanup",
    description: "Run cleanup tasks every week automatically",
    icon: Calendar,
    rule: {
      id: "preset-weekly-cleanup",
      name: "Weekly cleanup",
      enabled: true,
      trigger: { Schedule: { cron: "0 3 * * 0" } },
      actions: [{ RunCleanup: { target_ids: ["temp", "logs", "thumbnails"] } }],
      revert_actions: [],
    },
  },
];

function getTriggerIcon(trigger: AutomationTrigger) {
  if (typeof trigger === "string") return TRIGGER_ICONS[trigger] || Cog;
  const key = Object.keys(trigger)[0];
  return TRIGGER_ICONS[key] || Cog;
}

function triggerLabel(trigger: AutomationTrigger): string {
  if (typeof trigger === "object" && trigger !== null) {
    if ("Schedule" in trigger) return `Schedule: ${trigger.Schedule.cron}`;
    if ("ProcessLaunched" in trigger)
      return `When ${trigger.ProcessLaunched.process_name} launches`;
    if ("ProcessClosed" in trigger)
      return `When ${trigger.ProcessClosed.process_name} closes`;
    if ("PowerSourceChanged" in trigger)
      return trigger.PowerSourceChanged.on_battery ? "On battery" : "Plugged in";
  }
  if (trigger === "FullscreenDetected") return "Fullscreen detected";
  if (trigger === "Manual") return "Manual trigger";
  return JSON.stringify(trigger);
}

function actionLabel(action: AutomationAction): string {
  if (typeof action === "string") {
    if (action === "EnableDND") return "Enable Do Not Disturb";
    if (action === "DisableDND") return "Disable Do Not Disturb";
    return action;
  }
  if ("ApplyProfile" in action) return `Apply profile: ${action.ApplyProfile.profile_id}`;
  if ("RevertProfile" in action) return `Revert profile: ${action.RevertProfile.profile_id}`;
  if ("ApplyTweak" in action) return `Apply tweak: ${action.ApplyTweak.tweak_id}`;
  if ("RevertTweak" in action) return `Revert tweak: ${action.RevertTweak.tweak_id}`;
  if ("RunCleanup" in action) return "Run cleanup";
  if ("SuspendProcesses" in action) return "Suspend processes";
  if ("SetPowerPlan" in action) return "Set power plan";
  return JSON.stringify(action);
}

export default function Automation() {
  const { rules, fetchRules, addRule, removeRule, toggleRule, fetchDefaults } =
    useAutomationStore();
  const [defaults, setDefaults] = useState<AutomationRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
    fetchDefaults().then(setDefaults).catch(() => {});
  }, []);

  const handleAddDefault = async (rule: AutomationRule) => {
    setActionLoading(rule.id);
    try {
      await addRule(rule);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPreset = async (preset: PresetRuleConfig) => {
    setActionLoading(preset.rule.id);
    try {
      await addRule(preset.rule);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoading(id);
    try {
      await removeRule(id);
    } finally {
      setActionLoading(null);
    }
  };

  const activeRuleIds = new Set(rules.map((r) => r.id));

  return (
    <div className="max-w-6xl space-y-6 stagger-children">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Automation</h1>
          <p className="text-surface-400 text-sm mt-1">
            Set up automatic rules that respond to events on your PC
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary btn-animated text-sm flex items-center gap-2"
        >
          <Plus size={15} />
          Create Rule
        </button>
      </div>

      {/* Quick Presets */}
      <div className="card card-animated p-5">
        <h2 className="text-base font-semibold text-white mb-3">Quick Setup Presets</h2>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_RULES.filter((p) => !activeRuleIds.has(p.rule.id)).map((preset) => {
            const Icon = preset.icon;
            const loading = actionLoading === preset.rule.id;
            return (
              <div
                key={preset.rule.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-surface-600 transition-colors"
              >
                <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{preset.name}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{preset.description}</div>
                </div>
                <button
                  onClick={() => handleAddPreset(preset)}
                  disabled={loading}
                  className="btn-primary btn-animated text-xs px-3 py-1.5 shrink-0"
                >
                  {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Add
                </button>
              </div>
            );
          })}
          {PRESET_RULES.every((p) => activeRuleIds.has(p.rule.id)) && (
            <p className="text-surface-500 text-sm col-span-2 text-center py-4">
              All presets have been added.
            </p>
          )}
        </div>
      </div>

      {/* Active Rules */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">
          Active Rules
          <span className="text-surface-500 font-normal ml-2 text-sm">{rules.length}</span>
        </h2>
        {rules.length === 0 ? (
          <div className="card card-animated p-8 text-center">
            <Cog size={36} className="text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400 text-sm">No automation rules set up yet.</p>
            <p className="text-surface-600 text-xs mt-1">
              Add a preset above or create a custom rule.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => {
              const TriggerIcon = getTriggerIcon(rule.trigger);
              const loading = actionLoading === rule.id;
              return (
                <div key={rule.id} className="card card-animated p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${rule.enabled ? "bg-accent/10" : "bg-surface-800"}`}
                    >
                      <TriggerIcon
                        size={16}
                        className={rule.enabled ? "text-accent" : "text-surface-500"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{rule.name}</span>
                        {!rule.enabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-surface-500">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-surface-500 mt-0.5">
                        {triggerLabel(rule.trigger)}
                      </div>
                      {rule.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {rule.actions.map((action, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-surface-700"
                            >
                              {actionLabel(action)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleRule(rule.id, !rule.enabled)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${rule.enabled ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-surface-700 text-surface-400 hover:bg-surface-600"}`}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        onClick={() => handleRemove(rule.id)}
                        disabled={loading}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        {loading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Server-provided default rules */}
      {defaults.length > 0 && defaults.some((d) => !activeRuleIds.has(d.id)) && (
        <div className="card card-animated p-5">
          <h2 className="text-base font-semibold text-white mb-3">More Preset Rules</h2>
          <div className="space-y-2">
            {defaults
              .filter((d) => !activeRuleIds.has(d.id))
              .map((preset) => {
                const TriggerIcon = getTriggerIcon(preset.trigger);
                const loading = actionLoading === preset.id;
                return (
                  <div
                    key={preset.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-surface-800/50"
                  >
                    <TriggerIcon size={14} className="text-surface-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{preset.name}</div>
                      <div className="text-xs text-surface-500">
                        {triggerLabel(preset.trigger)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddDefault(preset)}
                      disabled={loading}
                      className="btn-primary btn-animated px-3 py-1 text-xs"
                    >
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      Add
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Automation Log */}
      <div className="card card-animated p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-white">Automation Log</h2>
        </div>
        <div className="text-center py-6">
          <Clock size={28} className="text-surface-600 mx-auto mb-2" />
          <p className="text-surface-500 text-sm">
            Automation events will appear here as rules trigger.
          </p>
          <p className="text-surface-600 text-xs mt-1">
            Rules run automatically in the background.
          </p>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <CreateRuleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (rule) => {
            await addRule(rule);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Rule Modal
// ---------------------------------------------------------------------------

type TriggerType =
  | "process_launch"
  | "process_close"
  | "power_change"
  | "schedule"
  | "fullscreen"
  | "manual";
type ActionType =
  | "apply_profile"
  | "revert_profile"
  | "enable_dnd"
  | "run_cleanup"
  | "set_power_plan";

function CreateRuleModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (rule: AutomationRule) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("process_launch");
  const [processName, setProcessName] = useState("");
  const [cron, setCron] = useState("0 3 * * 0");
  const [onBattery, setOnBattery] = useState(true);
  const [selectedActionType, setSelectedActionType] = useState<ActionType>("apply_profile");
  const [profileId, setProfileId] = useState("gaming");
  const [saving, setSaving] = useState(false);

  const buildTrigger = (): AutomationTrigger => {
    switch (triggerType) {
      case "process_launch":
        return { ProcessLaunched: { process_name: processName } };
      case "process_close":
        return { ProcessClosed: { process_name: processName } };
      case "power_change":
        return { PowerSourceChanged: { on_battery: onBattery } };
      case "schedule":
        return { Schedule: { cron } };
      case "fullscreen":
        return "FullscreenDetected";
      case "manual":
        return "Manual";
    }
  };

  const buildAction = (): AutomationAction => {
    switch (selectedActionType) {
      case "apply_profile":
        return { ApplyProfile: { profile_id: profileId } };
      case "revert_profile":
        return { RevertProfile: { profile_id: profileId } };
      case "enable_dnd":
        return "EnableDND";
      case "run_cleanup":
        return { RunCleanup: { target_ids: ["temp", "logs"] } };
      case "set_power_plan":
        return { SetPowerPlan: { guid: "high-performance" } };
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        id: `custom-${Date.now()}`,
        name: name.trim(),
        enabled: true,
        trigger: buildTrigger(),
        actions: [buildAction()],
        revert_actions: [],
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "w-full px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-white placeholder:text-surface-600 focus:outline-none focus:border-accent/50";
  const selectClasses =
    "w-full px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-accent/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Create Automation Rule</h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">
              Rule Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              placeholder="My automation rule"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">
              Trigger Type
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TriggerType)}
              className={selectClasses}
            >
              <option value="process_launch">When a process launches</option>
              <option value="process_close">When a process closes</option>
              <option value="power_change">When power source changes</option>
              <option value="schedule">On a schedule</option>
              <option value="fullscreen">When fullscreen detected</option>
              <option value="manual">Manual trigger</option>
            </select>
          </div>

          {(triggerType === "process_launch" || triggerType === "process_close") && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Process Name
              </label>
              <input
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                className={inputClasses}
                placeholder="game.exe"
              />
            </div>
          )}

          {triggerType === "schedule" && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Cron Expression
              </label>
              <input
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className={inputClasses}
                placeholder="0 3 * * 0"
              />
              <p className="text-[11px] text-surface-600 mt-1">
                Example: "0 3 * * 0" = every Sunday at 3 AM
              </p>
            </div>
          )}

          {triggerType === "power_change" && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Condition
              </label>
              <select
                value={onBattery ? "battery" : "plugged"}
                onChange={(e) => setOnBattery(e.target.value === "battery")}
                className={selectClasses}
              >
                <option value="battery">When switching to battery</option>
                <option value="plugged">When plugged in</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Action</label>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value as ActionType)}
              className={selectClasses}
            >
              <option value="apply_profile">Apply a profile</option>
              <option value="revert_profile">Revert a profile</option>
              <option value="enable_dnd">Enable Do Not Disturb</option>
              <option value="run_cleanup">Run cleanup</option>
              <option value="set_power_plan">Set power plan</option>
            </select>
          </div>

          {(selectedActionType === "apply_profile" ||
            selectedActionType === "revert_profile") && (
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Profile ID
              </label>
              <input
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className={inputClasses}
                placeholder="gaming"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-800">
          <button onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="btn-primary btn-animated text-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}
