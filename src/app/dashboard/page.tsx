'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Map as MapIcon, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  DollarSign, 
  Activity, 
  ChevronRight,
  Navigation,
  CloudSun,
  RefreshCcw,
  Zap,
  Briefcase,
  Users,
  CalendarDays
} from 'lucide-react';
import styles from './dashboard.module.css';
import CRMView from './components/CRMView';
import CalendarView from './components/CalendarView';
import GanttChart from './components/GanttChart';
import AccountingView from './components/AccountingView';

/**
 * MM Operations Hub: Premium Redesign
 * "State-of-the-Art" Command Center with Glassmorphism & High-End Aesthetics
 * Updated to use Vanilla CSS Modules for consistent styling.
 */
export default function Dashboard() {
  const [role] = useState<'OWNER' | 'EMPLOYEE' | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mm_role') as 'OWNER' | 'EMPLOYEE';
    }
    return null;
  });
  const [coreData, setCoreData] = useState<SystemCore | null>(null);
  const [opsData, setOpsData] = useState<Record<string, unknown> | null>(null);
  const [finData, setFinData] = useState<Record<string, unknown> | null>(null);
  const [sitesData, setSitesData] = useState<Record<string, unknown> | null>(null);
  const [fleetData, setFleetData] = useState<FleetData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'FLEET' | 'AGENTS' | 'ACCOUNTING' | 'CONFIG' | 'CUSTOMERS' | 'SCHEDULE'>('OVERVIEW');
  const [employeeId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mm_emp_id') || 'EMP-001';
    }
    return 'EMP-001';
  });

  useEffect(() => {
    // Redirect to login if no role found (Production Readiness)
    if (!role && typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    const fetchData = async () => {
      try {
        const [coreRes, opsRes, finRes, sitesRes, fleetRes] = await Promise.all([
          fetch('/api/site-manager/status'),
          fetch(`/api/operations/timeclock?employeeId=${employeeId}`),
          fetch('/api/accounting/stats'),
          fetch('/api/operations/sites'),
          fetch('/api/operations/fleet-status')
        ]);

        if (coreRes.ok) setCoreData(await coreRes.json());
        if (opsRes.ok) setOpsData(await opsRes.json());
        if (finRes.ok) setFinData(await finRes.json());
        if (sitesRes.ok) setSitesData(await sitesRes.json());
        if (fleetRes.ok) setFleetData(await fleetRes.json());
        
        setError(null);
        setLastUpdate(new Date());
      } catch {
        setError('Operations Link Interrupted');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    const clockInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [employeeId, role]);

  const handleClockAction = async (action: 'clockIn' | 'clockOut') => {
    const location = { lat: 34.4208, lng: -119.6982 }; 
    try {
      const res = await fetch('/api/operations/timeclock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, action, location })
      });
      const result = await res.json();
      if (result.success) {
        const opsRes = await fetch(`/api/operations/timeclock?employeeId=${employeeId}`);
        if (opsRes.ok) setOpsData(await opsRes.json());
      } else {
        alert(`System Alert: ${result.message}`);
      }
    } catch (err) {
      console.error('TimeClock Error', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  if (!coreData && !error) return <LoadingScreen />;

  interface AgentMetrics {
    totalCost: number;
    totalRequests: number;
    byProvider: Record<string, { requests: number; totalCost: number }>;
  }

  interface FinStats {
    revenueTotal: number;
    avgMargin: number;
    avgLaborBurden?: number;
    trends: Array<{ month: string; revenue: number }>;
  }

  interface FleetMember {
    employeeId: string;
    siteName: string;
    location: { lat: number; lng: number };
  }

  interface FleetData {
    activeFleet: FleetMember[];
  }

  interface PersonnelAlert {
    employeeId: string;
    type: string;
    message: string;
    severity: string;
    timestamp: Date;
  }

  interface SystemCore {
    agents: Array<{ name: string; healthy: boolean; details: Record<string, unknown> }>;
    personnelAlerts?: PersonnelAlert[];
    activeActivity?: Array<{ employeeId: string; activity: string; confidence: number; startTime: string }>;
    jobHistory?: Array<{ id: string; employeeId: string; siteId: string; date: string; activities: Array<{ task: string; durationMinutes: number }> }>;
    metrics: AgentMetrics;
    queueDepth: number;
    activeWorkers: number;
  }

  const metrics = (coreData?.metrics as AgentMetrics) || { totalCost: 0, totalRequests: 0, byProvider: {} };
  const finStats = (finData?.stats as FinStats) || { revenueTotal: 0, avgMargin: 0, trends: [] };
  const activeShift = opsData?.activeShift as { jobSiteId: string; startTime: string } | null;
  const sites = (sitesData?.sites as Array<{ id: string; name: string }>) || [];

  return (
    <div className={styles.dashboardContainer}>
      {/* Dynamic Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');
      `}</style>

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <Zap size={24} style={{ color: 'white' }} />
          </div>
          {isSidebarOpen && (
            <span className={styles.logoText}>
              MM<span className={styles.logoSuffix}>OPS.</span>
            </span>
          )}
        </div>

        <nav className={styles.nav}>
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={activeSection === 'OVERVIEW'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('OVERVIEW')}
          />
          <NavItem 
            icon={<MapIcon size={20} />} 
            label="Fleet Tracking" 
            active={activeSection === 'FLEET'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('FLEET')}
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="AI Agents" 
            active={activeSection === 'AGENTS'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('AGENTS')}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Customers" 
            active={activeSection === 'CUSTOMERS'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('CUSTOMERS')}
          />
          <NavItem 
            icon={<CalendarDays size={20} />} 
            label="Schedule" 
            active={activeSection === 'SCHEDULE'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('SCHEDULE')}
          />
          {role === 'OWNER' && (
            <NavItem 
              icon={<DollarSign size={20} />} 
              label="Accounting" 
              active={activeSection === 'ACCOUNTING'} 
              isOpen={isSidebarOpen} 
              onClick={() => setActiveSection('ACCOUNTING')}
            />
          )}
          <NavItem 
            icon={<Settings size={20} />} 
            label="System Config" 
            active={activeSection === 'CONFIG'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveSection('CONFIG')}
          />
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            onClick={() => {
              localStorage.removeItem('mm_role');
              localStorage.removeItem('mm_emp_id');
              window.location.href = '/login';
            }}
            className={styles.roleToggle}
          >
            <ShieldCheck size={18} style={{ color: role === 'OWNER' ? '#a78bfa' : '#34d399' }} />
            {isSidebarOpen && <span className={styles.roleText}>TERMINATE SESSION</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Large Overlays */}
        <div className={role === 'OWNER' ? styles.executiveIntelligenceLabel : styles.operationalDeploymentLabel}>
           {role === 'OWNER' ? 'EXECUTIVE INTELLIGENCE' : 'OPERATIONAL DEPLOYMENT'}
        </div>

        {/* Top Header */}
        <header className={styles.mainHeader}>
          <div className={styles.headerLeft}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={styles.sidebarToggle}>
              <ChevronRight style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </button>
            <div className={styles.headerInfo}>
              <h2 className={styles.headerSubtitle}>Central Coast Command Center</h2>
              <h1 className={styles.headerTitle}>
                {role === 'OWNER' ? 'EXECUTIVE INTELLIGENCE' : 'OPERATIONAL DEPLOYMENT'}
              </h1>
            </div>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.systemNode}>
              <span className={styles.nodeLabel}>System Node Alpha</span>
              <span className={styles.syncTime}>Sync: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <div className={styles.statusIcon}>
              <RefreshCcw size={16} className={styles.animateSpinSlow} />
            </div>
          </div>
        </header>

        <div className={styles.content}>
          
          {/* SECTION: OVERVIEW */}
          {activeSection === 'OVERVIEW' && (
            <div className={styles.animateIn}>
              {role === 'OWNER' ? (
                <section className={styles.statsGrid}>
                  <StatCard 
                    title="YTD Gross Revenue" 
                    value={formatCurrency(finStats.revenueTotal)} 
                    sub={`Avg Margin: ${finStats.avgMargin}%`} 
                    icon={<DollarSign style={{ color: '#a78bfa' }} />}
                    gradient="from-violet-500/20 to-indigo-500/20"
                  />
                  <StatCard 
                    title="AI Processing Depth" 
                    value={`${coreData?.queueDepth || 0} Req`} 
                    sub={`${coreData?.activeWorkers || 0} Agents Online`} 
                    icon={<Activity style={{ color: '#60a5fa' }} />}
                    gradient="from-blue-500/20 to-cyan-500/20"
                  />
                  <StatCard 
                    title="Avg Labor Burden" 
                    value="$45.00" 
                    sub="Geofence Validated" 
                    icon={<Clock style={{ color: '#34d399' }} />}
                    gradient="from-emerald-500/20 to-teal-500/20"
                  />
                  <StatCard 
                    title="Neural Network Cost" 
                    value={formatCurrency(metrics.totalCost)} 
                    sub={`${metrics.totalRequests} Inferences`} 
                    icon={<Cpu style={{ color: '#fb7185' }} />}
                    gradient="from-pink-500/20 to-rose-500/20"
                  />
                </section>
              ) : (
                <div className={styles.controlCenter}>
                  <div className={styles.controlBlur} />
                  <div className={`${styles.missionHeader} ${activeShift ? styles.missionHeaderActive : ''}`}>
                    <div className={styles.missionIconContainer}>
                      <Briefcase size={16} />
                    </div>
                    <h3 className={styles.missionTitle}>Mission Status</h3>
                  </div>
                  {activeShift ? (
                    <div className={styles.deploymentContent}>
                      <div className={styles.deploymentInfo}>
                        <div className={styles.deploymentLabel}>DEPLOYED AT SITE</div>
                        <div className={styles.deploymentValue}>{activeShift.jobSiteId}</div>
                        <div className={styles.deploymentStats}>
                           <div className={styles.deploymentStatItem}>
                             <div className={styles.deploymentStatLabel}>Start Time</div>
                             <div className={styles.deploymentStatValue}>{new Date(activeShift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                           </div>
                           <div className={styles.deploymentDivider} />
                           <div className={styles.deploymentStatItem}>
                             <div className={styles.deploymentStatLabel}>Elapsed</div>
                             <div className={styles.deploymentStatValue}>{Math.floor(((currentTime - new Date(activeShift.startTime).getTime()) / 60000))} Mins</div>
                           </div>
                        </div>
                      </div>
                      <button onClick={() => handleClockAction('clockOut')} className={`${styles.deploymentButton} ${styles.terminateButton}`}>TERMINATE DEPLOYMENT</button>
                    </div>
                  ) : (
                    <div className={styles.deploymentContent}>
                      <div className={styles.standbyContent}>
                        <div className={styles.standbyTitle}>STDBY</div>
                        <div className={styles.standbySub}>System Armed / Location Tracking</div>
                      </div>
                      <button onClick={() => handleClockAction('clockIn')} className={`${styles.deploymentButton} ${styles.initiateButton}`}>INITIATE SITE SYNC</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION: FLEET TRACKING */}
          {activeSection === 'FLEET' && (
            <div className={styles.animateIn}>
              <div className={styles.mapPanel}>
                <header className={styles.mapHeader}>
                  <div className={styles.mapHeaderLeft}>
                    <Navigation size={18} style={{ color: '#818cf8' }} />
                    <h3 className={styles.mapTitle}>Tactical Field Vectors</h3>
                  </div>
                  <span className={styles.liveBadge}>Live Stream</span>
                </header>
                <div className={styles.mapContent}>
                  <div className={styles.mapVisual}>
                    <div className={styles.mapImage} />
                    <div className={styles.mapOverlay}>
                      {fleetData?.activeFleet?.map((f: FleetMember) => (
                        <div key={f.employeeId} className={`${styles.mapMarker} ${styles.animateBounceSlow}`}>
                          <div className={styles.mapMarkerDot} style={{ backgroundColor: '#a78bfa' }} />
                          <div className={styles.mapMarkerLabel}>{f.employeeId}</div>
                        </div>
                      ))}
                      {!fleetData?.activeFleet?.length && (
                        <div className={`${styles.mapMarker} ${styles.animateBounceSlow}`}>
                           <div className={styles.mapMarkerDot} />
                        </div>
                      )}
                      <h4 className={styles.mapTargetTitle}>
                        {fleetData?.activeFleet?.[0]?.siteName || 'Santa Ynez Field HQ'}
                      </h4>
                      <p className={styles.mapTargetSub}>
                        {fleetData?.activeFleet?.[0] ? 'Active Deployment' : 'Geofence Verified (100m Radius)'}
                      </p>
                    </div>
                    <div className={styles.mapGPS}>
                      {fleetData?.activeFleet?.[0] 
                        ? `GPS-${fleetData.activeFleet[0].location.lat.toFixed(2)}-LN-${fleetData.activeFleet[0].location.lng.toFixed(2)}`
                        : 'GPS-34.42-LN-119.69'}
                    </div>
                  </div>
                  <div className={styles.mapSidebar}>
                      {/* Personnel Alerts Section */}
                      {coreData?.personnelAlerts && coreData.personnelAlerts.length > 0 && (
                        <div className={`${styles.infoBox} ${styles.alertBox}`}>
                          <h5 className={`${styles.infoLabel}`} style={{ color: '#fb7185' }}>SECURITY | PERSONNEL ALERT</h5>
                          <div className={styles.alertList}>
                             {coreData.personnelAlerts.map((alert, idx) => (
                               <div key={idx} className={styles.alertItem}>
                                 <div className={styles.alertDot} style={{ backgroundColor: alert.severity === 'high' ? '#ef4444' : '#f59e0b' }} />
                                 <div className={styles.alertText}>
                                   <div className={styles.alertTitle}>{alert.employeeId}: {alert.type}</div>
                                   <div className={styles.alertMsg}>{alert.message}</div>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.infoBox}>
                      <div className={styles.infoBox}>
                        <h5 className={`${styles.infoLabel} ${styles.logoSuffix}`}>Weather Ops Advisory</h5>
                        <div className={styles.infoContent}>
                          <CloudSun size={32} style={{ color: '#fbbf24' }} />
                          <div>
                            <div className={styles.infoMain}>72°F / 0% Precip</div>
                            <p className={styles.infoSub}>Conditions optimal for hardscape and turf prep.</p>
                          </div>
                        </div>
                      </div>

                      {/* Active Activity Tracking */}
                      {coreData?.activeActivity && coreData.activeActivity.length > 0 && (
                        <div className={`${styles.infoBox} ${styles.activityBox}`}>
                          <h5 className={`${styles.infoLabel}`} style={{ color: '#60a5fa' }}>ACTIVITY | INFERRED TASK</h5>
                          <div className={styles.alertList}>
                             {coreData.activeActivity.map((act, idx) => (
                               <div key={idx} className={styles.alertItem}>
                                 <div className={styles.alertDot} style={{ backgroundColor: '#3b82f6' }} />
                                 <div className={styles.alertText}>
                                   <div className={styles.alertTitle}>{act.employeeId}: {act.activity}</div>
                                   <div className={styles.alertMsg}>Pattern Match: {Math.round(act.confidence * 100)}% Confidence</div>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}

                      {/* Job History Highlights */}
                      {coreData?.jobHistory && coreData.jobHistory.length > 0 && (
                        <div className={`${styles.infoBox}`}>
                          <h5 className={`${styles.infoLabel}`} style={{ color: '#10b981' }}>JOB HISTORY | RECENT VECTORS</h5>
                          <div className={styles.historyGrid}>
                             {coreData.jobHistory.map((log, idx) => (
                               <div key={idx} className={styles.historyRow}>
                                 <div className={styles.historyName}>{log.employeeId} @ {log.siteId}</div>
                                 <div className={styles.historyDate}>{log.date}</div>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                        <div className={styles.infoContent}>
                          <CloudSun size={32} style={{ color: '#fbbf24' }} />
                          <div>
                            <div className={styles.infoMain}>72°F / 0% Precip</div>
                            <p className={styles.infoSub}>Conditions optimal for hardscape and turf prep.</p>
                          </div>
                        </div>
                     </div>
                      <div className={styles.infoBox}>
                        <h5 className={`${styles.infoLabel} ${styles.statusBadge.split(' ')[2]}`} style={{ color: '#34d399' }}>Field Logistics</h5>
                        <div className={styles.infoContent}>
                           <Zap size={32} style={{ color: 'white', filter: 'brightness(1.25)' }} />
                           <div style={{ width: '100%' }}>
                              <div className={styles.infoMain} style={{ fontSize: '0.875rem' }}>Active Teams: {fleetData?.activeFleet?.length || 0}</div>
                              {fleetData?.activeFleet?.map((f: FleetMember) => (
                                <div key={f.employeeId} style={{ fontSize: '0.7rem', opacity: 0.8, color: '#34d399', marginTop: '0.25rem' }}>
                                  • {f.employeeId} @ {f.siteName}
                                </div>
                              ))}
                              {!fleetData?.activeFleet?.length && <p className={styles.infoSub}>System standby: No active deployments.</p>}
                           </div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <GlassPanel title="Deployment Queue" subtitle="Scheduled Site Missions">
                  <div className={styles.queueGrid}>
                    {sites.length > 0 ? sites.map((s: { id: string; name: string }) => (
                      <div key={s.id} className={styles.queueCard}>
                        <div className={styles.queueCardHeader}>
                          <div className={styles.queueIconContainer}><Briefcase size={16} /></div>
                          <span className={styles.queueBadge}>Active Hub</span>
                        </div>
                        <h4 className={styles.queueTitle}>{s.name}</h4>
                        <p className={styles.queueSub}>Santa Ynez Multi-Property Site</p>
                        <div className={styles.queueFooter}>
                           <div className={styles.queueVector}>Vector: 34.42N</div>
                           <button 
                             className={styles.queueAction}
                             onClick={() => {
                               // Open Google Maps Directions in new tab
                               window.open(`https://www.google.com/maps/dir/?api=1&destination=34.4208,-119.6982`, '_blank');
                             }}
                           >
                             Start Directions
                           </button>
                        </div>
                      </div>
                    )) : (
                      <div className={styles.emptyQueue}>No pending site deployments scheduled.</div>
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          )}

          {/* SECTION: AI AGENTS */}
          {activeSection === 'AGENTS' && (
            <div className={styles.animateIn}>
              <GlassPanel title="Multi-Agent Execution Matrix" subtitle="Operational AI Team & Inference Infrastructure">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Left Column: Strategic Agents */}
                  <div className={styles.tableWrapper}>
                    <h4 className={styles.tableSubTitle}>STRATEGIC AGENT TEAM</h4>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.tableHeader}>
                          <th>Agent Vector</th>
                          <th>Status</th>
                          <th className={styles.textRight}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(coreData?.agents as Array<{ name: string; healthy: boolean; details: Record<string, unknown> }>)?.map((agent) => (
                          <tr key={agent.name} className={styles.tableRow}>
                            <td className={`${styles.tableCell} ${styles.agentName}`}>{agent.name}</td>
                            <td className={styles.tableCell}>
                              <span className={agent.healthy ? styles.statusBadge : styles.statusBadgeDown}>
                                {agent.healthy ? 'ACTIVE' : 'OFFLINE'}
                              </span>
                            </td>
                            <td className={`${styles.tableCell} ${styles.textRight}`} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                              {Object.keys(agent.details)[0] || 'Nominal'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Inference Providers */}
                  <div className={styles.tableWrapper}>
                    <h4 className={styles.tableSubTitle}>INFERENCE INFRASTRUCTURE</h4>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.tableHeader}>
                          <th>Compute Node</th>
                          <th>Health</th>
                          <th className={styles.textRight}>Throughput</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.byProvider && Object.entries(metrics.byProvider).map(([name, s]) => (
                          <tr key={name} className={styles.tableRow}>
                            <td className={`${styles.tableCell} ${styles.agentName}`}>{name}</td>
                            <td className={styles.tableCell}><span className={styles.statusBadge}>Online</span></td>
                            <td className={`${styles.tableCell} ${styles.textRight} ${styles.tabularNums}`}>{s.requests} REQS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

          {/* SECTION: ACCOUNTING */}
          {activeSection === 'ACCOUNTING' && role === 'OWNER' && (
            <div className={styles.animateIn}>
              <AccountingView />
            </div>
          )}

          {/* SECTION: SYSTEM CONFIG */}
          {activeSection === 'CONFIG' && (
            <div className={styles.animateIn}>
              <GlassPanel title="System Core Integrity" subtitle="Provider Health & Sync Status">
                <div className={styles.statusGrid}>
                  <StatusPulse label="QBO Connector" status="OPERATIONAL" color="indigo" />
                  <StatusPulse label="SAM 3 Vision" status="NOMINAL" color="blue" />
                  <StatusPulse label="Geofence Mesh" status="ARMED" color="emerald" />
                  <StatusPulse label="Neural Parser" status="OPTIMIZED" color="violet" />
                  <StatusPulse label="ArcGIS Stream" status="ACTIVE" color="cyan" />
                  <StatusPulse label="Cost Accounting" status="SYNCING" color="pink" />
                </div>
              </GlassPanel>
            </div>
          )}

          {/* SECTION: CUSTOMERS (CRM) */}
          {activeSection === 'CUSTOMERS' && (
            <div className={styles.animateIn}>
              <CRMView />
            </div>
          )}

          {/* SECTION: SCHEDULE (Calendar & Gantt) */}
          {activeSection === 'SCHEDULE' && (
            <div className={styles.animateIn}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <CalendarView />
                <GanttChart />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Sub-components for Premium Feel

function NavItem({ icon, label, active = false, isOpen, onClick }: { icon: React.ReactNode, label: string, active?: boolean, isOpen: boolean, onClick?: () => void }) {
  return (
    <div 
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
      onClick={onClick}
    >
      <div className={styles.navIcon}>{icon}</div>
      {isOpen && <span className={styles.navLabel}>{label}</span>}
      {active && isOpen && <div className={styles.activeIndicator} />}
    </div>
  );
}

function StatCard({ title, value, sub, icon, gradient }: { title: string, value: string, sub: string, icon: React.ReactNode, gradient: string }) {
  const gradientStyles: Record<string, { backgroundColor: string }> = {
    'from-violet-500/20 to-indigo-500/20': { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
    'from-blue-500/20 to-cyan-500/20': { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
    'from-emerald-500/20 to-teal-500/20': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
    'from-pink-500/20 to-rose-500/20': { backgroundColor: 'rgba(244, 63, 94, 0.2)' }
  };

  return (
    <div className={styles.statCard}>
      <div className={styles.statGradient} style={gradientStyles[gradient]} />
      <div className={styles.statContent}>
        <div className={styles.statHeader}>
          <span className={styles.statTitle}>{title}</span>
          <div className={styles.statIconContainer}>{icon}</div>
        </div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}

function GlassPanel({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className={styles.glassPanel}>
      <div className={styles.panelBlur} />
      <div className={styles.panelContent}>
        <div className={styles.panelHeaderInner}>
          <div>
            <h3 className={styles.panelTitle}>{title}</h3>
            <p className={styles.panelSubtitle}>{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusPulse({ label, status, color }: { label: string, status: string, color: 'indigo' | 'blue' | 'emerald' | 'violet' | 'cyan' | 'pink' }) {
  const colors = {
    indigo: '#818cf8',
    blue: '#60a5fa',
    emerald: '#34d399',
    violet: '#a78bfa',
    cyan: '#22d3ee',
    pink: '#fb7185'
  };

  return (
    <div className={styles.statusItem}>
       <span className={styles.statusLabel}>{label}</span>
       <div className={styles.statusValueContainer}>
         <span className={styles.statusValue} style={{ color: colors[color] }}>{status}</span>
         <div className={styles.statusPulseContainer}>
           <span className={styles.statusPulsePing} style={{ background: `linear-gradient(to top right, ${colors[color]}, #fff)` }}></span>
           <span className={styles.statusPulseDot} style={{ background: `linear-gradient(to top right, ${colors[color]}, #fff)` }}></span>
         </div>
       </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinnerContainer}>
        <div className={styles.loadingOuter}></div>
        <div className={styles.loadingInner}></div>
        <Zap className={styles.loadingZap} size={32} />
      </div>
      <div>
        <h2 className={styles.loadingText}>SYNCHRONIZING HUB...</h2>
        <div className={styles.loadingDots}>
          <div className={`${styles.loadingDot} ${styles.animatePulse}`} style={{ backgroundColor: '#6366f1', animationDelay: '-0.3s' }} />
          <div className={`${styles.loadingDot} ${styles.animatePulse}`} style={{ backgroundColor: '#8b5cf6', animationDelay: '-0.15s' }} />
          <div className={`${styles.loadingDot} ${styles.animatePulse}`} style={{ backgroundColor: '#22d3ee' }} />
        </div>
        <p className={styles.loadingLabel}>Establishing AI Vector Stream</p>
      </div>
    </div>
  );
}
