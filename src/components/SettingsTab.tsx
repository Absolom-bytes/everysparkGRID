import { useState } from 'react';
import { Settings, ShieldAlert, Cpu, Trash2, RefreshCw, Volume2 } from 'lucide-react';

interface SettingsTabProps {
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  onResetDatabase: () => void;
}

export default function SettingsTab({ onAddLog, onResetDatabase }: SettingsTabProps) {
  const [knoxAttestation, setKnoxAttestation] = useState(true);
  const [allowRoot, setAllowRoot] = useState(false);
  const [logLevel, setLogLevel] = useState('Verbose');
  const [simulationDelay, setSimulationDelay] = useState(1.5);

  const handleUpdatePolicy = (settingName: string, value: boolean) => {
    onAddLog(`System policy modified: [${settingName} = ${value}]`, 'warn');
  };

  const handleResetWipe = () => {
    if (confirm('CRITICAL: Are you sure you want to completely erase the client cache, database storage, and reset the device logs to factory default?')) {
      onResetDatabase();
      onAddLog('SYSTEM RESET: Cleared local database caches and re-seeded default devices.', 'success');
      alert('Local Database Cleared and Factory Default Seeded!');
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto h-full">
      {/* Policy Control Toggles */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-5 shadow-md h-fit">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#38bdf8]" />
            Regulatory Attestation Policies
          </h2>
          <p className="text-[#94a3b8] text-xs">
            Verify and toggle Android SDK security layer rules and local emulator compatibility.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-1">
          {/* Knox Attestation Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#0f172a] rounded border border-[#334155]/60">
            <div>
              <div className="text-xs font-bold text-slate-200">Enforce Samsung Knox/TEE checking</div>
              <div className="text-[10px] text-slate-400">Verifies true physical hardware signing elements</div>
            </div>
            <input
              type="checkbox"
              id="knox-attest-toggle"
              checked={knoxAttestation}
              onChange={() => {
                const checked = !knoxAttestation;
                setKnoxAttestation(checked);
                handleUpdatePolicy('SamsungKnoxTEEEncryption', checked);
              }}
              className="w-4 h-4 text-[#38bdf8] rounded border-slate-700 bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Root Debug Devices Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#0f172a] rounded border border-[#334155]/60">
            <div>
              <div className="text-xs font-bold text-slate-200">Allow root debug emulation hosts</div>
              <div className="text-[10px] text-slate-400">Allows ADB testing inside hypervisors</div>
            </div>
            <input
              type="checkbox"
              id="allow-root-toggle"
              checked={allowRoot}
              onChange={() => {
                const checked = !allowRoot;
                setAllowRoot(checked);
                handleUpdatePolicy('AllowRootEmulatorHosts', checked);
              }}
              className="w-4 h-4 text-[#38bdf8] rounded border-slate-700 bg-slate-900 cursor-pointer"
            />
          </div>

          <hr className="border-slate-700/60" />

          {/* Slider for simulation parameters */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-200 font-bold">Simulator Enrollment Scanning Delay</span>
              <span className="font-mono text-[#38bdf8] font-bold">{simulationDelay} seconds</span>
            </div>
            <input
              type="range"
              id="delay-slider"
              min="0.5"
              max="5.0"
              step="0.5"
              className="w-fullaccent-[#38bdf8] cursor-pointer"
              value={simulationDelay}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSimulationDelay(val);
                onAddLog(`System Parameter updated: [SimulationDelay = ${val}s]`, 'info');
              }}
            />
            <p className="text-[9.5px] text-[#64748b]">
              Adjusts the simulated processing delays of student device verification checklists.
            </p>
          </div>
        </div>
      </div>

      {/* Database/App diagnostics */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-5 shadow-md h-fit">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#38bdf8]" />
            Diagnostics and Database Hardening
          </h2>
          <p className="text-slate-400 text-[11px] mt-1">
            Review app performance parameters, log debugging verbosities, or trigger system diagnostics.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Selector log compliance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Diagnostic Console Verbosity
            </label>
            <select
              id="log-level-select"
              className="bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
              value={logLevel}
              onChange={(e) => {
                const level = e.target.value;
                setLogLevel(level);
                onAddLog(`Log schema verbosity toggled to: ${level}`, 'info');
              }}
            >
              <option value="Verbose">Verbose Auditing (All transactions indexed)</option>
              <option value="Compact">Compact Logging (Prerequisites and failures only)</option>
              <option value="Minimal">Production Quiet (Error codes only)</option>
            </select>
          </div>

          <hr className="border-slate-700/60" />

          {/* Reset button inside card wrapper */}
          <div className="flex items-start gap-3 bg-red-950/20 border border-red-900 p-3.5 rounded-lg flex-col">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-200">Erase Device Database Registers</span>
            </div>
            <p className="text-[10px] text-red-300 leading-relaxed">
              Caution: Clicking below will wipe all student devices enrolled during this session, restore original default templates, CA keys, and clear console outputs.
            </p>
            <button
              onClick={handleResetWipe}
              className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded shadow-sm flex items-center gap-1 cursor-pointer transition-colors mt-1 w-full justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Perform Factory Purge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
