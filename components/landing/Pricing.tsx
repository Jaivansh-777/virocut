"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    icon: Sparkles,
    features: [
      "3 videos per month",
      "Basic AI clips",
      "Standard captions",
      "720p export quality",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious content creators",
    icon: Crown,
    features: [
      "50 videos per month",
      "Advanced AI clips",
      "Custom caption styles",
      "4K export quality",
      "Priority processing",
      "All platforms",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    description: "For teams and agencies",
    icon: Building2,
    features: [
      "Unlimited videos",
      "White-label clips",
      "Brand voice AI",
      "8K export quality",
      "Instant processing",
      "Team collaboration",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-white">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={plan.popular ? "sm:-mt-2 sm:mb-[-8px] relative z-10" : ""}
            >
              <div className={plan.popular ? "relative" : ""}>
                {plan.popular && (
                  <div className="absolute -inset-px bg-gradient-to-b from-primary-500/15 via-purple-500/10 to-accent-500/15 rounded-2xl blur-sm opacity-80" />
                )}

                <Card
                  className={`p-6 sm:p-7 h-full flex flex-col relative ${
                    plan.popular
                      ? "border-primary-500/15 shadow-lg shadow-primary-500/[0.04]"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center bg-gradient-to-r from-primary-500 to-purple-600 text-white text-[0.6875rem] font-semibold px-3 py-1 rounded-full shadow-md shadow-primary-500/20">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="inline-flex w-10 h-10 rounded-xl bg-white/[0.04] items-center justify-center mb-3">
                      <plan.icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{plan.description}</p>
                  </div>

                  <div className="mb-5 pb-5 border-b border-white/[0.06]">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup" className="w-full block">
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      className="w-full text-sm"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
