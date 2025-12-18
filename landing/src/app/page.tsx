"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  BoltIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const appUrl = "http://localhost:5173";

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-200/50 selection:text-emerald-900">
      <nav className="fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-6 flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 shadow-nav">
            <div className="flex items-center gap-2">
              <Image
                src="/Icon.png"
                alt="DataForge AI"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-semibold text-lg tracking-tight">
                DataForge AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-200">
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#workflow" className="hover:text-white">
                Workflow
              </a>
              <a href="#proof" className="hover:text-white">
                Proof
              </a>
              <Link
                href={`${appUrl}/login`}
                className="rounded-full border border-white/15 px-4 py-2 hover:border-white/30"
              >
                Sign in
              </Link>
              <Link
                href={`${appUrl}/register`}
                className="rounded-full bg-emerald-400 text-slate-900 px-4 py-2 font-semibold hover:bg-emerald-300"
              >
                Try free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-28">
        <div className="noise-layer" />
        <div className="absolute inset-0 opacity-60 hero-rays" />
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-12"
          >
            <div className="space-y-8">
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100"
              >
                <SparklesIcon className="h-4 w-4 text-emerald-300" />
                AutoML + EDA + Predictions + Reports
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-6xl font-black leading-tight tracking-tight"
              >
                Ship data products{" "}
                <span className="text-gradient">without writing code.</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-slate-200/90 leading-relaxed max-w-2xl"
              >
                DataForge AI ingests your CSV/XLSX, runs automated EDA, tunes
                the best model, serves predictions, and writes stakeholder-ready
                reports. All with an AI copilot that explains every decision.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3 sm:items-center"
              >
                <Link
                  href={`${appUrl}/register`}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-400 px-6 py-3 text-slate-900 font-semibold text-lg shadow-lg shadow-emerald-400/30 hover:bg-emerald-300 active:translate-y-[1px]"
                >
                  Start free
                  <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={`${appUrl}/login`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-white hover:border-white/40"
                >
                  View live workspace
                  <CheckBadgeIcon className="h-5 w-5 text-emerald-300" />
                </Link>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4 text-sm text-slate-200/80"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
                  Secure by design
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <BoltIcon className="h-4 w-4 text-amber-300" />
                  EDA &lt; 5s, Train &lt; 30s
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-300" />
                  No credit card
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-emerald-500/15">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-200/80">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-900 font-bold">
                      DF
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Live project
                      </p>
                      <p className="font-semibold">customer_churn_v2.csv</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
                    AutoML running…
                  </div>
                </div>

                <div className="grid gap-3 mb-5">
                  {[
                    {
                      label: "Task detection",
                      value: "Classification",
                      accent: "text-emerald-300",
                    },
                    {
                      label: "Models training",
                      value: "5 candidates · XGBoost leading",
                      accent: "text-cyan-200",
                    },
                    {
                      label: "Data quality",
                      value: "0.4% missing · 124 outliers flagged",
                      accent: "text-amber-200",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="text-sm text-slate-200/80">
                        {item.label}
                      </span>
                      <span className={`text-sm font-semibold ${item.accent}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200 mb-4">
                    <div className="flex items-center gap-2">
                      <ChartPieIcon className="h-5 w-5 text-emerald-300" />
                      Model leaderboard
                    </div>
                    <span className="text-slate-400">Auto-tuned</span>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { name: "XGBoost", score: "98.2%" },
                      { name: "Random Forest", score: "95.1%" },
                      { name: "Logistic Regression", score: "89.4%" },
                    ].map((m) => (
                      <div
                        key={m.name}
                        className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-slate-100">
                          <span className="h-2 w-2 rounded-full bg-emerald-300" />
                          {m.name}
                        </div>
                        <span className="font-mono text-emerald-200">
                          {m.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="proof"
        className="border-y border-white/5 bg-slate-900/30 py-10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
            {[
              "Fintech risk teams",
              "Healthcare analytics",
              "RevOps squads",
              "Product growth",
              "Public sector",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 bg-white/5"
              >
                <CheckBadgeIcon className="h-4 w-4 text-emerald-300" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
              Built for real teams
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              E2E data science in one workspace.
            </h2>
            <p className="text-slate-200 max-w-3xl">
              Upload datasets, explore automatically, train the right model,
              generate predictions, and ship reports—without juggling scripts,
              notebooks, or dashboards.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 auto-rows-[1fr]">
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-slate-900/40 p-6 flex flex-col gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/15 p-3">
                  <CpuChipIcon className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">AutoML orchestration</h3>
                  <p className="text-slate-300">
                    Task detection, hyperparameter sweeps, and leaderboards out
                    of the box.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {["Classification", "Regression", "Time-aware (beta)"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-slate-200"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200 mb-3">
                  <span>Leaderboard</span>
                  <span className="text-emerald-200">ROC AUC · RMSE</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "XGBoost", metric: "0.982 ROC AUC" },
                    { name: "Gradient Boosting", metric: "0.964 ROC AUC" },
                    { name: "Random Forest", metric: "0.951 ROC AUC" },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        <span>{row.name}</span>
                      </div>
                      <span className="font-mono text-emerald-200">
                        {row.metric}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
            >
              <div className="rounded-2xl bg-cyan-400/15 p-3 w-fit">
                <ChartBarIcon className="h-6 w-6 text-cyan-200" />
              </div>
              <h3 className="text-xl font-semibold">Automated EDA</h3>
              <p className="text-slate-300">
                Distributions, correlations, missingness, and outlier maps
                generated instantly.
              </p>
              <div className="mt-auto space-y-2 text-sm text-slate-200">
                <div className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Row/column summary</span>
                  <span className="text-emerald-200">Live</span>
                </div>
                <div className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>Insight bullets</span>
                  <span className="text-emerald-200">AI-written</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
            >
              <div className="rounded-2xl bg-amber-400/15 p-3 w-fit">
                <DocumentTextIcon className="h-6 w-6 text-amber-200" />
              </div>
              <h3 className="text-xl font-semibold">Reports that stick</h3>
              <p className="text-slate-300">
                One click to PDF/HTML reports with charts, leaderboard, feature
                importances, and recommendations.
              </p>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
                <div className="flex items-center gap-2 text-emerald-200 mb-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  Stakeholder ready
                </div>
                <p>Brand-safe layouts, change logs, and export history.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 flex flex-col gap-4"
            >
              <div className="rounded-2xl bg-white/10 p-3 w-fit">
                <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold">AI assistant, in context</h3>
              <p className="text-slate-300">
                Ask “Why did churn increase?” or “What’s driving RMSE?” and get
                answers grounded in your project metadata.
              </p>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  • Explains metrics & charts
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  • What-if and feature-importance Q&A
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-400/15 via-white/5 to-cyan-400/10 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Secure ingestion & governance
                  </h3>
                  <p className="text-slate-200">
                    File-type validation, JWT auth, and audit trails baked in.
                  </p>
                </div>
                <ShieldCheckIcon className="h-8 w-8 text-emerald-200" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                {[
                  "Schema validation",
                  "Row/column limits",
                  "SSO-ready",
                  "Run logs & metadata",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-emerald-200" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-20 border-t border-white/5 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
              Three steps
            </p>
            <h2 className="text-4xl font-bold">From raw CSV to ROI.</h2>
            <p className="text-slate-200 max-w-3xl">
              Upload, auto-train, and deploy. Predictions stay aligned with your
              schema, and exports stay human-friendly.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload & validate",
                desc: "CSV/XLSX with schema detection, dtype checks, and missingness scan.",
              },
              {
                step: "02",
                title: "Auto-train & tune",
                desc: "Parallel experiments choose the right algorithm and hyperparameters.",
              },
              {
                step: "03",
                title: "Predict & report",
                desc: "Batch CSV scoring, API endpoints, and polished reports in one click.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20"
              >
                <div className="mb-4 flex items-center justify-between text-slate-200">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    {item.step}
                  </span>
                  <ArrowUpRightIcon className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-6">
              <UserGroupIcon className="h-6 w-6 text-emerald-200" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                  Ops in production
                </p>
                <h3 className="text-2xl font-semibold">Reliability by design</h3>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "EDA runtime", value: "< 5s" },
                { label: "Training window", value: "< 30s" },
                { label: "Prediction latency", value: "< 2s" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-3"
                >
                  <p className="text-sm text-slate-300">{stat.label}</p>
                  <p className="text-2xl font-bold text-emerald-200">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              • Cached EDA, horizontal ML jobs, and S3-ready storage keep teams
              unblocked.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-slate-900/60 p-6 shadow-xl shadow-black/30">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80 mb-3">
              Teams love it
            </p>
            <p className="text-2xl font-semibold text-white mb-6">
              “DataForge AI cut our churn analysis from a week of notebooks to a
              30-minute review. The AI assistant explains the why, and the
              reports ship themselves.”
            </p>
            <div className="flex items-center gap-3 text-slate-200">
              <div className="h-10 w-10 rounded-full bg-emerald-400 text-slate-900 font-bold grid place-items-center">
                L
              </div>
              <div>
                <p className="font-semibold">Lead Data Scientist</p>
                <p className="text-slate-400 text-sm">Global telco</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/70 px-8 py-12 shadow-2xl shadow-emerald-500/20">
            <div className="flex flex-col gap-6 text-center">
              <h2 className="text-4xl sm:text-5xl font-bold">
                Build your next model in minutes.
              </h2>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                Upload a dataset, select a target, and ship predictions with
                explainable models and executive-ready reports—today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`${appUrl}/register`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-emerald-300 shadow-lg shadow-emerald-400/30"
                >
                  Create free project
                  <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={`${appUrl}/login`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-lg font-semibold text-white hover:border-white/40"
                >
                  Talk to sales
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-slate-950/80 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/Icon.png"
              alt="DataForge AI"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-semibold">DataForge AI</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-white">
              Product
            </a>
            <a href="#workflow" className="hover:text-white">
              Docs
            </a>
            <a href="#proof" className="hover:text-white">
              Security
            </a>
            <a href={`${appUrl}/login`} className="hover:text-white">
              Sign in
            </a>
          </div>
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} DataForge AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
