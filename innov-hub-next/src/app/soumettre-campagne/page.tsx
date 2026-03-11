export default function SoumettreAvecCampagnePage() {
  return (
    <div className="px-4 lg:px-8 py-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-extrabold leading-tight tracking-tight">Soumettre une idée</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Partagez votre innovation avec la communauté Innov&apos;Hub</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-primary text-sm font-bold uppercase tracking-wider">Étape 1 sur 5</span>
                <span className="text-slate-900 dark:text-slate-100 text-sm font-bold">20%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "20%" }}></div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Prochaine étape : Détails du Concept</p>
            </div>
            <hr className="border-slate-100 dark:border-slate-800"/>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choisir une Campagne</label>
                <select className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all">
                  <option value="">Aucune (Idée libre)</option>
                  <option value="transition">Transition Écologique</option>
                  <option value="experience">Expérience Collaborateur</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
                <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">Détails du Concept</h3>
              </div>
              <form className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titre de l&apos;idée</label>
                  <input className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" placeholder="Ex: Optimisation du flux logistique par IA" type="text"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Catégorie</label>
                  <select className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all">
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="tech">Technologie &amp; IT</option>
                    <option value="ops">Opérations &amp; Logistique</option>
                    <option value="hr">Ressources Humaines</option>
                    <option value="mkt">Marketing &amp; Ventes</option>
                    <option value="csr">RSE &amp; Environnement</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Problématique constatée</label>
                  <textarea className="flex w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" placeholder="Décrivez le problème que vous souhaitez résoudre..." rows={3}></textarea>
                  <p className="text-xs text-slate-400 italic">Soyez précis sur l&apos;impact actuel de ce problème.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Solution proposée</label>
                  <textarea className="flex w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" placeholder="Comment votre idée répond-elle à ce problème ?" rows={4}></textarea>
                </div>
                <div className="pt-3 flex justify-between items-center">
                  <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 hover:-translate-y-0.5" type="button">Enregistrer en brouillon</button>
                  <button className="group relative flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-300" type="submit">Étape suivante <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 opacity-50 cursor-not-allowed pointer-events-none">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">lightbulb</span><span className="text-xs font-bold uppercase text-slate-400">Étape 2: Concept</span></div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">trending_up</span><span className="text-xs font-bold uppercase text-slate-400">Étape 3: Impact</span></div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">attach_file</span><span className="text-xs font-bold uppercase text-slate-400">Étape 4: Documents</span></div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">fact_check</span><span className="text-xs font-bold uppercase text-slate-400">Étape 5: Revue</span></div>
        </div>
      </div>
    </div>
  );
}
