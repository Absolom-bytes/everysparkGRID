import { useState, useEffect } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import RegistrationTab from './components/RegistrationTab';
import AuditTab from './components/AuditTab';
import WorkspaceTab from './components/WorkspaceTab';
import ClassroomTab from './components/ClassroomTab';
import SyncTab from './components/SyncTab';
import CertificatesTab from './components/CertificatesTab';
import SettingsTab from './components/SettingsTab';
import AuthGuard from './components/AuthGuard';

import { Device, ComplianceCheck, SecurityCert, SystemLog } from './types';
import {
  INITIAL_DEVICES,
  INITIAL_COMPLIANCE_CHECKLIST,
  INITIAL_LOGS,
  INITIAL_CERTIFICATES,
} from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState('device-registration');

  // Load from query parameters, default to false but allow interactive toggle
  const [isStudentMode, setIsStudentMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'student' || params.get('student') === 'true';
  });

  // Load from LocalStorage or Fallback
  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('everyspark_devices');
    return saved ? JSON.parse(saved) : INITIAL_DEVICES;
  });

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(() => {
    const saved = localStorage.getItem('everyspark_checks');
    return saved ? JSON.parse(saved) : INITIAL_COMPLIANCE_CHECKLIST;
  });

  const [certificates, setCertificates] = useState<SecurityCert[]>(() => {
    const saved = localStorage.getItem('everyspark_certs');
    return saved ? JSON.parse(saved) : INITIAL_CERTIFICATES;
  });

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('everyspark_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [latency, setLatency] = useState(14);

  // Sync active Google Classroom students
  const [classroomStudents, setClassroomStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('everyspark_classroom_students');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('everyspark_classroom_students', JSON.stringify(classroomStudents));
  }, [classroomStudents]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('everyspark_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('everyspark_checks', JSON.stringify(complianceChecks));
  }, [complianceChecks]);

  useEffect(() => {
    localStorage.setItem('everyspark_certs', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('everyspark_logs', JSON.stringify(logs));
  }, [logs]);

  // Simulate network latency shifts slightly
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + delta;
        return next < 8 ? 8 : next > 25 ? 25 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAddLog = (message: string, level: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString();
    const newLog: SystemLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      level,
      message,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // keep last 50 logs
  };

  const handleAddDevice = (device: Device) => {
    setDevices((prev) => [device, ...prev]);
  };

  const handleSyncRosterToGrid = (students: any[]) => {
    setClassroomStudents((prev) => {
      const existingMap = new Map(prev.map(s => [s.id, s]));
      students.forEach(s => {
        existingMap.set(s.id, s);
      });
      return Array.from(existingMap.values());
    });
  };

  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    handleAddLog(`De-enrolled classroom client [Session ID: ${id}]`, 'warn');
  };

  const handleResetDatabase = () => {
    setDevices(INITIAL_DEVICES);
    setComplianceChecks(INITIAL_COMPLIANCE_CHECKLIST);
    setCertificates(INITIAL_CERTIFICATES);
    setLogs(INITIAL_LOGS);
  };

  const handleNetworkAuditScan = async () => {
    handleAddLog('Evaluating regulatory statuses for active student hosts...', 'info');

    // Simulate individual device audit update
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.status === 'Fail') {
          // 40% chance of passing now that the compliance settings might have changed
          const shouldPass = Math.random() > 0.6;
          return {
            ...dev,
            status: shouldPass ? 'Pass' : 'Fail',
            complianceRating: shouldPass ? 6 : 3,
          };
        }
        return dev;
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
    handleAddLog('Success: Network-wide telemetry collection and audit completed.', 'success');
    alert('Security auditor evaluation sequence complete.');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-[#f8fafc] font-sans overflow-hidden">
      {/* Top Bar Header */}
      <header className="h-14 bg-[#1e293b] border-b border-[#334155] flex items-center px-5 justify-between select-none shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logow.png" alt="EverySpark Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
          <span className="font-bold text-[15px] tracking-tight text-white flex items-center">
            EverySpark <span className="text-[#38bdf8] ml-1">{isStudentMode ? 'PWA' : 'GRID'}</span>
          </span>
          <span className="text-[#475569] mx-1 font-normal font-sans text-xs">/</span>
          <span className="text-[#94a3b8] text-[13px] font-medium font-mono">
            {isStudentMode ? 'enroll.everyspark.cc' : 'mydevice.everyspark.cc'}
          </span>
        </div>

        {/* Dynamic Sandbox Role Switcher - Essential for showcasing standalone design vs full console */}
        <div className="flex items-center bg-[#0f172a] border border-[#334155] p-1 rounded-lg text-xs font-semibold select-none">
          <button
            onClick={() => {
              setIsStudentMode(false);
              setActiveTab('device-registration');
              handleAddLog('Switched user view to [Administrative Console Mode]', 'info');
            }}
            className={`px-3 py-1 rounded transition-all duration-150 cursor-pointer ${
              !isStudentMode
                ? 'bg-[#38bdf8] text-[#0f172a] font-bold shadow'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Admin Console
          </button>
          <button
            onClick={() => {
              setIsStudentMode(true);
              setActiveTab('device-registration'); // Force registration view only
              handleAddLog('Switched user view to [Standalone Scholar PWA Mode] (Simulating QR/subdomain pathway)', 'info');
            }}
            className={`px-3 py-1 rounded transition-all duration-150 cursor-pointer ${
              isStudentMode
                ? 'bg-[#38bdf8] text-[#0f172a] font-bold shadow'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Scholar PWA Mode
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-emerald-600/50 bg-[#064e3b] text-[#6ee7b7] text-[10.5px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            {isStudentMode ? 'Standalone App' : 'Full Node Online'}
          </div>
          {/* Avatar Profile representation */}
          <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500/80 grid place-items-center text-xs font-bold text-slate-200 shadow-inner">
            {isStudentMode ? 'SC' : 'GG'}
          </div>
        </div>
      </header>

      {/* Main Panel Box */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Interactive Sidebar - LOCKED when accessing as standalone student PWA */}
        {!isStudentMode && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Dynamic Center Work Pane */}
        <main className="flex-1 bg-[#020617] overflow-hidden">
          <AuthGuard onAddLog={handleAddLog}>
            {isStudentMode ? (
              <RegistrationTab
                onAddDevice={handleAddDevice}
                logs={logs}
                onAddLog={handleAddLog}
                complianceChecks={complianceChecks}
                setComplianceChecks={setComplianceChecks}
                isStudentMode={isStudentMode}
                syncedStudents={classroomStudents}
              />
            ) : (
              <>
                {activeTab === 'device-registration' && (
                  <RegistrationTab
                    onAddDevice={handleAddDevice}
                    logs={logs}
                    onAddLog={handleAddLog}
                    complianceChecks={complianceChecks}
                    setComplianceChecks={setComplianceChecks}
                    isStudentMode={isStudentMode}
                    syncedStudents={classroomStudents}
                  />
                )}

                {activeTab === 'compliance-audit' && (
                  <AuditTab
                    devices={devices}
                    onDeleteDevice={handleDeleteDevice}
                    onAddLog={handleAddLog}
                    onTriggerAuditScan={handleNetworkAuditScan}
                  />
                )}

                {activeTab === 'capture-workspace' && (
                  <WorkspaceTab onAddLog={handleAddLog} />
                )}

                {activeTab === 'classroom-sync' && (
                  <ClassroomTab
                    onAddLog={handleAddLog}
                    onSyncRosterToGrid={handleSyncRosterToGrid}
                  />
                )}

                {activeTab === 'data-sync-hub' && (
                  <SyncTab
                    onAddLog={handleAddLog}
                    devices={devices}
                    setDevices={setDevices}
                    complianceChecks={complianceChecks}
                    setComplianceChecks={setComplianceChecks}
                    certificates={certificates}
                    setCertificates={setCertificates}
                    logs={logs}
                    setLogs={setLogs}
                  />
                )}

                {activeTab === 'security-certificates' && (
                  <CertificatesTab
                    certs={certificates}
                    onAddLog={handleAddLog}
                    setCertificates={setCertificates}
                  />
                )}

                {activeTab === 'sdk-settings' && (
                  <SettingsTab
                    onAddLog={handleAddLog}
                    onResetDatabase={handleResetDatabase}
                  />
                )}
              </>
            )}
          </AuthGuard>
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="h-8 bg-[#1e293b] border-t border-[#334155] flex items-center px-5 text-[11px] text-[#64748b] gap-6 select-none font-medium">
        <div>
          NODE: <span className="font-mono text-[#38bdf8] font-semibold">CLOUDFLARE_EDGE_ATL</span>
        </div>
        <div className="hidden sm:block">
          VERSION: <span className="font-mono text-[#38bdf8] font-semibold">2.4.1-STABLE</span>
        </div>
        <div>
          LATENCY: <span className="font-mono text-[#38bdf8] font-semibold">{latency}ms</span>
        </div>
        <div className="ml-auto font-sans font-normal">
          © 2026 EverySpark Neighborhood GRID
        </div>
      </footer>
    </div>
  );
}
