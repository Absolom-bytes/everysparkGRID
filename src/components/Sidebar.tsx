import { ShieldAlert, Cpu, Layers, RefreshCw, KeyRound, Settings, Activity, GraduationCap } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const sections = [
    {
      title: 'Portal Tools',
      items: [
        { id: 'device-registration', label: 'Device Registration', icon: Cpu },
        { id: 'compliance-audit', label: 'Compliance Audit', icon: ShieldAlert },
        { id: 'capture-workspace', label: 'Capture Workspace', icon: Layers },
        { id: 'classroom-sync', label: 'Classroom Sync', icon: GraduationCap },
        { id: 'data-sync-hub', label: 'Data Sync Hub', icon: RefreshCw },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'security-certificates', label: 'Security Certificates', icon: KeyRound },
        { id: 'sdk-settings', label: 'SDK Settings', icon: Settings },
      ],
    },
  ];

  return (
    <nav className="w-56 bg-[#0f172a] border-r border-[#334155] flex flex-col p-3 gap-1 select-none h-full shadow-lg">
      {sections.map((section, idx) => (
        <div key={idx} className="flex flex-col">
          <div className="text-[#475569] text-[10px] font-bold uppercase tracking-wider px-4 pt-4 pb-2">
            {section.title}
          </div>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-left text-[13px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#334155] text-[#f8fafc] font-medium border-l-2 border-[#38bdf8]'
                      : 'text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc]'
                  }`}
                >
                  <Icon className={`w-4 height-4 ${isActive ? 'text-[#38bdf8]' : 'text-[#64748b]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="mt-auto p-4 border-t border-[#334155]/40 bg-[#020617]/40 rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-medium">SDK MONITOR</span>
        </div>
        <p className="text-[9px] text-[#64748b] leading-relaxed">
          Active listener hooked on Android emulator ports (5554, 5556). State synced locally.
        </p>
      </div>
    </nav>
  );
}
