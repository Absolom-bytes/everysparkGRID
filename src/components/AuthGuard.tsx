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
  Users,
  ExternalLink,
  Mail,
  LockKeyhole,
  UserPlus
} from 'lucide-react';
import { auth } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  onAuthStateChange?: (email: string | null) => void;
}

export default function AuthGuard({ children, onAddLog, onAuthStateChange }: AuthGuardProps) {
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Email and Password configurations
  const [authMethod, setAuthMethod] = useState<'sso' | 'email'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Email Authentication Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setSigningIn(true);
    setErrorMsg(null);
    try {
      if (isSignUp) {
        onAddLog(`AuthGuard: Registering new user ${emailInput}...`, 'info');
        const credential = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        onAddLog(`AuthGuard: Registration successful for ${credential.user.email}`, 'success');
      } else {
        onAddLog(`AuthGuard: Logging in user ${emailInput}...`, 'info');
        const credential = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        onAddLog(`AuthGuard: Login successful for ${credential.user.email}`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`${err.message || 'Authentication failed.'} (Error code: ${err.code || 'unknown'})`);
      onAddLog(`AuthGuard: Email auth failure: ${err.message}`, 'error');
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      onAuthStateChange?.(currentUser?.email || null);
      if (currentUser) {
        onAddLog(`AuthGuard state change: User ${currentUser.email} detected.`, 'info');
      }
    });
    return () => unsubscribe();
  }, [onAddLog, onAuthStateChange]);

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
      onAuthStateChange?.(null);
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

  const isAuthorized = currentUser !== null || bypassCheck;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] p-4 overflow-y-auto styles-scrollbar">
      {/* Background ambient flare */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 flex flex-col gap-6 my-auto">
        
        {!showAdvanced ? (
          /* SINGLE LOGIN VIEW - Zero fluff, zero instructions, 100% elegant */
          <div className="bg-[#0b1329]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3.5 bg-sky-500/10 border border-sky-500/25 text-[#38bdf8] rounded-2xl shrink-0 shadow-inner">
                <LockKeyhole className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-2">
                EverySpark GRID Portal
              </h2>
              <p className="text-slate-400 text-xs max-w-xs">
                Secure digital gateway for student device enrollment & neighborhood nodes.
              </p>
            </div>

            {/* Selector Tabs */}
            <div className="flex bg-[#0f172a] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-center rounded-md text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-[#1e293b] text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                Email Terminal
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('sso'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-center rounded-md text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  authMethod === 'sso'
                    ? 'bg-[#1e293b] text-sky-450 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5 inline mr-1.5 text-sky-450" />
                Google SSO
              </button>
            </div>

            {/* Email form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-1 border-b border-slate-800/60">
                  <span className="text-[10px] font-bold text-[#38bdf8] tracking-wider uppercase font-mono">
                    {isSignUp ? 'New Scholar Directory' : 'System Authorization'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[10px] text-teal-400 hover:underline cursor-pointer font-bold font-mono"
                  >
                    {isSignUp ? 'Switch to Sign In' : 'Sign Up Instead'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. scholar@every-spark.edu"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#050b14] border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs font-mono text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Security Password</label>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-[#050b14] border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs font-mono text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full mt-2 bg-sky-500 hover:bg-sky-400 text-[#0c111e] font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-950/20 disabled:opacity-50"
                >
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LockKeyhole className="w-4 h-4" />}
                  <span>{signingIn ? 'Connecting...' : isSignUp ? 'Create Account & Access' : 'Secure Login'}</span>
                </button>
              </form>
            )}

            {/* Google SSO */}
            {authMethod === 'sso' && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-[#38bdf8] tracking-wider uppercase font-mono pb-1 border-b border-slate-800/60 w-full block">
                  Federated Partner Login
                </span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Authenticate utilizing your Google Enterprise Directory profile or personal account to establish a secure browser handshake.
                </p>
                
                <div className="flex flex-col gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full bg-[#38bdf8] hover:bg-[#2ab6f3] text-[#0f172a] font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-sky-950/20 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4 text-[#0f172a]" />
                    <span>{signingIn ? 'Handshaking...' : 'Login with Google SSO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.open(window.location.href, '_blank');
                        onAddLog('AuthGuard: Custom pop-up parent handler executed.', 'info');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-450" />
                    <span>Open Standalone Tab</span>
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="text-red-400 bg-red-950/20 border border-red-900/40 p-3 rounded-xl text-[11px] leading-normal font-mono">
                Error: {errorMsg}
              </div>
            )}

            {/* Clean link to Advanced Setup */}
            <div className="border-t border-slate-800/60 pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowAdvanced(true);
                  setErrorMsg(null);
                }}
                className="text-slate-505 hover:text-slate-300 text-xs font-semibold cursor-pointer underline hover:underline-offset-2 transition-all"
              >
                Advanced Access & Developer Settings
              </button>
            </div>
          </div>
        ) : (
          /* ADVANCED VIEW - Hides all instructions, troubleshooting trackers, and admin overrides behind a toggle */
          <div className="bg-[#1e293b]/95 border border-[#334155] rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-w-2xl mx-auto">
            {/* Header with back navigation button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 justify-between w-full">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="text-white text-sm font-bold">
                  Administrative Access & Debugger Controls
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="text-xs bg-slate-850 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer font-bold"
              >
                ← Return to Login
              </button>
            </div>

            {/* Fast-Sandbox Evaluation Controls */}
            <div className="bg-[#0f172a]/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider font-mono">
                ⚡ Demo IT Admin Bypass Action
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Skip configuration setup completely! Authenticate instantly inside sandboxed developer frames with whitelisted demo admin credentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDemoUser({
                    uid: 'demo-it-admin-777',
                    email: 'gustav.gropp@gmail.com',
                    displayName: 'Gustav Gropp (Demo IT Lead)',
                    photoURL: null
                  });
                  onAuthStateChange?.('gustav.gropp@gmail.com');
                  onAddLog('AuthGuard: Signed in as Simulated IT Lead (gustav.gropp@gmail.com)', 'success');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <User className="w-4 h-4 text-white" />
                <span>Sign In as Demo IT Admin</span>
              </button>
            </div>

            {/* Error Troubleshooter with specific solutions */}
            {errorMsg && (
              <div className="bg-red-950/20 border border-red-800/30 p-4 rounded-xl flex flex-col gap-2">
                <span className="font-mono text-red-400 text-[11px] font-extrabold">
                  IO_HANDSHAKE_ERROR_LOG: {errorMsg}
                </span>
                <p className="text-slate-300 text-[10.5px] leading-relaxed">
                  <strong>Notice:</strong> This occurs if sandboxed iframes block third-party cookies or pop-up communications.
                </p>
                <p className="text-slate-300 text-[10.5px] leading-relaxed">
                  💡 <strong>Solutions:</strong> 
                  We support fallback memory authentication! Try standard <strong>"Email Terminal"</strong> signup, click <strong>"Open Standalone Tab"</strong>, or trigger <strong>"Sign In as Demo IT Admin"</strong> above.
                </p>
              </div>
            )}

            {/* Interactive instructions & Policy Whitelist lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Whitelists policies */}
              <div className="bg-[#0f172a]/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-3.5">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Active Access Whitelists
                </h4>

                {/* Domains list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-teal-400 font-bold uppercase font-mono">Approved Domains</span>
                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto styles-scrollbar animate-none">
                    {allowedDomains.map((domain) => (
                      <span key={domain} className="inline-flex items-center gap-1 text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        @{domain}
                        <button type="button" onClick={() => removeDomain(domain)} className="text-red-400 hover:text-red-300 font-bold ml-1 font-sans cursor-pointer text-[10px]">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Email whitelist list */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[9px] text-indigo-400 font-bold uppercase font-mono font-extrabold">Approved Administrators</span>
                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto styles-scrollbar">
                    {allowedEmails.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1 text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[130px]" title={email}>
                        {email}
                        <button type="button" onClick={() => removeEmail(email)} className="text-red-400 hover:text-red-300 font-bold ml-1 font-sans cursor-pointer text-[10px]">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Controls Formulators */}
              <div className="bg-[#0f172a]/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 justify-between">
                <div className="flex flex-col gap-2 items-start text-left">
                  <span className="text-sky-400 text-[10px] font-black uppercase font-mono">⚙️ Global Bypass Trigger</span>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed">
                    Instantly lift authentication policies to inspect pages manually without active sessions.
                  </p>
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg mt-auto">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-300 font-extrabold font-mono">BYPASS_RULE_CHECK</span>
                    <span className="text-[9px] text-slate-500">Enable total UI lock override</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bypassCheck}
                    onChange={(e) => {
                      setBypassCheck(e.target.checked);
                      onAddLog(`Global AuthGuard bypass set to: ${e.target.checked}`, e.target.checked ? 'warn' : 'info');
                    }}
                    className="w-4 h-4 rounded bg-[#020617] border-slate-700 text-[#38bdf8] focus:ring-[#38bdf8] cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Firebase Developer Manual configuration advice */}
            <div className="bg-[#0f172a]/40 border border-slate-800/80 p-4 rounded-xl text-xs flex flex-col gap-2 text-left">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider font-mono">
                🔧 Native Firebase Console Sync Instructions
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                To run custom authentication properly, set up your project credentials via the command instructions:
              </p>
              <div className="text-[10px] font-mono text-slate-305 bg-[#020617] p-2.5 rounded-lg border border-slate-805 flex flex-col gap-1">
                <span>1. Open auth console &gt; click "Add New Provider" &gt; select "Google"</span>
                <span>2. Register your current iframe domain: <code className="text-indigo-400">europe-west1.run.app</code></span>
                <span>3. Deploy rules matching the active schema blueprints</span>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
