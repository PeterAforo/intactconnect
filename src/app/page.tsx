"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, Users, TrendingUp, ShieldCheck, Truck, FileText, Wallet,
  Smartphone, Star, MessageCircle, Zap, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_IMG = "/img/people-identifical-clothes-african-couple-autumn-city.jpg";
const HOW_IMGS = [
  "/img/african-american-business-woman-with-laptop.jpg",
  "/img/girls-walk-along-streets-city.jpg",
  "/img/software-engineer-coding-laptop-focusing-deep-learning.jpg",
];
const CTA_IMG = "/img/african-american-woman-with-laptop-cafe.jpg";
const SOCIAL_IMG = "/img/portrait-african-american-man-sitting-cafe-working-laptop.jpg";

const features = [
  { icon: Users, title: "Your Own Store", desc: "Get a personalized storefront link to share with your network on WhatsApp, IG & more" },
  { icon: TrendingUp, title: "Earn Commissions", desc: "Make money on every product you sell — your hustle, your reward" },
  { icon: Truck, title: "Intact Delivers", desc: "All deliveries handled by Intact Ghana — you sell, we ship. Zero stress" },
  { icon: FileText, title: "Invoice Clients", desc: "Create and send professional invoices to your clients like a pro" },
  { icon: Wallet, title: "Easy Payouts", desc: "Withdraw your commissions straight to MoMo or bank — no delays" },
  { icon: ShieldCheck, title: "Trusted Products", desc: "Sell 100% genuine products from Intact Ghana's full catalog" },
];

const testimonials = [
  { name: "Ama Serwaa", location: "Accra", quote: "I started selling Intact products to my university friends. Now I make extra income every month without leaving campus!", avatar: "/img/african-american-business-woman-with-laptop.jpg" },
  { name: "Kwame Asante", location: "Kumasi", quote: "IntactConnect made it so easy. I just share my store link on WhatsApp and the orders come in. The commissions are real!", avatar: "/img/portrait-african-american-man-sitting-cafe-working-laptop.jpg" },
  { name: "Efya Mensah", location: "Takoradi", quote: "I love that I don't have to stock any products. Intact handles everything — I just focus on selling and earning.", avatar: "/img/african-american-woman-with-laptop-cafe.jpg" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/img/logo.png" alt="IntactConnect" width={180} height={50} className="h-12 w-auto" />
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

      {/* Hero — split layout with image */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-5">
              Reseller Platform by Intact Ghana
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-5 leading-[1.1]">
              Turn Your Network Into{" "}
              <span className="gradient-text">Income.</span>
            </h1>
            <p className="text-lg text-text-muted max-w-lg mb-8 leading-relaxed">
              Join IntactConnect — get your own branded store page, sell Intact Ghana products to your people, and earn commissions on every single sale. No stock needed. No stress.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button size="lg" className="rounded-full px-8 text-base w-full sm:w-auto">
                  Start Earning Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base w-full sm:w-auto">
                  Log In
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No stock needed</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> MoMo payouts</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image src={HERO_IMG} alt="Young Ghanaian entrepreneurs collaborating" width={800} height={600} className="w-full h-auto object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>
            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Commission Earned</p>
                  <p className="text-lg font-bold text-text">GH₵ 2,450</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="absolute -top-3 -right-3 bg-white rounded-xl shadow-xl p-3 border border-border"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-text">12 orders today</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: "1,900+", label: "Products Available" },
            { value: "GH₵0", label: "Startup Cost" },
            { value: "Instant", label: "Store Setup" },
            { value: "MoMo", label: "Payout Method" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
              <p className="text-white/70 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works — with images */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-2 mb-3">Start in 3 Easy Steps</h2>
            <p className="text-text-muted max-w-xl mx-auto">No experience needed. If you can share a link, you can earn</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Sign Up & Get Verified", desc: "Create your account, upload your ID. Our team reviews and approves you within 24 hours.", img: HOW_IMGS[0] },
              { step: "02", title: "Share Your Store Link", desc: "Get your unique store URL. Drop it in your WhatsApp status, IG bio, Twitter — anywhere your people are.", img: HOW_IMGS[1] },
              { step: "03", title: "Earn Cash on Every Sale", desc: "When someone buys through your link, you earn commission. Cash out to MoMo anytime. Simple.", img: HOW_IMGS[2] },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={item.img} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  <div className="absolute top-3 left-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-text mb-2">{item.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why IntactConnect?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text mt-2 mb-8">Everything You Need to Hustle Smart</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text text-sm mb-0.5">{f.title}</h3>
                      <p className="text-text-muted text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <Image src={SOCIAL_IMG} alt="Young person using phone for business" width={600} height={450} className="w-full h-auto object-cover" />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl p-4 border border-border max-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-success" />
                  <span className="text-xs font-medium text-text">WhatsApp Share</span>
                </div>
                <p className="text-xs text-text-muted">&quot;Check out my store! 🔥&quot;</p>
                <p className="text-[10px] text-primary mt-1">intactconnect.com/store/kwame</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Reseller Stories</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-2 mb-3">Hear From Our Resellers</h2>
            <p className="text-text-muted max-w-xl mx-auto">Real people, real earnings</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white rounded-2xl p-6 border border-border"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-text text-sm mb-4 leading-relaxed italic">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <Image src={t.avatar} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — with background image */}
      <section className="relative py-24 overflow-hidden">
        <Image src={CTA_IMG} alt="Young entrepreneurs" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Zap className="w-10 h-10 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Your Side Hustle Starts Here</h2>
            <p className="text-white/80 mb-8 text-lg max-w-lg mx-auto">
              No capital needed. No warehouse. No delivery headaches. Just you, your phone, and your network.
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-full px-10 bg-white text-primary hover:bg-white/90 text-base font-semibold shadow-lg">
                Join IntactConnect Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <Image src="/img/logo.png" alt="IntactConnect" width={180} height={50} className="h-12 w-auto" />
              <p className="text-text-muted text-xs mt-1">Reseller platform by Intact Ghana</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <Link href="/login" className="hover:text-text transition-colors">Login</Link>
              <Link href="/register" className="hover:text-text transition-colors">Register</Link>
              <a href="https://intactghana.com" target="_blank" rel="noopener" className="hover:text-text transition-colors">Intact Ghana</a>
            </div>
            <p className="text-text-muted text-xs">
              © {new Date().getFullYear()} IntactConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
