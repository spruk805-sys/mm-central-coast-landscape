'use client';

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import styles from './gantt.module.css';

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  status: string;
  customerId: string;
}

export default function GanttChart() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGanttData();
  }, []);

  const fetchGanttData = async () => {
    try {
      const res = await fetch('/api/crm/schedule?view=gantt');
      if (res.ok) {
        const data = await res.json();
        const parsed = data.tasks.map((t: GanttTask) => ({
          ...t,
          start: new Date(t.start),
          end: new Date(t.end)
        }));
        setTasks(parsed);
      }
    } catch (err) {
      console.error('Error fetching Gantt data', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  // Calculate range for the chart
  const now = new Date();
  const chartStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const chartEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0); // ~2 months
  const totalDays = Math.ceil((chartEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));

  const getBarPosition = (start: Date, end: Date) => {
    const startOffset = Math.max(0, (start.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  // Generate week markers
  const weeks: Date[] = [];
  for (let d = new Date(chartStart); d <= chartEnd; d.setDate(d.getDate() + 7)) {
    weeks.push(new Date(d));
  }

  if (loading) {
    return <div className={styles.loading}>Loading project timeline...</div>;
  }

  return (
    <div className={styles.ganttContainer}>
      <div className={styles.ganttHeader}>
        <BarChart3 size={18} />
        <span>Project Timeline</span>
      </div>

      <div className={styles.timeline}>
        <div className={styles.weekMarkers}>
          {weeks.map((week, idx) => (
            <div key={idx} className={styles.weekMarker}>
              {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>

        <div className={styles.tasksContainer}>
          {tasks.length === 0 ? (
            <div className={styles.noTasks}>No scheduled projects</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskLabel}>{task.name}</div>
                <div className={styles.taskBarContainer}>
                  <div 
                    className={styles.taskBar}
                    style={{
                      ...getBarPosition(task.start, task.end),
                      backgroundColor: getStatusColor(task.status)
                    }}
                    title={`${task.name} (${task.status})`}
                  >
                    <span className={styles.barLabel}>{task.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
