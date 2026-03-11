import Link from "next/link";

export default function ValidationPage() {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 lg:p-6 flex flex-col gap-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link className="hover:text-primary transition-colors" href="/">Accueil</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link className="hover:text-primary transition-colors" href="/validation">Gestion des Idées</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white font-medium">Validation ID-2024-089</span>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Panel de Validation</h1>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">En attente</span>
      </div>
      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">check</span></div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Soumission</span>
        </div>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 self-center"></div>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center"><span className="material-symbols-outlined text-[10px]">fact_check</span></div>
          <span className="text-xs font-bold text-primary">Validation Innovation</span>
        </div>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 self-center"></div>
        <div className="flex items-center gap-2 opacity-50">
          <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-slate-500">gavel</span></div>
          <span className="text-xs font-medium text-slate-500">Décision Direction</span>
        </div>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 self-center"></div>
        <div className="flex items-center gap-2 opacity-50">
          <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-slate-500">science</span></div>
          <span className="text-xs font-medium text-slate-500">Incubation</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-primary/60"></div>
            <div className="p-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Hydrogène Vert Compact</h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">Solution compacte de production d&apos;hydrogène vert pour sites industriels. Réduction des coûts énergétiques de 40% et empreinte carbone -60%.</p>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">trending_down</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">-15% Arrêts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">payments</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">45,000€</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">schedule</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">14 mois</span>
                </div>
              </div>
              <a className="text-xs font-semibold text-primary hover:underline flex items-center gap-1" href="#"><span className="material-symbols-outlined text-xs">attach_file</span> Document joint</a>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Feedback (optionnel)</label>
                <textarea className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ajoutez un commentaire pour le porteur..." rows={3}></textarea>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Score global</h3>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeWidth="8" fill="none" cx="50" cy="50" r="42"></circle>
                <circle className="text-primary" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="66" cx="50" cy="50" r="42"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold text-primary">7.5</span>
                <span className="text-slate-500 text-xs ml-0.5">/10</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Innovation</span><span className="font-bold text-primary">8/10</span></div>
                <input className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-primary" type="range" min="0" max="10" defaultValue="8" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Faisabilité</span><span className="font-bold text-primary">6/10</span></div>
                <input className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-primary" type="range" min="0" max="10" defaultValue="6" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Alignement</span><span className="font-bold text-primary">9/10</span></div>
                <input className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-primary" type="range" min="0" max="10" defaultValue="9" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 dark:text-slate-300">ROI</span><span className="font-bold text-primary">7/10</span></div>
                <input className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-primary" type="range" min="0" max="10" defaultValue="7" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Risque</span><span className="font-bold text-primary">4/10</span></div>
                <input className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-primary" type="range" min="0" max="10" defaultValue="4" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">check_circle</span> Valider &amp; Envoyer au Directeur BU</button>
            <button className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">cancel</span> Rejeter avec commentaire</button>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-600 dark:text-slate-400">Une fois validée, l&apos;idée sera transmise au Directeur BU pour décision finale. En cas de rejet, le porteur recevra une notification avec votre feedback.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
