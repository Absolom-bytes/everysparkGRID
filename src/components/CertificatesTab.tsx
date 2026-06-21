import React, { useState } from 'react';
import { KeyRound, ShieldAlert, BadgePlus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { SecurityCert } from '../types';

interface CertificatesTabProps {
  certs: SecurityCert[];
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  setCertificates: React.Dispatch<React.SetStateAction<SecurityCert[]>>;
}

export default function CertificatesTab({ certs, onAddLog, setCertificates }: CertificatesTabProps) {
  const [certName, setCertName] = useState('');
  const [certType, setCertType] = useState('Client Cert');
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle generating a new certificate key pair
  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim()) {
      alert('Please enter a valid certificate Common Name!');
      return;
    }

    setIsGenerating(true);
    onAddLog(`Generating new certificate keypair: "${certName}"`, 'info');

    setTimeout(() => {
      const newCert: SecurityCert = {
        id: 'cert-' + Math.floor(1000 + Math.random() * 9000),
        name: certName,
        type: certType,
        issuer: 'EverySpark Root Authority CA',
        status: 'Valid',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      };

      setCertificates(prev => [...prev, newCert]);
      onAddLog(`Certificate fully generated & loaded into local keystore: ${newCert.name}`, 'success');
      setCertName('');
      setIsGenerating(false);
      alert(`Certificate created successfully!\nCommon Name: ${newCert.name}\nIssuer: ${newCert.issuer}`);
    }, 1200);
  };

  const handleRevokeCert = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke the certificate: "${name}"? This action cannot be undone.`)) {
      setCertificates(prev =>
        prev.map(c => (c.id === id ? { ...c, status: 'Revoked' as const } : c))
      );
      onAddLog(`REVOKED: Certificate "${name}" has been disabled and placed in the Certificate Revocation List (CRL).`, 'error');
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 overflow-y-auto h-full">
      {/* Keystore Catalog Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-4 shadow-md h-fit">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#38bdf8]" />
            Local Keystore Catalog
          </h2>
          <p className="text-[#94a3b8] text-xs">
            Certificates and public key rings configured for Device Policy attestation & WPA3 classroom networks.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#334155] bg-slate-900/50 text-[#94a3b8] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Common Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Issuer</th>
                <th className="py-3 px-3">Expiration</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {certs.map((cert) => {
                let badgeClass = '';
                if (cert.status === 'Valid') {
                  badgeClass = 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]';
                } else if (cert.status === 'Expired') {
                  badgeClass = 'bg-[#451a03] text-[#fdba74] border border-[#d97706]';
                } else {
                  badgeClass = 'bg-red-950 text-red-300 border border-red-700';
                }

                return (
                  <tr key={cert.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{cert.name}</td>
                    <td className="py-3 px-3 text-[#38bdf8] font-mono">{cert.type}</td>
                    <td className="py-3 px-3 text-slate-400">{cert.issuer}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{cert.expiresAt}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase inline-block min-w-[55px] ${badgeClass}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {cert.status === 'Valid' ? (
                        <button
                          onClick={() => handleRevokeCert(cert.id, cert.name)}
                          className="text-red-400 hover:underline cursor-pointer font-bold text-[10px]"
                          title="Revoke Certificate"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-slate-600 font-normal">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Keypair Generator Form */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 flex flex-col gap-5 shadow-md h-fit">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <BadgePlus className="w-4 h-4 text-emerald-400" />
            Generate Security Keypair
          </h2>
          <p className="text-slate-400 text-[11px] mt-1">
            Produce localized client credentials for device identities. Encrypted on generation using elliptic curve primes.
          </p>
        </div>

        <form onSubmit={handleGenerateCertificate} className="flex flex-col gap-3">
          {/* Common Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Certificate Common Name (CN)
            </label>
            <input
              type="text"
              id="cert-cn-input"
              required
              className="bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              placeholder="e.g. Mobile_Student_Attestation"
            />
          </div>

          {/* Certificate Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Certificate Purpose / Type
            </label>
            <select
              id="cert-type-select"
              className="bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs cursor-pointer focus:outline-none focus:border-[#38bdf8]"
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
            >
              <option value="Client Cert">Client Identity Certificate</option>
              <option value="Signing Key">Cryptographic Signing Private Key</option>
              <option value="WPA Enterprise">WPA Enterprise Attestation</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Cryptography...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Generate Credentials</span>
              </>
            )}
          </button>
        </form>

        <hr className="border-slate-700/60" />

        <div className="flex items-start gap-2 bg-[#0f172a] p-3 rounded border border-slate-700/60">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-semibold">Keystore Alert:</span> Local certificates are hosted in isolated memory blocks. Clear cache to purge keys permanently.
          </div>
        </div>
      </div>
    </div>
  );
}
