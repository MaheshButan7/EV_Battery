import React, { useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import { Download, FileBarChart, Mail, Play } from 'lucide-react';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';

const reports = ['Daily Operations Report', 'Weekly Report', 'Monthly Report', 'Annual Report', 'Equipment Availability Report', 'Battery Performance Report', 'Battery Ageing Report', 'Energy Report', 'Warranty Report', 'Alarm Report', 'Event Report', 'Failure Analysis Report', 'Maintenance Report', 'Asset Health Report', 'Executive Summary'];

function downloadReport(name, format) {
  const content = `BESS Command Center - ${name}\nGenerated: ${new Date().toISOString()}\n\nThis report contains synthetic client-demo data.`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.toLowerCase().replaceAll(' ', '-')}.${format === 'CSV' ? 'csv' : 'txt'}`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [selected, setSelected] = useState(reports[0]);
  const { selectedSite } = useDemoData();
  return (
    <PageFrame title="Reports" description="Preview, generate, export and schedule standard BESS operational reports.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><h2 className="mb-3 text-sm font-bold">Report library</h2><div className="space-y-1">{reports.map((report) => <button key={report} type="button" onClick={() => setSelected(report)} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selected === report ? 'bg-cyan-500/10 font-bold text-cyan-700 dark:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{report}</button>)}</div></div>
        <div className="surface-card rounded-2xl border bg-white p-6 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><FileBarChart className="h-6 w-6 text-cyan-500" /><h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{selected}</h2><p className="mt-1 text-xs text-slate-500">{selectedSite?.name || 'Selected site'} · September 2026</p></div><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Preview</span></div><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{[['Site', selectedSite?.name || '—'], ['Availability', `${selectedSite?.availability || '—'}%`], ['Open alarms', selectedSite?.activeAlarms || 0], ['Site SoH', `${selectedSite?.soh || '—'}%`]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold">{value}</p></div>)}</div><div className="mt-8 flex flex-wrap gap-2"><Button variant="primary" icon={Download} onClick={() => downloadReport(selected, 'CSV')}>Export CSV</Button><Button variant="secondary" icon={Download} onClick={() => downloadReport(selected, 'PDF')}>Export PDF</Button><Button variant="secondary" icon={Mail}>Schedule</Button><Button variant="secondary" icon={Play}>Generate preview</Button></div></div>
      </div>
    </PageFrame>
  );
}
