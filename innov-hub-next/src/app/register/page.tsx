"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const roles = [
  { value: "PORTEUR_IDEE", label: "Porteur d'idée" },
  { value: "RESPONSABLE_INNOVATION", label: "Responsable Innovation" },
  { value: "DIRECTEUR_BU", label: "Directeur BU" },
  { value: "DIRECTEUR_GENERAL", label: "Directeur Général" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "PORTEUR_IDEE",
    businessUnit: "",
    department: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Column: Branding & Inspiration */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#6c3fc6] via-[#8d54f0] to-[#FF6B35]">
        {/* Abstract background grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <span className="material-symbols-outlined text-[#6c3fc6] text-3xl">hub</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Innov&apos;Hub</h1>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Rejoignez la communauté des innovateurs
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Connectez-vous avec des esprits créatifs, partagez vos idées et transformez le futur dès aujourd&apos;hui.
          </p>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex gap-4 items-center">
          <div className="flex -space-x-3">
            {[
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCK5vF9_y9xEfaAe-X-8upvgOoSopKHy3rIeMzz4121M7tmn_a--BoqJsdKCP8VkdnXJ_enerrJuO0x9Zal0k3hIyHagixxYmFZmOpd7-Ogp0xtLK4JIqe2SLzox0-qCHuctHQG1n6Olvfkd6b3a1DL7HBPqfiIFSeWMo6kgzFABkg9hIChKAsrSgfPn6KWSaHpxRW71f0PR2BHL6Z0Qb72jfqSxZOByOsym3RWHMS57TEar_fcO4JCIUCcZPi49JSWsDPxtnhTsqc",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuARukFONlZmyiWF7QH-K38P-Jb0LQziH0zzfX242ASNGEQaoMy71eiQdCGgmqhzmjh4G8-pn4blonJcQovoOJoh3Np-9ld-3FKk7bnCrLt2i0dDp5qOwF6IDjHeFnYaQdWDpf_AZxF7E23hVo_N-UTko5EV9MdkNJiAaxEwiPbKK5Lz37qJk8di34qBYHyUAZ_xq74GT8Fp92ax4P3wEe19wtSxHLSFC_VGZI8QVTH0YpMqLhbY7j3fs2t-JfvB-o0gWT4H-RfH-xE",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuAHsIxr0MYNnEYGv0owrPogc6Hmmy-TNW_Npw99Vils-_s1Fc_1yyR7bOgQZM-8EyPYxhdpr_LGRNjhFfMU0SCBoQXTkyVOtuLE3GPafyaQybTFIvq6Gir--LGao71HNysQuRtHLzi-yAKGo3BWPxoxXeXtXDnpDYQC7TGCHPdd7Hv2PSP0y-zzO6sWrziT5JoPODvqAOAkGACNkcFbBOJ_qF3xb1R0oD9AmfA9waYwop498BK7ywtlWLr12elddJHdnEAk3RNuShw",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Membre actif"
                className="h-10 w-10 rounded-full border-2 border-[#6c3fc6] object-cover"
              />
            ))}
          </div>
          <span className="text-white text-sm font-medium">+2,000 membres actifs</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-[#17131f]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <span className="material-symbols-outlined text-[#6c3fc6] text-3xl">hub</span>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold">Innov&apos;Hub</h1>
          </div>

          <div className="text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Inscription</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Créez votre compte pour commencer à innover.{" "}
              <Link href="/login" className="text-[#6c3fc6] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First name + Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="firstName">
                  Prénom
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    person
                  </span>
                  <input
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="Jean"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="lastName">
                  Nom
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    badge
                  </span>
                  <input
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Dupont"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="nom@exemple.com"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
                  Confirmer
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    lock_reset
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Role + Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="role">
                  Rôle
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    manage_accounts
                  </span>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm appearance-none"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="department">
                  Département
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    corporate_fare
                  </span>
                  <input
                    id="department"
                    type="text"
                    value={form.department}
                    onChange={(e) => update("department", e.target.value)}
                    placeholder="Ex: IT"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Business Unit */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="businessUnit">
                Business Unit
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  business
                </span>
                <input
                  id="businessUnit"
                  type="text"
                  value={form.businessUnit}
                  onChange={(e) => update("businessUnit", e.target.value)}
                  placeholder="Ex: Digital"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#6c3fc6] focus:border-transparent transition-all outline-none text-sm"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#6c3fc6] focus:ring-[#6c3fc6]"
                />
              </div>
              <label className="text-sm text-slate-500 dark:text-slate-400" htmlFor="terms">
                J&apos;accepte les{" "}
                <a href="#" className="text-[#6c3fc6] hover:underline">
                  Conditions d&apos;Utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-[#6c3fc6] hover:underline">
                  Politique de Confidentialité
                </a>
                .
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#6c3fc6] text-white font-bold rounded-xl shadow-lg shadow-[#6c3fc6]/30 hover:bg-[#6c3fc6]/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <>
                  Créer un compte
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="flex-shrink mx-4 text-slate-400 text-sm">Ou s&apos;inscrire avec</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBre9TSQtWVHYaFnR-dLsQRQDvog6Ch3raDpJho3qe0LenlECZmHBqvcEj77Eie7AoqDNkycoqpH8Hq5Zwej_vL5OB-GXc5-4H7crZuoMtcIr7-tG01Rqp-RAyVhLdTcO9ZDxJev5n9OsMsbPBMCUj-72s-_C-9JCZV3hEVjyC4ceOYky4dMBY0sspgYRgLP3Uz7yKzOx2Dk5T3w7AYOWlCH2yOyJPjkQUNKLth1xwWWvCewBj8px8iU1xFH11KFGLZxzrUgnXKVrQ"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3P3a2b31vBGbIsupQTq0QFh0cLV354ZdjWgb8AH3OJZab5Dxq3AwVkAliHFweRwSsbDGs32ylzfqGdm9wDChSVbrMdU2AlklWk1LwwvBoR-IE64zygih5IXt0Juji9TjbQspUaOgOVBkzNaRW8c0sGGI_XmasltNh2Oe6zEXzoG6ZeQJJWfh5NK5zrWV7V4X7gnt1OiGW03BnQzv3jdtTh9obuyJfavM79lqW9H47XDg6NI1exCiX4m6LtHMkgdOGDRu-7KraC7Q"
                  alt="LinkedIn"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
            </div>
          </form>

          <footer className="text-center pt-8">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © 2024 Innov&apos;Hub. Tous droits réservés. Propulsé par la créativité.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}