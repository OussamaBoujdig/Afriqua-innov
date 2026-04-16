"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] dark:bg-[#09090b] px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <Image src="/logo-afriquia.png" alt="Afriquia SMDC" width={36} height={36} />
          <div>
            <p className="text-[16px] font-semibold text-[#0066B3] tracking-tight leading-tight">InnovHub</p>
            <p className="text-[10px] text-slate-400 leading-tight">Afriquia SMDC</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Bienvenue
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Connectez-vous pour accéder à votre espace innovation.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-neutral-300 mb-1.5" htmlFor="email">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@afriquiasmdc.com"
                required
                autoFocus
                className="block w-full rounded-md border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-[14px] text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0066B3] dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#0066B3]/15 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-neutral-300 mb-1.5" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  className="block w-full rounded-md border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 pr-10 text-[14px] text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#0066B3] dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#0066B3]/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-[14px]"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-slate-400">
          Pas de compte ? Contactez votre responsable innovation.
        </p>
      </div>
    </div>
  );
}
