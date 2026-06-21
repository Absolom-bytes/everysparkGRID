import { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Cpu, Trash2, Filter, Download, Check, AlertTriangle } from 'lucide-react';
import { Device, SystemLog } from '../types';

interface AuditTabProps {
  devices: Device[];
  onDeleteDevice: (id: string) => void;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  onTriggerAuditScan: () => void;
}

export default function AuditTab({ devices, onDeleteDevice, onAddLog, onTriggerAuditScan }: AuditTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  // Computed statistics
  const total = devices.length;
  const passed = devices.filter((d) => d.status === 'Pass').length;
  const failed = devices.filter((d) => d.status === 'Fail').length;
  const pending = devices.filter((d) => d.status === 'Pending').length;

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.hardwareId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || device.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || device.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  const handleExportCSV = () => {
    onAddLog(`Exporting audit log sheet: ${filteredDevices.length} records...`, 'info');
    const headers = 'ID,Student ID,Hardware ID,Department,OS,Enrolled At,Status\n';
    const csvContent = filteredDevices
      .map(
        (d) =>
          `"${d.id}","${d.studentId}","${d.hardwareId}","${d.department}","${d.os}","${d.enrolledAt}","${d.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `EverySpark_Compliance_Audit_${new Date().toISOString().substring(0, 10)}.csv`);
    a.click();
    onAddLog('Audit sheet CSV downloaded successfully.', 'success');
  };

  const runTriggerBatchAuditScan = () => {
    onAddLog('Initiating network-wide batch compliance audit...', 'warn');
    onTriggerAuditScan();
  };

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
      {/* Top Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Enrolled</span>
            <Cpu className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-white">{total}</span>
            <span className="text-xs text-[#64748b] ml-2 block sm:inline">active units</span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Compliant</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-emerald-400">{passed}</span>
            <span className="text-xs text-[#64748b] ml-1.5 block sm:inline">
              ({total ? Math.round((passed / total) * 100) : 0}% ratio)
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Failed Audit</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-red-400">{failed}</span>
            <span className="text-xs text-red-400/70 ml-2 font-medium block sm:inline">Action required</span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#fdba74]">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Pending Checks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-amber-400">{pending}</span>
            <span className="text-xs text-[#64748b] ml-2 block sm:inline">queued verification</span>
          </div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="audit-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Hardware, Student ID, or Session..."
            className="w-full bg-[#0f172a] border border-[#334155] rounded-md pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Department Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5" />
            <select
              id="filter-dept"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded px-2 py-1.5 font-medium text-slate-200 cursor-pointer focus:outline-none focus:border-[#38bdf8]"
            >
              <option value="All">All Departments</option>
              <option value="K-12 General Education">K-12 GenEd</option>
              <option value="Higher Ed Technical">Higher Ed Tech</option>
              <option value="Administrative Staff">Admin Staff</option>
              <option value="System Sandbox Guest">Sandbox Guest</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded px-2 py-1.5 text-xs font-medium text-slate-200 cursor-pointer focus:outline-none focus:border-[#38bdf8] w-full sm:w-auto"
          >
            <option value="All">All Statuses</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Action buttons */}
          <button
            onClick={runTriggerBatchAuditScan}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors w-full sm:w-auto justify-center"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Audit Network</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredDevices.length === 0}
            className="bg-slate-700 hover:bg-slate-600 border border-[#334155] text-white font-semibold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Results Table Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden shadow-sm flex flex-col flex-1 min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#334155] bg-slate-900/60 text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={filteredDevices.length > 0 && selectedDevices.length === filteredDevices.length}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="py-3 px-4">Session/Code</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Hardware ID</th>
                <th className="py-3 px-4">Dept. Access Group</th>
                <th className="py-3 px-4">Operating System</th>
                <th className="py-3 px-4">Compliance Rating</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/50">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No matching student devices registered. Run "Begin Enrollment" or modify search filters.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  let badgeColor = '';
                  let statusLabel = '';

                  if (device.status === 'Pass') {
                    badgeColor = 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]';
                    statusLabel = 'PASS';
                  } else if (device.status === 'Pending') {
                    badgeColor = 'bg-[#451a03] text-[#fdba74] border border-[#d97706]';
                    statusLabel = 'PENDING';
                  } else {
                    badgeColor = 'bg-red-950/80 text-red-300 border border-red-700';
                    statusLabel = 'FAIL';
                  }

                  const isChecked = selectedDevices.includes(device.id);

                  return (
                    <tr
                      key={device.id}
                      className={`text-xs hover:bg-[#1f2d42]/40 transition-colors ${
                        isChecked ? 'bg-[#38bdf8]/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(device.id)}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#38bdf8]">
                        {device.id}-XQ-2026
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {device.studentId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {device.hardwareId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {device.department}
                      </td>
                      <td className="py-3.5 px-4 text-[#94a3b8] font-medium">
                        {device.osVersion}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#0f172a] h-1.5 rounded-full overflow-hidden border border-slate-700/60">
                            <div
                              className={`h-full ${
                                device.complianceRating >= 6
                                  ? 'bg-emerald-400'
                                  : device.complianceRating >= 4
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${(device.complianceRating / 6) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {device.complianceRating}/6 checks
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block min-w-[55px] ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Release device ${device.id} for student ${device.studentId}?`)) {
                              onDeleteDevice(device.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800/80 transition-colors cursor-pointer inline-block"
                          title="Release / Revoke Device Enrollment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-[#334155] bg-slate-900/40 text-[11px] text-slate-500 mt-auto flex justify-between items-center">
          <span>Showing {filteredDevices.length} of {devices.length} registered classroom sandbox entities.</span>
          {selectedDevices.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Erase compliance registers for the ${selectedDevices.length} selected devices?`)) {
                  selectedDevices.forEach((id) => onDeleteDevice(id));
                  setSelectedDevices([]);
                }
              }}
              className="text-red-400 hover:underline cursor-pointer font-bold font-mono text-[10px]"
            >
              Wipe {selectedDevices.length} selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
