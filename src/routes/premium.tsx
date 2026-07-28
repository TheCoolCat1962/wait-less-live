import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  Bell,
  Star,
  History,
  TrendingUp,
  Ban,
  Crown,
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
});

// Premium features data - easy to update and maintain
const PREMIUM_FEATURES = [
  {
    id: "smart-alerts",
    icon: Bell,
    title: "Smart Wait Alerts",
    description: "Receive notifications when a business reaches your desired wait time.",
    examples: [
      "Notify me when Costco is under 15 minutes",
      "Notify me when Starbucks has no line",
      "Notify me when the DMV is below 20 minutes",
    ],
    comingSoon: false,
  },
  {
    id: "favorite-notifications",
    icon: Star,
    title: "Favorite Place Notifications",
    description: "Receive instant notifications whenever one of your favorite businesses gets a new wait report.",
    comingSoon: false,
  },
  {
    id: "wait-history",
    icon: History,
    title: "Wait Time History",
    description: "Show historical wait trends for smarter planning.",
    features: [
      "Best time to visit",
      "Busiest hours",
      "Average wait by day",
      "Weekly trends",
    ],
    comingSoon: true,
  },
  {
    id: "advanced-insights",
    icon: TrendingUp,
    title: "Advanced Wait Insights",
    description: "Get deeper data to make informed decisions.",
    features: [
      "Confidence score",
      "Wait trend (Increasing / Stable / Decreasing)",
      "Number of recent reports",
    ],
    comingSoon: true,
  },
  {
    id: "ad-free",
    icon: Ban,
    title: "Ad-Free Experience",
    description: "If QueueLess adds ads in the future, Premium removes them for a clean experience.",
    comingSoon: false,
  },
] as const;

const PRICING = {
  name: "QueueLess Premium",
  price: 4.99,
  period: "month",
} as const;

// Local storage keys
const STORAGE_KEY = "queueless_premium_interest";

function FeatureCard({
  feature,
}: {
  feature: (typeof PREMIUM_FEATURES)[number];
}) {
  const Icon = feature.icon;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`grid size-10 place-items-center rounded-xl ${feature.comingSoon ? "bg-muted" : "bg-brand/10"}`}
        >
          <Icon
            className={`size-5 ${feature.comingSoon ? "text-muted-foreground" : "text-brand"}`}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{feature.title}</h3>
          {feature.comingSoon && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coming Soon
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{feature.description}</p>
      {"examples" in feature && feature.examples && (
        <ul className="mt-3 space-y-1.5">
          {feature.examples.map((example, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-brand" />
              <span>{example}</span>
            </li>
          ))}
        </ul>
      )}
      {"features" in feature && feature.features && (
        <ul className="mt-3 space-y-1.5">
          {feature.features.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-3 shrink-0 text-safe" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PricingCard() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const handleNotifyMe = useCallback(async () => {
    setIsSubmitting(true);
    // Simulate API call - ready for Stripe integration
    await new Promise((resolve) => setTimeout(resolve, 800));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, timestamp: Date.now() }));
    setIsSubmitted(true);
    setIsSubmitting(false);
  }, [email]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand to-brand/70 p-6 text-brand-foreground">
      <div className="mb-4 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          <Crown className="size-3" />
          <span>Launch Special</span>
        </div>
        <h2 className="text-2xl font-black">{PRICING.name}</h2>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <span className="text-lg font-semibold">$</span>
          <span className="text-5xl font-black">{PRICING.price}</span>
          <span className="text-sm font-medium opacity-80">/{PRICING.period}</span>
        </div>
      </div>

      {isSubmitted ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="grid size-16 place-items-center rounded-full bg-white/20">
              <Check className="size-8" />
            </div>
          </div>
          <div>
            <p className="font-bold">You're on the list!</p>
            <p className="mt-1 text-sm opacity-80">
              We'll notify you when Premium launches.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm font-medium opacity-90">
            Premium is coming soon. Payments are not available yet.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl bg-white/20 px-4 py-3 text-sm font-medium placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              onClick={handleNotifyMe}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-brand transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Bell className="size-4" />
                  <span>Notify Me When Premium Launches</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PremiumPage() {
  return (
    <AppShell>
      {/* Header with back button */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 px-5 pb-4 pt-6 backdrop-blur">
        <Link
          to="/profile"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>Back to Profile</span>
        </Link>
        <h1 className="text-2xl font-black tracking-tight">
          Unlock QueueLess Premium
        </h1>
      </header>

      <main className="space-y-8 px-5 py-6">
        {/* Hero Section */}
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2">
            <Zap className="size-4 text-brand" />
            <span className="text-sm font-bold text-brand">Power up your wait time experience</span>
          </div>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Get smarter alerts, deeper insights, and a seamless ad-free experience.
          </p>
        </section>

        {/* Features Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Premium Features</h2>
          <div className="space-y-3">
            {PREMIUM_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>

        {/* Pricing Card */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Simple Pricing</h2>
          <PricingCard />
        </section>

        {/* Comparison Section */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-bold">Free vs Premium</h3>
          <div className="space-y-3">
            <ComparisonRow
              feature="Basic wait times"
              free
              premium
            />
            <ComparisonRow
              feature="Report wait times"
              free
              premium
            />
            <ComparisonRow
              feature="Save favorites"
              free
              premium
            />
            <ComparisonRow
              feature="Smart wait alerts"
              free={false}
              premium
            />
            <ComparisonRow
              feature="Favorite notifications"
              free={false}
              premium
            />
            <ComparisonRow
              feature="Wait time history"
              free={false}
              premium
            />
            <ComparisonRow
              feature="Advanced insights"
              free={false}
              premium
            />
            <ComparisonRow
              feature="Ad-free experience"
              free={false}
              premium
            />
          </div>
        </section>

        {/* Trust Section */}
        <section className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="size-4 text-safe" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="size-4 text-brand" />
              <span>No ads ever</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment processing handled securely via Stripe
          </p>
        </section>
      </main>
    </AppShell>
  );
}

function ComparisonRow({
  feature,
  free,
  premium,
}: {
  feature: string;
  free: boolean;
  premium: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{feature}</span>
      <div className="flex items-center gap-4">
        <span className={free ? "text-safe" : "text-muted-foreground"}>
          {free ? <Check className="size-4" /> : "—"}
        </span>
        <span className={premium ? "text-brand font-bold" : "text-muted-foreground"}>
          {premium ? <Check className="size-4" /> : "—"}
        </span>
      </div>
    </div>
  );
}
