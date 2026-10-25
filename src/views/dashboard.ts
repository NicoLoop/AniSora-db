/**
 * AniSora Apo — Minimal Dark Theme API Documentation & Live Testing Console
 * Inspired by SlothUI / React Reference Documentation
 */

export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AniSora Apo — Documentation & API Reference</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-body: #0C0E12;
      --bg-header: #0C0E12;
      --bg-sidebar: #0C0E12;
      --bg-card: #14171F;
      --bg-card-hover: #1A1E29;
      --bg-card-subtle: #11131A;
      --bg-code: #080A0E;
      --border-subtle: #1D222E;
      --border-medium: #2A3142;
      --border-focus: #7C3AED;
      --accent-purple: #8B5CF6;
      --accent-purple-light: #A78BFA;
      --accent-purple-bg: rgba(139, 92, 246, 0.12);
      --accent-purple-border: rgba(139, 92, 246, 0.35);
      --accent-blue: #38BDF8;
      --accent-green: #34D399;
      --accent-green-bg: rgba(52, 211, 153, 0.12);
      --accent-red: #F87171;
      --accent-red-bg: rgba(248, 113, 113, 0.12);
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --text-dim: #64748B;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-body);
      color: var(--text-main);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Top Navigation Bar */
    .top-header {
      height: 64px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: #fff;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .brand-name {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }

    .version-pill {
      font-size: 11.5px;
      font-weight: 500;
      color: var(--text-dim);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      padding: 2px 8px;
      margin-left: 4px;
    }

    /* Center Search */
    .header-search-wrap {
      flex: 1;
      max-width: 440px;
      margin: 0 24px;
    }

    .header-search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #12151D;
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      padding: 7px 18px;
      color: var(--text-dim);
      font-size: 13.5px;
      cursor: pointer;
      transition: all 0.15s ease;
      width: 100%;
    }

    .header-search-bar:hover {
      border-color: var(--border-medium);
      color: var(--text-muted);
      background: #161A24;
    }

    .header-search-bar kbd {
      margin-left: auto;
      font-family: var(--font-mono);
      font-size: 11px;
      background: #090B0F;
      border: 1px solid var(--border-subtle);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Header Nav Links */
    .header-nav {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .nav-tab {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .nav-tab:hover {
      color: #fff;
    }

    .nav-tab.active {
      color: var(--accent-purple-light);
      background: var(--accent-purple-bg);
      font-weight: 600;
    }

    .header-icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .header-icon-btn:hover {
      color: #fff;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5, #06B6D4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
    }

    /* Docs Layout */
    .docs-container {
      display: flex;
      min-height: calc(100vh - 64px);
    }

    /* Left Sidebar */
    .left-sidebar {
      width: 270px;
      flex-shrink: 0;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
      overflow-y: auto;
      padding: 24px 14px 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .left-sidebar::-webkit-scrollbar {
      width: 4px;
    }
    .left-sidebar::-webkit-scrollbar-thumb {
      background: var(--border-subtle);
      border-radius: 2px;
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .section-title-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text-main);
      font-size: 14px;
      font-weight: 700;
      font-family: var(--font-sans);
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      transition: color 0.15s ease;
    }

    .section-title-btn:hover {
      color: #fff;
    }

    .section-title-btn .chevron {
      font-size: 11px;
      color: var(--text-dim);
      transition: transform 0.2s ease;
    }

    .section-title-btn.expanded .chevron {
      transform: rotate(180deg);
    }

    .sub-menu {
      display: none;
      flex-direction: column;
      gap: 2px;
      margin-top: 2px;
      padding-left: 4px;
    }

    .sub-menu.open {
      display: flex;
    }

    .sub-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 8px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .sub-menu-item:hover {
      color: #fff;
      background: var(--bg-card);
    }

    /* Active Item matching SlothUI style: subtle outline pill */
    .sub-menu-item.active {
      color: #fff;
      background: var(--accent-purple-bg);
      border: 1px solid var(--accent-purple-border);
      font-weight: 600;
    }

    .item-tag {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tag-new {
      background: rgba(139, 92, 246, 0.2);
      color: var(--accent-purple-light);
    }

    .tag-get {
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-blue);
    }

    /* Center Content Area */
    .center-content {
      flex: 1;
      padding: 36px 44px 80px;
      max-width: 860px;
      margin: 0 auto;
    }

    /* Breadcrumbs */
    .breadcrumbs-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-dim);
      margin-bottom: 16px;
    }

    .breadcrumbs-bar svg {
      width: 14px;
      height: 14px;
      color: var(--text-dim);
    }

    .breadcrumbs-bar span.active {
      color: var(--accent-purple-light);
      font-weight: 500;
    }

    /* Page Header */
    .endpoint-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }

    .endpoint-title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .endpoint-desc-lead {
      font-size: 15.5px;
      color: var(--text-muted);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    /* Signature Highlight Card */
    .signature-card {
      background: #11141C;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 18px;
      margin: 20px 0 32px;
      font-family: var(--font-mono);
      font-size: 13.5px;
      color: #F3F4F6;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sig-keyword {
      color: #F472B6;
      font-weight: 600;
    }

    .sig-fn {
      color: #818CF8;
    }

    .sig-args {
      color: var(--text-muted);
    }

    /* Section Headings */
    h2.content-heading {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin: 36px 0 16px;
      scroll-margin-top: 80px;
    }

    h3.sub-heading {
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font-mono);
      color: #E2E8F0;
      margin: 20px 0 8px;
    }

    /* Code Sandbox with Line Numbers */
    .code-sandbox-card {
      background: var(--bg-code);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      margin: 20px 0 32px;
      overflow: hidden;
    }

    .sandbox-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #10131B;
      border-bottom: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-dim);
    }

    .sandbox-body {
      display: flex;
      padding: 16px 0;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.65;
      overflow-x: auto;
    }

    .line-numbers {
      padding: 0 16px;
      color: var(--text-dim);
      user-select: none;
      text-align: right;
      border-right: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .code-lines {
      padding: 0 20px;
      color: #CBD5E1;
      white-space: pre;
      flex: 1;
    }

    .syntax-kw { color: #F472B6; }
    .syntax-fn { color: #818CF8; }
    .syntax-str { color: #34D399; }
    .syntax-comment { color: var(--text-dim); }

    /* Interactive API Request Box */
    .interactive-api-box {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      margin: 24px 0 32px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .api-url-bar {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #12151D;
      border-bottom: 1px solid var(--border-subtle);
    }

    .method-badge {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 5px;
      letter-spacing: 0.05em;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-blue);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .api-url-input {
      flex: 1;
      background: var(--bg-code);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 8px 14px;
      color: #fff;
      font-family: var(--font-mono);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .api-url-input:focus {
      border-color: var(--accent-purple);
    }

    .api-send-btn {
      background: var(--accent-purple);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease, transform 0.05s ease;
    }

    .api-send-btn:hover {
      background: #7C3AED;
    }

    .api-send-btn:active {
      transform: scale(0.98);
    }

    .api-status-bar {
      padding: 8px 18px;
      background: #0E1017;
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .status-badge {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-ok {
      background: var(--accent-green-bg);
      color: var(--accent-green);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .status-error {
      background: var(--accent-red-bg);
      color: var(--accent-red);
      border: 1px solid rgba(248, 113, 113, 0.3);
    }

    .api-response-pre {
      padding: 16px 18px;
      background: var(--bg-code);
      font-family: var(--font-mono);
      font-size: 12.5px;
      line-height: 1.55;
      color: #93C5FD;
      max-height: 440px;
      overflow: auto;
      white-space: pre;
    }

    /* Parameters Table */
    .params-table-wrap {
      width: 100%;
      overflow-x: auto;
      margin: 16px 0 28px;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      background: var(--bg-card);
    }

    table.params-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    table.params-table th {
      padding: 12px 16px;
      background: #11141C;
      border-bottom: 1px solid var(--border-subtle);
      color: #fff;
      font-weight: 600;
    }

    table.params-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-muted);
      vertical-align: top;
    }

    table.params-table tr:last-child td {
      border-bottom: none;
    }

    table.params-table code {
      background: var(--bg-code);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #fff;
    }

    /* Right Sidebar (On This Page) */
    .right-sidebar {
      width: 230px;
      flex-shrink: 0;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
      padding: 28px 18px 40px 10px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .toc-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }

    .toc-nav-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      list-style: none;
    }

    .toc-item-link {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: block;
    }

    .toc-item-link:hover {
      color: #fff;
    }

    /* Active TOC pill matching SlothUI screenshot */
    .toc-item-link.active {
      color: var(--accent-purple-light);
      background: var(--accent-purple-bg);
      font-weight: 600;
    }

    .toc-group-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-dim);
      margin: 12px 0 4px 12px;
    }

    /* Feedback Widget Card matching screenshot */
    .feedback-widget {
      margin-top: auto;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feedback-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #fff;
    }

    .feedback-desc {
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.4;
    }

    .feedback-actions {
      display: flex;
      gap: 8px;
    }

    .feedback-btn {
      flex: 1;
      background: #11141C;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 6px;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.15s ease;
    }

    .feedback-btn:hover {
      background: var(--bg-card-hover);
      color: #fff;
      border-color: var(--border-medium);
    }

    /* Global Search Modal */
    .search-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 999;
      align-items: flex-start;
      justify-content: center;
      padding-top: 90px;
    }

    .search-modal-backdrop.open { display: flex; }

    .search-modal-box {
      width: 90%;
      max-width: 560px;
      background: var(--bg-card);
      border: 1px solid var(--border-medium);
      border-radius: 12px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.7);
      overflow: hidden;
    }

    .search-modal-input {
      width: 100%;
      padding: 16px 20px;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border-subtle);
      color: #fff;
      font-size: 16px;
      outline: none;
      font-family: var(--font-sans);
    }

    .search-modal-results {
      max-height: 380px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .search-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.1s ease;
    }

    .search-item:hover {
      background: var(--bg-card-hover);
      color: #fff;
    }

    .search-item .item-title {
      font-size: 13.5px;
      color: #fff;
      font-weight: 500;
    }

    .search-item .item-path {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--text-dim);
      margin-left: auto;
    }

    @media (max-width: 1100px) {
      .right-sidebar { display: none; }
      .center-content { max-width: 100%; padding: 24px 20px; }
    }

    @media (max-width: 768px) {
      .left-sidebar { display: none; }
      .header-search-wrap { display: none; }
      .center-content { padding: 18px 14px; }
    }
  </style>
</head>
<body>

  <!-- Top Navigation Bar -->
  <header class="top-header">
    <div style="display: flex; align-items: center; gap: 12px;">
      <a href="javascript:void(0)" onclick="selectDocPage('welcome')" class="brand-wrap">
        <div class="brand-icon">A</div>
        <span class="brand-name">AniSora Apo</span>
        <span class="version-pill">v1.8.2</span>
      </a>
    </div>

    <!-- Search Input Bar -->
    <div class="header-search-wrap">
      <div class="header-search-bar" id="openSearchBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Search anything...</span>
        <kbd>Ctrl K</kbd>
      </div>
    </div>

    <!-- Top Navigation Links -->
    <div class="header-nav">
      <a href="javascript:void(0)" onclick="selectDocPage('welcome')" class="nav-tab">Learn</a>
      <a href="javascript:void(0)" onclick="selectDocPage('endpoint-home')" class="nav-tab active">Reference</a>
      <a href="https://github.com" target="_blank" class="nav-tab">Community</a>

      <button class="header-icon-btn" title="Toggle Theme">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>

      <div class="user-avatar" title="AniSora Apo Developer">S</div>
    </div>
  </header>

  <!-- Docs Body Container -->
  <div class="docs-container">

    <!-- Left Sidebar: Minimized/Collapsed by default -->
    <aside class="left-sidebar">

      <!-- Section: Overview -->
      <div class="sidebar-section">
        <div style="font-size: 18px; font-weight: 700; color: #fff; padding: 4px 10px 8px;">Overview</div>
        <div class="sub-menu-item active" id="item-welcome" onclick="selectDocPage('welcome')">
          <span>Introduction</span>
        </div>
        <div class="sub-menu-item" id="item-quickstart" onclick="selectDocPage('quickstart')">
          <span>Quickstart</span>
        </div>
        <div class="sub-menu-item" id="item-configuration" onclick="selectDocPage('configuration')">
          <span>Configuration</span>
        </div>
        <div class="sub-menu-item" id="item-deployment" onclick="selectDocPage('deployment')">
          <span>Deployment</span>
        </div>
        <div class="sub-menu-item" id="item-conventions" onclick="selectDocPage('conventions')">
          <span>Conventions</span>
        </div>
      </div>

      <!-- Section: ID Mappings (Minimized) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accIdMappings', this)">
          <span>ID Mappings</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accIdMappings">
          <div class="sub-menu-item" id="item-anilist-sync" onclick="selectDocPage('anilist-sync')">
            <span>AniList Sync</span>
            <span class="item-tag tag-new">New</span>
          </div>
          <div class="sub-menu-item" id="item-hianime-sync" onclick="selectDocPage('hianime-sync')">
            <span>HiAnime Sync</span>
            <span class="item-tag tag-get">GET</span>
          </div>
        </div>
      </div>

      <!-- Section: Provider: Anime -> HiAnime (Minimized) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accAnime', this)">
          <span>Anime (HiAnime)</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accAnime">
          <div class="sub-menu-item" id="item-home" onclick="selectDocPage('home')">
            <span>Home Highlights</span>
          </div>
          <div class="sub-menu-item" id="item-details" onclick="selectDocPage('details')">
            <span>Anime Details</span>
          </div>
          <div class="sub-menu-item" id="item-episodes" onclick="selectDocPage('episodes')">
            <span>Episodes List</span>
          </div>
          <div class="sub-menu-item" id="item-servers" onclick="selectDocPage('servers')">
            <span>Episode Servers</span>
          </div>
          <div class="sub-menu-item" id="item-downloads" onclick="selectDocPage('downloads')">
            <span>Downloads</span>
          </div>
          <div class="sub-menu-item" id="item-suggestions" onclick="selectDocPage('suggestions')">
            <span>Search Suggestions</span>
          </div>
          <div class="sub-menu-item" id="item-search" onclick="selectDocPage('search')">
            <span>Catalog Search</span>
          </div>
          <div class="sub-menu-item" id="item-filter-options" onclick="selectDocPage('filter-options')">
            <span>Filter Options</span>
          </div>
          <div class="sub-menu-item" id="item-schedule" onclick="selectDocPage('schedule')">
            <span>Airing Schedule</span>
          </div>
          <div class="sub-menu-item" id="item-subbed" onclick="selectDocPage('subbed')">
            <span>Subbed Anime</span>
          </div>
          <div class="sub-menu-item" id="item-dubbed" onclick="selectDocPage('dubbed')">
            <span>Dubbed Anime</span>
          </div>
          <div class="sub-menu-item" id="item-popular" onclick="selectDocPage('popular')">
            <span>Most Popular</span>
          </div>
          <div class="sub-menu-item" id="item-movies" onclick="selectDocPage('movies')">
            <span>Anime Movies</span>
          </div>
          <div class="sub-menu-item" id="item-tv" onclick="selectDocPage('tv')">
            <span>TV Series</span>
          </div>
          <div class="sub-menu-item" id="item-genres" onclick="selectDocPage('genres')">
            <span>Genres</span>
          </div>
          <div class="sub-menu-item" id="item-az" onclick="selectDocPage('az')">
            <span>A-Z Directory</span>
          </div>
          <div class="sub-menu-item" id="item-random" onclick="selectDocPage('random')">
            <span>Random Anime</span>
          </div>
          <div class="sub-menu-item" id="item-mirrors" onclick="selectDocPage('mirrors')">
            <span>Active Mirrors</span>
          </div>
        </div>
      </div>

      <!-- Section: Provider: Anime -> AniList (GraphQL) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accAniList', this)">
          <span>Anime (AniList)</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accAniList">
          <div class="sub-menu-item" id="item-anilist-home" onclick="selectDocPage('anilist-home')">
            <span>Home Highlights</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-trending" onclick="selectDocPage('anilist-trending')">
            <span>Trending Anime</span>
            <span class="item-tag tag-new">GQL</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-popular" onclick="selectDocPage('anilist-popular')">
            <span>Most Popular</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-top-rated" onclick="selectDocPage('anilist-top-rated')">
            <span>Top Rated</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-details" onclick="selectDocPage('anilist-details')">
            <span>Anime Details</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-episodes" onclick="selectDocPage('anilist-episodes')">
            <span>Episodes List</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-genres" onclick="selectDocPage('anilist-genres')">
            <span>Genres</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-az" onclick="selectDocPage('anilist-az')">
            <span>A-Z Directory</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-suggestions" onclick="selectDocPage('anilist-suggestions')">
            <span>Search Suggestions</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-search" onclick="selectDocPage('anilist-search')">
            <span>Catalog Search</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-schedule" onclick="selectDocPage('anilist-schedule')">
            <span>Airing Schedule</span>
          </div>
          <div class="sub-menu-item" id="item-anilist-random" onclick="selectDocPage('anilist-random')">
            <span>Random Anime</span>
          </div>
        </div>
      </div>

      <!-- Section: Provider: Anime -> MyAnimeList (MAL - Jikan) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accMAL', this)">
          <span>Anime (MyAnimeList - MAL)</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accMAL">
          <div class="sub-menu-item" id="item-mal-home" onclick="selectDocPage('mal-home')">
            <span>Home Highlights</span>
          </div>
          <div class="sub-menu-item" id="item-mal-trending" onclick="selectDocPage('mal-trending')">
            <span>Trending Anime</span>
            <span class="item-tag tag-new">Jikan</span>
          </div>
          <div class="sub-menu-item" id="item-mal-popular" onclick="selectDocPage('mal-popular')">
            <span>Most Popular</span>
          </div>
          <div class="sub-menu-item" id="item-mal-top-rated" onclick="selectDocPage('mal-top-rated')">
            <span>Top Rated</span>
          </div>
          <div class="sub-menu-item" id="item-mal-details" onclick="selectDocPage('mal-details')">
            <span>Anime Details</span>
          </div>
          <div class="sub-menu-item" id="item-mal-episodes" onclick="selectDocPage('mal-episodes')">
            <span>Episodes List</span>
          </div>
          <div class="sub-menu-item" id="item-mal-genres" onclick="selectDocPage('mal-genres')">
            <span>Genres</span>
          </div>
          <div class="sub-menu-item" id="item-mal-az" onclick="selectDocPage('mal-az')">
            <span>A-Z Directory</span>
          </div>
          <div class="sub-menu-item" id="item-mal-suggestions" onclick="selectDocPage('mal-suggestions')">
            <span>Search Suggestions</span>
          </div>
          <div class="sub-menu-item" id="item-mal-search" onclick="selectDocPage('mal-search')">
            <span>Catalog Search</span>
          </div>
          <div class="sub-menu-item" id="item-mal-schedule" onclick="selectDocPage('mal-schedule')">
            <span>Airing Schedule</span>
          </div>
          <div class="sub-menu-item" id="item-mal-random" onclick="selectDocPage('mal-random')">
            <span>Random Anime</span>
          </div>
          <div class="sub-menu-item" id="item-mal-sync" onclick="selectDocPage('mal-sync')">
            <span>Reverse Sync (MAL ID)</span>
          </div>
        </div>
      </div>

      <!-- Section: Provider: Anime -> Miruro -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accMiruro', this)">
          <span>Anime (Miruro)</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accMiruro">
          <div class="sub-menu-item" id="item-miruro-home" onclick="selectDocPage('miruro-home')">
            <span>Home Highlights</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-trending" onclick="selectDocPage('miruro-trending')">
            <span>Trending Anime</span>
            <span class="item-tag tag-new">Miruro</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-popular" onclick="selectDocPage('miruro-popular')">
            <span>Most Popular</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-top-rated" onclick="selectDocPage('miruro-top-rated')">
            <span>Top Rated</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-top-airing" onclick="selectDocPage('miruro-top-airing')">
            <span>Top Airing</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-details" onclick="selectDocPage('miruro-details')">
            <span>Anime Details</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-episodes" onclick="selectDocPage('miruro-episodes')">
            <span>Episodes List</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-servers" onclick="selectDocPage('miruro-servers')">
            <span>Episode Servers</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-embed" onclick="selectDocPage('miruro-embed')">
            <span>Embed / Sources</span>
            <span class="item-tag tag-new">Embed</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-stream" onclick="selectDocPage('miruro-stream')">
            <span>Direct Stream (Proxy)</span>
            <span class="item-tag tag-new" style="background: rgba(52, 211, 153, 0.2); color: #34d399;">M3U8</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-genres" onclick="selectDocPage('miruro-genres')">
            <span>Genres</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-az" onclick="selectDocPage('miruro-az')">
            <span>A-Z Directory</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-suggestions" onclick="selectDocPage('miruro-suggestions')">
            <span>Search Suggestions</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-search" onclick="selectDocPage('miruro-search')">
            <span>Catalog Search</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-schedule" onclick="selectDocPage('miruro-schedule')">
            <span>Airing Schedule</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-random" onclick="selectDocPage('miruro-random')">
            <span>Random Anime</span>
          </div>
          <div class="sub-menu-item" id="item-miruro-sync" onclick="selectDocPage('miruro-sync')">
            <span>Reverse Sync (Miruro ID)</span>
          </div>
        </div>
      </div>


      <!-- Section: Provider: Stream (Minimized) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accStream', this)">
          <span>Stream Providers</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accStream">
          <div class="sub-menu-item" id="item-universal-embed" onclick="selectDocPage('universal-embed')">
            <span>Universal Embed</span>
            <span class="item-tag tag-new" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">NEW</span>
          </div>
          <div class="sub-menu-item" id="item-aniskip" onclick="selectDocPage('aniskip')">
            <span>AniSkip Times</span>
            <span class="item-tag tag-new" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">SKIP</span>
          </div>
          <div class="sub-menu-item" id="item-stream-miruro" onclick="selectDocPage('miruro-stream')">
            <span>Miruro Direct</span>
            <span class="item-tag tag-new" style="background: rgba(52, 211, 153, 0.2); color: #34d399;">M3U8</span>
          </div>
          <div class="sub-menu-item" id="item-stream-animepahe" onclick="selectDocPage('stream-animepahe')">
            <span>AnimePahe</span>
            <span class="item-tag tag-new">M3U8</span>
          </div>
          <div class="sub-menu-item" id="item-stream-anitaku" onclick="selectDocPage('stream-anitaku')">
            <span>Anitaku</span>
            <span class="item-tag tag-new">HD-2</span>
          </div>
          <div class="sub-menu-item" id="item-stream-aniwave" onclick="selectDocPage('stream-aniwave')">
            <span>Aniwave</span>
            <span class="item-tag tag-new">Vidplay</span>
          </div>
          <div class="sub-menu-item" id="item-stream-zoko" onclick="selectDocPage('stream-zoko')">
            <span>ZokoAnime</span>
          </div>
          <div class="sub-menu-item" id="item-stream-hd1" onclick="selectDocPage('stream-hd1')">
            <span>MegaPlay HD-1</span>
          </div>
        </div>
      </div>

      <!-- Section: Core & Proxy (Minimized) -->
      <div class="sidebar-section">
        <button class="section-title-btn" onclick="toggleAccordion('accCore', this)">
          <span>Core & Proxy</span>
          <span class="chevron">▼</span>
        </button>
        <div class="sub-menu" id="accCore">
          <div class="sub-menu-item" id="item-stream-proxy" onclick="selectDocPage('stream-proxy')">
            <span>Stream Proxy</span>
            <span class="item-tag" style="background: rgba(234, 179, 8, 0.15); color: #FACC15;">WIP</span>
          </div>
          <div class="sub-menu-item" id="item-health" onclick="selectDocPage('health')">
            <span>Service Health</span>
          </div>
        </div>
      </div>

    </aside>

    <!-- Center Content: Separated page for each endpoint -->
    <main class="center-content" id="docMainArea">
      <div class="breadcrumbs-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span></span><span class="">Home</span><span> › </span><span class="">Overview</span><span> › </span><span class="active">Introduction</span>
      </div>
      <div class="endpoint-header" id="sec-overview">
        <h1 class="endpoint-title">
          <span>Introduction</span>
        </h1>
      </div>
      <p class="endpoint-desc-lead">AniSora Apo is an open-source, ultra-fast anime streaming extraction and metadata scraping API that returns structured JSON and playable video streams.</p>
      <div class="signature-card">
        <span class="sig-keyword">endpoint</span>
        <span class="sig-fn">AniSora Apo v1.8.2</span>
      </div>
      <h2 class="content-heading" id="sec-reference">Reference</h2>
      <h3 class="sub-heading">AniSora Apo v1.8.2</h3>
      <p style="color: var(--text-muted); margin-bottom: 20px;">AniSora Apo operates as a high-performance proxy and scraper in front of multiple content providers. Each provider features dedicated REST routes returning clean JSON: search results, episode lists, character casts with Japanese Seiyuu voice actors, and direct HLS (.m3u8) video streaming links.</p>
      <div class="code-sandbox-card">
        <div class="sandbox-header">
          <span>Example Usage</span>
          <button class="header-icon-btn" onclick="copyCurrentSnippet()">Copy</button>
        </div>
        <div class="sandbox-body">
          <div class="line-numbers">
            <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div>
          </div>
          <div class="code-lines">
            <div><span class="syntax-comment">// Start your local server</span></div>
            <div>npm run dev</div>
            <div>&nbsp;</div>
            <div><span class="syntax-comment">// Query AniSora Apo API</span></div>
            <div>curl http://localhost:4000/api/v1/hianime/home</div>
          </div>
        </div>
      </div>
      <h2 class="content-heading" id="sec-capabilities">Core Capabilities</h2>
      <div class="params-table-wrap">
        <table class="params-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Providers</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Anime Catalog</strong></td>
              <td>HiAnime (Multiple fallback mirrors)</td>
              <td>Trending, schedules, details, episode servers</td>
            </tr>
            <tr>
              <td><strong>Bidirectional ID Sync</strong></td>
              <td>AniList GraphQL + AniZip</td>
              <td>Cross-database mapping, voice actors, trailers</td>
            </tr>
            <tr>
              <td><strong>Direct Streaming</strong></td>
              <td>AnimePahe, Anitaku, Aniwave, Zoko, HD-1</td>
              <td>Master .m3u8 playlists, subtitles, skip intervals</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Right Sidebar (On This Page) -->
    <aside class="right-sidebar">
      <div>
        <div class="toc-title">On This Page</div>
        <ul class="toc-nav-list" id="tocNavContainer">
          <li><a href="#sec-overview" class="toc-item-link active">Overview</a></li>
          <li><a href="#sec-reference" class="toc-item-link">Reference</a></li>
          <li><a href="#sec-capabilities" class="toc-item-link">Core Capabilities</a></li>
        </ul>
      </div>

      <!-- Feedback Widget Card matching screenshot -->
      <div class="feedback-widget">
        <div class="feedback-title">Is this page useful?</div>
        <div class="feedback-desc">Help us improve AniSora Apo documentation by providing feedback.</div>
        <div class="feedback-actions">
          <button class="feedback-btn" onclick="onFeedback('yes')">👍</button>
          <button class="feedback-btn" onclick="onFeedback('no')">👎</button>
        </div>
      </div>
    </aside>

  </div>

  <!-- Search Modal -->
  <div class="search-modal-backdrop" id="searchModal">
    <div class="search-modal-box">
      <input type="text" class="search-modal-input" id="searchModalInput" placeholder="Search any endpoint, function, or keyword..." />
      <div class="search-modal-results" id="searchModalResults"></div>
    </div>
  </div>

  <script>
    // Centralized Documentation & Endpoint Registry
    const DOCS_DATA = {
      'welcome': {
        title: 'Introduction',
        breadcrumb: ['Home', 'Overview', 'Introduction'],
        desc: 'AniSora Apo is an open-source, ultra-fast anime streaming extraction and metadata scraping API that returns structured JSON and playable video streams.',
        codeSnippet: \`// Start your local server
npm run dev

// Query AniSora Apo API
curl http://localhost:4000/api/v1/hianime/home\`,
        referenceSignature: 'AniSora Apo v1.8.2',
        explanation: 'AniSora Apo operates as a high-performance proxy and scraper in front of multiple content providers. Each provider features dedicated REST routes returning clean JSON: search results, episode lists, character casts with Japanese Seiyuu voice actors, and direct HLS (.m3u8) video streaming links.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Reference', id: 'sec-reference' },
          { label: 'Core Capabilities', id: 'sec-capabilities' }
        ],
        extraHtml: \`
          <h2 class="content-heading" id="sec-capabilities">Core Capabilities</h2>
          <div class="params-table-wrap">
            <table class="params-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Providers</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Anime Catalog</strong></td>
                  <td>HiAnime (Multiple fallback mirrors)</td>
                  <td>Trending, schedules, details, episode servers</td>
                </tr>
                <tr>
                  <td><strong>Bidirectional ID Sync</strong></td>
                  <td>AniList GraphQL + AniZip</td>
                  <td>Cross-database mapping, voice actors, trailers</td>
                </tr>
                <tr>
                  <td><strong>Direct Streaming</strong></td>
                  <td>AnimePahe, Anitaku, Aniwave, Zoko, HD-1</td>
                  <td>Master .m3u8 playlists, subtitles, skip intervals</td>
                </tr>
              </tbody>
            </table>
          </div>
        \`
      },

      'quickstart': {
        title: 'Quickstart',
        breadcrumb: ['Home', 'Overview', 'Quickstart'],
        desc: 'Get AniSora Apo running on your machine in under two minutes.',
        codeSnippet: \`git clone https://github.com/CoorenLabs/CoorenLabs.git
cd CoorenLabs
npm install
npm run dev\`,
        referenceSignature: 'Run Locally (Node.js 18+ or Bun 1.4+)',
        explanation: 'This page gets the API running on your machine. To run in production with automated container orchestration, see Deployment.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Reference', id: 'sec-reference' }
        ]
      },

      'configuration': {
        title: 'Configuration',
        breadcrumb: ['Home', 'Overview', 'Configuration'],
        desc: 'Every environment variable AniSora Apo reads, with defaults.',
        codeSnippet: \`PORT=4000
NODE_ENV=development
HIANIME_BASE_URL=https://hianime.to
MIRRORS=https://hianime.to,https://hianime.at,https://hianime.mn
REQUEST_TIMEOUT_MS=15000\`,
        referenceSignature: 'Environment Variables (.env)',
        explanation: 'Configure AniSora Apo via .env variables. Copy .env.example to .env to begin.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Variables', id: 'sec-reference' }
        ]
      },

      'deployment': {
        title: 'Deployment',
        breadcrumb: ['Home', 'Overview', 'Deployment'],
        desc: 'Run AniSora Apo in production using Docker Compose or Node.js process managers.',
        codeSnippet: \`# Build & launch containerized API
docker compose up -d --build\`,
        referenceSignature: 'Production Deployment',
        explanation: 'Docker Compose bundles everything the providers need: Node/Bun runtime, Chromium for bypasses, and in-memory caches.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Docker Compose', id: 'sec-reference' }
        ]
      },

      'conventions': {
        title: 'Conventions',
        breadcrumb: ['Home', 'Overview', 'Conventions'],
        desc: 'Structured response envelopes, error schemas, and parameter routing.',
        codeSnippet: \`{
  "success": true,
  "data": { ... }
}\`,
        referenceSignature: 'Standard Response Envelope',
        explanation: 'Every API endpoint returns a standard JSON payload with success flags and HTTP status codes.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Schemas', id: 'sec-reference' }
        ]
      },

      'stream-proxy': {
        title: 'Stream Proxy',
        breadcrumb: ['Home', 'Core & Proxy', 'Stream Proxy'],
        desc: 'Built-in video proxy engine for handling HLS (.m3u8) video playlists and TS segments with custom CORS headers.',
        codeSnippet: \`// Upcloud / Vidnest CORS & Referer Spoofing Proxy
curl "https://upcloud.animanga.fun/proxy?url=https%3A%2F%2Fmegap.shiora.top%2Fmaster.m3u8&headers=%7B%22referer%22%3A%22https%3A%2F%2Fmegaplay.buzz%2F%22%7D"\`,
        referenceSignature: 'CORS & Referer Spoofing Proxy',
        explanation: 'Under active development: rewrites upstream TS segment transport URIs and injects valid Referer/Origin headers.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Roadmap', id: 'sec-reference' }
        ]
      },

      'health': {
        title: 'Service Health',
        breadcrumb: ['Home', 'Core & Proxy', 'Service Health'],
        desc: 'System uptime, memory statistics, and upstream mirror availability.',
        endpointUrl: '/health',
        codeSnippet: \`curl http://localhost:4000/health\`,
        referenceSignature: 'GET /health',
        explanation: 'Returns the active scraping mirror and current service uptime.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Live Console', id: 'sec-reference' }
        ]
      },

      // ID MAPPINGS
      'anilist-sync': {
        title: 'AniList Reverse Sync',
        breadcrumb: ['Home', 'ID Mappings', 'AniList Sync'],
        desc: 'Resolves HiAnime data from a numeric AniList ID with candidate title scoring, episode statistics, and poster art.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/sync/20958',
        codeSnippet: \`import { fetch } from 'undici';

// Reverse sync AniList ID 20958 (Attack on Titan Season 2)
const res = await fetch('http://localhost:4000/api/v1/anilist/sync/20958');
const data = await res.json();
console.log(data.data.hianime.name); // "Attack on Titan Season 2"\`,
        referenceSignature: 'GET /api/v1/anilist/sync/:anilistId',
        explanation: 'Takes an AniList ID, fetches official titles from AniList GraphQL and AniZip, queries HiAnime with candidate similarity scoring, and returns the full HiAnime details.',
        params: [
          { name: 'anilistId', in: 'path or query', type: 'number', req: true, desc: 'Numeric AniList ID (e.g. 20958 for AoT S2, 21 for One Piece, 195604 for Black Clover S2)' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'hianime-sync': {
        title: 'HiAnime Sync',
        breadcrumb: ['Home', 'ID Mappings', 'HiAnime Sync'],
        desc: 'Resolves AniList metadata from a HiAnime slug/ID, including Seiyuu voice actors, trailers, staff, and AniZip mappings.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/anime/sync/attack-on-titan-season-2-865',
        codeSnippet: \`// Sync from HiAnime slug
const res = await fetch('http://localhost:4000/api/v1/hianime/anime/sync/attack-on-titan-season-2-865');
const { data } = await res.json();
console.log(data.anilistId); // 20958\`,
        referenceSignature: 'GET /api/v1/hianime/anime/sync/:animeId',
        explanation: 'Scrapes the official name and jname from HiAnime, queries AniList GraphQL, scores matches, and returns rich AniList data.',
        params: [
          { name: 'animeId', in: 'path or query', type: 'string', req: true, desc: 'HiAnime anime slug (e.g. one-piece-1, attack-on-titan-season-2-865)' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      // ANILIST PROVIDER (GRAPHQL)
      'anilist-home': {
        title: 'AniList Home Highlights',
        breadcrumb: ['Home', 'AniList', 'Home Highlights'],
        desc: 'AniList GraphQL homepage feed with spotlight banners, trending anime, top airing, upcoming, and genres.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/home',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/home');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/anilist/home',
        explanation: 'Queries AniList GraphQL in a single request returning trending anime, spotlight media with descriptions, and genre lists.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-trending': {
        title: 'AniList Trending Anime',
        breadcrumb: ['Home', 'AniList', 'Trending'],
        desc: 'Real-time trending anime titles according to AniList community activity.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/trending?page=1&perPage=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/trending?page=1&perPage=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/anilist/trending?page=:page&perPage=:perPage',
        explanation: 'Returns trending anime sorted by TRENDING_DESC with cover art, format, score, and episode counts.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number (default: 1)' },
          { name: 'perPage', in: 'query', type: 'number', req: false, desc: 'Results per page (default: 20, max: 50)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-popular': {
        title: 'AniList Most Popular',
        breadcrumb: ['Home', 'AniList', 'Most Popular'],
        desc: 'All-time most popular anime titles on AniList.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/popular?page=1&perPage=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/popular?page=1&perPage=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/anilist/popular?page=:page',
        explanation: 'Fetches anime sorted by POPULARITY_DESC.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number (default: 1)' },
          { name: 'perPage', in: 'query', type: 'number', req: false, desc: 'Results per page (default: 20)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-top-rated': {
        title: 'AniList Top Rated',
        breadcrumb: ['Home', 'AniList', 'Top Rated'],
        desc: 'Top score anime titles according to AniList community ratings.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/top-rated?page=1&perPage=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/top-rated?page=1&perPage=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/anilist/top-rated?page=:page',
        explanation: 'Fetches anime sorted by SCORE_DESC.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-details': {
        title: 'AniList Anime Details',
        breadcrumb: ['Home', 'AniList', 'Anime Details'],
        desc: 'Full AniList anime metadata: English & Japanese titles, description, characters, Seiyuu voice actors, trailer, and relations.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/anime/21',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/anime/21');
const { data } = await res.json();
console.log(data.name, data.characters.length);\`,
        referenceSignature: 'GET /api/v1/anilist/anime/:id',
        explanation: 'Queries full Media information by numeric AniList ID.',
        params: [
          { name: 'id', in: 'path', type: 'number', req: true, desc: 'Numeric AniList ID (e.g. 21 for One Piece, 16498 for Attack on Titan)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-episodes': {
        title: 'AniList Episodes List',
        breadcrumb: ['Home', 'AniList', 'Episodes List'],
        desc: 'Complete list of episodes with titles, episode numbers, screencap thumbnails, and next airing countdown.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/episodes/21',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/episodes/21');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/anilist/episodes/:id',
        explanation: 'Merges AniList streamingEpisodes with AniZip mapping for rich localized episode titles and thumbnails.',
        params: [
          { name: 'id', in: 'path', type: 'number', req: true, desc: 'Numeric AniList ID' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-genres': {
        title: 'AniList Genres & Listing',
        breadcrumb: ['Home', 'AniList', 'Genres'],
        desc: 'Explore official AniList genres and anime filtered by genre.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/genres/Action?page=1&perPage=10',
        codeSnippet: \`// Get all genres
const genresRes = await fetch('http://localhost:4000/api/v1/anilist/genres');
const { data: { genres } } = await genresRes.json();

// Get anime by genre
const actionRes = await fetch('http://localhost:4000/api/v1/anilist/genres/Action?page=1');\`,
        referenceSignature: 'GET /api/v1/anilist/genres/:genre?page=:page',
        explanation: 'Returns anime categorized by official AniList genre collection.',
        params: [
          { name: 'genre', in: 'path', type: 'string', req: true, desc: 'Genre name (e.g. Action, Romance, Fantasy)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-az': {
        title: 'AniList A-Z Directory',
        breadcrumb: ['Home', 'AniList', 'A-Z Directory'],
        desc: 'Alphabetical anime directory filtering by starting character.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/az-list/A?page=1&perPage=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/az-list/A?page=1');\`,
        referenceSignature: 'GET /api/v1/anilist/az-list/:letter?page=:page',
        explanation: 'Filters catalog by initial letter (A-Z, 0-9, other, or all).',
        params: [
          { name: 'letter', in: 'path', type: 'string', req: true, desc: 'Letter (e.g. A, B, 0-9, all)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-suggestions': {
        title: 'AniList Search Suggestions',
        breadcrumb: ['Home', 'AniList', 'Search Suggestions'],
        desc: 'Instant typeahead suggestions with posters, format, score, and release year.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/search/suggestions?keyword=naruto',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/search/suggestions?keyword=naruto');\`,
        referenceSignature: 'GET /api/v1/anilist/search/suggestions?keyword=:keyword',
        explanation: 'Fast autocomplete search powered by AniList SEARCH_MATCH.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: true, desc: 'Search term' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-search': {
        title: 'AniList Catalog Search & Filter',
        breadcrumb: ['Home', 'AniList', 'Catalog Search'],
        desc: 'Multi-criteria anime search supporting keyword, format, genre, status, season, and year.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/search?keyword=naruto&page=1&perPage=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/search?keyword=naruto&format=TV');\`,
        referenceSignature: 'GET /api/v1/anilist/search?keyword=:keyword&format=:format&genre=:genre',
        explanation: 'Comprehensive catalog search with pagination and multi-parameter filtering.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: false, desc: 'Search query' },
          { name: 'format', in: 'query', type: 'string', req: false, desc: 'Format (TV, MOVIE, OVA, ONA)' },
          { name: 'genre', in: 'query', type: 'string', req: false, desc: 'Genre' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-schedule': {
        title: 'AniList Airing Schedule',
        breadcrumb: ['Home', 'AniList', 'Schedule'],
        desc: 'Live broadcast schedule of upcoming anime episodes with countdowns.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/schedule',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/schedule');\`,
        referenceSignature: 'GET /api/v1/anilist/schedule?date=:date',
        explanation: 'Queries AniList AiringSchedule sorted by broadcast time for any specified date.',
        params: [
          { name: 'date', in: 'query', type: 'string', req: false, desc: 'Date (YYYY-MM-DD)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'anilist-random': {
        title: 'AniList Random Anime',
        breadcrumb: ['Home', 'AniList', 'Random Anime'],
        desc: 'Surprise recommendation from the top anime catalog.',
        method: 'GET',
        endpointUrl: '/api/v1/anilist/random',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/anilist/random');\`,
        referenceSignature: 'GET /api/v1/anilist/random',
        explanation: 'Selects a random popular anime and returns complete media details.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      // MYANIMELIST (MAL - JIKAN) PROVIDER
      'mal-home': {
        title: 'MyAnimeList Home Highlights',
        breadcrumb: ['Home', 'MyAnimeList', 'Home Highlights'],
        desc: 'MyAnimeList / Jikan homepage feed highlighting top airing, most popular, top rated, upcoming anime, and genres.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/home',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/home');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/mal/home',
        explanation: 'Returns grouped highlights mapped to Jikan v4 schemas for modern anime apps.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-trending': {
        title: 'MAL Trending Anime (Top Airing)',
        breadcrumb: ['Home', 'MyAnimeList', 'Trending'],
        desc: 'Real-time trending currently airing anime titles according to MyAnimeList ratings and popularity.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/trending?page=1&limit=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/trending?page=1&limit=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/mal/trending?page=:page&limit=:limit',
        explanation: 'Fetches top currently airing anime with Jikan pagination and image links.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number (default: 1)' },
          { name: 'limit', in: 'query', type: 'number', req: false, desc: 'Results per page (default: 25, max: 50)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-popular': {
        title: 'MAL Most Popular Anime',
        breadcrumb: ['Home', 'MyAnimeList', 'Most Popular'],
        desc: 'All-time most popular anime titles on MyAnimeList.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/popular?page=1&limit=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/popular?page=1&limit=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/mal/popular?page=:page&limit=:limit',
        explanation: 'Returns anime sorted by MAL member popularity.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' },
          { name: 'limit', in: 'query', type: 'number', req: false, desc: 'Results per page' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-top-rated': {
        title: 'MAL Top Rated Anime',
        breadcrumb: ['Home', 'MyAnimeList', 'Top Rated'],
        desc: 'Top score anime titles according to MyAnimeList community ratings.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/top-rated?page=1&limit=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/top-rated?page=1&limit=10');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/mal/top-rated?page=:page&limit=:limit',
        explanation: 'Returns top scored anime titles in official Jikan v4 format.',
        params: [
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' },
          { name: 'limit', in: 'query', type: 'number', req: false, desc: 'Results per page' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-details': {
        title: 'MAL Anime Details',
        breadcrumb: ['Home', 'MyAnimeList', 'Anime Details'],
        desc: 'Full MyAnimeList anime metadata: English & Japanese titles, description, studios, aired dates, scores, trailer, and relations.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/anime/1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/anime/1');
const { data } = await res.json();
console.log(data.title, data.score);\`,
        referenceSignature: 'GET /api/v1/mal/anime/:id',
        explanation: 'Fetches full anime media metadata by numeric MyAnimeList ID.',
        params: [
          { name: 'id', in: 'path', type: 'number', req: true, desc: 'Numeric MyAnimeList ID (e.g. 1 for Cowboy Bebop, 16498 for Attack on Titan)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-episodes': {
        title: 'MAL Episodes List',
        breadcrumb: ['Home', 'MyAnimeList', 'Episodes List'],
        desc: 'Complete list of episodes with titles in multiple languages, episode numbers, broadcast air dates, and thumbnails.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/episodes/1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/episodes/1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/mal/episodes/:id?page=:page',
        explanation: 'Returns pagination and episode items with English/Romanji/Japanese titles and HD screencaps.',
        params: [
          { name: 'id', in: 'path', type: 'number', req: true, desc: 'Numeric MyAnimeList ID' },
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number (default: 1)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-genres': {
        title: 'MAL Genres & Listing',
        breadcrumb: ['Home', 'MyAnimeList', 'Genres'],
        desc: 'Explore official MyAnimeList genres and anime filtered by genre.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/genres/Action?page=1&limit=10',
        codeSnippet: \`// Get all genres
const genresRes = await fetch('http://localhost:4000/api/v1/mal/genres');
const { data } = await genresRes.json();

// Get anime by genre
const actionRes = await fetch('http://localhost:4000/api/v1/mal/genres/Action?page=1');\`,
        referenceSignature: 'GET /api/v1/mal/genres/:genre?page=:page&limit=:limit',
        explanation: 'Returns anime categorized by official MyAnimeList genre taxonomy.',
        params: [
          { name: 'genre', in: 'path', type: 'string or number', req: true, desc: 'Genre name or numeric MAL genre ID (e.g. Action or 1)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-az': {
        title: 'MAL A-Z Directory',
        breadcrumb: ['Home', 'MyAnimeList', 'A-Z Directory'],
        desc: 'Alphabetical anime directory filtering by starting letter.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/az-list/A?page=1&limit=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/az-list/A?page=1');\`,
        referenceSignature: 'GET /api/v1/mal/az-list/:letter?page=:page',
        explanation: 'Filters catalog by initial character (A-Z, 0-9, or all).',
        params: [
          { name: 'letter', in: 'path', type: 'string', req: true, desc: 'Letter (e.g. A, B, 0-9, all)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-suggestions': {
        title: 'MAL Search Suggestions',
        breadcrumb: ['Home', 'MyAnimeList', 'Search Suggestions'],
        desc: 'Instant typeahead suggestions with images, format, and scores.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/search/suggestions?keyword=naruto',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/search/suggestions?keyword=naruto');\`,
        referenceSignature: 'GET /api/v1/mal/search/suggestions?keyword=:keyword',
        explanation: 'Fast autocomplete search for instant search bars and modals.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: true, desc: 'Search query' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-search': {
        title: 'MAL Catalog Search & Filter',
        breadcrumb: ['Home', 'MyAnimeList', 'Catalog Search'],
        desc: 'Multi-parameter catalog search supporting keyword, type, status, rating, genre, and order.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/search?keyword=naruto&type=tv&page=1&limit=10',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/search?keyword=naruto&type=tv');\`,
        referenceSignature: 'GET /api/v1/mal/search?keyword=:keyword&type=:type&status=:status',
        explanation: 'Search anime across the entire MyAnimeList database with Jikan filtering options.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: false, desc: 'Search query' },
          { name: 'type', in: 'query', type: 'string', req: false, desc: 'Type (tv, movie, ova, ona, special)' },
          { name: 'rating', in: 'query', type: 'string', req: false, desc: 'Age rating (g, pg, pg13, r17, r, rx)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-schedule': {
        title: 'MAL Airing Schedule',
        breadcrumb: ['Home', 'MyAnimeList', 'Schedule'],
        desc: 'Day-by-day broadcast schedule of upcoming anime releases.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/schedule?day=monday',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/schedule?day=monday');\`,
        referenceSignature: 'GET /api/v1/mal/schedule?day=:day',
        explanation: 'Queries airing schedule filtered by day of the week (monday, tuesday, etc.) or date.',
        params: [
          { name: 'day', in: 'query', type: 'string', req: false, desc: 'Day of week (monday..sunday) or YYYY-MM-DD' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-random': {
        title: 'MAL Random Anime',
        breadcrumb: ['Home', 'MyAnimeList', 'Random Anime'],
        desc: 'Surprise recommendation from the MyAnimeList catalog.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/random',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/random');\`,
        referenceSignature: 'GET /api/v1/mal/random',
        explanation: 'Randomly selects an anime entry and returns full Jikan metadata.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mal-sync': {
        title: 'MAL Reverse Sync',
        breadcrumb: ['Home', 'MyAnimeList', 'Reverse Sync'],
        desc: 'Maps a numeric MyAnimeList ID to HiAnime streaming sources, episode IDs, and server links.',
        method: 'GET',
        endpointUrl: '/api/v1/mal/sync/1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/mal/sync/1');
const { data } = await res.json();
console.log(data.hianime?.animeId);\`,
        referenceSignature: 'GET /api/v1/mal/sync/:malId',
        explanation: 'Takes a numeric MyAnimeList ID, queries mappings via AniZip and AniList, and matches to HiAnime streaming records.',
        params: [
          { name: 'malId', in: 'path', type: 'number', req: true, desc: 'Numeric MyAnimeList ID (e.g. 1 for Cowboy Bebop)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      // UNIVERSAL EMBED & STREAM ENDPOINT
      'universal-embed': {
        title: 'Universal Anime Embed & Streams',
        breadcrumb: ['Home', 'Stream Providers', 'Universal Embed'],
        desc: 'Universal streaming & embed aggregator. Resolves any anime ID (Miruro hash, AniList ID, MAL ID, HiAnime slug, or title) with episode number, cross-maps across all providers, and aggregates all available iframe embeds, HLS streams, subtitles, thumbnails, and downloads.',
        method: 'GET',
        endpointUrl: '/embed?id=21&ep=1&category=sub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/embed?id=21&ep=1');
const { data } = await res.json();
console.log(data.primaryEmbed.embedUrl, data.mappings);\`,
        referenceSignature: 'GET /embed?id=:id&ep=:ep&category=:cat&server=:srv',
        explanation: 'Universal aggregator resolving IDs and gathering embeds, HLS master playlists, and multi-lingual VTT subtitles from Miruro, HiAnime, MegaPlay, ZokoAnime, AnimePahe, Anitaku, and Aniwave.',
        params: [
          { name: 'id', in: 'query', type: 'string', req: true, desc: 'Miruro hash, AniList ID (21), MAL ID (21), HiAnime slug (one-piece-100), or title' },
          { name: 'ep', in: 'query', type: 'number', req: false, desc: 'Episode number (default: 1)' },
          { name: 'category', in: 'query', type: 'string', req: false, desc: 'sub, dub, or raw (default: sub)' },
          { name: 'server', in: 'query', type: 'string', req: false, desc: 'Optional server preference (e.g. animepahe, HD-1, ZokoAnime)' },
          { name: 'player', in: 'query', type: 'boolean', req: false, desc: 'Set to true for HTML player preview view' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      // MIRURO ENDPOINTS
      'miruro-home': {
        title: 'Miruro Home Highlights Feed',
        breadcrumb: ['Home', 'Miruro', 'Home Highlights'],
        desc: 'Miruro homepage highlights with spotlight carousel banners, top airing, latest releases, and upcoming anime.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/home',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/home');
const { data } = await res.json();
console.log(data.spotlights);\`,
        referenceSignature: 'GET /api/v1/miruro/home',
        explanation: 'Provides full hero banners, airing anime, dub releases, and trending rankings from Miruro.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-trending': {
        title: 'Miruro Trending Anime',
        breadcrumb: ['Home', 'Miruro', 'Trending Anime'],
        desc: 'Real-time trending anime titles on Miruro.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/trending?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/trending?page=1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/trending?page=:page',
        explanation: 'Returns real-time trending anime sorted by viewer engagement.',
        params: [{ name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-popular': {
        title: 'Miruro Most Popular Anime',
        breadcrumb: ['Home', 'Miruro', 'Most Popular'],
        desc: 'All-time popular anime titles on Miruro.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/popular?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/popular?page=1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/popular?page=:page',
        explanation: 'Returns all-time most popular anime.',
        params: [{ name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-top-rated': {
        title: 'Miruro Top Rated Anime',
        breadcrumb: ['Home', 'Miruro', 'Top Rated'],
        desc: 'Top score rated anime titles on Miruro.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/top-rated?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/top-rated?page=1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/top-rated?page=:page',
        explanation: 'Returns highest-rated anime series and movies.',
        params: [{ name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-top-airing': {
        title: 'Miruro Top Airing Anime',
        breadcrumb: ['Home', 'Miruro', 'Top Airing'],
        desc: 'Currently airing seasonal anime series on Miruro.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/top-airing?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/top-airing?page=1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/top-airing?page=:page',
        explanation: 'Returns top currently broadcasting anime.',
        params: [{ name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-details': {
        title: 'Miruro Anime Details',
        breadcrumb: ['Home', 'Miruro', 'Anime Details'],
        desc: 'Full anime details: title, poster, scores, synopsis, studios, genres, relations, and recommendations.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/anime/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/anime/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz');
const { data } = await res.json();
console.log(data.name, data.stats);\`,
        referenceSignature: 'GET /api/v1/miruro/anime/:id',
        explanation: 'Supports Miruro hash IDs, AniList numeric IDs (e.g. 21), MAL numeric IDs, or title slugs.',
        params: [{ name: 'id', in: 'path', type: 'string', req: true, desc: 'Miruro hash ID, AniList ID, MAL ID, or title slug' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-episodes': {
        title: 'Miruro Episodes List',
        breadcrumb: ['Home', 'Miruro', 'Episodes List'],
        desc: 'Complete episode list with titles, numbers, air dates, duration, and thumbnail images.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/episodes/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/episodes/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/episodes/:id',
        explanation: 'Returns all released episodes for the given anime.',
        params: [{ name: 'id', in: 'path', type: 'string', req: true, desc: 'Miruro ID or AniList ID' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-servers': {
        title: 'Miruro Episode Servers',
        breadcrumb: ['Home', 'Miruro', 'Episode Servers'],
        desc: 'Available video servers grouped by sub, dub, and raw.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/servers?episodeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz?ep=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/servers?episodeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz?ep=1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/miruro/servers?episodeId=:episodeId',
        explanation: 'Returns all servers and providers for an episode with embed availability indicators.',
        params: [{ name: 'episodeId', in: 'query', type: 'string', req: true, desc: 'Episode ID in format <miruroId>?ep=<num>' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-embed': {
        title: 'Miruro Embed URL & Sources',
        breadcrumb: ['Home', 'Miruro', 'Embed Sources'],
        desc: 'Extracts iframe embed URLs, multi-language subtitles, thumbnail VTT, and direct downloads.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/embed?animeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&episode=1&category=sub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/embed?animeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&episode=1&category=sub');
const { data } = await res.json();
console.log(data.embedUrl, data.subtitles);\`,
        referenceSignature: 'GET /api/v1/miruro/embed?animeId=:id&episode=:ep&category=:cat&server=:srv',
        explanation: 'Retrieves embed URL (kwik.cx, megaplay, vidplay, or miruro player), subtitles (.vtt), and downloads.',
        params: [
          { name: 'animeId', in: 'query', type: 'string', req: true, desc: 'Miruro ID or AniList ID' },
          { name: 'episode', in: 'query', type: 'number', req: false, desc: 'Episode number (default: 1)' },
          { name: 'category', in: 'query', type: 'string', req: false, desc: 'sub, dub, or raw (default: sub)' },
          { name: 'server', in: 'query', type: 'string', req: false, desc: 'Optional server name (e.g. animepahe, Vidstream-1, HD-1)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-stream': {
        title: 'Miruro Direct Stream (with Proxy)',
        breadcrumb: ['Home', 'Miruro', 'Direct Stream'],
        desc: 'Direct HLS (.m3u8) video stream extraction from Miruro with automatic CORS-safe streaming proxy and server selection.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1&category=sub&server=animepahe',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1&server=animepahe');
const { data } = await res.json();
console.log('Playable Proxied M3U8:', data.proxyM3U8);
console.log('Available Servers:', data.availableServers);
console.log('Subtitles:', data.subtitles);\`,
        referenceSignature: 'GET /api/v1/miruro/stream?id=:id&ep=:ep&server=:server&category=sub',
        explanation: 'Provides direct .m3u8 playlist streams wrapped in an ultra-fast proxy (https://upcloud.animanga.fun/proxy) to bypass CORS and referer hotlink protection. Pass ?server=... to pick your desired server or leave as auto.',
        params: [
          { name: 'id', in: 'query', type: 'string', req: true, desc: 'Miruro ID hash, slug, or AniList ID' },
          { name: 'ep', in: 'query', type: 'number', req: false, desc: 'Episode number (default: 1)' },
          { name: 'server', in: 'query', type: 'string', req: false, desc: 'Server name (e.g. animepahe, Vidplay, DatSaV, Cat, HD-1, MyCloud)' },
          { name: 'category', in: 'query', type: 'string', req: false, desc: 'sub, dub, or raw (default: sub)' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-genres': {
        title: 'Miruro Genres',
        breadcrumb: ['Home', 'Miruro', 'Genres'],
        desc: 'List of genres and anime filtered by genre.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/genres/Action?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/genres/Action?page=1');\`,
        referenceSignature: 'GET /api/v1/miruro/genres/:genre?page=:page',
        explanation: 'Filter anime by official Miruro genre categories.',
        params: [{ name: 'genre', in: 'path', type: 'string', req: true, desc: 'Genre name (e.g. Action, Comedy)' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-az': {
        title: 'Miruro A-Z Directory',
        breadcrumb: ['Home', 'Miruro', 'A-Z Directory'],
        desc: 'Alphabetical anime directory filtering by starting letter.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/az-list/A?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/az-list/A?page=1');\`,
        referenceSignature: 'GET /api/v1/miruro/az-list/:letter?page=:page',
        explanation: 'Filters catalog alphabetically.',
        params: [{ name: 'letter', in: 'path', type: 'string', req: true, desc: 'Letter (A-Z)' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-suggestions': {
        title: 'Miruro Search Suggestions',
        breadcrumb: ['Home', 'Miruro', 'Search Suggestions'],
        desc: 'Typeahead anime search suggestions.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/search/suggestions?keyword=naruto',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/search/suggestions?keyword=naruto');\`,
        referenceSignature: 'GET /api/v1/miruro/search/suggestions?keyword=:keyword',
        explanation: 'Fast autocomplete search suggestions with posters and format.',
        params: [{ name: 'keyword', in: 'query', type: 'string', req: true, desc: 'Search term' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-search': {
        title: 'Miruro Catalog Search & Filter',
        breadcrumb: ['Home', 'Miruro', 'Catalog Search'],
        desc: 'Search Miruro database with format, status, and genre filters.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/search?keyword=naruto&format=TV&page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/search?keyword=naruto');\`,
        referenceSignature: 'GET /api/v1/miruro/search?keyword=:keyword&format=:format&status=:status',
        explanation: 'Multi-criteria anime search on Miruro.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: false, desc: 'Search term' },
          { name: 'format', in: 'query', type: 'string', req: false, desc: 'TV, MOVIE, OVA, ONA, SPECIAL' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-schedule': {
        title: 'Miruro Airing Schedule',
        breadcrumb: ['Home', 'Miruro', 'Schedule'],
        desc: 'Weekly and daily release broadcast schedule.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/schedule',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/schedule');\`,
        referenceSignature: 'GET /api/v1/miruro/schedule?date=:date',
        explanation: 'Airing schedule filtered by date (YYYY-MM-DD).',
        params: [{ name: 'date', in: 'query', type: 'string', req: false, desc: 'Date (YYYY-MM-DD)' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-random': {
        title: 'Miruro Random Anime',
        breadcrumb: ['Home', 'Miruro', 'Random Anime'],
        desc: 'Surprise anime recommendation from Miruro.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/random',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/random');\`,
        referenceSignature: 'GET /api/v1/miruro/random',
        explanation: 'Random anime discovery.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'miruro-sync': {
        title: 'Miruro Reverse Sync',
        breadcrumb: ['Home', 'Miruro', 'Reverse Sync'],
        desc: 'Maps a Miruro ID or title to external AniList, MAL, Kitsu, and IMDb IDs.',
        method: 'GET',
        endpointUrl: '/api/v1/miruro/sync/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/miruro/sync/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz');\`,
        referenceSignature: 'GET /api/v1/miruro/sync/:id',
        explanation: 'Returns cross-database ID mappings.',
        params: [{ name: 'id', in: 'path', type: 'string', req: true, desc: 'Miruro hash ID or slug' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      // ANIME ENDPOINTS
      'home': {

        title: 'Home Highlights Feed',
        breadcrumb: ['Home', 'Anime', 'Home Highlights'],
        desc: 'HiAnime homepage feed with spotlight banners, trending anime, top 10 rankings, and latest releases.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/home',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/home');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/hianime/home',
        explanation: 'Provides structured highlights suitable for mobile/web homepage rendering.',
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'details': {
        title: 'Anime Details',
        breadcrumb: ['Home', 'Anime', 'Anime Details'],
        desc: 'Comprehensive anime metadata, sub/dub episode counts, Japanese titles, and recommended titles.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/anime/one-piece-1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/anime/one-piece-1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/hianime/anime/:id',
        explanation: 'Fetches the anime detail page by slug or numeric ID.',
        params: [
          { name: 'id', in: 'path', type: 'string', req: true, desc: 'HiAnime anime slug (e.g. one-piece-1)' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'episodes': {
        title: 'Episodes List',
        breadcrumb: ['Home', 'Anime', 'Episodes List'],
        desc: 'Chronological list of all available episodes with titles and episode IDs.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/episodes/one-piece-1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/episodes/one-piece-1');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/hianime/episodes/:id',
        explanation: 'Returns episode IDs required for server queries and playback.',
        params: [{ name: 'id', in: 'path', type: 'string', req: true, desc: 'Anime slug or ID' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'servers': {
        title: 'Episode Servers',
        breadcrumb: ['Home', 'Anime', 'Episode Servers'],
        desc: 'Active streaming server sources (MegaPlay HD-1, HD-2, StreamSB) for sub and dub.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/servers?episodeId=one-piece-1?ep=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/servers?episodeId=one-piece-1?ep=1');\`,
        referenceSignature: 'GET /api/v1/hianime/servers?episodeId=:id',
        explanation: 'Lists playable server targets for a specific episode.',
        params: [{ name: 'episodeId', in: 'query', type: 'string', req: true, desc: 'Episode query ID' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'downloads': {
        title: 'Episode Downloads',
        breadcrumb: ['Home', 'Anime', 'Downloads'],
        desc: 'Direct video file download mirrors.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/downloads?episodeId=one-piece-1?ep=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/downloads?episodeId=one-piece-1?ep=1');\`,
        referenceSignature: 'GET /api/v1/hianime/downloads?episodeId=:id',
        explanation: 'Fetches download mirrors for offline viewing.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'suggestions': {
        title: 'Search Suggestions',
        breadcrumb: ['Home', 'Anime', 'Suggestions'],
        desc: 'Live typeahead auto-complete with anime posters and release year.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/search/suggestions?keyword=attack',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/search/suggestions?keyword=attack');\`,
        referenceSignature: 'GET /api/v1/hianime/search/suggestions?keyword=:kw',
        explanation: 'Ultra-fast search suggestions endpoint for auto-complete search inputs.',
        params: [{ name: 'keyword', in: 'query', type: 'string', req: true, desc: 'Search prefix' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'search': {
        title: 'Catalog Search',
        breadcrumb: ['Home', 'Anime', 'Search'],
        desc: 'Multi-filter paginated catalog search.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/search?keyword=naruto&page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/search?keyword=naruto&page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/search?keyword=:kw&page=:page',
        explanation: 'Searches anime matching keyword and optional filters.',
        params: [
          { name: 'keyword', in: 'query', type: 'string', req: true, desc: 'Search query' },
          { name: 'page', in: 'query', type: 'number', req: false, desc: 'Page number' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'filter-options': {
        title: 'Filter Options',
        breadcrumb: ['Home', 'Anime', 'Filter Options'],
        desc: 'Dictionary of genres, types, ratings, and sort filters.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/filter/options',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/filter/options');\`,
        referenceSignature: 'GET /api/v1/hianime/filter/options',
        explanation: 'Provides available filter criteria for advanced search queries.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'schedule': {
        title: 'Airing Schedule',
        breadcrumb: ['Home', 'Anime', 'Schedule'],
        desc: 'Daily television broadcast times with timezone offsets.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/schedule?date=2026-10-23&tzOffset=-360',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/schedule?date=2026-10-23&tzOffset=-360');\`,
        referenceSignature: 'GET /api/v1/hianime/schedule?date=:date&tzOffset=:tz',
        explanation: 'Returns scheduled releases for any given date.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'subbed': {
        title: 'Subbed Anime',
        breadcrumb: ['Home', 'Anime', 'Subbed'],
        desc: 'Latest releases with Japanese audio and English subtitles.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/subbed-anime?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/subbed-anime?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/subbed-anime?page=1',
        explanation: 'Paginated subbed anime releases.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'dubbed': {
        title: 'Dubbed Anime',
        breadcrumb: ['Home', 'Anime', 'Dubbed'],
        desc: 'Latest anime releases with English voice dubbing.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/dubbed-anime?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/dubbed-anime?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/dubbed-anime?page=1',
        explanation: 'Paginated dubbed anime releases.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'popular': {
        title: 'Most Popular',
        breadcrumb: ['Home', 'Anime', 'Most Popular'],
        desc: 'All-time most watched and trending anime titles.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/most-popular?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/most-popular?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/most-popular?page=1',
        explanation: 'All-time popularity rankings.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'movies': {
        title: 'Anime Movies',
        breadcrumb: ['Home', 'Anime', 'Movies'],
        desc: 'Theatrical anime movie catalog.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/movie?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/movie?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/movie?page=1',
        explanation: 'Paginated movie releases.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'tv': {
        title: 'TV Series',
        breadcrumb: ['Home', 'Anime', 'TV Series'],
        desc: 'Broadcast episodic television anime catalog.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/tv?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/tv?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/tv?page=1',
        explanation: 'Paginated TV series anime.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'genres': {
        title: 'Genre Catalog',
        breadcrumb: ['Home', 'Anime', 'Genres'],
        desc: 'Filter anime catalog by specific genre slug.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/genres/action?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/genres/action?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/genres/:genre?page=1',
        explanation: 'Filter by action, romance, comedy, shounen, etc.',
        params: [{ name: 'genre', in: 'path', type: 'string', req: true, desc: 'Genre identifier' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'az': {
        title: 'A-Z Catalog Directory',
        breadcrumb: ['Home', 'Anime', 'A-Z Directory'],
        desc: 'Alphabetical directory of anime titles.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/az-list/a?page=1',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/az-list/a?page=1');\`,
        referenceSignature: 'GET /api/v1/hianime/az-list/:letter?page=1',
        explanation: 'Filter catalog by starting character.',
        params: [{ name: 'letter', in: 'path', type: 'string', req: true, desc: 'a-z or 0-9' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'random': {
        title: 'Random Anime',
        breadcrumb: ['Home', 'Anime', 'Random'],
        desc: 'Resolves and returns a random anime title.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/random',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/random');\`,
        referenceSignature: 'GET /api/v1/hianime/random',
        explanation: 'Random anime discovery endpoint.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'mirrors': {
        title: 'Active Mirrors',
        breadcrumb: ['Home', 'Anime', 'Mirrors'],
        desc: 'Active scraper base URL and health status across backup mirrors.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/mirrors?check=true',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/mirrors?check=true');\`,
        referenceSignature: 'GET /api/v1/hianime/mirrors?check=true',
        explanation: 'Automated failover mirror diagnostics.',
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      // STREAM PROVIDERS
      'stream-animepahe': {
        title: 'AnimePahe Direct Stream',
        breadcrumb: ['Home', 'Stream Providers', 'AnimePahe'],
        desc: 'Direct video stream extraction from AnimePahe via AniList ID, episode number, and sub/dub.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/stream/animepahe/16498/1/dub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/stream/animepahe/16498/1/dub');
const { data } = await res.json();
console.log(data.m3u8); // Direct Master .m3u8 URL\`,
        referenceSignature: 'GET /api/v1/hianime/stream/animepahe/:anilistId/:episode/:type',
        explanation: 'Extracts direct multi-bitrate Master HLS (.m3u8) streams, VTT subtitles, and intro/outro timestamps.',
        params: [
          { name: 'anilistId', in: 'path', type: 'number', req: true, desc: 'Numeric AniList ID (e.g. 16498)' },
          { name: 'episode', in: 'path', type: 'number', req: true, desc: 'Episode number' },
          { name: 'type', in: 'path', type: 'string', req: false, desc: 'sub or dub (default: sub)' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'stream-anitaku': {
        title: 'Anitaku Direct Stream',
        breadcrumb: ['Home', 'Stream Providers', 'Anitaku'],
        desc: 'Direct video stream extraction from Anitaku (HD-2) with AES-256-GCM cipher decryption.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/stream/anitaku/21/1/sub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/stream/anitaku/21/1/sub');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/hianime/stream/anitaku/:anilistId/:episode/:type',
        explanation: 'Decrypts upstream Anitaku cipher payload and returns playable HLS video links.',
        params: [
          { name: 'anilistId', in: 'path', type: 'number', req: true, desc: 'AniList ID (e.g. 21)' },
          { name: 'episode', in: 'path', type: 'number', req: true, desc: 'Episode number' },
          { name: 'type', in: 'path', type: 'string', req: false, desc: 'sub or dub' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'stream-aniwave': {
        title: 'Aniwave Direct Stream',
        breadcrumb: ['Home', 'Stream Providers', 'Aniwave'],
        desc: 'Direct video stream extraction from Aniwave / Vidplay with AES-256-GCM decryption.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/stream/aniwave/21/1/sub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/stream/aniwave/21/1/sub');
const { data } = await res.json();\`,
        referenceSignature: 'GET /api/v1/hianime/stream/aniwave/:anilistId/:episode/:type',
        explanation: 'Extracts direct Master .m3u8 streams and proxy endpoints for Vidplay.',
        params: [
          { name: 'anilistId', in: 'path', type: 'number', req: true, desc: 'AniList ID' },
          { name: 'episode', in: 'path', type: 'number', req: true, desc: 'Episode number' },
          { name: 'type', in: 'path', type: 'string', req: false, desc: 'sub or dub' }
        ],
        toc: [
          { label: 'Overview', id: 'sec-overview' },
          { label: 'Parameters', id: 'sec-params' },
          { label: 'Live Console', id: 'sec-interactive' }
        ]
      },

      'stream-zoko': {
        title: 'ZokoAnime Stream Extractor',
        breadcrumb: ['Home', 'Stream Providers', 'ZokoAnime'],
        desc: 'Direct HLS extraction from ZokoAnime video links.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/stream/zokoanime?url=https://zokoanime.video/stream/mal/21/1/sub',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/stream/zokoanime?url=' + encodeURIComponent('https://zokoanime.video/stream/mal/21/1/sub'));\`,
        referenceSignature: 'GET /api/v1/hianime/stream/zokoanime?url=:url',
        explanation: 'Extracts direct Master .m3u8, English/Arabic subtitles, and skip timestamps.',
        params: [{ name: 'url', in: 'query', type: 'string', req: true, desc: 'ZokoAnime stream URL' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'stream-hd1': {
        title: 'MegaPlay HD-1 Stream Extractor',
        breadcrumb: ['Home', 'Stream Providers', 'MegaPlay HD-1'],
        desc: 'AES-256-CBC encrypted stream decryption for MegaPlay HD-1 sources.',
        method: 'GET',
        endpointUrl: '/api/v1/hianime/stream/hd-1?url=https://megaplay.buzz/stream/s-2/2142/sub?s=tcdn',
        codeSnippet: \`const res = await fetch('http://localhost:4000/api/v1/hianime/stream/hd-1?url=' + encodeURIComponent('https://megaplay.buzz/stream/s-2/2142/sub?s=tcdn'));\`,
        referenceSignature: 'GET /api/v1/hianime/stream/hd-1?url=:url',
        explanation: 'Decrypts encrypted sources payload and returns direct HLS stream.',
        params: [{ name: 'url', in: 'query', type: 'string', req: true, desc: 'MegaPlay stream URL' }],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'universal-embed': {
        title: 'Universal Embed & Stream Aggregator',
        breadcrumb: ['Home', 'Stream Providers', 'Universal Embed'],
        desc: 'Accepts anime ID and episode number from ANY provider (Miruro, AniList, MAL, HiAnime), cross-resolves all servers, and returns aggregated direct streams, iframe embeds, VTT subtitles, and intro/outro timestamps.',
        method: 'GET',
        endpointUrl: '/embed?id=21&ep=1&category=sub&provider=mal',
        codeSnippet: \`const res = await fetch('http://localhost:4000/embed?id=21&ep=1&provider=mal');
const { data } = await res.json();
console.log('Streams:', data.streams);
console.log('Intro skip:', data.intro);
console.log('Outro skip:', data.outro);\`,
        referenceSignature: 'GET /embed?id=:id&ep=:episode&category=sub&provider=mal',
        explanation: 'Aggregates stream data across Miruro, HiAnime, MegaPlay, AnimePahe, Anitaku, and Aniwave with sub-second response times. Specifying provider eliminates guesswork and prevents ID mismatches.',
        params: [
          { name: 'id', in: 'query', type: 'string', req: true, desc: 'Anime ID from any provider (AniList ID 21, MAL ID 21, Miruro hash, or HiAnime slug)' },
          { name: 'ep', in: 'query', type: 'number', req: false, desc: 'Episode number (default: 1)' },
          { name: 'provider', in: 'query', type: 'string', req: false, desc: 'Explicit provider: mal, anilist, hianime, miruro, or auto (prevents ID mismatches and accelerates resolution)' },
          { name: 'category', in: 'query', type: 'string', req: false, desc: 'sub or dub (default: sub)' },
          { name: 'player', in: 'query', type: 'boolean', req: false, desc: 'Set to true for HTML player view' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      },

      'aniskip': {
        title: 'AniSkip Intro & Outro Timestamps',
        breadcrumb: ['Home', 'Stream Providers', 'AniSkip'],
        desc: 'Fetches precise opening (OP) and ending (ED) skip timestamps using AniSkip API. Works with ANY provider ID (AniList, MAL, HiAnime, Miruro) with near-instant AniZip and cache mapping.',
        method: 'GET',
        endpointUrl: '/skip-times?id=21&ep=1&provider=mal',
        codeSnippet: \`const res = await fetch('http://localhost:4000/skip-times?id=21&ep=1&provider=mal');
const { data } = await res.json();
console.log('Opening (Intro):', data.skipTimes.op);
console.log('Ending (Outro):', data.skipTimes.ed);\`,
        referenceSignature: 'GET /skip-times?id=:id&ep=:episode&provider=mal',
        explanation: 'Extracts exact frame timestamps for OP, ED, recap, and mixed skip intervals. Passing provider=mal executes directly with 0 intermediate hops.',
        params: [
          { name: 'id', in: 'query', type: 'string', req: true, desc: 'Anime ID from any provider (AniList, MAL, HiAnime slug, Miruro hash)' },
          { name: 'ep', in: 'query', type: 'number', req: false, desc: 'Episode number (default: 1)' },
          { name: 'provider', in: 'query', type: 'string', req: false, desc: 'Explicit provider: mal, anilist, hianime, miruro, or auto' },
          { name: 'episodeLength', in: 'query', type: 'number', req: false, desc: 'Optional episode length in seconds' }
        ],
        toc: [{ label: 'Overview', id: 'sec-overview' }, { label: 'Parameters', id: 'sec-params' }, { label: 'Live Console', id: 'sec-interactive' }]
      }
    };

    // Accordion toggle: keeps sidebar minimized by default
    function toggleAccordion(id, btn) {
      const sub = document.getElementById(id);
      if (!sub) return;
      sub.classList.toggle('open');
      btn.classList.toggle('expanded');
    }

    // Switch Page function
    function selectDocPage(pageKey) {
      window.currentDocKey = pageKey;
      const doc = DOCS_DATA[pageKey];
      if (!doc) return;

      // Update sidebar active state
      document.querySelectorAll('.sub-menu-item').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('item-' + pageKey);
      if (activeEl) {
        activeEl.classList.add('active');
        // Ensure its accordion is open
        const parentSub = activeEl.closest('.sub-menu');
        if (parentSub) {
          parentSub.classList.add('open');
          const trigger = parentSub.previousElementSibling;
          if (trigger) trigger.classList.add('expanded');
        }
      }

      // Render Breadcrumbs
      const main = document.getElementById('docMainArea');
      let html = '';

      if (doc.breadcrumb && doc.breadcrumb.length > 0) {
        html += '<div class="breadcrumbs-bar">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
        doc.breadcrumb.forEach((b, idx) => {
          const isLast = idx === doc.breadcrumb.length - 1;
          html += '<span>' + (idx > 0 ? ' › ' : '') + '</span>';
          html += '<span class="' + (isLast ? 'active' : '') + '">' + b + '</span>';
        });
        html += '</div>';
      }

      // Header
      html += \`
        <div class="endpoint-header" id="sec-overview">
          <h1 class="endpoint-title">
            \${doc.method ? \`<span class="method-badge">\${doc.method}</span>\` : ''}
            <span>\${doc.title}</span>
          </h1>
        </div>
        <p class="endpoint-desc-lead">\${doc.desc}</p>
      \`;

      // Signature Card
      if (doc.referenceSignature) {
        html += \`
          <div class="signature-card">
            <span class="sig-keyword">endpoint</span>
            <span class="sig-fn">\${doc.referenceSignature}</span>
          </div>
        \`;
      }

      // Reference Section
      html += \`
        <h2 class="content-heading" id="sec-reference">Reference</h2>
        <h3 class="sub-heading">\${doc.referenceSignature || doc.title}</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">\${doc.explanation || ''}</p>
      \`;

      // Code Sandbox (with line numbers matching screenshot!)
      if (doc.codeSnippet) {
        const lines = doc.codeSnippet.split('\\n');
        html += \`
          <div class="code-sandbox-card">
            <div class="sandbox-header">
              <span>Example Usage</span>
              <button class="header-icon-btn" onclick="copyCurrentSnippet()">Copy</button>
            </div>
            <div class="sandbox-body">
              <div class="line-numbers">
                \${lines.map((_, i) => '<div>' + (i + 1) + '</div>').join('')}
              </div>
              <div class="code-lines">\${lines.map(l => {
                let formatted = l
                  .replace(/\\b(import|from|const|await|export|default|function|return)\\b/g, '<span class="syntax-kw">$1</span>')
                  .replace(/\\b(useCallback|fetch|get|post)\\b/g, '<span class="syntax-fn">$1</span>')
                  .replace(/('[^']*'|"[^"]*")/g, '<span class="syntax-str">$1</span>')
                  .replace(/(\\/\\/.*$)/g, '<span class="syntax-comment">$1</span>');
                return '<div>' + formatted + '</div>';
              }).join('')}</div>
            </div>
          </div>
        \`;
      }

      // Parameters Table
      if (doc.params && doc.params.length > 0) {
        html += \`
          <h2 class="content-heading" id="sec-params">Parameters</h2>
          <div class="params-table-wrap">
            <table class="params-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>In</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                \${doc.params.map(p => \`
                  <tr>
                    <td><code>\${p.name}</code></td>
                    <td>\${p.in}</td>
                    <td><code>\${p.type}</code></td>
                    <td>\${p.req ? '<span style="color: #F87171; font-weight: 600;">Yes</span>' : '<span style="color: var(--text-dim);">No</span>'}</td>
                    <td>\${p.desc}</td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
      }

      // Interactive Tester
      if (doc.endpointUrl) {
        html += \`
          <h2 class="content-heading" id="sec-interactive">Interactive Live Console</h2>
          <div class="interactive-api-box">
            <div class="api-url-bar">
              <span class="method-badge">\${doc.method || 'GET'}</span>
              <input type="text" class="api-url-input" id="liveInputUrl" value="\${doc.endpointUrl}" spellcheck="false" />
              <button class="api-send-btn" id="liveSendBtn" onclick="sendLiveApiRequest()">
                <span>Send</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

            <div class="api-status-bar" id="liveStatusBar" style="display: none;">
              <span class="status-badge status-ok" id="liveStatusPill">200 OK</span>
              <span id="liveLatency" style="color: var(--text-dim);">⚡ 112 ms</span>
              <button class="header-icon-btn" style="margin-left: auto;" onclick="copyJsonText()">Copy Response</button>
            </div>

            <pre class="api-response-pre" id="liveResponsePre">// Click "Send" to execute a live request against http://localhost:4000</pre>
          </div>
        \`;
      }

      if (doc.extraHtml) {
        html += doc.extraHtml;
      }

      main.innerHTML = html;

      // Render Right TOC
      const tocContainer = document.getElementById('tocNavContainer');
      if (doc.toc && doc.toc.length > 0) {
        tocContainer.innerHTML = doc.toc.map((t, idx) => \`
          <li><a href="#\${t.id}" class="toc-item-link \${idx === 0 ? 'active' : ''}">\${t.label}</a></li>
        \`).join('');
      } else {
        tocContainer.innerHTML = '<li><a href="#sec-overview" class="toc-item-link active">Overview</a></li>';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Automatically execute request on endpoint pages
      if (doc.endpointUrl) {
        setTimeout(sendLiveApiRequest, 50);
      }
    }

    // Execute Request from Live Console
    async function sendLiveApiRequest() {
      const input = document.getElementById('liveInputUrl');
      const btn = document.getElementById('liveSendBtn');
      const bar = document.getElementById('liveStatusBar');
      const pill = document.getElementById('liveStatusPill');
      const latency = document.getElementById('liveLatency');
      const pre = document.getElementById('liveResponsePre');

      if (!input || !btn || !pre) return;

      let url = input.value.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (!url.startsWith('/')) url = '/' + url;
      }

      btn.disabled = true;
      btn.innerHTML = '<span>Loading...</span>';
      pre.textContent = '// Fetching ' + url + '...';

      const start = performance.now();
      try {
        const res = await fetch(url);
        const dur = Math.round(performance.now() - start);

        bar.style.display = 'flex';
        pill.textContent = res.status + ' ' + (res.statusText || (res.ok ? 'OK' : 'Error'));
        pill.className = 'status-badge ' + (res.ok ? 'status-ok' : 'status-error');
        latency.textContent = '⚡ ' + dur + ' ms';

        const json = await res.json();
        pre.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        const dur = Math.round(performance.now() - start);
        bar.style.display = 'flex';
        pill.textContent = 'Network Error';
        pill.className = 'status-badge status-error';
        latency.textContent = '⚡ ' + dur + ' ms';
        pre.textContent = '// Failed to fetch: ' + (err.message || String(err));
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Send</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
      }
    }

    function copySnippetText(txt) {
      navigator.clipboard.writeText(txt);
      alert('Code snippet copied to clipboard!');
    }

    function copyCurrentSnippet() {
      const doc = DOCS_DATA[window.currentDocKey];
      if (doc && doc.codeSnippet) {
        navigator.clipboard.writeText(doc.codeSnippet);
        alert('Code snippet copied to clipboard!');
      }
    }

    function copyJsonText() {
      const pre = document.getElementById('liveResponsePre');
      if (pre) {
        navigator.clipboard.writeText(pre.textContent);
        alert('Response JSON copied!');
      }
    }

    function onFeedback(choice) {
      alert(choice === 'yes' ? 'Thank you for your feedback!' : 'Thanks! We will continue improving.');
    }

    // Search Modal
    const searchModal = document.getElementById('searchModal');
    const openSearchBtn = document.getElementById('openSearchBtn');
    const searchModalInput = document.getElementById('searchModalInput');
    const searchModalResults = document.getElementById('searchModalResults');

    function openSearch() {
      searchModal.classList.add('open');
      searchModalInput.value = '';
      renderSearchResults('');
      setTimeout(() => searchModalInput.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('open');
    }

    openSearchBtn.addEventListener('click', openSearch);
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    });

    searchModalInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim().toLowerCase());
    });

    function renderSearchResults(q) {
      const list = Object.entries(DOCS_DATA).map(([k, d]) => ({
        key: k,
        title: d.title,
        path: d.endpointUrl || d.title,
        group: d.breadcrumb ? d.breadcrumb.join(' / ') : 'Overview'
      }));

      const filtered = q
        ? list.filter(item => item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q))
        : list.slice(0, 10);

      searchModalResults.innerHTML = filtered.map(item => \`
        <div class="search-item" onclick="selectDocPage('\${item.key}'); closeSearch();">
          <span class="item-title">\${item.title}</span>
          <span class="item-path">\${item.path}</span>
        </div>
      \`).join('');
    }

    // Default load: Welcome Introduction
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        selectDocPage('welcome');
      });
    } else {
      selectDocPage('welcome');
    }
  </script>
</body>
</html>`;
}

export default renderDashboardHtml;
