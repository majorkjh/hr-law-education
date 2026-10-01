import './index.css';
import { DocumentData, CeremonyRow } from './types';
import {
  loadDocumentData,
  saveDocumentData,
  getDefaultDocumentData,
  getEmptyDocumentData,
  generateDefaultCeremonyRows,
} from './utils/storage';
import { generateHwpx, parseHwpx } from './utils/hwpx';

// Global State
let docData: DocumentData = loadDocumentData();
let activeMobileTab: 'form' | 'preview' = 'form';
let zoomLevel = 100;
let isDarkMode = false;

// Initialize Theme
function initTheme() {
  const savedTheme = localStorage.getItem('epost_theme');
  if (savedTheme === 'dark') {
    isDarkMode = true;
  } else if (savedTheme === 'light') {
    isDarkMode = false;
  } else {
    isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme();
}

function applyTheme() {
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeButtonUI();
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('epost_theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
}

function updateThemeButtonUI() {
  const btn = document.getElementById('btn-toggle-theme');
  if (!btn) return;
  if (isDarkMode) {
    btn.innerHTML = `
      <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <span class="sr-only sm:not-sr-only text-[11px] font-medium text-slate-300">라이트 모드</span>
    `;
    btn.setAttribute('title', '라이트 모드로 전환');
  } else {
    btn.innerHTML = `
      <svg class="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <span class="sr-only sm:not-sr-only text-[11px] font-medium text-slate-600">다크 모드</span>
    `;
    btn.setAttribute('title', '다크 모드로 전환');
  }
}

// Root element
const app = document.getElementById('app')!;

function showToast(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    info: 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700',
    success: 'bg-emerald-800 dark:bg-emerald-900 text-white border border-emerald-700',
    warn: 'bg-amber-800 dark:bg-amber-900 text-white border border-amber-700',
    error: 'bg-red-800 dark:bg-red-900 text-white border border-red-700',
  };

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgColors[type]}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function updateSectionStatusIndicators() {
  const check0 = Boolean(docData.title.trim());
  const check1 = Boolean(docData.purpose.trim());
  const ov = docData.overview;
  const check2 = Boolean(
    ov.eventName.trim() || ov.dateTime.trim() || ov.location.trim() ||
    ov.target.trim() || ov.awardeeCount.trim() || ov.attendeeCount.trim() ||
    ov.host.trim() || ov.extra.trim()
  );
  const check3 = Boolean(docData.details.trim());
  const check4 = docData.ceremonyRows.some(r => r.time.trim() || r.content.trim() || r.remarks.trim());
  const check5 = Boolean(docData.futurePlans.trim());

  const setStatus = (id: string, active: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (active) {
      el.className = 'w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/80 text-[#D2232A] dark:text-red-400 flex items-center justify-center text-xs font-bold border border-red-300 dark:border-red-800';
      el.innerHTML = '✓';
    } else {
      el.className = 'w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center text-xs';
      el.innerHTML = '·';
    }
  };

  setStatus('status-sec-0', check0);
  setStatus('status-sec-1', check1);
  setStatus('status-sec-2', check2);
  setStatus('status-sec-3', check3);
  setStatus('status-sec-4', check4);
  setStatus('status-sec-5', check5);
}

function renderCeremonyRowsInput() {
  const container = document.getElementById('ceremony-rows-container');
  if (!container) return;

  container.innerHTML = '';

  docData.ceremonyRows.forEach((row, index) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-md border border-slate-200 dark:border-slate-700';
    rowEl.dataset.id = row.id;

    rowEl.innerHTML = `
      <div class="w-7 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">${index + 1}</div>
      <input type="text" class="row-time w-28 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded focus:border-red-600 focus:outline-none" placeholder="14:00~14:05" value="${escapeHtml(row.time)}">
      <input type="text" class="row-content flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded focus:border-red-600 focus:outline-none" placeholder="식순 내용" value="${escapeHtml(row.content)}">
      <input type="text" class="row-remarks w-28 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded focus:border-red-600 focus:outline-none" placeholder="사회자 등" value="${escapeHtml(row.remarks)}">
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" class="btn-move-up p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="위로 이동" ${index === 0 ? 'disabled' : ''}>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        <button type="button" class="btn-move-down p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="아래로 이동" ${index === docData.ceremonyRows.length - 1 ? 'disabled' : ''}>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button type="button" class="btn-del-row p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/40" title="행 삭제">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    const timeInput = rowEl.querySelector('.row-time') as HTMLInputElement;
    const contentInput = rowEl.querySelector('.row-content') as HTMLInputElement;
    const remarksInput = rowEl.querySelector('.row-remarks') as HTMLInputElement;

    timeInput.addEventListener('input', () => {
      row.time = timeInput.value;
      saveDocumentData(docData);
      renderPreview();
    });
    contentInput.addEventListener('input', () => {
      row.content = contentInput.value;
      saveDocumentData(docData);
      renderPreview();
    });
    remarksInput.addEventListener('input', () => {
      row.remarks = remarksInput.value;
      saveDocumentData(docData);
      renderPreview();
    });

    rowEl.querySelector('.btn-move-up')?.addEventListener('click', () => {
      if (index > 0) {
        const temp = docData.ceremonyRows[index];
        docData.ceremonyRows[index] = docData.ceremonyRows[index - 1];
        docData.ceremonyRows[index - 1] = temp;
        saveDocumentData(docData);
        renderCeremonyRowsInput();
        renderPreview();
      }
    });

    rowEl.querySelector('.btn-move-down')?.addEventListener('click', () => {
      if (index < docData.ceremonyRows.length - 1) {
        const temp = docData.ceremonyRows[index];
        docData.ceremonyRows[index] = docData.ceremonyRows[index + 1];
        docData.ceremonyRows[index + 1] = temp;
        saveDocumentData(docData);
        renderCeremonyRowsInput();
        renderPreview();
      }
    });

    rowEl.querySelector('.btn-del-row')?.addEventListener('click', () => {
      docData.ceremonyRows.splice(index, 1);
      saveDocumentData(docData);
      renderCeremonyRowsInput();
      renderPreview();
      updateSectionStatusIndicators();
    });

    container.appendChild(rowEl);
  });
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPreview() {
  const paper = document.getElementById('a4-paper');
  if (!paper) return;

  const title = docData.title.trim() || '우체국 문화전 수상자 시상식 계획';

  // Section 1: 목적
  const hasPurpose = Boolean(docData.purpose.trim());
  let purposeHtml = '';
  if (hasPurpose) {
    const lines = docData.purpose.split('\n').map(l => l.trim()).filter(Boolean);
    const itemLines = lines.map(line => {
      const isSub = line.startsWith('-');
      const clean = line.replace(/^[○•\-\*\s]+/, '').trim();
      return isSub
        ? `<div class="doc-subitem-indent leading-relaxed text-sm">- ${escapeHtml(clean)}</div>`
        : `<div class="doc-item-indent leading-relaxed text-sm font-normal">○ ${escapeHtml(clean)}</div>`;
    }).join('');
    purposeHtml = `
      <div class="mb-6">
        <h2 class="text-base font-bold mb-2">1. 목적</h2>
        <div class="space-y-1">${itemLines}</div>
      </div>
    `;
  } else {
    purposeHtml = `
      <div class="mb-6 empty-section-guide">
        <h2 class="text-base font-bold text-slate-400 mb-1">1. 목적</h2>
        <p class="text-xs text-slate-400 italic bg-slate-50 p-2 border border-dashed border-slate-200 rounded">[1. 목적 내용이 비어 있습니다. 작성 시 반영됩니다]</p>
      </div>
    `;
  }

  // Section 2: 개요
  const ov = docData.overview;
  const hasOverview = Boolean(
    ov.eventName.trim() || ov.dateTime.trim() || ov.location.trim() ||
    ov.target.trim() || ov.awardeeCount.trim() || ov.attendeeCount.trim() ||
    ov.host.trim() || ov.extra.trim()
  );

  let overviewHtml = '';
  if (hasOverview) {
    const fields: Array<{ label: string; value: string }> = [
      { label: '행사명', value: ov.eventName },
      { label: '일시', value: ov.dateTime },
      { label: '장소', value: ov.location },
      { label: '대상', value: ov.target },
      { label: '수상 인원', value: ov.awardeeCount },
      { label: '참석 예정', value: ov.attendeeCount },
      { label: '주최 · 주관', value: ov.host },
    ];

    const ovLines = fields
      .filter(f => f.value && f.value.trim())
      .map(f => `<div class="doc-item-indent leading-relaxed text-sm font-normal">○ ${escapeHtml(f.label)} : ${escapeHtml(f.value.trim())}</div>`);

    if (ov.extra && ov.extra.trim()) {
      const extraLines = ov.extra.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of extraLines) {
        const isSub = line.startsWith('-');
        const clean = line.replace(/^[○•\-\*\s]+/, '').trim();
        ovLines.push(
          isSub
            ? `<div class="doc-subitem-indent leading-relaxed text-sm">- ${escapeHtml(clean)}</div>`
            : `<div class="doc-item-indent leading-relaxed text-sm font-normal">○ ${escapeHtml(clean)}</div>`
        );
      }
    }

    overviewHtml = `
      <div class="mb-6">
        <h2 class="text-base font-bold mb-2">2. 개요</h2>
        <div class="space-y-1">${ovLines.join('')}</div>
      </div>
    `;
  } else {
    overviewHtml = `
      <div class="mb-6 empty-section-guide">
        <h2 class="text-base font-bold text-slate-400 mb-1">2. 개요</h2>
        <p class="text-xs text-slate-400 italic bg-slate-50 p-2 border border-dashed border-slate-200 rounded">[2. 개요 내용이 비어 있습니다. 작성 시 반영됩니다]</p>
      </div>
    `;
  }

  // Section 3: 세부내용
  const hasDetails = Boolean(docData.details.trim());
  let detailsHtml = '';
  if (hasDetails) {
    const lines = docData.details.split('\n').map(l => l.trim()).filter(Boolean);
    const itemLines = lines.map(line => {
      const isSub = line.startsWith('-');
      const clean = line.replace(/^[○•\-\*\s]+/, '').trim();
      return isSub
        ? `<div class="doc-subitem-indent leading-relaxed text-sm">- ${escapeHtml(clean)}</div>`
        : `<div class="doc-item-indent leading-relaxed text-sm font-normal">○ ${escapeHtml(clean)}</div>`;
    }).join('');
    detailsHtml = `
      <div class="mb-6">
        <h2 class="text-base font-bold mb-2">3. 세부내용</h2>
        <div class="space-y-1">${itemLines}</div>
      </div>
    `;
  } else {
    detailsHtml = `
      <div class="mb-6 empty-section-guide">
        <h2 class="text-base font-bold text-slate-400 mb-1">3. 세부내용</h2>
        <p class="text-xs text-slate-400 italic bg-slate-50 p-2 border border-dashed border-slate-200 rounded">[3. 세부내용이 비어 있습니다. 작성 시 반영됩니다]</p>
      </div>
    `;
  }

  // Section 4: 시상식 순서
  const validRows = docData.ceremonyRows.filter(r => r.time.trim() || r.content.trim() || r.remarks.trim());
  let ceremonyHtml = '';
  if (validRows.length > 0) {
    const tableRows = validRows.map(r => `
      <tr class="border-b border-slate-300">
        <td class="py-2 px-3 text-center text-xs border-r border-slate-300 whitespace-nowrap font-medium">${escapeHtml(r.time)}</td>
        <td class="py-2 px-3 text-left text-xs border-r border-slate-300">${escapeHtml(r.content)}</td>
        <td class="py-2 px-3 text-center text-xs whitespace-nowrap">${escapeHtml(r.remarks)}</td>
      </tr>
    `).join('');

    ceremonyHtml = `
      <div class="mb-6">
        <h2 class="text-base font-bold mb-2">4. 시상식 순서</h2>
        <table class="w-full border-collapse border border-slate-400 text-left">
          <thead>
            <tr class="bg-slate-200 border-b border-slate-400">
              <th class="py-2 px-3 text-center text-xs font-bold border-r border-slate-400 w-[20%]">시 간</th>
              <th class="py-2 px-3 text-center text-xs font-bold border-r border-slate-400 w-[55%]">내 용</th>
              <th class="py-2 px-3 text-center text-xs font-bold w-[25%]">담당 · 비고</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  } else {
    ceremonyHtml = `
      <div class="mb-6 empty-section-guide">
        <h2 class="text-base font-bold text-slate-400 mb-1">4. 시상식 순서</h2>
        <p class="text-xs text-slate-400 italic bg-slate-50 p-2 border border-dashed border-slate-200 rounded">[4. 시상식 순서가 비어 있습니다. '기본 식순 넣기'를 눌러보세요]</p>
      </div>
    `;
  }

  // Section 5: 향후 계획
  const hasFuture = Boolean(docData.futurePlans.trim());
  let futureHtml = '';
  if (hasFuture) {
    const lines = docData.futurePlans.split('\n').map(l => l.trim()).filter(Boolean);
    const itemLines = lines.map(line => {
      const isSub = line.startsWith('-');
      const clean = line.replace(/^[○•\-\*\s]+/, '').trim();
      return isSub
        ? `<div class="doc-subitem-indent leading-relaxed text-sm">- ${escapeHtml(clean)}</div>`
        : `<div class="doc-item-indent leading-relaxed text-sm font-normal">○ ${escapeHtml(clean)}</div>`;
    }).join('');
    futureHtml = `
      <div class="mb-4">
        <h2 class="text-base font-bold mb-2">5. 향후 계획</h2>
        <div class="space-y-1">${itemLines}</div>
      </div>
    `;
  } else {
    futureHtml = `
      <div class="mb-4 empty-section-guide">
        <h2 class="text-base font-bold text-slate-400 mb-1">5. 향후 계획</h2>
        <p class="text-xs text-slate-400 italic bg-slate-50 p-2 border border-dashed border-slate-200 rounded">[5. 향후 계획 내용이 비어 있습니다. 작성 시 반영됩니다]</p>
      </div>
    `;
  }

  paper.innerHTML = `
    <!-- Document Title -->
    <div class="text-center pt-2 pb-8">
      <h1 class="text-2xl font-bold tracking-tight inline-block border-b-2 border-slate-900 pb-1.5 px-4">${escapeHtml(title)}</h1>
    </div>

    <!-- Document Body Sections -->
    <div class="doc-body font-doc">
      ${purposeHtml}
      ${overviewHtml}
      ${detailsHtml}
      ${ceremonyHtml}
      ${futureHtml}
    </div>
  `;
}

function handleCopyContent() {
  const lines: string[] = [];
  lines.push(docData.title.trim() || '우체국 문화전 수상자 시상식 계획');
  lines.push('');

  if (docData.purpose.trim()) {
    lines.push('1. 목적');
    for (const l of docData.purpose.split('\n').map(x => x.trim()).filter(Boolean)) {
      const isSub = l.startsWith('-');
      const clean = l.replace(/^[○•\-\*\s]+/, '').trim();
      lines.push(isSub ? `  - ${clean}` : `○ ${clean}`);
    }
    lines.push('');
  }

  const ov = docData.overview;
  const hasOverview = ov.eventName.trim() || ov.dateTime.trim() || ov.location.trim() ||
    ov.target.trim() || ov.awardeeCount.trim() || ov.attendeeCount.trim() ||
    ov.host.trim() || ov.extra.trim();

  if (hasOverview) {
    lines.push('2. 개요');
    if (ov.eventName.trim()) lines.push(`○ 행사명 : ${ov.eventName.trim()}`);
    if (ov.dateTime.trim()) lines.push(`○ 일시 : ${ov.dateTime.trim()}`);
    if (ov.location.trim()) lines.push(`○ 장소 : ${ov.location.trim()}`);
    if (ov.target.trim()) lines.push(`○ 대상 : ${ov.target.trim()}`);
    if (ov.awardeeCount.trim()) lines.push(`○ 수상 인원 : ${ov.awardeeCount.trim()}`);
    if (ov.attendeeCount.trim()) lines.push(`○ 참석 예정 : ${ov.attendeeCount.trim()}`);
    if (ov.host.trim()) lines.push(`○ 주최 · 주관 : ${ov.host.trim()}`);
    if (ov.extra.trim()) {
      for (const l of ov.extra.split('\n').map(x => x.trim()).filter(Boolean)) {
        const isSub = l.startsWith('-');
        const clean = l.replace(/^[○•\-\*\s]+/, '').trim();
        lines.push(isSub ? `  - ${clean}` : `○ ${clean}`);
      }
    }
    lines.push('');
  }

  if (docData.details.trim()) {
    lines.push('3. 세부내용');
    for (const l of docData.details.split('\n').map(x => x.trim()).filter(Boolean)) {
      const isSub = l.startsWith('-');
      const clean = l.replace(/^[○•\-\*\s]+/, '').trim();
      lines.push(isSub ? `  - ${clean}` : `○ ${clean}`);
    }
    lines.push('');
  }

  const validRows = docData.ceremonyRows.filter(r => r.time.trim() || r.content.trim() || r.remarks.trim());
  if (validRows.length > 0) {
    lines.push('4. 시상식 순서');
    lines.push('시간\t내용\t담당·비고');
    for (const r of validRows) {
      lines.push(`${r.time}\t${r.content}\t${r.remarks}`);
    }
    lines.push('');
  }

  if (docData.futurePlans.trim()) {
    lines.push('5. 향후 계획');
    for (const l of docData.futurePlans.split('\n').map(x => x.trim()).filter(Boolean)) {
      const isSub = l.startsWith('-');
      const clean = l.replace(/^[○•\-\*\s]+/, '').trim();
      lines.push(isSub ? `  - ${clean}` : `○ ${clean}`);
    }
  }

  const textToCopy = lines.join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showToast('내용을 클립보드에 복사했습니다. 한글(HWP) 등에 붙여넣기(Ctrl+V) 하세요.', 'success');
      })
      .catch(() => {
        fallbackCopy(textToCopy);
      });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('내용을 클립보드에 복사했습니다. 한글(HWP)에 붙여넣기(Ctrl+V) 하세요.', 'success');
  } catch (err) {
    showToast('복사에 실패했습니다. 권한을 확인해 주세요.', 'error');
  }
  document.body.removeChild(ta);
}

function handleExportPdf() {
  showToast("인쇄 창에서 'PDF로 저장'을 선택해 주세요.", 'info');
  setTimeout(() => {
    window.print();
  }, 300);
}

function handleExportHwpx() {
  try {
    const hwpxBytes = generateHwpx(docData);
    const blob = new Blob([hwpxBytes as unknown as BlobPart], { type: 'application/hwp+zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${docData.title.trim() || '우체국 문화전 수상자 시상식 계획'}.hwpx`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('HWPX 파일을 저장했습니다. 한글에서 열어 확인해 주세요.', 'success');
  } catch (err) {
    console.error('HWPX export error:', err);
    showToast('HWPX 파일 생성 중 오류가 발생했습니다.', 'error');
  }
}

async function handleImportHwpx(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { data: parsedData, recognizedSectionsCount } = await parseHwpx(arrayBuffer);

    docData = parsedData;
    saveDocumentData(docData);
    populateFormValues();
    renderCeremonyRowsInput();
    renderPreview();
    updateSectionStatusIndicators();

    // Required toast message advising the user to verify the content
    showToast('내용이 맞게 들어갔는지 확인해 주세요.', 'success');

    if (recognizedSectionsCount === 0) {
      setTimeout(() => {
        showToast('인식 가능한 표준 섹션 제목이 없어 직접 입력을 권장합니다.', 'warn');
      }, 1500);
    }
  } catch (err: unknown) {
    console.error('HWPX import error:', err);
    const msg = err instanceof Error ? err.message : 'HWPX 파일을 읽는 중 오류가 발생했습니다.';
    showToast(msg, 'error');
  }
}

function populateFormValues() {
  (document.getElementById('input-title') as HTMLInputElement).value = docData.title;
  (document.getElementById('input-purpose') as HTMLTextAreaElement).value = docData.purpose;
  (document.getElementById('input-event-name') as HTMLInputElement).value = docData.overview.eventName;
  (document.getElementById('input-date-time') as HTMLInputElement).value = docData.overview.dateTime;
  (document.getElementById('input-location') as HTMLInputElement).value = docData.overview.location;
  (document.getElementById('input-target') as HTMLInputElement).value = docData.overview.target;
  (document.getElementById('input-awardee-count') as HTMLInputElement).value = docData.overview.awardeeCount;
  (document.getElementById('input-attendee-count') as HTMLInputElement).value = docData.overview.attendeeCount;
  (document.getElementById('input-host') as HTMLInputElement).value = docData.overview.host;
  (document.getElementById('input-extra') as HTMLTextAreaElement).value = docData.overview.extra;
  (document.getElementById('input-details') as HTMLTextAreaElement).value = docData.details;
  (document.getElementById('input-future-plans') as HTMLTextAreaElement).value = docData.futurePlans;
}

function initApp() {
  app.innerHTML = `
    <!-- Top Fixed Accent Bar & Header -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs no-print transition-colors">
      <!-- Top Red Brand Bar -->
      <div class="h-1 bg-[#D2232A] w-full"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <!-- Zone 1: Brand title, single element -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="w-8 h-8 rounded-md bg-[#D2232A] flex items-center justify-center text-white font-black text-sm tracking-wider shadow-xs shrink-0">
            우
          </div>
          <div>
            <h1 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              우체국 문화전 수상자 시상식 계획서 작성기
            </h1>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden md:block">공공기관 보고서 양식 표준 · HWPX / PDF 지원</p>
          </div>
        </div>

        <!-- Zone 2 & 3: Actions + Dark Mode Toggle -->
        <div class="flex items-center gap-2 overflow-x-auto py-1">
          <!-- Hidden file input for HWPX import -->
          <input type="file" id="hwpx-file-input" accept=".hwpx" class="hidden" />

          <!-- Button 1: HWPX 불러오기 -->
          <button id="btn-import-hwpx" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#D2232A] dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 active:bg-red-100 rounded-md border border-slate-300 dark:border-slate-700 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400">
            <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"/></svg>
            <span>HWPX 불러오기</span>
          </button>

          <!-- Button 2: 내용 복사 -->
          <button id="btn-copy-content" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#D2232A] dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 active:bg-red-100 rounded-md border border-slate-300 dark:border-slate-700 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400">
            <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <span class="hidden sm:inline">내용 복사</span>
          </button>

          <!-- Button 3: PDF로 저장 -->
          <button id="btn-export-pdf" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#D2232A] dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 active:bg-red-100 rounded-md border border-slate-300 dark:border-slate-700 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400">
            <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span class="hidden sm:inline">PDF로 저장</span>
          </button>

          <!-- Button 4: HWPX로 저장 (강조) -->
          <button id="btn-export-hwpx" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#D2232A] hover:bg-[#b81b21] active:bg-[#9e161c] rounded-md shadow-xs transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m-7-3l-5 5m0 0l-5-5m5 5V3"/></svg>
            <span>HWPX로 저장</span>
          </button>

          <!-- Theme Toggle Button -->
          <button id="btn-toggle-theme" type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-red-300 dark:hover:border-red-800 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400" title="화면 모드 전환">
            <!-- Content populated by updateThemeButtonUI() -->
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile View Switcher Tab (Hidden on LG and up) -->
    <div class="lg:hidden bg-slate-200 dark:bg-slate-800 p-1.5 flex gap-1 sticky top-[57px] z-20 no-print transition-colors">
      <button id="tab-btn-form" class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeMobileTab === 'form' ? 'bg-white dark:bg-slate-900 text-[#D2232A] dark:text-red-400 shadow-xs border-b-2 border-[#D2232A]' : 'text-slate-600 dark:text-slate-400'}">
        입력 폼
      </button>
      <button id="tab-btn-preview" class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeMobileTab === 'preview' ? 'bg-white dark:bg-slate-900 text-[#D2232A] dark:text-red-400 shadow-xs border-b-2 border-[#D2232A]' : 'text-slate-600 dark:text-slate-400'}">
        A4 문서 미리보기
      </button>
    </div>

    <!-- Main Content Grid (2 Columns on Desktop) -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT COLUMN: Input Form -->
      <section id="form-pane" class="lg:col-span-6 bg-white dark:bg-slate-800/95 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden transition-colors ${activeMobileTab === 'preview' ? 'hidden lg:block' : ''}">
        <!-- Form Header with Quick Utilities -->
        <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">보고서 작성 항목</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">자동 저장 활성화됨</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-load-sample" type="button" class="text-xs text-[#D2232A] dark:text-red-400 hover:text-[#b81b21] dark:hover:text-red-300 font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
              샘플 채우기
            </button>
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <button id="btn-reset-form" type="button" class="text-xs text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
              새로 작성
            </button>
          </div>
        </div>

        <form id="plan-form" class="p-5 space-y-6">
          <!-- 0. 문서 제목 -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span id="status-sec-0" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
              <label for="input-title" class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">0.</span> 문서 제목</label>
            </div>
            <input type="text" id="input-title" class="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none focus:ring-1 focus:ring-[#D2232A]" value="${escapeHtml(docData.title)}" placeholder="우체국 문화전 수상자 시상식 계획" />
          </div>

          <hr class="border-slate-100 dark:border-slate-700" />

          <!-- 1. 목적 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span id="status-sec-1" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
                <label for="input-purpose" class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">1.</span> 목적</label>
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">한 줄=한 항목, '-'로 시작하면 하위 항목</span>
            </div>
            <textarea id="input-purpose" rows="3" class="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none focus:ring-1 focus:ring-[#D2232A] leading-relaxed" placeholder="미래 세대의 따뜻한 정서 함양과 문화예술 창작 활동 지원&#10;- 어린이 및 청소년의 창의적 표현력 계발 및 우정 문화 확산">${escapeHtml(docData.purpose)}</textarea>
          </div>

          <hr class="border-slate-100 dark:border-slate-700" />

          <!-- 2. 개요 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span id="status-sec-2" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
                <label class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">2.</span> 개요</label>
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">비워둔 항목은 문서에서 자동 제외</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="input-event-name" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">행사명</label>
                <input type="text" id="input-event-name" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.eventName)}" placeholder="제34회 우체국 문화전 시상식" />
              </div>
              <div>
                <label for="input-date-time" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">일시</label>
                <input type="text" id="input-date-time" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.dateTime)}" placeholder="2026. 10. 15.(목) 14:00" />
              </div>
              <div>
                <label for="input-location" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">장소</label>
                <input type="text" id="input-location" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.location)}" placeholder="우정사업본부 대강당" />
              </div>
              <div>
                <label for="input-target" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">대상</label>
                <input type="text" id="input-target" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.target)}" placeholder="수상자 및 가족" />
              </div>
              <div>
                <label for="input-awardee-count" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">수상 인원</label>
                <input type="text" id="input-awardee-count" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.awardeeCount)}" placeholder="90명 이내" />
              </div>
              <div>
                <label for="input-attendee-count" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">참석 예정</label>
                <input type="text" id="input-attendee-count" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.attendeeCount)}" placeholder="50~60명 내외" />
              </div>
              <div class="sm:col-span-2">
                <label for="input-host" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">주최 · 주관</label>
                <input type="text" id="input-host" class="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none" value="${escapeHtml(docData.overview.host)}" placeholder="우정사업본부" />
              </div>
            </div>

            <div>
              <label for="input-extra" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">그 밖의 개요 (여러 줄)</label>
              <textarea id="input-extra" rows="2" class="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none leading-relaxed" placeholder="행사장 내 수상작 특별 전시 부스 운영&#10;- 참석 가족 편의를 위한 다과 제공">${escapeHtml(docData.overview.extra)}</textarea>
            </div>
          </div>

          <hr class="border-slate-100 dark:border-slate-700" />

          <!-- 3. 세부내용 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span id="status-sec-3" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
                <label for="input-details" class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">3.</span> 세부내용</label>
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">한 줄=한 항목, '-'로 시작하면 하위 항목</span>
            </div>
            <textarea id="input-details" rows="4" class="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none focus:ring-1 focus:ring-[#D2232A] leading-relaxed" placeholder="부문별 우수작 시상 및 부상 수여&#10;- 그림 부문: 대상 4명, 최우수상 8명 등&#10;- 글짓기 부문: 대상 4명, 최우수상 8명 등">${escapeHtml(docData.details)}</textarea>
          </div>

          <hr class="border-slate-100 dark:border-slate-700" />

          <!-- 4. 시상식 순서 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span id="status-sec-4" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
                <label class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">4.</span> 시상식 순서</label>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="btn-default-schedule" class="text-xs px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#D2232A] dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 border border-slate-300 dark:border-slate-600 rounded transition-colors" title="일시 입력값 기준으로 기본 식순 시간 자동 계산">
                  기본 식순 넣기
                </button>
                <button type="button" id="btn-add-ceremony-row" class="text-xs px-2.5 py-1 font-semibold text-[#D2232A] dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/80 rounded transition-colors">
                  + 행 추가
                </button>
              </div>
            </div>

            <!-- Table Rows Input List -->
            <div id="ceremony-rows-container" class="space-y-2"></div>
          </div>

          <hr class="border-slate-100 dark:border-slate-700" />

          <!-- 5. 향후 계획 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span id="status-sec-5" class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xs">·</span>
                <label for="input-future-plans" class="text-sm font-bold text-slate-800 dark:text-slate-200"><span class="text-[#D2232A] dark:text-red-400">5.</span> 향후 계획</label>
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">한 줄=한 항목, '-'로 시작하면 하위 항목</span>
            </div>
            <textarea id="input-future-plans" rows="3" class="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:bg-white focus:dark:bg-slate-950 focus:border-[#D2232A] focus:outline-none focus:ring-1 focus:ring-[#D2232A] leading-relaxed" placeholder="시상식 결과 보고 및 보도자료 배포: 2026. 10. 16.(금)&#10;- 수상작 e-작품집 제작 및 누리집 게시">${escapeHtml(docData.futurePlans)}</textarea>
          </div>
        </form>
      </section>

      <!-- RIGHT COLUMN: A4 Paper Preview Area -->
      <section id="preview-wrapper" class="lg:col-span-6 flex flex-col items-center ${activeMobileTab === 'form' ? 'hidden lg:flex' : 'flex'}">
        <!-- Preview Control Ribbon -->
        <div class="w-full flex items-center justify-between px-3 py-2 mb-3 bg-slate-200/80 dark:bg-slate-800/90 dark:border dark:border-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300 no-print transition-colors">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-100">A4 실시간 미리보기</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">바탕체 (Batang)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button id="btn-zoom-out" type="button" class="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200" title="축소">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>
            </button>
            <span id="zoom-indicator" class="font-mono text-[11px] px-1 font-semibold text-slate-700 dark:text-slate-200">100%</span>
            <button id="btn-zoom-in" type="button" class="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200" title="확대">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>
            </button>
          </div>
        </div>

        <!-- Realistic A4 Paper (Centerpiece, ALWAYS pure white) -->
        <div class="w-full overflow-x-auto flex justify-center pb-8">
          <div id="a4-paper-container" class="transition-transform origin-top">
            <article id="a4-paper" class="w-[210mm] min-h-[297mm] p-[20mm] bg-white text-slate-900 shadow-xl shadow-slate-300/80 dark:shadow-black/70 ring-1 ring-slate-300/60 dark:ring-slate-700 transition-shadow">
              <!-- Rendered document content inserted here -->
            </article>
          </div>
        </div>
      </section>
    </main>

    <!-- Drag & Drop Overlay Indicator -->
    <div id="dropzone-overlay" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center hidden pointer-events-none transition-opacity">
      <div class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl border-2 border-dashed border-[#D2232A] flex flex-col items-center gap-3 text-center max-w-sm mx-4">
        <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-[#D2232A]">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">HWPX 파일을 여기에 놓아주세요</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">문서 내용을 자동으로 파싱하여 각 입력칸에 채워 넣습니다.</p>
      </div>
    </div>

    <!-- Floating Toast Notification Container -->
    <div id="toast-container" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none no-print"></div>
  `;

  // Attach Top Bar Actions
  const btnImportHwpx = document.getElementById('btn-import-hwpx');
  const fileInput = document.getElementById('hwpx-file-input') as HTMLInputElement;
  const btnCopyContent = document.getElementById('btn-copy-content');
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportHwpx = document.getElementById('btn-export-hwpx');
  const btnToggleTheme = document.getElementById('btn-toggle-theme');

  btnImportHwpx?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      handleImportHwpx(target.files[0]);
      target.value = '';
    }
  });

  btnCopyContent?.addEventListener('click', handleCopyContent);
  btnExportPdf?.addEventListener('click', handleExportPdf);
  btnExportHwpx?.addEventListener('click', handleExportHwpx);
  btnToggleTheme?.addEventListener('click', toggleTheme);

  // Setup Drag & Drop File Handling
  const dropzoneOverlay = document.getElementById('dropzone-overlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dropzoneOverlay) {
      dropzoneOverlay.classList.remove('hidden');
    }
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && dropzoneOverlay) {
      dropzoneOverlay.classList.add('hidden');
      dragCounter = 0;
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dropzoneOverlay) {
      dropzoneOverlay.classList.add('hidden');
    }

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.hwpx')) {
        handleImportHwpx(file);
      } else {
        showToast('HWPX (.hwpx) 파일만 불러올 수 있습니다.', 'warn');
      }
    }
  });

  // Attach Mobile Tabs
  const tabBtnForm = document.getElementById('tab-btn-form');
  const tabBtnPreview = document.getElementById('tab-btn-preview');
  const formPane = document.getElementById('form-pane');
  const previewWrapper = document.getElementById('preview-wrapper');

  tabBtnForm?.addEventListener('click', () => {
    activeMobileTab = 'form';
    tabBtnForm.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors bg-white dark:bg-slate-900 text-[#D2232A] dark:text-red-400 shadow-xs border-b-2 border-[#D2232A]';
    tabBtnPreview!.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors text-slate-600 dark:text-slate-400';
    formPane?.classList.remove('hidden');
    previewWrapper?.classList.add('hidden');
    previewWrapper?.classList.remove('flex');
  });

  tabBtnPreview?.addEventListener('click', () => {
    activeMobileTab = 'preview';
    tabBtnPreview.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors bg-white dark:bg-slate-900 text-[#D2232A] dark:text-red-400 shadow-xs border-b-2 border-[#D2232A]';
    tabBtnForm!.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors text-slate-600 dark:text-slate-400';
    formPane?.classList.add('hidden');
    previewWrapper?.classList.remove('hidden');
    previewWrapper?.classList.add('flex');
  });

  // Attach Quick Sample & Reset Buttons
  document.getElementById('btn-load-sample')?.addEventListener('click', () => {
    docData = getDefaultDocumentData();
    saveDocumentData(docData);
    populateFormValues();
    renderCeremonyRowsInput();
    renderPreview();
    updateSectionStatusIndicators();
    showToast('샘플 시상식 계획서 내용이 채워졌습니다.', 'info');
  });

  document.getElementById('btn-reset-form')?.addEventListener('click', () => {
    if (confirm('작성 중인 모든 내용을 비우고 새로 작성하시겠습니까?')) {
      docData = getEmptyDocumentData();
      saveDocumentData(docData);
      populateFormValues();
      renderCeremonyRowsInput();
      renderPreview();
      updateSectionStatusIndicators();
      showToast('입력 폼이 초기화되었습니다.', 'info');
    }
  });

  // Attach Form Input Listeners
  const bindInput = (id: string, setter: (val: string) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
    if (!el) return;
    el.addEventListener('input', () => {
      setter(el.value);
      saveDocumentData(docData);
      renderPreview();
      updateSectionStatusIndicators();
    });
  };

  bindInput('input-title', v => { docData.title = v; });
  bindInput('input-purpose', v => { docData.purpose = v; });
  bindInput('input-event-name', v => { docData.overview.eventName = v; });
  bindInput('input-date-time', v => { docData.overview.dateTime = v; });
  bindInput('input-location', v => { docData.overview.location = v; });
  bindInput('input-target', v => { docData.overview.target = v; });
  bindInput('input-awardee-count', v => { docData.overview.awardeeCount = v; });
  bindInput('input-attendee-count', v => { docData.overview.attendeeCount = v; });
  bindInput('input-host', v => { docData.overview.host = v; });
  bindInput('input-extra', v => { docData.overview.extra = v; });
  bindInput('input-details', v => { docData.details = v; });
  bindInput('input-future-plans', v => { docData.futurePlans = v; });

  // Default Schedule Button
  document.getElementById('btn-default-schedule')?.addEventListener('click', () => {
    const generated = generateDefaultCeremonyRows(docData.overview.dateTime);
    docData.ceremonyRows = generated;
    saveDocumentData(docData);
    renderCeremonyRowsInput();
    renderPreview();
    updateSectionStatusIndicators();
    showToast('일시 기준 기본 식순이 추가되었습니다.', 'success');
  });

  // Add Ceremony Row Button
  document.getElementById('btn-add-ceremony-row')?.addEventListener('click', () => {
    docData.ceremonyRows.push({
      id: `row_${Date.now()}`,
      time: '',
      content: '',
      remarks: '',
    });
    saveDocumentData(docData);
    renderCeremonyRowsInput();
    renderPreview();
    updateSectionStatusIndicators();
  });

  // Zoom buttons
  const paperContainer = document.getElementById('a4-paper-container');
  const zoomIndicator = document.getElementById('zoom-indicator');
  const updateZoom = (newZoom: number) => {
    zoomLevel = Math.max(60, Math.min(140, newZoom));
    if (paperContainer) {
      paperContainer.style.transform = `scale(${zoomLevel / 100})`;
    }
    if (zoomIndicator) {
      zoomIndicator.textContent = `${zoomLevel}%`;
    }
  };

  document.getElementById('btn-zoom-in')?.addEventListener('click', () => updateZoom(zoomLevel + 10));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => updateZoom(zoomLevel - 10));

  // Initialize theme & theme button UI
  initTheme();

  // Initial renders
  renderCeremonyRowsInput();
  renderPreview();
  updateSectionStatusIndicators();
}

// Boot application
initApp();
