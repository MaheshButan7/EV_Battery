import React, { useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import { Download, FileBarChart, Mail, Play } from 'lucide-react';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';

const reports = ['Daily Operations Report', 'Weekly Report', 'Monthly Report', 'Annual Report', 'Equipment Availability Report', 'Battery Performance Report', 'Battery Ageing Report', 'Energy Report', 'Warranty Report', 'Alarm Report', 'Event Report', 'Failure Analysis Report', 'Maintenance Report', 'Asset Health Report', 'Executive Summary'];

function quoteCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function createReportRows(name, site, activeAlarmCount, generatedAt) {
  return [
    ['Report', name, ''],
    ['Generated at', generatedAt.toISOString(), ''],
    ['Data source', 'Frontend demo dataset', ''],
    ['Site', site?.name || 'No site selected', ''],
    ['Site ID', site?.id || '', ''],
    ['Location', site?.location || '', ''],
    ['Operating state', site?.status || '', ''],
    ['Communications', site?.commsStatus || '', ''],
    ['Installed power', site?.capacityMW ?? '', 'MW'],
    ['Energy capacity', site?.capacityMWh ?? '', 'MWh'],
    ['State of charge', site?.soc ?? '', '%'],
    ['State of health', site?.soh ?? '', '%'],
    ['Availability', site?.availability ?? '', '%'],
    ['Active alarms', activeAlarmCount, ''],
    ['Risk level', site?.riskLevel || '', ''],
    ['OEM', site?.oem || '', ''],
  ];
}

function csvBlob(name, rows) {
  const body = [
    ['Report', 'Generated At', 'Site', 'Metric', 'Value', 'Unit'].map(quoteCsv).join(','),
    ...rows.slice(1).map(([metric, value, unit]) => [name, rows[1][1], rows[3][1], metric, value, unit].map(quoteCsv).join(',')),
  ].join('\r\n');
  return new Blob([`\uFEFF${body}\r\n`], { type: 'text/csv;charset=utf-8' });
}

function excelBlob(rows) {
  const html = `<table><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
}

function pdfSafe(value) {
  return String(value ?? '')
    .replaceAll('°C', ' deg C')
    .replaceAll('·', '-')
    .replaceAll('–', '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function escapePdfText(value) {
  return pdfSafe(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function wrapText(value, maxLength = 88) {
  const words = pdfSafe(value).split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function pdfBlob(name, site, rows) {
  const detailLines = rows.slice(1).map(([metric, value, unit]) => `${metric}: ${value}${unit ? ` ${unit}` : ''}`);
  const textLines = [
    'BESS COMMAND CENTER',
    name,
    `Site: ${site?.name || 'No site selected'} (${site?.id || 'N/A'})`,
    'Operational report',
    ...detailLines,
  ].flatMap((line) => wrapText(line));

  let stream = '';
  textLines.forEach((line, index) => {
    const y = 750 - index * 23;
    const fontSize = index < 2 ? (index === 0 ? 10 : 18) : 11;
    const color = index === 0 ? '0.05 0.55 0.68 rg' : '0.12 0.17 0.24 rg';
    stream += `BT ${color} /F1 ${fontSize} Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET\n`;
  });

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filenameFor(name, extension) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}.${extension}`;
}

export default function Reports() {
  const [selected, setSelected] = useState(reports[0]);
  const [reportCatalog, setReportCatalog] = useState(reports);
  const [notice, setNotice] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState({ frequency: 'Weekly', time: '09:00', recipients: 'operations@demo.local', format: 'PDF' });
  const [schedules, setSchedules] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMetrics, setCustomMetrics] = useState(['Installed power', 'Energy capacity', 'State of charge', 'State of health', 'Availability', 'Active alarms']);
  const [templateMetrics, setTemplateMetrics] = useState({});
  const { selectedSite, accessibleSites, accessibleAlarms } = useDemoData();
  const [reportSiteId, setReportSiteId] = useState(() => selectedSite?.id || '');
  const [period, setPeriod] = useState('Last 30 days');
  const reportSite = reportSiteId ? accessibleSites.find((site) => site.id === reportSiteId) || null : null;
  const activeAlarmCount = accessibleAlarms.filter((alarm) => alarm.state === 'Active' && (!reportSiteId || alarm.siteId === reportSiteId)).length;
  const reportDate = new Date();
  const generatedLabel = reportDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const previewMetrics = [
    ['Site', reportSite?.name || '—'],
    ['Reporting period', period],
    ['Availability', reportSite ? `${reportSite.availability}%` : '—'],
    ['Open alarms', activeAlarmCount],
    ['Site SoH', reportSite ? `${reportSite.soh}%` : '—'],
  ];

  const exportReport = (format) => {
    const generatedAt = new Date();
    const allRows = createReportRows(selected, reportSite, activeAlarmCount, generatedAt);
    const selectedMetrics = templateMetrics[selected];
    const rows = selectedMetrics ? allRows.filter((row, index) => index < 8 || selectedMetrics.includes(row[0])) : allRows;
    const blob = format === 'CSV'
      ? csvBlob(selected, rows)
      : format === 'Excel'
        ? excelBlob(rows)
        : pdfBlob(selected, reportSite, rows);
    downloadBlob(blob, filenameFor(selected, format.toLowerCase()));
    setNotice(`Downloaded ${format} report for ${reportSite?.name || 'the selected site'}.`);
  };

  const saveSchedule = (event) => {
    event.preventDefault();
    const entry = { ...schedule, report: selected, site: reportSite?.name || 'Fleet', id: `SCH-${Date.now()}`, status: 'Scheduled' };
    setSchedules((current) => [entry, ...current]);
    setScheduleOpen(false);
    setNotice(`${selected} schedule saved for ${entry.site}. Delivery is simulated in this frontend demo.`);
  };
  const addCustomReport = (event) => {
    event.preventDefault();
    const name = customName.trim();
    if (!name) return;
    setReportCatalog((current) => [...current, name]);
    setTemplateMetrics((current) => ({ ...current, [name]: customMetrics }));
    setSelected(name);
    setCustomName('');
    setCustomMetrics(['Installed power', 'Energy capacity', 'State of charge', 'State of health', 'Availability', 'Active alarms']);
    setCustomOpen(false);
    setNotice(`Custom report template “${name}” added to this demo library.`);
  };

  return (
    <PageFrame title="Reports" description="Preview, generate, and export standard BESS operational reports.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">Report library</h2>
          <div className="space-y-1">{reportCatalog.map((report) => <button key={report} type="button" onClick={() => { setSelected(report); setNotice(''); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selected === report ? 'bg-cyan-500/10 font-bold text-cyan-700 dark:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{report}</button>)}</div>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => setCustomOpen((open) => !open)}>Create custom template</Button>
          {customOpen && <form onSubmit={addCustomReport} className="mt-3 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><input required value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Template name" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700" /><fieldset className="space-y-2"><legend className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Include metrics</legend>{['Installed power', 'Energy capacity', 'State of charge', 'State of health', 'Availability', 'Active alarms', 'Risk level', 'OEM'].map((metric) => <label key={metric} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={customMetrics.includes(metric)} onChange={() => setCustomMetrics((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric])} className="accent-cyan-600" />{metric}</label>)}</fieldset><Button type="submit" size="sm" variant="primary">Save template</Button></form>}
        </div>
        <div className="surface-card rounded-2xl border bg-white p-6 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div><FileBarChart className="h-6 w-6 text-cyan-500" /><h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{selected}</h2><p className="mt-1 text-xs text-slate-500">{reportSite?.name || 'Selected site'} · {period} · {generatedLabel}</p></div>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-300">Preview</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Site scope<select value={reportSiteId} onChange={(event) => setReportSiteId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option value="">Fleet</option>{accessibleSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Period<select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Quarter to date', 'Year to date', 'Custom'].map((option) => <option key={option}>{option}</option>)}</select></label></div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{previewMetrics.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold">{value}</p></div>)}</div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button variant="primary" icon={Download} onClick={() => exportReport('CSV')}>Export CSV</Button>
            <Button variant="secondary" icon={Download} onClick={() => exportReport('Excel')}>Export Excel</Button>
            <Button variant="secondary" icon={Download} onClick={() => exportReport('PDF')}>Export PDF</Button>
            <Button variant="secondary" icon={Mail} onClick={() => setScheduleOpen((current) => !current)}>Schedule</Button>
            <Button variant="secondary" icon={Play} onClick={() => setNotice(`${selected} preview refreshed.`)}>Generate preview</Button>
          </div>
          {notice && <p role="status" className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-800 dark:text-cyan-200">{notice}</p>}
          {scheduleOpen && <form className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800" onSubmit={saveSchedule}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Schedule report</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Frequency<select value={schedule.frequency} onChange={(event) => setSchedule((current) => ({ ...current, frequency: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Time<input type="time" value={schedule.time} onChange={(event) => setSchedule((current) => ({ ...current, time: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Recipients<input type="text" required value={schedule.recipients} onChange={(event) => setSchedule((current) => ({ ...current, recipients: event.target.value }))} placeholder="Separate multiple recipients with commas" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Format<select value={schedule.format} onChange={(event) => setSchedule((current) => ({ ...current, format: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option>PDF</option><option>CSV</option><option>Excel</option></select></label>
            </div>
            <Button className="mt-4" size="sm" variant="primary" type="submit">Save schedule</Button>
          </form>}
        </div>
      </div>
      {schedules.length > 0 && <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-sm font-bold">Saved report schedules</h2><div className="mt-3 space-y-2">{schedules.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"><span className="font-semibold">{item.report} · {item.site}</span><span className="text-slate-500">{item.frequency} at {item.time} · {item.format} · {item.recipients}</span><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{item.status}</span></div>)}</div></section>}
    </PageFrame>
  );
}
