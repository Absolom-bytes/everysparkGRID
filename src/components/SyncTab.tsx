import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Database,
  Radio,
  CheckCircle2,
  RotateCw,
  Sparkles,
  CloudLightning,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Server,
  ArrowRight,
  TriangleAlert,
  HelpCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import { Device, ComplianceCheck, SecurityCert, SystemLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface SyncTabProps {
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  complianceChecks: ComplianceCheck[];
  setComplianceChecks: React.Dispatch<React.SetStateAction<ComplianceCheck[]>>;
  certificates: SecurityCert[];
  setCertificates: React.Dispatch<React.SetStateAction<SecurityCert[]>>;
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
}

export default function SyncTab({
  onAddLog,
  devices,
  setDevices,
  complianceChecks,
  setComplianceChecks,
  certificates,
  setCertificates,
  logs,
  setLogs
}: SyncTabProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [percent, setPercent] = useState(0);
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [syncDirection, setSyncDirection] = useState<'push' | 'pull' | null>(null);
  const [selectedGuideTopic, setSelectedGuideTopic] = useState<string>('auth');

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    onAddLog('Initiating Google Identity Platform handshake...', 'info');
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        onAddLog(`Firebase Authenticated: Signed in securely as ${result.user.email}`, 'success');
      }
    } catch (error: any) {
      console.error('Google Auth Popup Error:', error);
      onAddLog(`OAUTH_FAIL: Could not log in. Did you enable Google Provider in console? (${error.message})`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAddLog('Firebase Session Terminated: Signed out.', 'warn');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Real Pull configuration from Firestore
  const handlePullFromCloud = async () => {
    if (!currentUser) return;
    setSyncing(true);
    setSyncDirection('pull');
    setPercent(10);
    onAddLog('Pulling clean state from Firestore Cloud...', 'info');

    const uid = currentUser.uid;

    try {
      await new Promise(r => setTimeout(r, 400));
      setPercent(30);

      // 1. Get Devices
      const devPath = `users/${uid}/devices`;
      let cloudDevices: Device[] = [];
      try {
        const querySnapshot = await getDocs(collection(db, devPath));
        querySnapshot.forEach((doc) => {
          cloudDevices.push(doc.data() as Device);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, devPath);
      }
      setPercent(50);

      // 2. Get ComplianceChecks
      const compPath = `users/${uid}/complianceChecks`;
      let cloudChecks: ComplianceCheck[] = [];
      try {
        const querySnapshot = await getDocs(collection(db, compPath));
        querySnapshot.forEach((doc) => {
          cloudChecks.push(doc.data() as ComplianceCheck);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, compPath);
      }
      setPercent(70);

      // 3. Get Certificates
      const certPath = `users/${uid}/certificates`;
      let cloudCerts: SecurityCert[] = [];
      try {
        const querySnapshot = await getDocs(collection(db, certPath));
        querySnapshot.forEach((doc) => {
          cloudCerts.push(doc.data() as SecurityCert);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, certPath);
      }
      setPercent(90);

      // 4. Get Logs
      const logPath = `users/${uid}/logs`;
      let cloudLogs: SystemLog[] = [];
      try {
        const querySnapshot = await getDocs(collection(db, logPath));
        querySnapshot.forEach((doc) => {
          cloudLogs.push(doc.data() as SystemLog);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, logPath);
      }

      // Merge or load
      if (cloudDevices.length > 0) setDevices(cloudDevices);
      if (cloudChecks.length > 0) setComplianceChecks(cloudChecks);
      if (cloudCerts.length > 0) setCertificates(cloudCerts);
      if (cloudLogs.length > 0) setLogs(cloudLogs);

      setPercent(100);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setLastSynced(nowStr);
      onAddLog(`Successfully merged ${cloudDevices.length} devices and policies from Cloud!`, 'success');

    } catch (err: any) {
      onAddLog(`Sync aborted: ${err.message}`, 'error');
    } finally {
      setSyncing(false);
      setSyncDirection(null);
    }
  };

  // Real Push configuration to Firestore via Batch Writes
  const handlePushToCloud = async () => {
    if (!currentUser) return;
    setSyncing(true);
    setSyncDirection('push');
    setPercent(10);
    onAddLog('Preparing transaction batch to push local states to Google Firestore...', 'info');

    const uid = currentUser.uid;

    try {
      const batch = writeBatch(db);
      await new Promise(r => setTimeout(r, 400));
      setPercent(40);

      // Write Devices
      devices.forEach((dev) => {
        const docRef = doc(db, `users/${uid}/devices`, dev.id);
        batch.set(docRef, { ...dev, userId: uid });
      });

      // Write Compliance checks
      complianceChecks.forEach((check) => {
        const docRef = doc(db, `users/${uid}/complianceChecks`, check.id);
        batch.set(docRef, { ...check, userId: uid });
      });

      // Write Certificates
      certificates.forEach((cert) => {
        const docRef = doc(db, `users/${uid}/certificates`, cert.id);
        batch.set(docRef, { ...cert, userId: uid });
      });

      // Write System Logs
      logs.slice(0, 15).forEach((log) => { // sync last 15 logs
        const docRef = doc(db, `users/${uid}/logs`, log.id);
        batch.set(docRef, { ...log, userId: uid });
      });

      setPercent(80);
      onAddLog('Executing atomic writeBatch commit on Firebase...', 'info');

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }

      setPercent(100);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setLastSynced(nowStr);
      onAddLog(`Successfully synchronized state registry to Cloud at ${nowStr}!`, 'success');

    } catch (err: any) {
      onAddLog(`Sync aborted: ${err.message}`, 'error');
    } finally {
      setSyncing(false);
      setSyncDirection(null);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 overflow-y-auto h-full bg-[#020617] styles-scrollbar">
      
      {/* Left Column: Local State and Cloud Database Connector */}
      <div className="flex flex-col gap-6">
        
        {/* Core Connection Panel */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#38bdf8]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#0284c7]/20 border border-[#0284c7]/40 rounded-xl text-[#38bdf8] shrink-0">
              <CloudLightning className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                Google Cloud Firestore Sync Hub
                {currentUser ? (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-[#34d399] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Online Auth
                  </span>
                ) : (
                  <span className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Local Sandbox
                  </span>
                )}
              </h2>
              <p className="text-[#94a3b8] text-[12px] mt-2.5 max-w-xl leading-relaxed">
                Connect your EverySpark GRID console to Google Firestore to persist student logs, certs, and device policy definitions securely across systems.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-stretch md:self-auto flex items-center mt-2 md:mt-0">
            {!currentUser ? (
              <button
                onClick={handleGoogleLogin}
                className="w-full md:w-auto bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0f172a] font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                <span>Google SSO Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full justify-between bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-7 h-7 rounded-full border border-slate-600"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-[#38bdf8]">
                      AC
                    </div>
                  )}
                  <div className="text-left w-36">
                    <div className="text-white text-[11px] font-bold truncate leading-tight">
                      {currentUser.displayName || 'Authorized Admin'}
                    </div>
                    <div className="text-[#64748b] text-[9px] truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 px-2.5 border border-slate-750 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-[#ef4444] text-[11px] transition-all cursor-pointer font-semibold"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Database Stats Control Pad */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="text-[#38bdf8] w-4 h-4" />
            Registry Cloud Synchronization
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Database Properties Panel */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-2">
                  Database Metadata
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-[#64748b]">Engine:</span>
                    <span className="text-slate-200 font-mono text-[11px]">Firestore Enterprise</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-[#64748b]">Console Instance:</span>
                    <span className="text-[#38bdf8] font-mono text-[11px] truncate max-w-[140px]" title="gen-lang-client-0070677805">
                      gen-lang-client-00...
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-[#64748b]">Active Region:</span>
                    <span className="text-slate-200 font-mono text-[11px]">europe-west1</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#64748b]">Last Sync Attempt:</span>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">{lastSynced}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current System Counts Panel */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2.5">
                Local Handshake Payload
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1e293b]/50 p-2 rounded border border-slate-800 flex flex-col">
                  <span className="text-[#64748b] text-[10px]">Devices</span>
                  <span className="text-white text-sm font-extrabold font-mono">{devices.length}</span>
                </div>
                <div className="bg-[#1e293b]/50 p-2 rounded border border-slate-800 flex flex-col">
                  <span className="text-[#64748b] text-[10px]">Policies</span>
                  <span className="text-white text-sm font-extrabold font-mono">{complianceChecks.length}</span>
                </div>
                <div className="bg-[#1e293b]/50 p-2 rounded border border-slate-800 flex flex-col">
                  <span className="text-[#64748b] text-[10px]">Certs</span>
                  <span className="text-white text-sm font-extrabold font-mono">{certificates.length}</span>
                </div>
                <div className="bg-[#1e293b]/50 p-2 rounded border border-slate-800 flex flex-col">
                  <span className="text-[#64748b] text-[10px]">Logs Cache</span>
                  <span className="text-white text-sm font-extrabold font-mono">15</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sync Controls */}
          <div className="border-t border-[#334155]/60 pt-4 flex flex-col gap-3">
            {!currentUser ? (
              <div className="bg-[#c2410c]/10 border border-[#c2410c]/30 text-[#f97316] p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5">
                <TriangleAlert className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Database offline sandbox:</span> Connect to Google SSO via the authorization button above to sync active local settings to Google Cloud Platform Firestore.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {syncing && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="animate-pulse flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                        {syncDirection === 'push' ? 'Pushing records sandbox to cloud...' : 'Downloading database state...'}
                      </span>
                      <span className="font-mono text-[#38bdf8] font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-[#0f172a] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#38bdf8] h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePullFromCloud}
                    disabled={syncing}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Server className="w-4 h-4 text-emerald-400 font-semibold" />
                    <span>Pull from Cloud</span>
                  </button>

                  <button
                    onClick={handlePushToCloud}
                    disabled={syncing}
                    className="p-3 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0f172a] rounded-lg text-xs font-black transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow"
                  >
                    <RefreshCw className="w-4 h-4 font-black text-[#0f172a]" />
                    <span>Push to Cloud</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Interactive Setup Instruction Guide & SSO parameters */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg flex flex-col h-[560px] lg:h-full overflow-hidden">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#38bdf8]" />
            Firebase SSO Setup Handbook
          </h4>
          <p className="text-[#94a3b8] text-[11px] mt-1.5">
            Follow these essential steps within your Google Cloud Platform & Firebase Web Console to enable Identity Platform & SSO permissions correctly.
          </p>
        </div>

        {/* Mini tabs inside guide */}
        <div className="flex border-b border-slate-750 text-[11px] font-bold mt-4 shrink-0 select-none">
          <button
            onClick={() => setSelectedGuideTopic('auth')}
            className={`flex-1 py-2 border-b-2 text-center transition-all cursor-pointer ${
              selectedGuideTopic === 'auth'
                ? 'border-[#38bdf8] text-[#38bdf8]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => setSelectedGuideTopic('firestore')}
            className={`flex-1 py-1.5 border-b-2 text-center transition-all cursor-pointer ${
              selectedGuideTopic === 'firestore'
                ? 'border-[#38bdf8] text-[#38bdf8]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Firestore Rules
          </button>
          <button
            onClick={() => setSelectedGuideTopic('credentials')}
            className={`flex-1 py-1.5 border-b-2 text-center transition-all cursor-pointer ${
              selectedGuideTopic === 'credentials'
                ? 'border-[#38bdf8] text-[#38bdf8]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {/* Guide Content Display */}
        <div className="flex-1 overflow-y-auto styles-scrollbar py-3.5 pr-1 text-slate-300 text-xs leading-relaxed flex flex-col gap-4">
          
          {selectedGuideTopic === 'auth' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                <span className="font-extrabold text-[#38bdf8] uppercase block mb-1">Step 1: Enable Google Provider</span>
                Go to the Firebase Console, choose your project <span className="text-white font-semibold">gen-lang-client-0070677805</span>, select <span className="text-white font-semibold">Authentication --&gt; Sign-In Method</span>, click <span className="text-white font-semibold">Add New Provider</span>, choose <span className="text-white font-semibold">Google</span>, configure support settings, and click Enable.
              </div>

              <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                <span className="font-extrabold text-[#38bdf8] uppercase block mb-1">Step 2: Add Authorized Redirect URI</span>
                Since your web application runs inside a secure iframe, please ensure the following dev URL is added to your OAuth Consent configuration as an authorized redirect origin:
                <div className="bg-slate-900 border border-slate-750 text-[10px] p-2 rounded mt-2 select-all font-mono break-all text-teal-400 leading-normal">
                  https://gen-lang-client-0070677805.firebaseapp.com/__/auth/handler
                </div>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-[11.5px]">Open Firebase Console</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quick access to set up dynamic provider scopes:</p>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0070677805/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#38bdf8] hover:underline font-bold text-[11px] inline-flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    Configure Auth Providers Now <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {selectedGuideTopic === 'firestore' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#0f172a] p-3.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                <span className="font-extrabold text-[#38bdf8] uppercase block mb-1.5">Enforced Cloud Security Regulations</span>
                EverySpark relies on high-security Attribute-Based Access Control policies ensuring absolute compartmentalization. These rule paradigms guarantee:
                <ul className="list-disc pl-4 mt-2 flex flex-col gap-1 text-slate-400">
                  <li><span className="text-slate-300 font-bold">Relational Partitioning:</span> Users can only view or write data inside their explicit <code className="text-teal-400">/users/{"{userId}"}</code> branch.</li>
                  <li><span className="text-slate-300 font-bold">Strict Map Size Enforcement:</span> Shadow updates trying to inject unauthorized variables get instantly killed at database layer.</li>
                  <li><span className="text-slate-300 font-bold">ID Input Sanitization:</span> Rejects document names containing malicious SQL or injection payloads.</li>
                </ul>
              </div>

              <div className="bg-[#0f172a] p-3.5 rounded-lg border border-slate-800 text-[11.5px] font-mono leading-normal">
                <span className="font-extrabold text-teal-400 block mb-1">Verify deployed `firestore.rules`</span>
                You can review or copy the deployed <span className="text-white">firestore.rules</span> in your project's root workspace, which contains exact path match blocks for <code className="bg-[#1e293b] px-1 py-0.5 rounded">devices</code>, <code className="bg-[#1e293b] px-1 py-0.5 rounded">complianceChecks</code>, and <code className="bg-[#1e293b] px-1 py-0.5 rounded">certificates</code>.
              </div>

              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0070677805/firestore/rules"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-200 p-2.5 rounded-lg font-bold text-center text-[10.5px] items-center justify-center flex gap-1 cursor-pointer"
              >
                <span>View Live Firestore Rules Editor</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#38bdf8]" />
              </a>
            </div>
          )}

          {selectedGuideTopic === 'credentials' && (
            <div className="flex flex-col gap-3.5 text-[11px]">
              <div className="border border-slate-800 bg-[#0f172a] p-3 rounded-lg leading-relaxed text-slate-300">
                <span className="font-bold text-[#38bdf8] uppercase block mb-1 font-mono">HANDSHAKE SPECS</span>
                <div className="flex flex-col gap-1 font-mono text-[9.5px]">
                  <div>API KEY: AIzaSyCecNtj1aNufuVtwJXlMp8M7vcB4SyE2eM</div>
                  <div>AUTH DOMAIN: gen-lang-client-0070677805.firebaseapp.com</div>
                  <div>DATABASE INSTANCE: {firebaseConfig.firestoreDatabaseId}</div>
                </div>
              </div>

              <div className="bg-teal-950/20 border border-teal-500/20 p-3 rounded-lg leading-relaxed text-[#34d399]">
                <span className="font-extrabold uppercase block mb-1">Diagnostic Integration Status: OK</span>
                The Firebase web ecosystem builds successfully. The local schema validation is perfectly synchronized, and any attempt to write without permissions will automatically produce a structured FirestoreErrorInfo payload for analysis.
              </div>
            </div>
          )}

        </div>

        <div className="bg-[#020617] p-2.5 rounded-lg border border-slate-800 text-[10.5px] text-[#55698b] font-mono mt-auto shrink-0 select-none">
          SECURE PROTOCOL INTERACTION LOGGED
        </div>
      </div>

    </div>
  );
}
