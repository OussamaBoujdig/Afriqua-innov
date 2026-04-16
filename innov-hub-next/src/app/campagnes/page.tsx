"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { campaigns as campaignsApi, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  imageUrl: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdByName: string;
  ideaCount: number;
  createdAt: string;
}

function getProgress(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime(), e = new Date(end).getTime(), now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function daysLeft(end: string | null): number | null {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
}

function formatDate(d: string | null) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  ACTIF:    { label: "Actif",    dotColor: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  A_VENIR:  { label: "À venir",  dotColor: "bg-blue-500",    bgColor: "bg-blue-50",    textColor: "text-blue-700" },
  TERMINEE: { label: "Terminée", dotColor: "bg-neutral-400", bgColor: "bg-neutral-100", textColor: "text-neutral-600" },
  TERMINE:  { label: "Terminée", dotColor: "bg-neutral-400", bgColor: "bg-neutral-100", textColor: "text-neutral-600" },
};

const MANAGER_ROLES = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"];

type SortKey = "date" | "ideas" | "title" | "progress";

/* Skeleton card */
function CardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-[16/9] w-full" style={{ borderRadius: 0 }} />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-1.5 w-full rounded-full mt-2" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function CampagnesPage() {
  const { user } = useAuth();
  const canManage = user && MANAGER_ROLES.includes(user.role);
  const isResponsable = user?.role === "RESPONSABLE_INNOVATION";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [closing, setClosing]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus]     = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortBy, setSortBy]       = useState<SortKey>("date");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode]   = useState<"grid" | "list">("grid");

  const flash = (setter: (v: string | null) => void, msg: string) => {
    setter(msg); setTimeout(() => setter(null), 4000);
  };

  const load = () => {
    setLoading(true);
    campaignsApi.getAll(0, 100).then(res => {
      const page = res.data as { content: Campaign[] };
      setCampaigns(page.content || []);
    }).catch(() => flash(setError, "Erreur lors du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = async (id: string, title: string) => {
    if (!confirm(`Clôturer la campagne "${title}" ?`)) return;
    setClosing(id);
    try {
      await campaignsApi.close(id);
      flash(setSuccess, "Campagne clôturée avec succès.");
      load();
    } catch (e) { flash(setError, e instanceof Error ? e.message : "Erreur"); }
    finally { setClosing(null); }
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const categories = useMemo(() => [...new Set(campaigns.map(c => c.category).filter(Boolean))], [campaigns]);

  const filtered = useMemo(() => {
    let list = [...campaigns];
    if (filterStatus !== "ALL") list = list.filter(c => c.status === filterStatus || (filterStatus === "TERMINEE" && c.status === "TERMINE"));
    if (filterCategory !== "ALL") list = list.filter(c => c.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.createdByName?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === "ideas") diff = a.ideaCount - b.ideaCount;
      else if (sortBy === "title") diff = a.title.localeCompare(b.title);
      else if (sortBy === "progress") diff = getProgress(a.startDate, a.endDate) - getProgress(b.startDate, b.endDate);
      else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
    return list;
  }, [campaigns, filterStatus, filterCategory, search, sortBy, sortDir]);

  const counts = useMemo(() => ({
    ALL: campaigns.length,
    ACTIF: campaigns.filter(c => c.status === "ACTIF").length,
    A_VENIR: campaigns.filter(c => c.status === "A_VENIR").length,
    TERMINEE: campaigns.filter(c => c.status === "TERMINEE" || c.status === "TERMINE").length,
  }), [campaigns]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button type="button" onClick={() => toggleSort(k)} className={`filter-tab${sortBy === k ? " active" : ""}`}>
      {label}
      {sortBy === k && <span className="material-symbols-outlined text-[12px]">{sortDir === "desc" ? "arrow_downward" : "arrow_upward"}</span>}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto">
      {/* Toasts */}
      {error && (
        <div className="fixed top-3 right-3 z-[100] animate-slide-in-right">
          <div className="toast error flex items-center gap-2 pr-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 hover:bg-red-100 rounded transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed top-3 right-3 z-[100] animate-slide-in-right">
          <div className="toast success flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Campagnes</h1>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {loading ? (
                <span className="skeleton h-3 w-40 inline-block align-middle" />
              ) : (
                <>{campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""} &middot; {counts.ACTIF} active{counts.ACTIF !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          {canManage && (
            <Link href="/campagnes/creer" className="btn-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Créer une campagne
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="filter-tabs">
            {[
              { key: "ALL", label: "Toutes", count: counts.ALL },
              { key: "ACTIF", label: "Actives", count: counts.ACTIF },
              { key: "A_VENIR", label: "À venir", count: counts.A_VENIR },
              { key: "TERMINEE", label: "Terminées", count: counts.TERMINEE },
            ].filter(t => t.key === "ALL" || t.count > 0).map(tab => (
              <button key={tab.key} type="button" onClick={() => setFilterStatus(tab.key)}
                className={`filter-tab${filterStatus === tab.key ? " active" : ""}`}>
                {tab.label} <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-neutral-400">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="search-input" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select shrink-0">
              <option value="ALL">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="filter-tabs shrink-0" role="group">
            <SortBtn k="date" label="Date" />
            <SortBtn k="ideas" label="Idées" />
            <SortBtn k="progress" label="Avancement" />
          </div>
          <div className="filter-tabs shrink-0">
            <button type="button" onClick={() => setViewMode("grid")} className={`filter-tab${viewMode === "grid" ? " active" : ""}`}>
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
            </button>
            <button type="button" onClick={() => setViewMode("list")} className={`filter-tab${viewMode === "list" ? " active" : ""}`}>
              <span className="material-symbols-outlined text-[15px]">view_list</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-neutral-300">search_off</span>
            <p className="text-[14px] text-neutral-500">Aucune campagne trouvée.</p>
            {canManage && (
              <Link href="/campagnes/creer" className="btn-primary mt-2">Créer une campagne</Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 stagger">
            {filtered.map(c => <CampaignCard key={c.id} campaign={c} isResponsable={!!isResponsable} closing={closing} onClose={handleClose} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 stagger">
            {filtered.map(c => <CampaignRow key={c.id} campaign={c} isResponsable={!!isResponsable} closing={closing} onClose={handleClose} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign: c, isResponsable, closing, onClose }: {
  campaign: Campaign; isResponsable: boolean; closing: string | null;
  onClose: (id: string, title: string) => void;
}) {
  const cfg = STATUS_CFG[c.status] || STATUS_CFG.ACTIF;
  const progress = getProgress(c.startDate, c.endDate);
  const days = daysLeft(c.endDate);
  const isActive = c.status === "ACTIF";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const resolvedImg = resolveImageUrl(c.imageUrl);

  useEffect(() => {
    const t = setTimeout(() => setProgressVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <Link
      href={`/campagnes/${c.id}`}
      className="card group flex flex-col overflow-hidden hover:border-[#0066B3]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Image header */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {resolvedImg ? (
          <>
            {!imgLoaded && <div className="skeleton absolute inset-0" style={{ borderRadius: 0 }} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImg}
              alt={c.title}
              className={`absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02] transition-all duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-neutral-800 dark:to-neutral-900">
            <span className="material-symbols-outlined text-[36px] text-[#0066B3]/30">campaign</span>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${cfg.bgColor} ${cfg.textColor} shadow-sm`}>
            <span className={`inline-block size-1.5 rounded-full ${cfg.dotColor} mr-1`} />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{c.category}</span>
          {days !== null && isActive && days <= 7 && (
            <span className="badge bg-red-50 text-red-600 font-semibold">
              {days > 0 ? `${days}j` : "Expiré"}
            </span>
          )}
        </div>

        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white line-clamp-2 mb-1 group-hover:text-[#0066B3] transition-colors duration-150">{c.title}</h3>
        <p className="text-[12px] text-neutral-500 line-clamp-2 mb-3 leading-relaxed">{c.description}</p>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-neutral-400">Avancement</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isActive ? "bg-[#0066B3]" : "bg-slate-400"}`}
              style={{ width: progressVisible ? `${progress}%` : "0%" }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800 text-[12px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">lightbulb</span>
            {c.ideaCount} idée{c.ideaCount !== 1 ? "s" : ""}
          </span>
          <span>{formatDate(c.startDate)} → {formatDate(c.endDate)}</span>
        </div>

        {/* Close action */}
        {isResponsable && isActive && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(c.id, c.title); }}
            disabled={closing === c.id}
            className="btn-danger mt-3 justify-center text-[12px]"
          >
            {closing === c.id
              ? <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> Fermeture...</>
              : <><span className="material-symbols-outlined text-[14px]">lock</span> Clôturer</>
            }
          </button>
        )}
      </div>
    </Link>
  );
}

function CampaignRow({ campaign: c, isResponsable, closing, onClose }: {
  campaign: Campaign; isResponsable: boolean; closing: string | null;
  onClose: (id: string, title: string) => void;
}) {
  const cfg = STATUS_CFG[c.status] || STATUS_CFG.ACTIF;
  const progress = getProgress(c.startDate, c.endDate);
  const days = daysLeft(c.endDate);
  const isActive = c.status === "ACTIF";

  return (
    <div className="card group flex items-center gap-4 px-4 py-3 hover:border-[#0066B3]/30 hover:shadow-sm transition-all duration-150 hover:bg-blue-50/20 dark:hover:bg-blue-950/5">
      <span className={`size-2 rounded-full shrink-0 ${cfg.dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate group-hover:text-[#0066B3] transition-colors">{c.title}</p>
        <p className="text-[12px] text-neutral-500">{c.createdByName} &middot; {formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="w-24">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className={`h-full rounded-full transition-all duration-500 ${isActive ? "bg-[#0066B3]" : "bg-slate-400"}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-0.5 text-right text-[11px] text-slate-400 tabular-nums">{progress}%</p>
        </div>
        <span className="text-[12px] text-neutral-500 tabular-nums">{c.ideaCount} idées</span>
        {days !== null && isActive && days <= 7 && (
          <span className="badge bg-red-50 text-red-600 text-[11px] font-semibold">{days > 0 ? `${days}j` : "Expiré"}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isResponsable && isActive && (
          <button
            type="button"
            onClick={() => onClose(c.id, c.title)}
            disabled={closing === c.id}
            className="btn-danger text-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            Clôturer
          </button>
        )}
        <Link href={`/campagnes/${c.id}`} className="text-[12px] font-medium text-[#0066B3] hover:text-[#004d87] dark:text-blue-400 transition-colors flex items-center gap-0.5">
          Voir <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
