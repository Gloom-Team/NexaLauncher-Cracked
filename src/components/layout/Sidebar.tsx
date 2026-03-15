import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Gamepad2,
  Activity,
  Play,
  Trash2,
  ShieldOff,
  Shield,
  Monitor,
  Cog,
  RotateCcw,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/profiles", icon: Layers, label: "Profiles" },
  { to: "/gaming", icon: Gamepad2, label: "Gaming" },
  { to: "/performance", icon: Activity, label: "Performance" },
  { to: "/startup", icon: Play, label: "Startup & Background" },
  { to: "/cleanup", icon: Trash2, label: "Cleanup" },
  { to: "/annoyances", icon: ShieldOff, label: "Annoyances" },
  { to: "/privacy", icon: Shield, label: "Privacy" },
  { to: "/diagnostics", icon: Monitor, label: "Diagnostics" },
  { to: "/automation", icon: Cog, label: "Automation" },
  { to: "/undo", icon: RotateCcw, label: "Undo & Safety" },
  { to: "/advanced", icon: Settings, label: "Advanced" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 h-screen bg-surface-950 border-r border-surface-800 flex flex-col fixed left-0 top-0">
      <div className="px-5 py-5">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Ready<span className="text-accent">PC</span>
        </h1>
        <p className="text-[10px] text-surface-500 mt-0.5 leading-tight">
          Optimize Windows for gaming,
          <br />
          speed, and less annoyance
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `nav-item-animated flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_10px_-3px_rgba(99,102,241,0.3)]"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-surface-800">
        <p className="text-[10px] text-surface-600 text-center">
          ReadyPC v1.0.0 — All changes are reversible
        </p>
      </div>
    </aside>
  );
}
