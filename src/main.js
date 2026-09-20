import {
  checkSupabaseConnection,
  fetchSectors,
  fetchJobTypes,
  fetchStatuses,
  fetchCompanies,
  createCompany,
  fetchApplications,
  createApplication,
  updateApplicationStatus,
  archiveApplication,
  fetchArchivedApplications,
  deleteArchivedApplication,
} from './supabase.js';

// Application State Store
const state = {
  sectors: [],
  jobTypes: [],
  statuses: [],
  companies: [],
  applications: [],
  archivedApplications: [],
  activeTab: 'overview', // 'overview' | 'new-app' | 'applied'
  appliedSegment: 'active', // 'active' | 'archive'
  searchQuery: '',
  filterStatusId: 'ALL',
  theme: localStorage.getItem('jobtracker_theme') || 'system',
};

// DOM Elements
const elements = {
  // Header & Branding
  creatorTag: document.getElementById('creator-tag'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  iconThemeSun: document.getElementById('icon-theme-sun'),
  iconThemeMoon: document.getElementById('icon-theme-moon'),
  iconThemeSystem: document.getElementById('icon-theme-system'),
  themeTooltipText: document.getElementById('theme-tooltip-text'),

  // Connection Indicator
  connectionIndicator: document.getElementById('connection-indicator'),
  connectionDot: document.getElementById('connection-dot'),
  tooltipDot: document.getElementById('tooltip-dot'),
  connectionTooltipStatus: document.getElementById('connection-tooltip-status'),
  connectionTooltipLatency: document.getElementById('connection-tooltip-latency'),

  // Navigation Tabs
  tabNavOverview: document.getElementById('tab-nav-overview'),
  tabNavNew: document.getElementById('tab-nav-new'),
  tabNavApplied: document.getElementById('tab-nav-applied'),
  navAppliedCount: document.getElementById('nav-applied-count'),

  // Main Views
  viewOverview: document.getElementById('view-overview'),
  viewNewApp: document.getElementById('view-new-app'),
  viewApplied: document.getElementById('view-applied'),

  // Overview Elements
  statActiveCount: document.getElementById('stat-active-count'),
  statInterviewCount: document.getElementById('stat-interview-count'),
  statOfferCount: document.getElementById('stat-offer-count'),
  statArchiveCount: document.getElementById('stat-archive-count'),
  btnJumpNewApp: document.getElementById('btn-jump-new-app'),
  btnJumpApplied: document.getElementById('btn-jump-applied'),
  btnOverviewSeeAll: document.getElementById('btn-overview-see-all'),
  overviewRecentTbody: document.getElementById('overview-recent-tbody'),
  overviewRecentEmpty: document.getElementById('overview-recent-empty'),
  radarItemsContainer: document.getElementById('radar-items-container'),
  radarCountBadge: document.getElementById('radar-count-badge'),

  // New Application Form
  intakeForm: document.getElementById('intake-form'),
  companySelect: document.getElementById('app-company-select'),
  btnOpenNewCompany: document.getElementById('btn-open-new-company'),
  jobTitleInput: document.getElementById('app-job-title'),
  jobTypeSelect: document.getElementById('app-job-type-select'),
  statusSelect: document.getElementById('app-status-select'),
  salaryTargetInput: document.getElementById('app-salary-target'),
  listingUrlInput: document.getElementById('app-listing-url'),
  appliedDateInput: document.getElementById('app-applied-date'),
  skillsInput: document.getElementById('app-skills'),
  jobDescriptionInput: document.getElementById('app-job-description'),
  notesInput: document.getElementById('app-notes'),
  btnQuickFillDemo: document.getElementById('btn-quick-fill-demo'),
  btnClearForm: document.getElementById('btn-clear-form'),
  btnSaveApplication: document.getElementById('btn-save-application'),
  saveIconFloppy: document.getElementById('save-icon-floppy'),
  saveIconSpinner: document.getElementById('save-icon-spinner'),

  // Applied View Elements
  btnSegmentActive: document.getElementById('btn-segment-active'),
  btnSegmentArchive: document.getElementById('btn-segment-archive'),
  segmentActiveBadge: document.getElementById('segment-active-badge'),
  segmentArchiveBadge: document.getElementById('segment-archive-badge'),
  searchInput: document.getElementById('search-input'),
  filterStatusSelect: document.getElementById('filter-status-select'),

  appliedActiveContainer: document.getElementById('applied-active-container'),
  activeTableBody: document.getElementById('active-table-body'),
  activeCardsContainer: document.getElementById('active-cards-container'),
  activeEmptyState: document.getElementById('active-empty-state'),

  appliedArchiveContainer: document.getElementById('applied-archive-container'),
  archiveTableBody: document.getElementById('archive-table-body'),
  archiveCardsContainer: document.getElementById('archive-cards-container'),
  archiveEmptyState: document.getElementById('archive-empty-state'),

  // Slide-over Drawer Elements
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  drawerPanel: document.getElementById('drawer-panel'),
  drawerJobTitle: document.getElementById('drawer-job-title'),
  drawerStatusBadge: document.getElementById('drawer-status-badge'),
  drawerCompanyName: document.getElementById('drawer-company-name'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  btnDrawerCloseBottom: document.getElementById('btn-drawer-close-bottom'),
  btnDrawerArchive: document.getElementById('btn-drawer-archive'),
  drawerJobType: document.getElementById('drawer-job-type'),
  drawerSalary: document.getElementById('drawer-salary'),
  drawerAppliedDate: document.getElementById('drawer-applied-date'),
  drawerUpdatedDate: document.getElementById('drawer-updated-date'),
  drawerListingContainer: document.getElementById('drawer-listing-container'),
  drawerListingUrl: document.getElementById('drawer-listing-url'),
  drawerSkillsContainer: document.getElementById('drawer-skills-container'),
  drawerDescriptionText: document.getElementById('drawer-description-text'),
  btnCopyDescription: document.getElementById('btn-copy-description'),
  drawerNotesText: document.getElementById('drawer-notes-text'),

  // Modals
  modalNewCompany: document.getElementById('modal-new-company'),
  btnCloseNewCompany: document.getElementById('btn-close-new-company'),
  btnCancelNewCompany: document.getElementById('btn-cancel-new-company'),
  formNewCompany: document.getElementById('form-new-company'),
  companyNameInput: document.getElementById('company-name'),
  companySectorSelect: document.getElementById('company-sector-select'),
  companyLocationInput: document.getElementById('company-location'),
  companyCareersUrlInput: document.getElementById('company-careers-url'),
  companyHrContactInput: document.getElementById('company-hr-contact'),

  modalDeleteConfirm: document.getElementById('modal-delete-confirm'),
  deleteArchiveIdInput: document.getElementById('delete-archive-id'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),

  // Toast Container
  toastContainer: document.getElementById('toast-container'),
};

// Date Helpers
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Dynamic Relative Time Function
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'just now';
  if (diffSec < 90) return '1m ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return formatDate(timestamp);
}

// Minimalist badge colors (Linear / Raycast graphite palette)
function getBadgeStyle(badgeColor, statusName = '') {
  const color = (badgeColor || '').toLowerCase();
  const name = (statusName || '').toLowerCase();

  if (color === 'green' || color === 'emerald' || name.includes('offer')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (color === 'purple' || color === 'indigo' || name.includes('interview')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
  if (color === 'yellow' || color === 'amber' || name.includes('screen') || name.includes('assessment')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  if (color === 'red' || color === 'rose' || name.includes('reject')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
  if (color === 'gray' || color === 'slate' || name.includes('withdrawn')) {
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
  return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Micro Toast Notifications
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto px-3.5 py-2.5 rounded-lg shadow-xl border flex items-center space-x-2.5 animate-toast transition-all text-xs font-medium ${
    type === 'success'
      ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
      : type === 'error'
      ? 'bg-zinc-900 border-rose-800 text-rose-300'
      : 'bg-zinc-900 border-zinc-700 text-zinc-300'
  }`;

  const iconSvg =
    type === 'success'
      ? `<svg class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
      : type === 'error'
      ? `<svg class="w-3.5 h-3.5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      : `<svg class="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span class="flex-1">${message}</span>
    <button class="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors" onclick="this.parentElement.remove()">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-1');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Theme Controller (Dark / Light / System)
function initTheme() {
  applyTheme(state.theme);

  elements.btnThemeToggle.addEventListener('click', () => {
    if (state.theme === 'system') {
      state.theme = 'dark';
    } else if (state.theme === 'dark') {
      state.theme = 'light';
    } else {
      state.theme = 'system';
    }
    localStorage.setItem('jobtracker_theme', state.theme);
    applyTheme(state.theme);
    showToast(`Theme: ${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)}`, 'info');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') {
      applyTheme('system');
    }
  });
}

function applyTheme(theme) {
  elements.iconThemeSun.classList.add('hidden');
  elements.iconThemeMoon.classList.add('hidden');
  elements.iconThemeSystem.classList.add('hidden');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    elements.iconThemeSun.classList.remove('hidden');
    elements.themeTooltipText.textContent = 'Theme: Dark';
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    elements.iconThemeMoon.classList.remove('hidden');
    elements.themeTooltipText.textContent = 'Theme: Light';
  } else {
    elements.iconThemeSystem.classList.remove('hidden');
    elements.themeTooltipText.textContent = 'Theme: System';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// Conditional Creator Tag ("by NearXkie")
function initConditionalBranding() {
  const hasVisited = sessionStorage.getItem('visited');

  if (hasVisited === 'true') {
    if (elements.creatorTag) {
      elements.creatorTag.style.display = 'none';
    }
  } else {
    if (elements.creatorTag) {
      elements.creatorTag.classList.remove('fade-out-creator');
    }
  }
}

function dismissCreatorTag() {
  if (!elements.creatorTag || elements.creatorTag.style.display === 'none') return;
  sessionStorage.setItem('visited', 'true');
  elements.creatorTag.classList.add('fade-out-creator');
  setTimeout(() => {
    if (elements.creatorTag) {
      elements.creatorTag.style.display = 'none';
    }
  }, 350);
}

// Tab Switching
function switchTab(tabName) {
  if (tabName !== 'overview') {
    dismissCreatorTag();
  }

  state.activeTab = tabName;

  const activeClass = 'px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 flex items-center space-x-2 bg-zinc-100 text-zinc-900 shadow-sm min-h-[40px]';
  const inactiveClass = 'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 min-h-[40px]';

  elements.tabNavOverview.className = tabName === 'overview' ? activeClass : inactiveClass;
  elements.tabNavNew.className = tabName === 'new-app' ? activeClass : inactiveClass;
  elements.tabNavApplied.className = tabName === 'applied' ? activeClass : inactiveClass;

  elements.viewOverview.classList.toggle('hidden', tabName !== 'overview');
  elements.viewNewApp.classList.toggle('hidden', tabName !== 'new-app');
  elements.viewApplied.classList.toggle('hidden', tabName !== 'applied');

  if (tabName === 'overview') {
    document.title = 'Overview | Job Tracker';
  } else if (tabName === 'new-app') {
    document.title = 'New Application | Job Tracker';
  } else if (tabName === 'applied') {
    document.title = state.appliedSegment === 'active' ? 'Applied Pipeline | Job Tracker' : 'Archive | Job Tracker';
  }
}

function switchAppliedSegment(segment) {
  state.appliedSegment = segment;

  if (segment === 'active') {
    elements.btnSegmentActive.className =
      'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex items-center space-x-1.5 bg-zinc-100 text-zinc-900 shadow-sm min-h-[36px]';
    elements.btnSegmentArchive.className =
      'px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-200 min-h-[36px]';

    elements.appliedActiveContainer.classList.remove('hidden');
    elements.appliedArchiveContainer.classList.add('hidden');
    document.title = 'Applied Pipeline | Job Tracker';
  } else {
    elements.btnSegmentArchive.className =
      'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex items-center space-x-1.5 bg-zinc-100 text-zinc-900 shadow-sm min-h-[36px]';
    elements.btnSegmentActive.className =
      'px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-200 min-h-[36px]';

    elements.appliedActiveContainer.classList.add('hidden');
    elements.appliedArchiveContainer.classList.remove('hidden');
    document.title = 'Archive | Job Tracker';
  }
}

// Initial Data Fetching
async function loadInitialData() {
  try {
    elements.connectionDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    elements.tooltipDot.className = 'w-2 h-2 rounded-full bg-amber-400';
    elements.connectionTooltipStatus.textContent = 'Checking connection...';

    const conn = await checkSupabaseConnection();

    if (conn.ok) {
      elements.connectionDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      elements.tooltipDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      elements.connectionTooltipStatus.textContent = 'Connected (Supabase)';
      elements.connectionTooltipLatency.textContent = `Latency: ${conn.latency || '< 50'} ms`;
    } else {
      elements.connectionDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      elements.tooltipDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      elements.connectionTooltipStatus.textContent = conn.isDemo ? 'Demo Mode (Interactive)' : 'Offline';
      elements.connectionTooltipLatency.textContent = conn.latency ? `Latency: ${conn.latency} ms` : 'Local Storage';
      if (conn.isDemo) {
        showToast('Demo Mode active. Connect Supabase in .env for live sync.', 'info');
      }
    }

    const [sectors, jobTypes, statuses, companies, applications, archived] = await Promise.all([
      fetchSectors(),
      fetchJobTypes(),
      fetchStatuses(),
      fetchCompanies(),
      fetchApplications(),
      fetchArchivedApplications(),
    ]);

    state.sectors = sectors || [];
    state.jobTypes = jobTypes || [];
    state.statuses = statuses || [];
    state.companies = companies || [];
    state.applications = applications || [];
    state.archivedApplications = archived || [];

    populateDropdowns();
    updateMetrics();
    renderOverviewRecent();
    renderFollowUpRadar();
    renderActiveApplications();
    renderArchivedApplications();
  } catch (err) {
    console.error('Error loading initial data:', err);
    showToast('Failed to load application data: ' + err.message, 'error');
  }
}

function populateDropdowns() {
  // Company Select
  const currentCompanyVal = elements.companySelect.value;
  elements.companySelect.innerHTML = '<option value="">Select a company...</option>';
  state.companies.forEach((comp) => {
    const opt = document.createElement('option');
    opt.value = comp.id;
    opt.textContent = comp.name + (comp.location ? ` (${comp.location})` : '');
    elements.companySelect.appendChild(opt);
  });
  if (currentCompanyVal) elements.companySelect.value = currentCompanyVal;

  // Sector Select in Modal
  elements.companySectorSelect.innerHTML = '<option value="">Select a sector (optional)...</option>';
  state.sectors.forEach((sec) => {
    const opt = document.createElement('option');
    opt.value = sec.id;
    opt.textContent = sec.name;
    elements.companySectorSelect.appendChild(opt);
  });

  // Job Type Select
  elements.jobTypeSelect.innerHTML = '<option value="">Select type...</option>';
  state.jobTypes.forEach((type) => {
    const opt = document.createElement('option');
    opt.value = type.id;
    opt.textContent = type.name;
    elements.jobTypeSelect.appendChild(opt);
  });

  // Status Select in Intake Form
  elements.statusSelect.innerHTML = '<option value="">Select status...</option>';
  state.statuses.forEach((status) => {
    const opt = document.createElement('option');
    opt.value = status.id;
    opt.textContent = status.name;
    elements.statusSelect.appendChild(opt);
  });
  if (state.statuses.length > 0) {
    elements.statusSelect.value = state.statuses[0].id;
  }

  // Filter Status Select
  elements.filterStatusSelect.innerHTML = '<option value="ALL">All Statuses</option>';
  state.statuses.forEach((status) => {
    const opt = document.createElement('option');
    opt.value = status.id;
    opt.textContent = status.name;
    elements.filterStatusSelect.appendChild(opt);
  });
}

function updateMetrics() {
  const activeCount = state.applications.length;
  const interviewCount = state.applications.filter((a) => {
    const statusName = a.statuses?.name || '';
    return statusName.toLowerCase().includes('interview');
  }).length;
  const offerCount = state.applications.filter((a) => {
    const statusName = a.statuses?.name || '';
    return statusName.toLowerCase().includes('offer');
  }).length;
  const archiveCount = state.archivedApplications.length;

  elements.statActiveCount.textContent = activeCount;
  elements.statInterviewCount.textContent = interviewCount;
  elements.statOfferCount.textContent = offerCount;
  elements.statArchiveCount.textContent = archiveCount;

  elements.navAppliedCount.textContent = activeCount;
  elements.segmentActiveBadge.textContent = activeCount;
  elements.segmentArchiveBadge.textContent = archiveCount;
}

// 1. Overview Recent Activity Table (Last 4 submissions)
function renderOverviewRecent() {
  if (state.applications.length === 0) {
    elements.overviewRecentTbody.innerHTML = '';
    elements.overviewRecentEmpty.classList.remove('hidden');
    return;
  }
  elements.overviewRecentEmpty.classList.add('hidden');

  const recent = state.applications.slice(0, 4);
  elements.overviewRecentTbody.innerHTML = recent
    .map((app) => {
      const company = app.companies || {};
      const status = app.statuses || {};
      const badgeStyle = getBadgeStyle(status.badge_color, status.name);

      return `
        <tr class="hover:bg-zinc-900/50 transition-colors">
          <td class="py-2.5 font-medium text-zinc-200">
            ${escapeHtml(company.name || 'Unknown')}
            ${company.location ? `<span class="text-zinc-500 font-normal ml-1">(${escapeHtml(company.location)})</span>` : ''}
          </td>
          <td class="py-2.5 text-zinc-300">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              class="text-left font-medium text-zinc-200 hover:text-white hover:underline transition-colors flex items-center space-x-1"
            >
              <span>${escapeHtml(app.job_title)}</span>
            </button>
            ${app.salary_target ? `<span class="text-zinc-500 text-[11px] font-mono ml-1.5">${escapeHtml(app.salary_target)}</span>` : ''}
          </td>
          <td class="py-2.5 font-mono text-zinc-400 text-[11px]">
            ${formatDate(app.applied_date)}
          </td>
          <td class="py-2.5 text-right">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyle}">
              ${escapeHtml(status.name || 'Applied')}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

// 2. Follow-up Radar Widget (Applications > 7 days ago and still marked 'Applied')
function renderFollowUpRadar() {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const radarItems = state.applications.filter((app) => {
    const statusName = (app.statuses?.name || '').toLowerCase();
    const isAppliedStatus = statusName === 'applied' || app.status_id === 1;
    if (!isAppliedStatus || !app.applied_date) return false;

    const appliedTime = new Date(app.applied_date).getTime();
    return (now - appliedTime) > SEVEN_DAYS_MS;
  });

  elements.radarCountBadge.textContent = radarItems.length;

  if (radarItems.length === 0) {
    elements.radarItemsContainer.innerHTML = `
      <div class="py-6 text-center space-y-2">
        <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p class="text-xs font-medium text-zinc-300">All applications up to date.</p>
        <p class="text-[11px] text-zinc-500">No applications older than 7 days require follow-up.</p>
      </div>
    `;
    return;
  }

  elements.radarItemsContainer.innerHTML = radarItems.slice(0, 3)
    .map((app) => {
      const company = app.companies || {};
      const appliedTime = new Date(app.applied_date).getTime();
      const daysWaiting = Math.floor((now - appliedTime) / (24 * 60 * 60 * 1000));

      return `
        <div class="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between">
          <div class="min-w-0 pr-2">
            <p class="text-xs font-medium text-zinc-200 truncate">${escapeHtml(company.name || 'Unknown Company')}</p>
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              class="text-[11px] text-zinc-400 hover:text-white truncate text-left hover:underline"
            >
              ${escapeHtml(app.job_title)}
            </button>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              ${daysWaiting}d ago
            </span>
          </div>
        </div>
      `;
    })
    .join('');
}

// 3. Render Active Applications
function renderActiveApplications() {
  const filtered = state.applications.filter((app) => {
    const companyName = (app.companies?.name || '').toLowerCase();
    const jobTitle = (app.job_title || '').toLowerCase();
    const query = state.searchQuery.toLowerCase();

    const matchesQuery = !query || companyName.includes(query) || jobTitle.includes(query);
    const matchesStatus =
      state.filterStatusId === 'ALL' || String(app.status_id) === String(state.filterStatusId);

    return matchesQuery && matchesStatus;
  });

  if (filtered.length === 0) {
    elements.activeTableBody.innerHTML = '';
    elements.activeCardsContainer.innerHTML = '';
    elements.activeEmptyState.classList.remove('hidden');
    return;
  }
  elements.activeEmptyState.classList.add('hidden');

  // Desktop Table
  elements.activeTableBody.innerHTML = filtered
    .map((app) => {
      const company = app.companies || {};
      const jobType = app.job_types || {};
      const currentStatus = app.statuses || {};
      const badgeStyle = getBadgeStyle(currentStatus.badge_color, currentStatus.name);
      
      const timestampField = app.updated_at || app.applied_date;
      const relativeTime = formatTimeAgo(timestampField);

      const statusOptions = state.statuses
        .map(
          (s) =>
            `<option value="${s.id}" ${Number(s.id) === Number(app.status_id) ? 'selected' : ''} class="bg-zinc-900 text-zinc-100 font-normal">${escapeHtml(s.name)}</option>`
        )
        .join('');

      return `
        <tr class="hover:bg-zinc-900/50 transition-colors group">
          <!-- Company -->
          <td class="py-3 px-5">
            <div class="flex items-center space-x-2">
              <span class="font-medium text-zinc-100 group-hover:text-white transition-colors">
                ${escapeHtml(company.name || 'Unknown')}
              </span>
              ${
                company.careers_url
                  ? `<a href="${escapeHtml(company.careers_url)}" target="_blank" rel="noopener noreferrer" title="Careers Portal" class="text-zinc-500 hover:text-zinc-300 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>`
                  : ''
              }
            </div>
            ${company.location ? `<p class="text-[11px] text-zinc-400 mt-0.5">${escapeHtml(company.location)}</p>` : ''}
          </td>

          <!-- Role & Salary with View Spec Trigger -->
          <td class="py-3 px-5">
            <div class="flex items-center space-x-1.5">
              <button
                type="button"
                data-action="view-spec"
                data-id="${app.id}"
                class="text-left font-medium text-zinc-200 hover:text-white hover:underline transition-colors flex items-center space-x-1"
                title="View Job Details & Stored Spec"
              >
                <span>${escapeHtml(app.job_title)}</span>
                <svg class="w-3 h-3 text-zinc-500 hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
              ${
                app.listing_url
                  ? `<a href="${escapeHtml(app.listing_url)}" target="_blank" rel="noopener noreferrer" title="Job Listing" class="text-zinc-500 hover:text-zinc-300 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </a>`
                  : ''
              }
            </div>
            ${app.salary_target ? `<p class="text-[11px] text-zinc-400 font-mono mt-0.5">${escapeHtml(app.salary_target)}</p>` : ''}
          </td>

          <!-- Type -->
          <td class="py-3 px-5">
            <span class="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
              ${escapeHtml(jobType.name || 'Full-time')}
            </span>
          </td>

          <!-- Applied Date & Dynamic Timestamp -->
          <td class="py-3 px-5 text-zinc-400 font-mono text-[11px]">
            <div>${formatDate(app.applied_date)}</div>
            ${relativeTime ? `<div class="text-[10px] text-zinc-500 font-sans mt-0.5">Updated: ${relativeTime}</div>` : ''}
          </td>

          <!-- Interactive Inline Status Auto-Save -->
          <td class="py-3 px-5">
            <select
              data-action="inline-status"
              data-app-id="${app.id}"
              class="status-select-badge text-[11px] font-medium rounded px-2 py-0.5 border focus:outline-none focus:border-zinc-500 transition-opacity ${badgeStyle}"
              title="Click to change status"
            >
              ${statusOptions}
            </select>
          </td>

          <!-- Action: View Spec & Archive -->
          <td class="py-3 px-5 text-right space-x-1.5">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              class="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all inline-flex items-center space-x-1"
              title="View Job Details & Stored Spec"
            >
              <span>Spec</span>
            </button>
            <button
              type="button"
              data-action="archive"
              data-id="${app.id}"
              class="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all inline-flex items-center space-x-1"
              title="Move to Archive"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              <span>Archive</span>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Mobile Cards
  elements.activeCardsContainer.innerHTML = filtered
    .map((app) => {
      const company = app.companies || {};
      const jobType = app.job_types || {};
      const currentStatus = app.statuses || {};
      const badgeStyle = getBadgeStyle(currentStatus.badge_color, currentStatus.name);
      const timestampField = app.updated_at || app.applied_date;
      const relativeTime = formatTimeAgo(timestampField);

      const statusOptions = state.statuses
        .map(
          (s) =>
            `<option value="${s.id}" ${Number(s.id) === Number(app.status_id) ? 'selected' : ''} class="bg-zinc-900 text-zinc-100">${escapeHtml(s.name)}</option>`
        )
        .join('');

      return `
        <div class="glass-card p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <button
                type="button"
                data-action="view-spec"
                data-id="${app.id}"
                class="text-left font-medium text-zinc-100 text-sm hover:underline"
              >
                ${escapeHtml(app.job_title)}
              </button>
              <p class="text-xs text-zinc-400">${escapeHtml(company.name || 'Unknown Company')}</p>
            </div>
            
            <select
              data-action="inline-status"
              data-app-id="${app.id}"
              class="status-select-badge text-[11px] font-medium rounded px-2 py-1 border focus:outline-none ${badgeStyle}"
            >
              ${statusOptions}
            </select>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <span class="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">${escapeHtml(jobType.name || 'Full-time')}</span>
            <span>Applied: ${formatDate(app.applied_date)}</span>
            ${app.salary_target ? `<span class="text-zinc-300">${escapeHtml(app.salary_target)}</span>` : ''}
            ${relativeTime ? `<span class="text-zinc-500 font-sans">Updated: ${relativeTime}</span>` : ''}
          </div>

          ${app.notes ? `<p class="text-xs text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800/80">${escapeHtml(app.notes)}</p>` : ''}

          <div class="pt-2 border-t border-zinc-800/80 flex items-center space-x-2">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              class="flex-1 py-2 text-xs font-medium rounded-lg text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-center space-x-1"
            >
              <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span>View Spec</span>
            </button>
            <button
              type="button"
              data-action="archive"
              data-id="${app.id}"
              class="flex-1 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-center space-x-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              <span>Archive</span>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

// 4. Render Archived Applications
function renderArchivedApplications() {
  const filtered = state.archivedApplications.filter((app) => {
    const companyName = (app.company_name || '').toLowerCase();
    const jobTitle = (app.job_title || '').toLowerCase();
    const query = state.searchQuery.toLowerCase();

    return !query || companyName.includes(query) || jobTitle.includes(query);
  });

  if (filtered.length === 0) {
    elements.archiveTableBody.innerHTML = '';
    elements.archiveCardsContainer.innerHTML = '';
    elements.archiveEmptyState.classList.remove('hidden');
    return;
  }
  elements.archiveEmptyState.classList.add('hidden');

  // Desktop Table
  elements.archiveTableBody.innerHTML = filtered
    .map((app) => {
      const badgeClass = getBadgeStyle('', app.status_name);
      return `
        <tr class="hover:bg-zinc-900/50 transition-colors group">
          <td class="py-3 px-5 font-medium text-zinc-200">
            ${escapeHtml(app.company_name || 'Unknown')}
          </td>
          <td class="py-3 px-5 text-zinc-300">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              data-archive="true"
              class="text-left font-medium text-zinc-200 hover:text-white hover:underline flex items-center space-x-1"
            >
              <span>${escapeHtml(app.job_title)}</span>
            </button>
            ${app.salary_target ? `<p class="text-[11px] text-zinc-500 font-mono mt-0.5">${escapeHtml(app.salary_target)}</p>` : ''}
          </td>
          <td class="py-3 px-5 text-[11px] text-zinc-400 font-mono">
            ${formatDate(app.applied_date)}
          </td>
          <td class="py-3 px-5 text-[11px] text-zinc-500 font-mono">
            ${formatDate(app.archived_at)}
          </td>
          <td class="py-3 px-5">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeClass}">
              ${escapeHtml(app.status_name || 'Archived')}
            </span>
          </td>
          <td class="py-3 px-5 text-right space-x-1.5">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              data-archive="true"
              class="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all inline-flex items-center space-x-1"
              title="View Stored Spec"
            >
              <span>Spec</span>
            </button>
            <button
              type="button"
              data-action="delete-archive"
              data-id="${app.id}"
              class="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded transition-all inline-flex items-center space-x-1"
              title="Delete Archive Log Permanently"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Delete</span>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Mobile Cards
  elements.archiveCardsContainer.innerHTML = filtered
    .map((app) => {
      const badgeClass = getBadgeStyle('', app.status_name);
      return `
        <div class="glass-card p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <button
                type="button"
                data-action="view-spec"
                data-id="${app.id}"
                data-archive="true"
                class="text-left font-medium text-zinc-100 text-sm hover:underline"
              >
                ${escapeHtml(app.job_title)}
              </button>
              <p class="text-xs text-zinc-400">${escapeHtml(app.company_name || 'Unknown Company')}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeClass}">
              ${escapeHtml(app.status_name || 'Archived')}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono">
            <span>Applied: ${formatDate(app.applied_date)}</span>
            <span>Archived: ${formatDate(app.archived_at)}</span>
            ${app.salary_target ? `<span class="text-zinc-300">${escapeHtml(app.salary_target)}</span>` : ''}
          </div>

          ${app.notes ? `<p class="text-xs text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800/80">${escapeHtml(app.notes)}</p>` : ''}

          <div class="pt-2 border-t border-zinc-800/80 flex items-center space-x-2">
            <button
              type="button"
              data-action="view-spec"
              data-id="${app.id}"
              data-archive="true"
              class="flex-1 py-2 text-xs font-medium rounded-lg text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-center space-x-1"
            >
              <span>View Spec</span>
            </button>
            <button
              type="button"
              data-action="delete-archive"
              data-id="${app.id}"
              class="flex-1 py-2 text-xs font-medium rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center justify-center space-x-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

// 5. Frictionless Inline Status Change Handler (Fix Reactivity)
async function handleInlineStatusChange(appId, newStatusId, selectElement) {
  // 1. Visual feedback (disable while saving)
  selectElement.disabled = true;
  selectElement.classList.add('opacity-60');

  try {
    // 2. Await the update
    await updateApplicationStatus(appId, newStatusId);

    // 3. Immediately re-fetch applications and re-render the view
    state.applications = await fetchApplications();

    updateMetrics();
    renderActiveApplications();
    renderOverviewRecent();
    renderFollowUpRadar();

    const newStatus = state.statuses.find((s) => Number(s.id) === Number(newStatusId));
    showToast(`Status updated to "${newStatus ? newStatus.name : 'Updated'}"`, 'success');
  } catch (err) {
    console.error('Failed to update status:', err);
    showToast('Failed to update status: ' + err.message, 'error');
    renderActiveApplications();
  } finally {
    selectElement.disabled = false;
    selectElement.classList.remove('opacity-60');
  }
}

// 6. Slide-over Drawer Handlers
function openJobDetailsDrawer(appId, isArchive = false) {
  const app = isArchive
    ? state.archivedApplications.find((a) => a.id === Number(appId))
    : state.applications.find((a) => a.id === Number(appId));

  if (!app) return;

  const companyName = isArchive ? app.company_name : (app.companies?.name || 'Unknown');
  const location = isArchive ? '' : (app.companies?.location || '');
  const statusName = isArchive ? app.status_name : (app.statuses?.name || 'Applied');
  const badgeColor = isArchive ? '' : (app.statuses?.badge_color || '');
  const jobTypeName = isArchive ? 'Full-time' : (app.job_types?.name || 'Full-time');

  elements.drawerJobTitle.textContent = app.job_title || 'Untitled Role';
  elements.drawerCompanyName.textContent = companyName + (location ? ` • ${location}` : '');
  elements.drawerJobType.textContent = jobTypeName;
  elements.drawerSalary.textContent = app.salary_target || '—';
  elements.drawerAppliedDate.textContent = formatDate(app.applied_date);
  elements.drawerUpdatedDate.textContent = formatTimeAgo(app.updated_at || app.applied_date) || '—';

  // Badge
  const badgeStyle = getBadgeStyle(badgeColor, statusName);
  elements.drawerStatusBadge.className = `px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyle}`;
  elements.drawerStatusBadge.textContent = statusName;

  // Listing Link
  if (app.listing_url) {
    elements.drawerListingContainer.classList.remove('hidden');
    elements.drawerListingUrl.href = app.listing_url;
  } else {
    elements.drawerListingContainer.classList.add('hidden');
  }

  // Skills
  elements.drawerSkillsContainer.innerHTML = '';
  if (app.skills_required && app.skills_required.trim()) {
    const skills = app.skills_required.split(',').map((s) => s.trim()).filter(Boolean);
    skills.forEach((skill) => {
      const tag = document.createElement('span');
      tag.className = 'px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-xs border border-zinc-700';
      tag.textContent = skill;
      elements.drawerSkillsContainer.appendChild(tag);
    });
  } else {
    elements.drawerSkillsContainer.innerHTML = '<span class="text-xs text-zinc-500">No specific skills recorded.</span>';
  }

  // Saved Job Description
  if (app.job_description && app.job_description.trim()) {
    elements.drawerDescriptionText.textContent = app.job_description;
  } else {
    elements.drawerDescriptionText.textContent = 'No job description stored for this position.';
  }

  // Notes
  elements.drawerNotesText.textContent = app.notes && app.notes.trim() ? app.notes : 'No additional notes.';

  // Archive button in drawer
  if (isArchive) {
    elements.btnDrawerArchive.classList.add('hidden');
  } else {
    elements.btnDrawerArchive.classList.remove('hidden');
    elements.btnDrawerArchive.setAttribute('data-id', app.id);
  }

  // Open Drawer
  elements.drawerBackdrop.classList.remove('hidden');
  elements.drawerPanel.classList.remove('translate-x-full');
}

function closeJobDetailsDrawer() {
  elements.drawerPanel.classList.add('translate-x-full');
  elements.drawerBackdrop.classList.add('hidden');
}

// 7. Intake Form Submission
async function handleIntakeSubmit(e) {
  e.preventDefault();

  const companyId = elements.companySelect.value;
  const jobTitle = elements.jobTitleInput.value.trim();
  const jobTypeId = elements.jobTypeSelect.value || null;
  const statusId = elements.statusSelect.value;
  const listingUrl = elements.listingUrlInput.value.trim() || null;
  const salaryTarget = elements.salaryTargetInput.value.trim() || null;
  const appliedDate = elements.appliedDateInput.value || getTodayDateString();
  const skillsRequired = elements.skillsInput.value.trim() || null;
  const jobDescription = elements.jobDescriptionInput.value.trim() || null;
  const notes = elements.notesInput.value.trim() || null;

  if (!companyId) {
    showToast('Please select or create a company.', 'error');
    elements.companySelect.focus();
    return;
  }
  if (!jobTitle) {
    showToast('Job Title is required.', 'error');
    elements.jobTitleInput.focus();
    return;
  }
  if (!statusId) {
    showToast('Please select a status.', 'error');
    elements.statusSelect.focus();
    return;
  }

  elements.btnSaveApplication.disabled = true;
  elements.saveIconFloppy.classList.add('hidden');
  elements.saveIconSpinner.classList.remove('hidden');

  try {
    const payload = {
      company_id: Number(companyId),
      job_title: jobTitle,
      job_type_id: jobTypeId ? Number(jobTypeId) : null,
      status_id: Number(statusId),
      listing_url: listingUrl,
      applied_date: appliedDate,
      salary_target: salaryTarget,
      skills_required: skillsRequired,
      job_description: jobDescription,
      notes: notes,
    };

    await createApplication(payload);

    state.applications = await fetchApplications();

    // Reset all form inputs
    elements.jobTitleInput.value = '';
    elements.listingUrlInput.value = '';
    elements.salaryTargetInput.value = '';
    elements.appliedDateInput.value = getTodayDateString();
    elements.skillsInput.value = '';
    elements.jobDescriptionInput.value = '';
    elements.notesInput.value = '';

    updateMetrics();
    renderOverviewRecent();
    renderFollowUpRadar();
    renderActiveApplications();

    showToast(`Application for "${jobTitle}" saved!`, 'success');
  } catch (err) {
    console.error('Failed to create application:', err);
    showToast('Failed to save application: ' + err.message, 'error');
  } finally {
    elements.btnSaveApplication.disabled = false;
    elements.saveIconFloppy.classList.remove('hidden');
    elements.saveIconSpinner.classList.add('hidden');
  }
}

// 8. "+ New Company" Modal Handlers
function openNewCompanyModal() {
  elements.modalNewCompany.classList.remove('hidden');
  elements.companyNameInput.value = '';
  elements.companyLocationInput.value = '';
  elements.companyCareersUrlInput.value = '';
  elements.companyHrContactInput.value = '';
  elements.companySectorSelect.value = '';
  setTimeout(() => elements.companyNameInput.focus(), 80);
}

function closeNewCompanyModal() {
  elements.modalNewCompany.classList.add('hidden');
}

async function handleNewCompanySubmit(e) {
  e.preventDefault();

  const name = elements.companyNameInput.value.trim();
  const sectorId = elements.companySectorSelect.value || null;
  const location = elements.companyLocationInput.value.trim() || null;
  const careersUrl = elements.companyCareersUrlInput.value.trim() || null;
  const hrContact = elements.companyHrContactInput.value.trim() || null;

  if (!name) {
    showToast('Company Name is required', 'error');
    elements.companyNameInput.focus();
    return;
  }

  const submitBtn = document.getElementById('btn-submit-new-company');
  const originalHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Creating...</span>';

  try {
    const newCompany = await createCompany({
      name,
      sector_id: sectorId ? Number(sectorId) : null,
      location,
      careers_url: careersUrl,
      hr_contact: hrContact,
    });

    state.companies = await fetchCompanies();
    populateDropdowns();

    elements.companySelect.value = newCompany.id;

    closeNewCompanyModal();
    showToast(`Company "${name}" created!`, 'success');
  } catch (err) {
    console.error('Failed to create company:', err);
    showToast('Failed to create company: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

// 9. Archive Application Handler
async function handleArchiveApplication(appId) {
  const app = state.applications.find((a) => a.id === Number(appId));
  if (!app) return;

  try {
    await archiveApplication(app);

    state.applications = await fetchApplications();
    state.archivedApplications = await fetchArchivedApplications();

    updateMetrics();
    renderOverviewRecent();
    renderFollowUpRadar();
    renderActiveApplications();
    renderArchivedApplications();

    closeJobDetailsDrawer();
    showToast(`Moved "${app.job_title}" to Archive.`, 'info');
  } catch (err) {
    console.error('Failed to archive application:', err);
    showToast('Failed to archive application: ' + err.message, 'error');
  }
}

// 10. Delete Archived Item Handlers
function openDeleteConfirmModal(archiveId) {
  elements.deleteArchiveIdInput.value = archiveId;
  elements.modalDeleteConfirm.classList.remove('hidden');
}

function closeDeleteConfirmModal() {
  elements.modalDeleteConfirm.classList.add('hidden');
}

async function handleConfirmDelete() {
  const archiveId = elements.deleteArchiveIdInput.value;
  if (!archiveId) return;

  try {
    await deleteArchivedApplication(archiveId);

    state.archivedApplications = await fetchArchivedApplications();
    updateMetrics();
    renderArchivedApplications();

    closeDeleteConfirmModal();
    showToast('Archived record permanently removed.', 'success');
  } catch (err) {
    console.error('Failed to delete archived record:', err);
    showToast('Failed to delete record: ' + err.message, 'error');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  elements.tabNavOverview.addEventListener('click', () => switchTab('overview'));
  elements.tabNavNew.addEventListener('click', () => switchTab('new-app'));
  elements.tabNavApplied.addEventListener('click', () => switchTab('applied'));

  // Quick Action Jump Cards
  elements.btnJumpNewApp.addEventListener('click', () => switchTab('new-app'));
  elements.btnJumpApplied.addEventListener('click', () => switchTab('applied'));
  elements.btnOverviewSeeAll.addEventListener('click', () => switchTab('applied'));

  // Applied View Segment Toggle
  elements.btnSegmentActive.addEventListener('click', () => switchAppliedSegment('active'));
  elements.btnSegmentArchive.addEventListener('click', () => switchAppliedSegment('archive'));

  // Search & Filter
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderActiveApplications();
    renderArchivedApplications();
  });

  elements.filterStatusSelect.addEventListener('change', (e) => {
    state.filterStatusId = e.target.value;
    renderActiveApplications();
  });

  // Intake Form
  elements.intakeForm.addEventListener('submit', handleIntakeSubmit);
  elements.btnClearForm.addEventListener('click', () => {
    elements.intakeForm.reset();
    elements.skillsInput.value = '';
    elements.jobDescriptionInput.value = '';
    elements.appliedDateInput.value = getTodayDateString();
  });

  // Quick Demo Fill
  elements.btnQuickFillDemo.addEventListener('click', () => {
    if (state.companies.length > 0) {
      elements.companySelect.value = state.companies[0].id;
    }
    elements.jobTitleInput.value = 'Staff Software Engineer';
    if (state.jobTypes.length > 0) {
      elements.jobTypeSelect.value = state.jobTypes[0].id;
    }
    if (state.statuses.length > 0) {
      elements.statusSelect.value = state.statuses[0].id;
    }
    elements.salaryTargetInput.value = '85,000 - 105,000';
    elements.listingUrlInput.value = 'https://jobs.example.com/staff-engineer';
    elements.appliedDateInput.value = getTodayDateString();
    elements.skillsInput.value = 'Python, FastAPI, TypeScript, React, Docker, PostgreSQL';
    elements.jobDescriptionInput.value = 'We are seeking a Staff Software Engineer to spearhead our core platforms. Responsibilities include distributed system architecture, high-throughput microservices, and leading high-impact technical initiatives.';
    elements.notesInput.value = 'Referred by team member. Recruiter screen set for Thursday.';
    showToast('Example application data pre-filled!', 'info');
  });

  // Drawer Listeners
  elements.btnCloseDrawer.addEventListener('click', closeJobDetailsDrawer);
  elements.btnDrawerCloseBottom.addEventListener('click', closeJobDetailsDrawer);
  elements.drawerBackdrop.addEventListener('click', closeJobDetailsDrawer);
  elements.btnDrawerArchive.addEventListener('click', (e) => {
    const id = elements.btnDrawerArchive.getAttribute('data-id');
    if (id) handleArchiveApplication(id);
  });
  elements.btnCopyDescription.addEventListener('click', () => {
    const text = elements.drawerDescriptionText.textContent;
    if (text && text !== 'No job description stored for this position.') {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Job description copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Could not copy to clipboard', 'error');
      });
    }
  });

  // Modal: New Company
  elements.btnOpenNewCompany.addEventListener('click', openNewCompanyModal);
  elements.btnCloseNewCompany.addEventListener('click', closeNewCompanyModal);
  elements.btnCancelNewCompany.addEventListener('click', closeNewCompanyModal);
  elements.formNewCompany.addEventListener('submit', handleNewCompanySubmit);

  // Modal: Delete Confirm
  elements.btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);
  elements.btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // Close modals & drawer on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeJobDetailsDrawer();
      closeNewCompanyModal();
      closeDeleteConfirmModal();
    }
  });

  [elements.modalNewCompany, elements.modalDeleteConfirm].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Event Delegation for Table & Cards
  document.addEventListener('change', (e) => {
    const select = e.target.closest('select[data-action="inline-status"]');
    if (select) {
      const appId = select.getAttribute('data-app-id');
      const newStatusId = select.value;
      handleInlineStatusChange(appId, newStatusId, select);
    }
  });

  document.addEventListener('click', (e) => {
    // View Spec / Details Trigger
    const viewSpecBtn = e.target.closest('[data-action="view-spec"]');
    if (viewSpecBtn) {
      const id = viewSpecBtn.getAttribute('data-id');
      const isArchive = viewSpecBtn.getAttribute('data-archive') === 'true';
      openJobDetailsDrawer(id, isArchive);
      return;
    }

    // Archive Button
    const archiveBtn = e.target.closest('button[data-action="archive"]');
    if (archiveBtn) {
      const id = archiveBtn.getAttribute('data-id');
      handleArchiveApplication(id);
      return;
    }

    // Delete Archive Button
    const deleteBtn = e.target.closest('button[data-action="delete-archive"]');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      openDeleteConfirmModal(id);
      return;
    }
  });
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initConditionalBranding();

  if (elements.appliedDateInput) {
    elements.appliedDateInput.value = getTodayDateString();
  }

  setupEventListeners();
  loadInitialData();
});
