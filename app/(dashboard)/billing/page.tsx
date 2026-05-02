"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Sparkles, Crown, Building2, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    icon: Sparkles,
    features: [
      "3 videos per month",
      "Basic AI clips",
      "Standard captions",
      "720p export",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    icon: Crown,
    features: [
      "50 videos per month",
      "Advanced AI clips",
      "Custom captions",
      "4K export",
      "Priority processing",
      "All platforms",
      "Analytics dashboard",
    ],
    current: false,
    popular: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    icon: Building2,
    features: [
      "Unlimited videos",
      "White-label clips",
      "Brand voice AI",
      "8K export",
      "Instant processing",
      "Team collaboration",
      "API access",
      "Dedicated support",
    ],
    current: false,
  },
];

export default function BillingPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = (plan: string) => {
    setSelectedPlan(plan);
    addToast({ type: "info", message: `Redirecting to payment for ${plan} plan...` });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Billing & Plans</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your subscription and upgrade your plan.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Current Plan</h3>
                <p className="text-sm text-slate-400">
                  {user?.plan?.charAt(0).toUpperCase()}{user?.plan?.slice(1)} Plan &middot; {user?.email}
                </p>
              </div>
            </div>
            <Button variant="secondary">
              <Zap className="w-4 h-4" />
              Upgrade Plan
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.06] grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400">Videos Used</p>
              <p className="text-2xl font-bold mt-1 text-white">2 / 3</p>
              <div className="mt-2 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Next Billing</p>
              <p className="text-2xl font-bold mt-1 text-white">--</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Clips</p>
              <p className="text-2xl font-bold mt-1 text-white">12</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-semibold mb-6 text-white">Available Plans</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className={plan.popular ? "relative" : ""}>
                {plan.popular && (
                  <div className="absolute -inset-px bg-gradient-to-b from-primary-500/15 via-purple-500/10 to-accent-500/15 rounded-2xl blur-sm opacity-80" />
                )}

                <Card
                  className={`p-6 h-full flex flex-col relative ${
                    plan.popular ? "border-primary-500/15 shadow-lg shadow-primary-500/[0.04]" : ""
                  } ${selectedPlan === plan.name ? "ring-2 ring-primary-500" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center bg-gradient-to-r from-primary-500 to-purple-600 text-white text-[0.6875rem] font-semibold px-3 py-1 rounded-full shadow-md shadow-primary-500/20">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
                      <plan.icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.current ? "secondary" : "primary"}
                    className="w-full"
                    disabled={plan.current}
                    onClick={() => !plan.current && handleUpgrade(plan.name)}
                  >
                    {plan.current ? "Current Plan" : "Upgrade"}
                  </Button>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
