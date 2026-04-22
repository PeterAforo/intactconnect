"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, TrendingUp, ShieldCheck, Truck, FileText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Users, title: "Your Own Store", desc: "Get a personalized storefront to share with your clients" },
  { icon: TrendingUp, title: "Earn Commissions", desc: "Earn a percentage on every product you sell" },
  { icon: Truck, title: "Intact Delivers", desc: "All deliveries handled by Intact Ghana — zero hassle" },
  { icon: FileText, title: "Invoice Clients", desc: "Create and send professional invoices to your clients" },
  { icon: Wallet, title: "Easy Payouts", desc: "Withdraw your commissions to MoMo or bank anytime" },
  { icon: ShieldCheck, title: "Trusted Products", desc: "Sell genuine products from Intact Ghana's catalog" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="gradient-text">IntactConnect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Reseller Platform by Intact Ghana
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-text mb-6 leading-tight">
              Sell Intact Products.<br />
              <span className="gradient-text">Earn Commissions.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8">
              Register as an IntactConnect reseller, get your own branded store page,
              sell Intact Ghana products to your network, and earn commissions on every sale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="rounded-full px-8 text-base">
                  Become a Reseller <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                  Log In to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-3">How It Works</h2>
            <p className="text-text-muted max-w-xl mx-auto">Three simple steps to start earning</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Register & Get Approved", desc: "Sign up with your details and ID. Intact admin reviews and approves your account." },
              { step: "2", title: "Share Your Store Link", desc: "Get a unique store page. Share it with clients via WhatsApp, social media, or email." },
              { step: "3", title: "Earn on Every Sale", desc: "When clients purchase through your store, you earn a commission. Request payouts anytime." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl p-6 border border-border text-center"
              >
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-text mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-3">Everything You Need</h2>
            <p className="text-text-muted max-w-xl mx-auto">Powerful tools to grow your reselling business</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-text mb-1">{f.title}</h3>
                <p className="text-text-muted text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-white/80 mb-8 text-lg">Join IntactConnect today and turn your network into income.</p>
          <Link href="/register">
            <Button size="lg" className="rounded-full px-10 bg-white text-primary hover:bg-white/90 text-base font-semibold">
              Register Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} IntactConnect — Powered by{" "}
            <a href="https://intactghana.com" className="text-primary hover:underline" target="_blank" rel="noopener">
              Intact Ghana
            </a>
            . All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
