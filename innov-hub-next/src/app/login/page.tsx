"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="flex min-h-screen">
      {/* Left Column: Login Form */}
      <div className="flex w-full flex-col justify-center bg-white dark:bg-slate-900 px-8 py-12 md:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 flex items-center gap-2 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6c3fc6] text-white">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Innov&apos;Hub
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Connexion</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Heureux de vous revoir ! Veuillez entrer vos coordonnées.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#6c3fc6] focus:ring-[#6c3fc6] focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                Mot de passe
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:border-[#6c3fc6] focus:ring-[#6c3fc6] focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#6c3fc6] transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#6c3fc6] focus:ring-[#6c3fc6]"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                >
                  Se souvenir de moi
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-semibold text-[#6c3fc6] hover:text-[#6c3fc6]/80 transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-[#6c3fc6] px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#6c3fc6]/90 focus:outline-none focus:ring-2 focus:ring-[#6c3fc6] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Social / SSO */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500 dark:bg-slate-900">
                  Ou continuer avec
                </span>
              </div>
            </div>

            <div className="mt-6 justify-center  gap-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW_M9GfxhazkAOFuwRF-n7CGt3BWu0u4YJgTS5OFyW6_sl5U2ZpyMITtetoFX5FSvu9SKcyaBdCf3qQFSUvuO4GtizWqJ5aTah2KGx-vaZSVWff-B28WqxvR-dPLDF2xCxSHbaJBwbG5WFvcTEsI5fBHeNIpekGGwg8qWWFVl4LqBdc0bfMgQDa4r3EE2LIyj669mJjqMcTPCURAHhl7fh3UOxJfQ0MVpYjCMgbWY98ibbWdb7imwKUsHTEtn03WmisxP9ZxXhL5I"
                  alt="Google"
                  className="h-5 w-5"
                />
                <span>Google</span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-600 dark:text-slate-400">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#6c3fc6] hover:text-[#6c3fc6]/80 transition-colors"
            >
              Commencer l&apos;aventure
            </Link>
          </p>

          {/* Test accounts */}
          <div className="mt-8 text-center text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-500 mb-1">
              Comptes de test (mot de passe: password123)
            </p>
            <p>Porteur d&apos;idée : jean.dupont@innovhub.com</p>
            <p>Resp. Innovation : admin@innovhub.com</p>
            <p>Directeur BU : directeur@innovhub.com</p>
            <p>Directeur Général : dg@innovhub.com</p>
          </div>
        </div>
      </div>

      {/* Right Column: Visual / Branding */}
      <div
        className="relative hidden w-1/2 items-center justify-center overflow-hidden md:flex"
        style={{ background: "linear-gradient(135deg, #6c3fc6 0%, #FF6B35 100%)" }}
      >
        {/* Blurred decorations */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        {/* Background image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCGyFOEh6Jla7Yoz9Rr9aIXUrlGkmYrsfLMQlJwwkjdilScCJ8TuiDP3j7OxPAI3F2AdPhNg_DHdV0uVDrllp6jTj_ZEP67suhgp89cWiMDtZxo3VnM8_SkLrqJdgB7zdx6a8_z8p02RLi_ltBSlhYco734BDBUXT5vngdyMcLqt_90eiZ4XYdrXy37aXoFNRColBiBQY-bloVs4qhnB6VypOTPCYQI74nB1BSDa8UlOaWzcNPk-AaDyu2zHNlV_3k2t9GzeZBOBeI')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-12 text-center text-white">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl">
              <span className="material-symbols-outlined text-5xl">rocket_launch</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">Innov&apos;Hub</h1>
          <p className="mt-6 text-xl font-medium text-white/90 lg:text-2xl italic opacity-90">
            « Propulsez vos idées vers le futur »
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-white mb-2 block">group</span>
              <h4 className="font-bold">Communauté</h4>
              <p className="text-sm text-white/70">Rejoignez des milliers d&apos;innovateurs.</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-white mb-2 block">lightbulb</span>
              <h4 className="font-bold">Incubation</h4>
              <p className="text-sm text-white/70">Donnez vie à vos projets les plus fous.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}