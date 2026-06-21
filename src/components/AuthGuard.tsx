import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  Key,
  Globe,
  UserCheck,
  Power,
  ChevronRight,
  User,
  AlertTriangle,
  Fingerprint,
  Users
} from 'lucide-react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
}

export default function AuthGuard({ children, onAddLog }: AuthGuardProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [demoUser, setDemoUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default allowed criteria for School IT Staff
  const [allowedDomains, setAllowedDomains] = useState<string[]>(['school.edu', 'every-spark.edu', 'gmail.com']);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([
    'gustav.gropp@gmail.com', // Active developer email from metadata
    'it-admin@everyspark.cc',
    'principal@school.edu'
  ]);

  // Track domains/emails input fields
  const [newDomain, setNewDomain] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Mode override for easy demonstration
  const [bypassCheck, setBypassCheck] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        onAddLog(`AuthGuard state change: User ${currentUser.email} detected.`, 'info');
      }
    });
    return () => unsubscribe();
  }, [onAddLog]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    onAddLog('AuthGuard: Requesting Google Identity handshake...', 'info');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        onAddLog(`AuthGuard: Authentication successful for ${result.user.email}`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`${err.message || 'Identity pop-up dismissed or blocked.'} (Error code: ${err.code || 'unknown'})`);
      onAddLog(`AuthGuard: Failure in Google SSO popup. (${err.message})`, 'error');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setDemoUser(null);
      await signOut(auth);
      onAddLog('AuthGuard: Session manually completed.', 'warn');
    } catch (err) {
      console.error(err);
    }
  };

  // Check authorization with either active Firebase user or locally simulated Demo IT Admin User
  const currentUser = user || demoUser;
  const isEmailAllowed = currentUser?.email ? allowedEmails.includes(currentUser.email.toLowerCase()) : false;
  const isDomainAllowed = currentUser?.email
    ? allowedDomains.some((domain) => {
        const emailParts = currentUser.email!.split('@');
        return emailParts.length > 1 && emailParts[1].toLowerCase() === domain.toLowerCase();
      })
    : false;

  const isAuthorized = (currentUser && (isEmailAllowed || isDomainAllowed)) || bypassCheck;

  // Handlers for managing lists
  const addDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim() && !allowedDomains.includes(newDomain.trim().toLowerCase())) {
      setAllowedDomains([...allowedDomains, newDomain.trim().toLowerCase()]);
      onAddLog(`AuthGuard: Whitelisted email domain *@${newDomain.trim().toLowerCase()}`, 'success');
      setNewDomain('');
    }
  };

  const addEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim() && !allowedEmails.includes(newEmail.trim().toLowerCase())) {
      setAllowedEmails([...allowedEmails, newEmail.trim().toLowerCase()]);
      onAddLog(`AuthGuard: Whitelisted direct email access for ${newEmail.trim().toLowerCase()}`, 'success');
      setNewEmail('');
    }
  };

  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
    onAddLog(`AuthGuard: Removed domain whitelist rule *@${domain}`, 'warn');
  };

  const removeEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter((e) => e !== email));
    onAddLog(`AuthGuard: Removed direct email whitelist rule ${email}`, 'warn');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] h-full bg-[#020617] text-[#94a3b8]">
        <div className="flex flex-col items-center gap-3">
          <Fingerprint className="w-12 h-12 text-[#38bdf8] animate-pulse" />
          <span className="text-sm font-bold tracking-widest text-[#38bdf8] uppercase animate-pulse">
            Verifying Terminal Handshake...
          </span>
        </div>
      </div>
    );
  }

  // Render original components when fully authenticated and authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#020617] styles-scrollbar p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Main Lock Screen Banner */}
        <div className="bg-[#1e293b] border border-red-500/30 rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl shrink-0 mt-1 md:mt-0">
                <Lock className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide">
                  SECURE PORTAL DETECTED
                </span>
                <h2 className="text-xl font-black text-white mt-2 tracking-tight">
                  EverySpark GRID Admin Console
                </h2>
                <p className="text-[#94a3b8] text-xs leading-relaxed max-w-xl mt-1.5">
                  Access to the central node registration, compliance audit scans, cryptographic certificate panels, and school databases is restricted exclusively to authorized IT staff.
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 self-stretch md:self-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!currentUser ? (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0f172a] font-black text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Key className="w-4 h-4 text-[#0f172a]" />
                    <span>{signingIn ? 'Handshaking...' : 'Google SSO Sign In'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setDemoUser({
                        uid: 'demo-it-admin-777',
                        email: 'gustav.gropp@gmail.com', // directly whitelisted developer email
                        displayName: 'Gustav Gropp (Demo IT Lead)',
                        photoURL: null
                      });
                      onAddLog('AuthGuard: Signed in as Simulated IT Lead (gustav.gropp@gmail.com)', 'success');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <User className="w-4 h-4 text-white" />
                    <span>Sign In as Demo IT Admin</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2.5 bg-[#0f172a] border border-[#334155] p-3 rounded-xl w-full justify-between">
                  <div className="flex items-center gap-2.5">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-8 h-8 rounded-full border border-slate-750" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-[#38bdf8]">
                        {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'DM'}
                      </div>
                    )}
                    <div>
                      <div className="text-white text-xs font-bold max-w-[140px] truncate leading-none mb-1">
                        {currentUser.displayName || 'Authorized Admin'}
                      </div>
                      <div className="text-emerald-450 text-[9px] font-mono font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {isEmailAllowed || isDomainAllowed ? 'WHITELISTED_ROLE' : 'ROLE_PENDING'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 px-2 bg-slate-805 hover:bg-red-950/40 border border-slate-750 text-slate-400 hover:text-red-400 rounded-md text-[10.5px] cursor-pointer transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 bg-red-950/20 border border-red-500/20 p-4 rounded-lg flex flex-col gap-2">
              <span className="font-mono text-red-400 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                GOOGLE_SSO_INITIALIZATION_ERROR: {errorMsg}
              </span>
              <p className="text-slate-300 text-[10.5px] leading-relaxed">
                If you encounter a <code className="bg-red-950/40 text-red-300 px-1 py-0.5 rounded">auth/internal-error</code> context, this is due to Chrome/Safari running inside the secure AI Studio iframe, or if Google Identity Platform login is not yet enabled on your Firebase project. Check the <strong className="text-white">SSO Troubleshooting Guide</strong> below to configure it in 2 minutes! In the meantime, click <strong className="text-emerald-400">Sign In as Demo IT Admin</strong> above to instantly test the full dashboard without setup!
              </p>
            </div>
          )}
        </div>

        {/* Informative Rationale Section / Control Gate */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
          
          {/* Identity Analysis Screen & Troubleshooting Guide */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-white text-sm font-bold flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Administrative Gate Rationale & Setup Instructions
            </h3>

            {currentUser ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[#0f172a] p-4 rounded-lg border border-red-500/20 text-xs flex flex-col gap-2.5">
                  <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest font-mono">
                    Token Analysis Result
                  </span>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-[#64748b]">Authenticated ID:</span>
                    <span className="text-slate-300 font-mono text-[10px] truncate max-w-[180px]" title={currentUser.uid}>
                      {currentUser.uid}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-[#64748b]">Email Endpoint:</span>
                    <span className="text-white font-mono text-[11px] font-bold">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748b]">Authorization Outcome:</span>
                    <span className={isEmailAllowed || isDomainAllowed ? "text-emerald-400 font-bold uppercase tracking-wider" : "text-red-400 font-bold uppercase tracking-wider"}>
                      {isEmailAllowed || isDomainAllowed ? "AUTHORIZED IT STAFF" : "REJECTED BY DIRECTORY RULE"}
                    </span>
                  </div>
                  <p className="text-[#64748b] text-[10.5px] mt-2 leading-relaxed">
                    Verified profile: <span className="font-semibold text-slate-300">{currentUser.email}</span>. Status matches rules defined in the Access Policy matrix.
                  </p>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-lg flex flex-col gap-2.5">
                  <span className="text-[10.5px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono block">
                    Developer & Testing Toolkit
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Are you evaluating the app or trying to sign in as a developer? You can bypass the restriction by Whitelisting your email, adding your domain on the right panel, or activating the Override toggle below.
                  </p>
                  <div className="flex flex-wrap gap-2.5 mt-1 border-t border-emerald-800/30 pt-3 items-center justify-between">
                    <button
                      onClick={() => {
                        if (currentUser?.email && !allowedEmails.includes(currentUser.email.toLowerCase())) {
                          setAllowedEmails([...allowedEmails, currentUser.email.toLowerCase()]);
                          onAddLog(`AuthGuard Override: Whitelisted currently signed-in user ${currentUser.email}`, 'success');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#10b981] hover:bg-[#10b981]/85 text-[#064e3b] font-black text-[11px] rounded transition-all cursor-pointer shadow-sm"
                    >
                      Bypass: Add My Email
                    </button>

                    <button
                      onClick={() => {
                        setBypassCheck(true);
                        onAddLog('AuthGuard Bypass activated for active session.', 'warn');
                      }}
                      className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0284c7]/85 text-[#0f172a] font-black text-[11px] rounded transition-all cursor-pointer shadow-sm"
                    >
                      Bypass Entirely (Override tab)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs mt-1">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                  <span className="text-sky-400 font-black text-xs uppercase tracking-wider font-mono">
                    🔧 Fast Sandbox Setup Instructions
                  </span>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    By default, Google SSO Popup might fail inside the secure AI Studio iframe unless configured specifically.
                  </p>
                  <div className="flex flex-col gap-1.5 text-slate-300 text-[10.5px] font-mono bg-[#0f172a] p-3 rounded-lg border border-slate-800">
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">Step 1:</span>
                      <span>Go to <strong className="text-white">Authentication &gt; Sign-In Method</strong> in Firebase Console.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">Step 2:</span>
                      <span>Click <strong className="text-white">Add New Provider</strong> and activate <strong className="text-white">Google</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">Step 3:</span>
                      <span>Under Authorized Domains, register your AI Studio link: <code className="text-indigo-300">europe-west1.run.app</code>.</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 bg-[#0f172a] p-3 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-[10.5px] text-[#94a3b8] leading-normal">
                    <span className="font-bold text-white block">Offline Sandbox Backup</span>
                    If you prefer not to configure Firebase credentials, just click the <strong className="text-emerald-400">Sign In as Demo IT Admin</strong> button above for instant evaluation.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Whitelisted Attributes Configuration Center */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl flex flex-col gap-4 h-full">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#38bdf8]" />
                Authorized Access Policies
              </h4>
              <p className="text-[#64748b] text-[10px] mt-1">
                Customize parameters dynamically to evaluate SSO outcomes.
              </p>
            </div>

            {/* Domains Setup */}
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 flex flex-col gap-2 shrink-0">
              <span className="text-[9.5px] text-teal-400 font-bold block uppercase tracking-wide">
                1. Whitelisted School Domains
              </span>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto styles-scrollbar py-0.5">
                {allowedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 text-[9.5px] font-mono bg-[#1e293b] border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                  >
                    @{domain}
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="text-red-400 hover:text-red-300 font-bold ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={addDomain} className="flex gap-1.5 mt-1 border-t border-slate-800/80 pt-2 shrink-0">
                <input
                  type="text"
                  placeholder="e.g. mit.edu"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="bg-[#1e293b] border border-slate-800 rounded px-2 py-1 text-[10.5px] font-mono text-white flex-1 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  className="bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Direct Emails whitelists */}
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 flex flex-col gap-2 shrink-0">
              <span className="text-[9.5px] text-indigo-400 font-bold block uppercase tracking-wide">
                2. Whitelisted Specific Staff Emails
              </span>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto styles-scrollbar py-0.5">
                {allowedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 text-[9.5px] font-mono bg-[#1e293b] border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[170px]"
                    title={email}
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-red-400 hover:text-red-300 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={addEmail} className="flex gap-1.5 mt-1 border-t border-slate-800/80 pt-2 shrink-0">
                <input
                  type="email"
                  placeholder="e.g. staff@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-[#1e293b] border border-slate-800 rounded px-2 py-1 text-[10.5px] font-mono text-white flex-1 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  className="bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Simulated offline authentication pathway for test suite or presentation */}
            <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#64748b] font-bold">BYPASS SECURITY GUARD</span>
                <span className="text-[9px] text-[#475569]">Demonstration audit override</span>
              </div>
              <input
                type="checkbox"
                checked={bypassCheck}
                onChange={(e) => {
                  setBypassCheck(e.target.checked);
                  onAddLog(`Global AuthGuard bypass set to: ${e.target.checked}`, e.target.checked ? 'warn' : 'info');
                }}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-[#38bdf8] focus:ring-[#38bdf8] cursor-pointer"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
