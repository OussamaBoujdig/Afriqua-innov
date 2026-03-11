"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { campaigns as campaignsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  imageUrl: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName: string;
  ideaCount: number;
  createdAt: string;
}

function getProgress(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

const MANAGER_ROLES = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"];

export default function CampagnesPage() {
  const { user } = useAuth();
  const canCreate = user && MANAGER_ROLES.includes(user.role);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignsApi.getAll(0, 50).then((res) => {
      const page = res.data as { content: Campaign[] };
      setCampaigns(page.content || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold tracking-tight mb-1">Explorer les Campagnes</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Découvrez les défis d&apos;innovation actuels et proposez vos solutions.</p>
          </div>
          {canCreate && (
            <Link href="/campagnes/creer" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Créer une campagne
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const progress = getProgress(c.startDate, c.endDate);
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="h-32 w-full bg-gradient-to-br from-primary/40 to-indigo-600/60 relative">
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${c.categoryColor || "bg-primary"}`}>
                      {c.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{c.description}</p>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-500">Progression temporelle</span>
                        <span className="text-primary">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                        <span className="text-sm font-medium">{c.ideaCount} idées</span>
                      </div>
                      <Link
                        href={`/soumettre?campaignId=${c.id}`}
                        className="bg-primary text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                      >
                        Participer
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {canCreate && (
              <Link
                href="/campagnes/creer"
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">add</span>
                </div>
                <h3 className="text-sm font-bold mb-1">Créer une campagne</h3>
                <p className="text-slate-500 text-xs">Lancez un nouveau défi d&apos;innovation.</p>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
