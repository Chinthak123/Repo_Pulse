import React, { useState, useRef } from 'react';
import { 
  Search, 
  X,
  Activity, 
  Users, 
  Clock, 
  AlertCircle, 
  Info, 
  RefreshCw 
} from 'lucide-react';

const PRESETS = [
  { label: "facebook/react", slug: "facebook/react" },
  { label: "pallets/flask", slug: "pallets/flask" },
  { label: "request/request (Archived)", slug: "request/request" },
  { label: "celery/celery", slug: "celery/celery" }
];

export default function App() {
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (targetRepo) => {
    const slugToSearch = targetRepo || repoInput;
    if (!slugToSearch || !slugToSearch.trim()) return;

    setError(null);
    setLoading(true);
    setLoadingStep(1);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 400);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 900);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: slugToSearch.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred while inspecting the repository.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleClear = () => {
    setRepoInput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getStatusColor = (category) => {
    switch (category) {
      case 'healthy':
        return {
          bg: 'bg-[#1C1C20]',
          text: 'text-white',
          border: 'border-[#3A3A42]',
          badge: 'bg-white text-black font-semibold'
        };
      case 'moderate':
        return {
          bg: 'bg-[#1C1C20]',
          text: 'text-firefox-amber',
          border: 'border-firefox-amber/40',
          badge: 'bg-firefox-amber text-black font-semibold'
        };
      case 'critical':
      default:
        return {
          bg: 'bg-[#1C1C20]',
          text: 'text-firefox-crimson',
          border: 'border-firefox-crimson/40',
          badge: 'bg-firefox-crimson text-white font-semibold'
        };
    }
  };

  return (
    <div className="min-h-screen bg-firefox-ink text-firefox-text flex flex-col font-sans antialiased">
      {/* Clean Topbar */}
      <header className="border-b border-firefox-border bg-firefox-ink/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-bold tracking-tight text-white text-base">Repo Pulse</span>
          </div>
          <div className="text-xs text-firefox-muted font-mono">
            Repository Diagnostic Tool
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        
        {/* Title Section */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Repository Health & Silent Abandonment Diagnostic
          </h1>
          <p className="text-sm sm:text-base text-firefox-muted max-w-2xl mx-auto">
            Analyzes GitHub maintainer patterns, code cadence, and review turnaround to identify unmaintained repositories before you depend on them.
          </p>
        </section>

        {/* Search Input with Clear button */}
        <section className="w-full max-w-2xl mx-auto space-y-3">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="relative flex items-center shadow-lg"
          >
            <div className="absolute left-4 text-firefox-muted pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            
            <input 
              ref={inputRef}
              type="text" 
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="github.com/owner/repository or owner/repository"
              className="w-full bg-firefox-surface border border-firefox-border rounded-xl pl-12 pr-36 py-3.5 text-sm sm:text-base text-white placeholder-firefox-muted focus:outline-none focus:border-firefox-orange focus:ring-1 focus:ring-firefox-orange transition-all font-mono"
            />

            {/* Clear Button */}
            {repoInput && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear input"
                className="absolute right-24 text-firefox-muted hover:text-white p-1 rounded-md transition-colors hover:bg-firefox-surfaceHover"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Inspect Button */}
            <button
              type="submit"
              disabled={loading || !repoInput.trim()}
              className="absolute right-2 px-4 py-2 bg-firefox-orange hover:bg-firefox-orangeHover disabled:opacity-40 disabled:hover:bg-firefox-orange text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Inspect"}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-firefox-subtle font-mono">Try example:</span>
            {PRESETS.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setRepoInput(p.slug);
                  handleSearch(p.slug);
                }}
                className="px-2.5 py-1 bg-firefox-surface hover:bg-firefox-surfaceHover border border-firefox-border rounded-md text-firefox-muted hover:text-white transition-colors font-mono"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error Alert Box */}
        {error && (
          <div className="max-w-2xl mx-auto w-full p-4 rounded-xl bg-firefox-crimson/10 border border-firefox-crimson/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-firefox-crimson shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-white">Diagnostic Error</div>
              <div className="text-firefox-muted mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Stepped Loading State */}
        {loading && (
          <div className="max-w-xl mx-auto w-full p-6 rounded-xl bg-firefox-surface border border-firefox-border space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-firefox-orange animate-spin" />
              <span className="text-sm font-semibold text-white">Inspecting Repository Telemetry...</span>
            </div>
            
            <div className="space-y-2 text-xs text-firefox-muted font-mono">
              <div className="flex items-center gap-2">
                <span className={loadingStep >= 1 ? "text-white font-bold" : "text-firefox-subtle"}>
                  {loadingStep >= 1 ? "[OK]" : "[..]"}
                </span>
                <span>Connecting to GitHub repository...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={loadingStep >= 2 ? "text-white font-bold" : "text-firefox-subtle"}>
                  {loadingStep >= 2 ? "[OK]" : "[..]"}
                </span>
                <span>Extracting commit cadences and maintainer concentration...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={loadingStep >= 3 ? "text-white font-bold" : "text-firefox-subtle"}>
                  {loadingStep >= 3 ? "[OK]" : "[..]"}
                </span>
                <span>Calculating abandonment risk indicators...</span>
              </div>
            </div>

            <div className="w-full bg-firefox-ink rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-firefox-orange h-full transition-all duration-300"
                style={{ width: `${(loadingStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {result && !loading && (
          <div className="space-y-6">
            
            {/* Primary Status Card */}
            {(() => {
              const colors = getStatusColor(result.status_category);
              return (
                <div className={`p-6 sm:p-8 rounded-2xl ${colors.bg} border ${colors.border} space-y-6 transition-all`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase ${colors.badge}`}>
                          {result.status_label}
                        </span>
                        {result.diagnostics.is_archived && (
                          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-firefox-surface text-firefox-muted border border-firefox-border">
                            Officially Archived
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 font-mono">
                        {result.repo_slug}
                      </h2>
                      <p className="text-xs sm:text-sm text-firefox-muted mt-1 max-w-xl">
                        {result.diagnostics.description}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                        {result.risk_score}%
                      </div>
                      <div className="text-xs text-firefox-muted mt-0.5">
                        Abandonment Probability
                      </div>
                    </div>
                  </div>

                  {/* 4-Column Metric Widget (Styled precisely like reference widget) */}
                  <div className="bg-[#222228] border border-[#3A3A42] rounded-2xl p-5 sm:p-6 my-3 shadow-md">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3A3A42]">
                      
                      {/* Column 1: Commit Cadence */}
                      <div className="pb-4 sm:pb-0 sm:pr-6">
                        <div className="text-base sm:text-lg font-bold text-white tracking-wider font-sans">
                          CADENCE
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-1 font-mono">
                          Commit Delta
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-5 sm:mt-6">
                          {result.diagnostics.commit_decay_rate > 0 
                            ? `-${result.diagnostics.commit_decay_rate}%` 
                            : `+${Math.abs(result.diagnostics.commit_decay_rate)}%`}
                        </div>
                      </div>

                      {/* Column 2: Maintainer Risk */}
                      <div className="py-4 sm:py-0 sm:px-6">
                        <div className="text-base sm:text-lg font-bold text-white tracking-wider font-sans">
                          BUS FACTOR
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-1 font-mono">
                          Maintainer Share
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-5 sm:mt-6">
                          {result.diagnostics.top_author_share}%
                        </div>
                      </div>

                      {/* Column 3: PR Queue Latency */}
                      <div className="py-4 sm:py-0 sm:px-6">
                        <div className="text-base sm:text-lg font-bold text-white tracking-wider font-sans">
                          PR QUEUE
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-1 font-mono">
                          Avg Response Wait
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-5 sm:mt-6">
                          {result.diagnostics.avg_pr_age_days}d
                        </div>
                      </div>

                      {/* Column 4: Total Risk Index */}
                      <div className="pt-4 sm:pt-0 sm:pl-6">
                        <div className="text-base sm:text-lg font-bold text-white tracking-wider font-sans">
                          RISK INDEX
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-1 font-mono">
                          Abandonment Prob
                        </div>
                        <div className={`text-xl sm:text-2xl font-bold font-mono mt-5 sm:mt-6 ${colors.text}`}>
                          {result.risk_score}%
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Summary Verdict Callout */}
                  <div className="bg-firefox-ink/60 rounded-xl p-4 border border-firefox-border flex items-start gap-3">
                    <Info className="w-5 h-5 text-firefox-orange shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm leading-relaxed">
                      <span className="font-semibold text-white">Diagnostic Summary: </span>
                      <span className="text-firefox-text">{result.recommendation}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* The 3 Diagnostic Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Commit Cadence */}
              <div className="p-5 rounded-xl bg-firefox-surface border border-firefox-border space-y-3">
                <div className="flex items-center justify-between text-firefox-muted">
                  <span className="text-xs font-mono uppercase tracking-wider">Commit Cadence</span>
                  <Activity className="w-4 h-4 text-firefox-orange" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {result.diagnostics.commit_decay_rate > 0 
                      ? `-${result.diagnostics.commit_decay_rate}%` 
                      : `+${Math.abs(result.diagnostics.commit_decay_rate)}%`}
                  </div>
                  <div className="text-xs font-medium text-firefox-orange mt-0.5">
                    {result.diagnostics.commit_decay_rate > 50 
                      ? "Critical Activity Drop" 
                      : result.diagnostics.commit_decay_rate > 20 
                      ? "Slowing Heartbeat" 
                      : "Healthy Pulse"}
                  </div>
                </div>
                <p className="text-xs text-firefox-muted leading-relaxed">
                  Compares code updates in the last 90 days ({result.diagnostics.commits_last_90_days} commits) against the previous 6-month baseline.
                </p>
              </div>

              {/* Card 2: Maintainer Risk */}
              <div className="p-5 rounded-xl bg-firefox-surface border border-firefox-border space-y-3">
                <div className="flex items-center justify-between text-firefox-muted">
                  <span className="text-xs font-mono uppercase tracking-wider">Maintainer Risk</span>
                  <Users className="w-4 h-4 text-firefox-orange" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {result.diagnostics.top_author_share}%
                  </div>
                  <div className="text-xs font-medium text-firefox-orange mt-0.5">
                    {result.diagnostics.top_author_share > 80 
                      ? "Single-Author Dependency" 
                      : result.diagnostics.top_author_share > 60 
                      ? "Concentrated Maintenance" 
                      : "Distributed Team"}
                  </div>
                </div>
                <p className="text-xs text-firefox-muted leading-relaxed">
                  Top contributor (<span className="text-white font-mono">{result.diagnostics.top_author}</span>) authored {result.diagnostics.top_author_share}% of recent commits across {result.diagnostics.unique_contributors} total contributor(s).
                </p>
              </div>

              {/* Card 3: PR Turnaround Latency */}
              <div className="p-5 rounded-xl bg-firefox-surface border border-firefox-border space-y-3">
                <div className="flex items-center justify-between text-firefox-muted">
                  <span className="text-xs font-mono uppercase tracking-wider">PR Turnaround</span>
                  <Clock className="w-4 h-4 text-firefox-orange" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {result.diagnostics.avg_pr_age_days} Days
                  </div>
                  <div className="text-xs font-medium text-firefox-orange mt-0.5">
                    {result.diagnostics.avg_pr_age_days > 60 
                      ? "High Review Latency" 
                      : result.diagnostics.avg_pr_age_days > 25 
                      ? "Moderate Response Lag" 
                      : "Active Review Cadence"}
                  </div>
                </div>
                <p className="text-xs text-firefox-muted leading-relaxed">
                  Average idle wait time for open community pull requests waiting for author review or integration.
                </p>
              </div>

            </div>

            {/* Additional Telemetry Table */}
            <div className="p-5 rounded-xl bg-firefox-surface border border-firefox-border space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-firefox-muted">
                Repository Telemetry
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-mono text-xs">
                <div>
                  <div className="text-firefox-subtle">Stars</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.diagnostics.stars.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-firefox-subtle">Forks</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.diagnostics.forks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-firefox-subtle">Open Issues</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.diagnostics.open_issues.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-firefox-subtle">Days Since Push</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.diagnostics.days_since_last_push} days</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-firefox-border py-6 text-center text-xs text-firefox-muted">
        <p>Repo Pulse · Open-Source Repository Health Diagnostic</p>
      </footer>
    </div>
  );
}
