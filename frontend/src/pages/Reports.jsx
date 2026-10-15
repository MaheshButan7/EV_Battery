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
    ['Data source', 'Synthetic frontend demo data', ''],
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
    'Synthetic frontend demo report',
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
  const [notice, setNotice] = useState('');
  const { selectedSite, alarms } = useDemoData();
  const activeAlarmCount = alarms.filter((alarm) => alarm.state === 'Active').length;
  const reportDate = new Date();
  const generatedLabel = reportDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const previewMetrics = [
    ['Site', selectedSite?.name || '—'],
    ['Availability', selectedSite ? `${selectedSite.availability}%` : '—'],
    ['Open alarms', activeAlarmCount],
    ['Site SoH', selectedSite ? `${selectedSite.soh}%` : '—'],
  ];

  const exportReport = (format) => {
    const generatedAt = new Date();
    const rows = createReportRows(selected, selectedSite, activeAlarmCount, generatedAt);
    const blob = format === 'CSV'
      ? csvBlob(selected, rows)
      : pdfBlob(selected, selectedSite, rows);
    downloadBlob(blob, filenameFor(selected, format.toLowerCase()));
    setNotice(`Downloaded synthetic ${format} report for ${selectedSite?.name || 'the selected site'}.`);
  };

  return (
    <PageFrame title="Reports" description="Preview, generate and export standard BESS operational reports using synthetic demo data.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">Report library</h2>
          <div className="space-y-1">{reports.map((report) => <button key={report} type="button" onClick={() => { setSelected(report); setNotice(''); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selected === report ? 'bg-cyan-500/10 font-bold text-cyan-700 dark:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{report}</button>)}</div>
        </div>
        <div className="surface-card rounded-2xl border bg-white p-6 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div><FileBarChart className="h-6 w-6 text-cyan-500" /><h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{selected}</h2><p className="mt-1 text-xs text-slate-500">{selectedSite?.name || 'Selected site'} · {generatedLabel}</p></div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Synthetic preview</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{previewMetrics.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold">{value}</p></div>)}</div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button variant="primary" icon={Download} onClick={() => exportReport('CSV')}>Export CSV</Button>
            <Button variant="secondary" icon={Download} onClick={() => exportReport('PDF')}>Export PDF</Button>
            <Button variant="secondary" icon={Mail} onClick={() => setNotice('Report scheduling is a production integration and is not sent by this frontend demo.')}>Schedule</Button>
            <Button variant="secondary" icon={Play} onClick={() => setNotice(`${selected} preview refreshed using synthetic demo data.`)}>Generate preview</Button>
          </div>
          {notice && <p role="status" className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-800 dark:text-cyan-200">{notice}</p>}
        </div>
      </div>
    </PageFrame>
  );
}
