import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  RefreshCw,
  User,
  BookOpen,
  MapPin,
  Laptop,
  CheckCircle2,
  Users,
  LogOut,
  Sparkles,
  School,
  Database,
  ArrowRight,
  ShieldEllipsis,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { googleSignIn, logout, getAccessToken, initAuth } from '../classroomAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface ClassroomTabProps {
  onAddLog: (message: string, level?: 'info' | 'warn' | 'success' | 'error') => void;
  onSyncRosterToGrid: (students: any[], cohortName: string, department: string) => void;
}

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  courseState: string;
  alternateLink?: string;
}

interface ClassroomStudent {
  userId: string;
  profile: {
    name: {
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

export default function ClassroomTab({ onAddLog, onSyncRosterToGrid }: ClassroomTabProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Digital Provisioning States
  const [campusLocation, setCampusLocation] = useState('Main Campus - Hall A');
  const [cohortGrade, setCohortGrade] = useState('Grade 11');
  const [cohortSubject, setCohortSubject] = useState('Robotics & IoT');
  const [enforcedPolicy, setEnforcedPolicy] = useState('Standard Android Sandbox');
  const [isProvisioned, setIsProvisioned] = useState(false);

  // Sandbox Mode state if no classes found or API fails/permissions limited
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Load configuration from LocalStorage
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        onAddLog(`Classroom Database Connector: RESTORED session for ${currentUser.email}`, 'success');
        fetchCourses(accessToken);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        onAddLog(`Classroom Database Connector: AUTHORIZED successfully as ${result.user.email}`, 'success');
        fetchCourses(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Classroom Login Failed:', err);
      onAddLog(`OAUTH_ERROR: Authentication aborted or failed. ${err.message || ''}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setCourses([]);
      setStudents([]);
      setSelectedCourse(null);
      onAddLog('Classroom Database Connector: DISCONNECTED. Sessions cleared.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Fetch courses from Google Classroom API
  const fetchCourses = async (accessToken: string) => {
    setLoading(true);
    setIsSandboxMode(false);
    onAddLog('Requesting active Google Classroom courses...', 'info');
    try {
      const response = await fetch('https://classroom.googleapis.com/v1/courses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();

      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
        setSelectedCourse(data.courses[0]);
        fetchRoster(data.courses[0].id, accessToken);
        onAddLog(`Fetched ${data.courses.length} active courses from Google Classroom API!`, 'success');
      } else {
        onAddLog('No courses found on your Google Classroom account. Initializing EverySpark sandboxed demo catalogs.', 'warn');
        loadSandboxDemo();
      }
    } catch (error: any) {
      console.error('Error fetching Google Classroom courses:', error);
      onAddLog('Classroom API unreachable or insufficient workspace scopes. Loading EverySpark simulated sandbox catalog.', 'warn');
      loadSandboxDemo();
    } finally {
      setLoading(false);
    }
  };

  const loadSandboxDemo = () => {
    setIsSandboxMode(true);
    const mockCourses: ClassroomCourse[] = [
      { id: '101', name: 'AP Physics - Quantum Computing', section: 'Sec 4B', room: 'Main Lab 2', courseState: 'ACTIVE' },
      { id: '102', name: 'Grade 10 Robotics Core', section: 'Sec A', room: 'South Annex', courseState: 'ACTIVE' },
      { id: '103', name: 'Intro to Mobile Software Architecture', section: 'Sec 1C', room: 'Creative Studio', courseState: 'ACTIVE' },
      { id: '104', name: 'Digital Citizenship & Cybersecurity', section: 'Elective', room: 'Library', courseState: 'ACTIVE' }
    ];
    setCourses(mockCourses);
    setSelectedCourse(mockCourses[0]);
    loadSandboxStudents(mockCourses[0].id);
  };

  const fetchRoster = async (courseId: string, accessToken: string) => {
    setLoadingRoster(true);
    try {
      const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();

      if (data.students && data.students.length > 0) {
        setStudents(data.students);
        onAddLog(`Fetched Roster: Loaded ${data.students.length} students from classroom.`, 'success');
      } else {
        onAddLog('No students enrolled in this Google Classroom course. Loading simulated student roster.', 'info');
        loadSandboxStudents(courseId);
      }
    } catch (error) {
      console.error('Error fetching course roster:', error);
      loadSandboxStudents(courseId);
    } finally {
      setLoadingRoster(false);
    }
  };

  const loadSandboxStudents = (courseId: string) => {
    const mockStudents: { [key: string]: ClassroomStudent[] } = {
      '101': [
        { userId: 'STU-48281-AM', profile: { name: { fullName: 'Amelia Chen' }, emailAddress: 'a.chen@everyspark.edu', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop' } },
        { userId: 'STU-99283-MD', profile: { name: { fullName: 'Marcus Dubois' }, emailAddress: 'm.dubois@everyspark.edu' } },
        { userId: 'STU-18274-JK', profile: { name: { fullName: 'Jordan Kamau' }, emailAddress: 'j.kamau@everyspark.edu' } },
        { userId: 'STU-88492-SL', profile: { name: { fullName: 'Sarah Lin' }, emailAddress: 's.lin@everyspark.edu' } },
      ],
      '102': [
        { userId: 'STU-31215-TK', profile: { name: { fullName: 'Takahiro Kurihara' }, emailAddress: 't.kuri@everyspark.edu' } },
        { userId: 'STU-55421-EA', profile: { name: { fullName: 'Elena Al-Asad' }, emailAddress: 'e.asad@everyspark.edu' } },
      ],
      '103': [
        { userId: 'STU-99482-BR', profile: { name: { fullName: 'Brandon Russo' }, emailAddress: 'b.russo@everyspark.edu' } },
        { userId: 'STU-77291-VS', profile: { name: { fullName: 'Valerie Smith' }, emailAddress: 'v.smith@everyspark.edu' } },
      ]
    };
    const fetched = mockStudents[courseId] || [
      { userId: 'STU-10020-XX', profile: { name: { fullName: 'Demo Scholar A' }, emailAddress: 'demo.a@everyspark.edu' } },
      { userId: 'STU-10021-YY', profile: { name: { fullName: 'Demo Scholar B' }, emailAddress: 'demo.b@everyspark.edu' } },
    ];
    setStudents(fetched);
  };

  const handleSelectCourse = (course: ClassroomCourse) => {
    setSelectedCourse(course);
    setIsProvisioned(false);
    if (isSandboxMode) {
      loadSandboxStudents(course.id);
    } else if (token) {
      fetchRoster(course.id, token);
    }
  };

  const handleSubmitProvisioning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    // Build the Grid student list
    const mappedStudents = students.map(s => ({
      id: s.userId,
      name: s.profile.name.fullName,
      email: s.profile.emailAddress,
      campus: campusLocation,
      grade: cohortGrade,
      subject: cohortSubject,
      policy: enforcedPolicy,
    }));

    onSyncRosterToGrid(mappedStudents, selectedCourse.name, cohortSubject);
    setIsProvisioned(true);
    onAddLog(`PROVISIONED: Course [${selectedCourse.name}] successfully mapped. Enforced device policy: ${enforcedPolicy}. Registries imported.`, 'success');
  };

  const handleForceUpdateRoster = () => {
    if (!selectedCourse) return;
    if (isSandboxMode) {
      loadSandboxStudents(selectedCourse.id);
      onAddLog('Refreshed sandboxed course rosters.', 'info');
    } else if (token) {
      fetchRoster(selectedCourse.id, token);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 overflow-y-auto h-full bg-[#020617] styles-scrollbar">
      
      {/* Left Column: Course List and Connector */}
      <div className="flex flex-col gap-6">
        
        {/* Connection Bar */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#38bdf8]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#0284c7]/20 border border-[#0284c7]/40 rounded-xl text-[#38bdf8] shrink-0">
              <School className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                Google Classroom Database Connector
                {needsAuth ? (
                  <span className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Inactive
                  </span>
                ) : (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-[#34d399] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Connected
                  </span>
                )}
              </h2>
              <p className="text-[#94a3b8] text-[12px] mt-1.5 max-w-xl leading-relaxed">
                Connect active Google Classroom rosters with EverySpark GRID. Sync student lists, grades, and classes to automatically provision compliant device configuration policy files.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-stretch md:self-auto flex items-center mt-2 md:mt-0">
            {needsAuth ? (
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="gsi-material-button w-full shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper p-1">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-slate-100 font-semibold pl-2 py-1.5 text-xs">Sign in with Google</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full justify-between bg-[#0f172a] border border-[#334155] p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      AC
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-white text-[11px] font-bold truncate max-w-[140px]">
                      {user?.displayName || 'Google Instructor'}
                    </div>
                    <div className="text-[#64748b] text-[9px] truncate max-w-[140px]">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 px-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-[#ef4444] transition-colors cursor-pointer"
                  title="Disconnect Workspace Sync"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Courses List Section */}
        <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg flex flex-col gap-4 overflow-hidden min-h-[350px]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-[#38bdf8] w-4 h-4" />
                Classroom Academic Courses
              </h3>
              <p className="text-[#94a3b8] text-[11px] mt-0.5">
                Configure ecosystem deployments for selected active Google Classroom registries.
              </p>
            </div>
            {!needsAuth && (
              <button
                type="button"
                onClick={() => fetchCourses(token!)}
                disabled={loading}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-[#38bdf8] transition-colors cursor-pointer"
                title="Force reload API courses"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Sandbox alert */}
          {isSandboxMode && (
            <div className="bg-[#c2410c]/10 border border-[#c2410c]/30 text-[#f97316] p-3 rounded-lg text-[10.5px] leading-normal flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#f97316]" />
              <div>
                <span className="font-bold uppercase tracking-wider">Education Demo sandbox enabled:</span> Google Workspace API scopes are active, and authenticating above pulls actual cohorts if any exist on the account. Otherwise, simulated Google classroom databases are exposed below for quick modeling.
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 grid place-items-center text-xs text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8]" />
                <span>Interrogating classroom catalogs...</span>
              </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex-1 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 text-[#475569] mb-2" />
              <p className="text-xs font-semibold text-slate-300">Classroom Connector Inactive</p>
              <p className="text-[11px] text-[#64748b] mt-1 max-w-[280px]">
                Connect your Google Account above or sync simulated directories using the manual tools.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 styles-scrollbar">
              {courses.map((course) => {
                const isSelected = selectedCourse?.id === course.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`p-4 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'bg-[#334155]/60 border-[#38bdf8] shadow-md ring-1 ring-[#38bdf8]/30'
                        : 'bg-[#0f172a] border-[#334155] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-[12.5px] font-bold text-white line-clamp-2 leading-snug">
                          {course.name}
                        </div>
                        {isSelected && (
                          <span className="bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                        {course.section || 'General Cohort'} • {course.room || 'Virtual Space'}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-800/40 pt-2 shrink-0">
                      <span>ID: {course.id}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#38bdf8]" />
                        Sync Capable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: digital provisioner and database connector */}
      <div className="flex flex-col gap-6">
        
        {/* Provisioning mapping params */}
        {selectedCourse ? (
          <form
            onSubmit={handleSubmitProvisioning}
            className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg flex flex-col gap-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Database className="w-4 h-4 text-[#38bdf8]" />
                Ecosystem Provisioner
              </h3>
              <p className="text-[#94a3b8] text-[11px] mt-0.5">
                Map Classroom Course IDs directly to secure school organizational units (OUs).
              </p>
            </div>

            <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] flex flex-col gap-1.5 text-xs">
              <div className="text-[10px] text-indigo-400 font-bold uppercase">Classroom Connection Source</div>
              <div className="text-white font-bold leading-tight">{selectedCourse.name}</div>
              <div className="text-slate-400 text-[10px] font-mono select-all">
                API COURSE ID: {selectedCourse.id}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 mt-1">
              {/* Campus Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Campus Location / Facility Link
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <select
                    value={campusLocation}
                    onChange={(e) => setCampusLocation(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs pl-9 focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="Main Campus - Hall A">Main Campus - Hall A</option>
                    <option value="Research Wing - Lab B">Research Wing - Lab B</option>
                    <option value="South Annex - Bldg 2">South Annex - Bldg 2</option>
                    <option value="Virtual Online Academy">Virtual Online Academy</option>
                  </select>
                </div>
              </div>

              {/* Grade Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Academic Grade Level
                </label>
                <select
                  value={cohortGrade}
                  onChange={(e) => setCohortGrade(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
                >
                  <option value="Grade 9">Grade 9 (Freshman)</option>
                  <option value="Grade 10">Grade 10 (Sophomore)</option>
                  <option value="Grade 11">Grade 11 (Junior)</option>
                  <option value="Grade 12">Grade 12 (Senior)</option>
                  <option value="Graduate Research">Graduate Research</option>
                </select>
              </div>

              {/* Subject taxonomy classification */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Subject Taxonomy / Syllabus
                </label>
                <input
                  type="text"
                  required
                  value={cohortSubject}
                  onChange={(e) => setCohortSubject(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#38bdf8]"
                  placeholder="e.g. Physics, Advanced Math"
                />
              </div>

              {/* Associated local DPC policy */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Enforced Device Security Policy
                </label>
                <div className="relative">
                  <ShieldEllipsis className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <select
                    value={enforcedPolicy}
                    onChange={(e) => setEnforcedPolicy(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 rounded px-3 py-2 text-xs pl-9 focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="Standard Android Sandbox">Standard Android Sandbox</option>
                    <option value="Strict Exam Kiosk Lock">Strict Exam Kiosk Lock</option>
                    <option value="BYOD Restricted Sandbox">BYOD Restricted Sandbox</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[#334155] pt-4 mt-1">
              {isProvisioned ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] p-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                  <span>Cohort Registry Provisioned Successfully!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-slate-950 font-bold text-xs py-2.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Build Connector Tunnel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="bg-[#1e293b]/50 border border-[#334155] rounded-xl p-6 shadow-lg text-center text-slate-400">
            <ClassroomCourseSelectMessage />
          </div>
        )}

        {/* Selected Course Student Roster */}
        {selectedCourse && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg flex-1 flex flex-col gap-3 min-h-[280px]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full" />
                  Class Course Roster ({students.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleForceUpdateRoster}
                disabled={loadingRoster}
                className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRoster ? 'animate-spin' : ''}`} />
                Reload roster
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[220px] bg-[#0f172a] border border-[#334155] rounded-lg p-2 flex flex-col gap-1.5 styles-scrollbar">
              {loadingRoster ? (
                <div className="flex-1 grid place-items-center text-[11px] text-slate-400 py-6">
                  Fetching class rosters...
                </div>
              ) : students.length === 0 ? (
                <div className="flex-1 grid place-items-center text-[11px] text-slate-500 py-6 italic">
                  Roster is empty or unavailable.
                </div>
              ) : (
                students.map((student, idx) => (
                  <div
                    key={student.userId || idx}
                    className="flex items-center justify-between p-2 bg-[#1e293b]/40 rounded hover:bg-[#1e293b]/70 transition-colors border border-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5">
                      {student.profile.photoUrl ? (
                        <img
                          src={student.profile.photoUrl}
                          alt={student.profile.name.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                          {student.profile.name.fullName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-white text-xs font-semibold leading-tight">
                          {student.profile.name.fullName}
                        </div>
                        <div className="text-[10px] text-[#64748b] truncate max-w-[170px]">
                          {student.profile.emailAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded leading-none shrink-0">
                      ID: {student.userId.substring(0, 7)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassroomCourseSelectMessage() {
  return (
    <div className="flex flex-col items-center py-6 text-slate-400">
      <Sparkles className="w-8 h-8 text-[#475569] mb-2" />
      <p className="text-xs font-semibold text-slate-300">Choose Classroom Course</p>
      <p className="text-[10.5px] text-[#64748b] mt-1 max-w-[240px]">
        Select an academic cohort course catalog on the left to set up its secure ecosystem mapping constraints!
      </p>
    </div>
  );
}
