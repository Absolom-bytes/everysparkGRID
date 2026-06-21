import { useState } from 'react';
import { RefreshCw, Database, Radio, Server, CheckCircle2, RotateCw } from 'lucide-react';

interface SyncTabProps {
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
}

export default function SyncTab({ onAddLog }: SyncTabProps) {
  const [syncing, setSyncing] = useState(false);
  const [percent, setPercent] = useState(0);
  const [lastSynced, setLastSynced] = useState('2026-06-20 17:01');
  const [syncLog, setSyncLog] = useState<string[]>([
    'DB_SYNC: Precheck OK - SQLite sandbox is clean.',
    'DB_SYNC: Configured upstream route: https://everyspark.cc/api/v1/sync',
    'DB_SYNC: Idle - Standby for active synchronization trigger.'
  ]);

  const handleForceSync = async () => {
    setSyncing(true);
    setPercent(0);
    onAddLog('Initiating cloud state sync to EverySpark cloud database...', 'info');

    const updateLogs = (msg: string) => {
      setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    updateLogs('CONNECTING: Contacting EverySpark cloud edge network...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setPercent(25);

    updateLogs('AUTHORIZING: Performing RSA-SHA256 handshake verification...');
    await new Promise(resolve => setTimeout(resolve, 900));
    setPercent(55);

    updateLogs('PENDING_PUSH: Bundling local client registries and attestation signatures...');
    await new Promise(resolve => setTimeout(resolve, 700));
    setPercent(85);

    updateLogs('UPLOADING: Transferring state records to cloud datastore...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPercent(100);

    updateLogs('SYNC_COMPLETED: 100% synchronized and listening.');
    setSyncing(false);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setLastSynced(nowStr);
    onAddLog(`State synchronized successfully at ${nowStr}`, 'success');
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto h-full">
      {/* Sync Status Info */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-6 shadow-md h-fit">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#38bdf8]" />
            Local Data Sync Hub
          </h2>
          <p className="text-[#94a3b8] text-xs mt-1">
            Push local student device registrations and compliance histories to EverySpark Cloud database.
          </p>
        </div>

        {/* Sync Stats Table */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-md overflow-hidden text-xs">
          <div className="grid grid-cols-2 p-3 border-b border-[#334155]/60 hover:bg-[#1a2333]/30">
            <span className="text-[#64748b] font-bold">Local SQLite Database</span>
            <span className="text-slate-200 font-mono">1.28 MB (24 pages)</span>
          </div>
          <div className="grid grid-cols-2 p-3 border-b border-[#334155]/60 hover:bg-[#1a2333]/30">
            <span className="text-[#64748b] font-bold">Unpushed Local Changes</span>
            <span className="text-amber-400 font-mono">2 records pending</span>
          </div>
          <div className="grid grid-cols-2 p-3 border-b border-[#334155]/60 hover:bg-[#1a2333]/30">
            <span className="text-[#64748b] font-bold">Upstream Endpoint</span>
            <span className="text-[#38bdf8] font-mono break-all font-semibold">https://everyspark.cc/api/v1/sync</span>
          </div>
          <div className="grid grid-cols-2 p-3 hover:bg-[#1a2333]/30">
            <span className="text-[#64748b] font-bold">Last Synced Timestamp</span>
            <span className="text-emerald-400 font-mono">{lastSynced}</span>
          </div>
        </div>

        {syncing && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold animate-pulse">Synchronizing database blocks...</span>
              <span className="font-mono text-[#38bdf8] font-bold">{percent}%</span>
            </div>
            <div className="w-full bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#38bdf8] h-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleForceSync}
          disabled={syncing}
          className="bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-slate-950 font-bold text-xs py-2.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          {syncing ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>{syncing ? 'Syncing Local Registers...' : 'Force Upstream Sync'}</span>
        </button>
      </div>

      {/* Sync Terminal Logs Box */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-5 flex flex-col h-[350px] md:h-full shadow-md overflow-hidden justify-between">
        <div className="font-semibold text-xs text-slate-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
          <Database className="w-4 h-4 text-[#38bdf8]" />
          Synchronizer Log Pipeline
        </div>

        <div className="flex-1 bg-[#020617] p-4 rounded-md border border-[#334155]/60 font-mono text-[11px] leading-relaxed text-[#38bdf8] overflow-y-auto styles-scrollbar flex flex-col gap-1.5">
          {syncLog.map((log, idx) => (
            <div key={idx} className="break-all">
              {log}
            </div>
          ))}
        </div>

        <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sync channel secured via TLS 1.3 cryptographic layers.</span>
        </div>
      </div>
    </div>
  );
}
