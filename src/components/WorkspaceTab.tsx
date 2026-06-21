import { useState } from 'react';
import { Layers, Copy, Check, Download, ShieldAlert, Cpu, Terminal, Eye } from 'lucide-react';

interface WorkspaceTabProps {
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
}

export default function WorkspaceTab({ onAddLog }: WorkspaceTabProps) {
  const [profileName, setProfileName] = useState('Standard Android Sandbox');
  const [allowCamera, setAllowCamera] = useState(false);
  const [allowSideload, setAllowSideload] = useState(false);
  const [requireBiometric, setRequireBiometric] = useState(true);
  const [wifiSsid, setWifiSsid] = useState('STUDENT_SECURE_WPA3');
  const [isCopied, setIsCopied] = useState(false);

  // Generate dynamic xml android device policy payload
  const generatedPolicy = `<?xml version="1.0" encoding="utf-8"?>
<device-policy xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- EverySpark DPC Policy Wrapper Layout -->
    <profile-meta>
        <identity-name>${profileName}</identity-name>
        <generator-ver>ES-SDK-v2.4.1</generator-ver>
        <export-timestamp>${new Date().toISOString()}</export-timestamp>
    </profile-meta>

    <camera-disabled value="${!allowCamera ? 'true' : 'false'}" />
    <install-unknown-sources value="${allowSideload ? 'true' : 'false'}" />
    <password-quality value="${requireBiometric ? 'BIOMETRIC_COMPLEX' : 'PASSWORD_ANY'}" />

    <network-configurations>
        <wifi-profile ssid="${wifiSsid}" securityType="WPA3_Enterprise">
            <auto-join value="true" />
            <cert-anchor alias="EverySparkRootCA" />
        </wifi-profile>
    </network-configurations>

    <application-restrictions>
        <app package="com.everyspark.compliance.wrapper">
            <restriction key="isolation_layer" value="active" />
            <restriction key="developer_options" value="disabled" />
        </app>
    </application-restrictions>
</device-policy>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedPolicy);
    setIsCopied(true);
    onAddLog(`Copied DPC Client configuration XML to clipboard.`, 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadXML = () => {
    onAddLog(`Downloading policy XML profile: ${profileName}...`, 'info');
    const blob = new Blob([generatedPolicy], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${profileName.toLowerCase().replace(/ /g, '_')}_policy.xml`);
    a.click();
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 overflow-y-auto h-full">
      {/* Parameters Panel */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-5 shadow-md h-fit">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38bdf8]" />
            Policy Workspace Builder
          </h2>
          <p className="text-[#94a3b8] text-xs mt-1">
            Build, test, and export Android Device Policy Controller (DPC) structures for student compliance.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          {/* Profile Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Profile Configuration Name
            </label>
            <input
              type="text"
              id="policy-profile-name"
              className="bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>

          {/* Secure Wi-Fi SSID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Enforced Classroom Wi-Fi SSID
            </label>
            <input
              type="text"
              id="policy-wifi-ssid"
              className="bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#38bdf8]"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
            />
          </div>

          <hr className="border-[#334155]/60 my-1" />

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            {/* Allow Camera Dial */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Enforce Camera Lockout</div>
                <div className="text-[10px] text-slate-400">Classroom camera sandbox isolation</div>
              </div>
              <input
                type="checkbox"
                id="toggle-camera"
                checked={!allowCamera}
                onChange={() => setAllowCamera(!allowCamera)}
                className="w-4 h-4 text-[#38bdf8] rounded border-slate-700 bg-slate-900 focus:ring-[#38bdf8]/50 cursor-pointer"
              />
            </div>

            {/* Block Sideloading */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Restrict App Sideloading</div>
                <div className="text-[10px] text-slate-400">Strictly forbid APK file manual launches</div>
              </div>
              <input
                type="checkbox"
                id="toggle-sideload"
                checked={!allowSideload}
                onChange={() => setAllowSideload(!allowSideload)}
                className="w-4 h-4 text-[#38bdf8] rounded border-slate-700 bg-slate-900 focus:ring-[#38bdf8]/50 cursor-pointer"
              />
            </div>

            {/* Password verification complexity */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Require Biometric Attestation</div>
                <div className="text-[10px] text-slate-400">Forces device PIN/Fingerprint secure boot</div>
              </div>
              <input
                type="checkbox"
                id="toggle-biometric"
                checked={requireBiometric}
                onChange={() => setRequireBiometric(!requireBiometric)}
                className="w-4 h-4 text-[#38bdf8] rounded border-slate-700 bg-slate-900 focus:ring-[#38bdf8]/50 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#334155] pt-4 mt-2 flex gap-2">
          <button
            onClick={handleDownloadXML}
            className="flex-1 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-slate-950 font-bold text-xs py-2 rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download XML</span>
          </button>
        </div>
      </div>

      {/* Code Editor Panel */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-lg overflow-hidden shadow-md flex flex-col h-[520px] lg:h-full">
        <div className="bg-slate-900 px-4 py-3 border-b border-[#334155] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-xs font-mono font-bold text-slate-300">DPC_POLICY_MANIFEST.XML</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="bg-slate-800 hover:bg-slate-700 text-[#cbd5e1] border border-slate-700 px-3 py-1.5 rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors font-semibold"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy XML</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-[#38bdf8] bg-[#020617] styles-scrollbar">
          <pre>{generatedPolicy}</pre>
        </div>

        <div className="p-3 bg-slate-900 border-t border-[#334155] text-[10px] text-slate-500 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          <span>Live evaluation updates automatically as parameters are adjusted on the left.</span>
        </div>
      </div>
    </div>
  );
}
