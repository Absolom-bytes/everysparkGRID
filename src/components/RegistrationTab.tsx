import React, { useState } from 'react';
import { Play, RotateCw, CheckCircle2, AlertCircle, ShieldEllipsis, Terminal, QrCode, ExternalLink } from 'lucide-react';
import { Device, ComplianceCheck, SystemLog } from '../types';

interface RegistrationTabProps {
  onAddDevice: (device: Device) => void;
  logs: SystemLog[];
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  complianceChecks: ComplianceCheck[];
  setComplianceChecks: React.Dispatch<React.SetStateAction<ComplianceCheck[]>>;
  isStudentMode?: boolean;
  syncedStudents?: any[];
}

export default function RegistrationTab({
  onAddDevice,
  logs,
  onAddLog,
  complianceChecks,
  setComplianceChecks,
  isStudentMode = false,
  syncedStudents = [],
}: RegistrationTabProps) {
  const [studentId, setStudentId] = useState('STU-99482-BR');
  const [hardwareId, setHardwareId] = useState('');
  const [department, setDepartment] = useState('K-12 General Education');
  const [osVersion, setOsVersion] = useState('Android 13.0');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatusMsg, setScanningStatusMsg] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Generate random Hardware ID
  const handleAutoScanHardware = () => {
    onAddLog('Initiating device hardware attestation check via ADB...', 'info');
    const randomHWID = 'HW-ADR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setHardwareId(randomHWID);
    onAddLog(`Hardware signature fetched successfully: ${randomHWID}`, 'success');
  };

  const handleBeginEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      onAddLog('Enrollment aborted: Student Identifier is required', 'error');
      alert('Please enter a valid Student Identifier!');
      return;
    }

    const hwId = hardwareId || 'HW-ADR-AUTO' + Math.floor(100000 + Math.random() * 900000);
    setIsScanning(true);
    setScanProgress(0);

    // Set check 4 (Policy Controller) and 5 (App Sandbox) to pending/scanning
    setComplianceChecks(prev =>
      prev.map((c, i) => (i >= 4 ? { ...c, status: 'Scanning' } : c))
    );

    onAddLog(`Starting standard device registration pipeline for [Student: ${studentId}]`, 'info');

    // Step 1: Policy Controller Check
    setScanningStatusMsg('Verifying Policy Controller rules...');
    onAddLog('Evaluating Profile Owner compatibility criteria...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1200));
    setScanProgress(30);
    setComplianceChecks(prev =>
      prev.map((c, i) => (i === 4 ? { ...c, status: 'Pass' } : c))
    );
    onAddLog('Compliance Pass: Policy Controller (DPC) configured securely', 'success');

    // Step 2: App Sandbox Isolation Layer Check
    setScanningStatusMsg('Evaluating App Sandbox Isolation...');
    onAddLog('Scanning namespace isolation and context restriction layouts...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1400));
    setScanProgress(75);
    setComplianceChecks(prev =>
      prev.map((c, i) => (i === 5 ? { ...c, status: 'Pass' } : c))
    );
    onAddLog('Compliance Pass: Application Sandbox verified & isolated', 'success');

    // Step 3: Certificate Attestation
    setScanningStatusMsg('Finalizing cryptographic handshakes...');
    await new Promise(resolve => setTimeout(resolve, 900));
    setScanProgress(100);

    const newDevice: Device = {
      id: 'ES-' + Math.floor(1000 + Math.random() * 9000),
      studentId: studentId,
      hardwareId: hwId,
      department: department,
      os: osVersion,
      osVersion: `${osVersion}.0_r${Math.floor(Math.random() * 90 + 1)}`,
      enrolledAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      complianceRating: 6,
      status: 'Pass',
    };

    onAddDevice(newDevice);
    onAddLog(`SUCCESS: Device registered. Generated Session Code: ${newDevice.id}-XQ-2026`, 'success');

    setIsScanning(false);
    setScanningStatusMsg('');
    alert(`Success! Device fully enrolled under department group: ${department}\nSession ID: ${newDevice.id}-XQ-2026`);
  };

  // Reset compliance checklist state back to initial with pending items
  const handleResetChecklist = () => {
    setComplianceChecks(prev =>
      prev.map((c, i) => (i >= 4 ? { ...c, status: 'Pending' } : { ...c, status: 'Pass' }))
    );
    onAddLog('Compliance auditor reset. Re-checking device prerequisites...', 'warn');
  };

  return (
    <div className="content-pane grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 p-6 h-full overflow-y-auto">
      {isStudentMode && (
        <div className="xl:col-span-2 bg-[#0c4a6e] border border-[#0284c7] text-[#bae6fd] p-4 rounded-lg text-xs leading-relaxed flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#0284c7]/30 border border-[#0284c7]/50 rounded text-[#38bdf8] shrink-0">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px] flex items-center gap-1.5">
                Scholar QR Pathway Active <span className="bg-[#0284c7] text-white px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Subdomain Mode</span>
              </p>
              <p className="mt-1 text-[#e0f2fe]">
                This PWA view is locked to the scholar's secure QR code scanner link routing to the school enrollment subdomain. 
                All parent administrative elements and navigation routes are deactivated to guarantee high client sandbox performance within mobile WebViews.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const studentUrl = `${window.location.origin}${window.location.pathname}?mode=student`;
              navigator.clipboard.writeText(studentUrl);
              alert('Scholar enrollment URL copied to clipboard!');
            }}
            className="shrink-0 bg-[#0284c7] hover:bg-[#0369a1] text-white px-3 py-1.5 rounded font-semibold text-[11px] flex items-center gap-1.5 transition-colors self-stretch md:self-auto justify-center cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Copy QR Link
          </button>
        </div>
      )}

      {/* Left Registration Form Card */}
      <form
        onSubmit={handleBeginEnrollment}
        className="registration-card bg-[#1e293b] border border-[#334155] rounded-lg p-6 flex flex-col gap-5 shadow-lg h-fit"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="margin-0 text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Enroll Student Device
            </h1>
            <p className="text-[#94a3b8] text-[13px] mt-1.5 leading-relaxed">
              Initialize Android SDK wrapper for device compliance verification and classroom sandbox provisioning.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-[#64748b] block font-bold tracking-wider">SESSION ID</span>
            <span className="mono font-mono text-[13px] text-[#38bdf8]">ES-8829-XQ-2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Student ID */}
          <div className="input-group flex flex-col gap-1.5 justify-between">
            <div>
              <label className="text-xs text-[#94a3b8] font-semibold tracking-wide">
                Student Identifier <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="student-id-input"
                required
                className="input-field bg-[#0f172a] border border-[#334155] text-[#f8fafc] px-3.5 py-2.5 rounded-md text-sm font-medium focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all duration-200 w-full mt-1.5"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-99482-BR"
                disabled={isScanning}
              />
            </div>
            {syncedStudents && syncedStudents.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider block mb-1">
                  Or link active Classroom scholar:
                </span>
                <select
                  onChange={(e) => {
                    const selId = e.target.value;
                    const matched = syncedStudents.find(s => s.id === selId);
                    if (matched) {
                      setStudentId(matched.id);
                      setDepartment(`${matched.grade} - ${matched.subject}`);
                      onAddLog(`Linked scholar ${matched.name} (${matched.id}) from Classroom.`, 'success');
                    }
                  }}
                  value={syncedStudents.some(s => s.id === studentId) ? studentId : ''}
                  className="bg-[#0f172a] border border-[#334155] text-slate-300 text-xs rounded p-2 w-full focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                >
                  <option value="">-- Choose Sync Roster list ({syncedStudents.length}) --</option>
                  {syncedStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) - {s.subject}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Hardware ID with scanner lookup */}
          <div className="input-group flex flex-col gap-1.5">
            <label className="text-xs text-[#94a3b8] font-semibold tracking-wide flex justify-between">
              <span>Device Hardware ID</span>
              <button
                type="button"
                onClick={handleAutoScanHardware}
                disabled={isScanning}
                className="text-[11px] text-[#38bdf8] hover:underline cursor-pointer disabled:opacity-50"
              >
                Scan hardware
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                id="hardware-id-input"
                className="input-field bg-[#0f172a] border border-[#334155] text-[#f8fafc] pl-3.5 pr-10 py-2.5 rounded-md text-sm font-mono focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all duration-200 w-full"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value)}
                placeholder="ADB auto-scan pending..."
                disabled={isScanning}
              />
              <button
                type="button"
                onClick={handleAutoScanHardware}
                disabled={isScanning}
                title="Simulate hardware SDK capture"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-[#94a3b8] hover:text-[#f8fafc] bg-slate-800 hover:bg-slate-700/80 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4 animate-spin-delayed" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department Access Grid */}
          <div className="input-group flex flex-col gap-1.5">
            <label className="text-xs text-[#94a3b8] font-semibold tracking-wide">
              Department Access Group
            </label>
            <select
              id="department-select"
              className="input-field bg-[#0f172a] border border-[#334155] text-[#f8fafc] px-3.5 py-2.5 rounded-md text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all duration-200 cursor-pointer"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isScanning}
            >
              <option value="K-12 General Education">K-12 General Education</option>
              <option value="Higher Ed Technical">Higher Ed Technical</option>
              <option value="Administrative Staff">Administrative Staff</option>
              <option value="System Sandbox Guest">System Sandbox Guest</option>
              {department !== "K-12 General Education" && 
               department !== "Higher Ed Technical" && 
               department !== "Administrative Staff" && 
               department !== "System Sandbox Guest" && (
                <option value={department}>{department}</option>
              )}
            </select>
          </div>

          {/* Android Target Version OS selection */}
          <div className="input-group flex flex-col gap-1.5">
            <label className="text-xs text-[#94a3b8] font-semibold tracking-wide">
              Simulated Target OS
            </label>
            <select
              id="os-select"
              className="input-field bg-[#0f172a] border border-[#334155] text-[#f8fafc] px-3.5 py-2.5 rounded-md text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all duration-200 cursor-pointer"
              value={osVersion}
              onChange={(e) => setOsVersion(e.target.value)}
              disabled={isScanning}
            >
              <option value="Android 14">Android 14 (Usp1a)</option>
              <option value="Android 13">Android 13 (Tiramisu)</option>
              <option value="Android 12">Android 12 (Snow Cone)</option>
              <option value="Android 11">Android 11 (Legacy - Fail Alert)</option>
            </select>
          </div>
        </div>

        {/* Dynamic progress feedback if scanning */}
        {isScanning && (
          <div className="bg-slate-900/60 border border-[#334155] rounded-md p-4 mt-2 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#38bdf8] font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                {scanningStatusMsg}
              </span>
              <span className="font-mono text-slate-300 font-bold">{scanProgress}%</span>
            </div>
            <div className="w-full bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#38bdf8] h-full transition-all duration-500 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#334155] flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setStudentId('STU-99482-BR');
              setHardwareId('');
              setDepartment('K-12 General Education');
              onAddLog('Cleared enrollment input forms.', 'info');
            }}
            disabled={isScanning}
            className="border border-[#334155] text-[#f8fafc] hover:bg-slate-700/40 font-medium px-5 py-2.5 rounded-md text-[13px] transition-all duration-200 cursor-pointer text-center disabled:opacity-50"
          >
            Clear Form
          </button>
          <button
            type="submit"
            id="begin-enrollment-btn"
            disabled={isScanning}
            className="bg-[#38bdf8] text-[#0f172a] hover:bg-[#38bdf8]/90 font-semibold px-5 py-2.5 rounded-md text-[13px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Running SDK Attestation...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Enrollment</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Right Compliance Checklist Panel */}
      <div className="info-panel bg-[#0f172a] border border-[#334155] rounded-lg flex flex-col h-fit xl:h-full overflow-hidden shadow-lg min-h-[500px]">
        <div className="p-4 border-b border-[#334155] font-semibold text-sm text-slate-200 flex justify-between items-center bg-slate-900">
          <span>Compliance Checklist</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {complianceChecks.filter(c => c.status === 'Pass').length}/{complianceChecks.length} Passed
            </span>
            <button
              onClick={handleResetChecklist}
              title="Reset Checklist Auditor"
              className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-400 hover:text-[#38bdf8]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#334155]/60 pr-1">
          {complianceChecks.map((check) => {
            let badgeClass = '';
            let labelText = '';

            if (check.status === 'Pass') {
              badgeClass = 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]';
              labelText = 'Pass';
            } else if (check.status === 'Scanning') {
              badgeClass = 'bg-sky-950 text-sky-300 border border-sky-500 animate-pulse';
              labelText = 'Scan...';
            } else if (check.status === 'Pending') {
              badgeClass = 'bg-[#451a03] text-[#fdba74] border border-[#d97706]';
              labelText = 'Pending';
            } else {
              badgeClass = 'bg-red-950/80 text-red-300 border border-red-700';
              labelText = 'Fail';
            }

            return (
              <div key={check.id} className="compliance-row flex items-center justify-between p-3.5 hover:bg-[#1a2333]/30 transition-colors">
                <div>
                  <div className="text-[13px] font-medium text-[#f8fafc]">{check.name}</div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">{check.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  {check.status === 'Pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {check.status === 'Pending' && <ShieldEllipsis className="w-3.5 h-3.5 text-[#fdba74]" />}
                  {check.status === 'Scanning' && <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                  {check.status === 'Fail' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className={`status-badge text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide min-w-[55px] text-center ${badgeClass}`}>
                    {labelText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Console / Simulated Log Box */}
        <div className="p-4 bg-[#020617] border-t border-[#334155] flex flex-col h-[200px]">
          <div className="font-semibold text-[10px] text-[#64748b] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 tracking-wider uppercase">
              <Terminal className="w-3 h-3 text-[#38bdf8]" />
              REAL-TIME LOG
            </span>
            <span className="font-mono text-[9px] text-[#38bdf8] animate-pulse">online</span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-[#38bdf8] flex flex-col gap-1 pr-1 styles-scrollbar">
            {logs.map((log) => {
              let logColor = 'text-[#38bdf8]';
              if (log.level === 'warn') logColor = 'text-amber-400';
              if (log.level === 'error') logColor = 'text-red-400';
              if (log.level === 'success') logColor = 'text-emerald-400';

              return (
                <div key={log.id} className="break-all">
                  <span className="text-[#475569] mr-1.5">[{log.timestamp}]</span>
                  <span className={logColor}>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
