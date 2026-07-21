"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2, Package, Tag, ChevronRight, ChevronLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface SubCategory { id: string; name: string; slug: string; image: string | null; }
interface Category { id: string; name: string; slug: string; image: string | null; children: SubCategory[]; }
interface ProductItem { id: string; name: string; slug: string; price: number; comparePrice: number | null; image: string | null; category: { id: string; name: string }; stock: number; }

const STEPS = ["Categories", "Products", "Finish"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/onboarding")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setProducts(d.products || []);
        setSelectedCategoryIds(d.selectedCategoryIds || []);
        setSelectedProductIds(d.selectedProductIds || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async (redirect = true) => {
    setSaving(true);
    await fetch("/api/dashboard/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedCategoryIds, selectedProductIds }),
    });
    setSaving(false);
    if (redirect) router.push("/dashboard");
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">Customize Your Store</h1>
          <p className="text-text-muted text-sm mt-1">Choose the categories and products you want to sell.</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-2 text-sm ${i === step ? "text-primary font-medium" : "text-text-muted"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === step ? "bg-primary text-white" : i < step ? "bg-success text-white" : "bg-surface border border-border"}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s}
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text mb-1 flex items-center gap-2"><Tag className="w-5 h-5" /> Select Categories</h2>
              <p className="text-text-muted text-sm mb-6">Pick categories that match what you want to sell. Leave empty to show all products.</p>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="border border-border rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="w-5 h-5 rounded border-border text-primary"
                      />
                      <span className="font-medium text-text">{cat.name}</span>
                    </label>
                    {cat.children.length > 0 && (
                      <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.children.map((sub) => (
                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(sub.id)}
                              onChange={() => toggleCategory(sub.id)}
                              className="w-4 h-4 rounded border-border text-primary"
                            />
                            <span className="text-text-muted">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text mb-1 flex items-center gap-2"><Package className="w-5 h-5" /> Select Products</h2>
              <p className="text-text-muted text-sm mb-4">Choose specific products to feature. Leave empty to show all products from selected categories.</p>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="mb-4"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${selectedProductIds.includes(p.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="aspect-square relative bg-surface rounded-lg mb-2 overflow-hidden">
                      {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2" /> : <Package className="w-8 h-8 text-text-muted m-auto" />}
                    </div>
                    <p className="text-xs text-text-muted">{p.category.name}</p>
                    <p className="text-sm font-medium text-text line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-sm font-bold text-primary">GH₵{p.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border p-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Ready to Sell!</h2>
              <p className="text-text-muted text-sm mb-6">
                You selected {selectedCategoryIds.length} categories and {selectedProductIds.length} products.
              </p>
              <Button onClick={() => save(true)} disabled={saving} className="rounded-full h-11">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Finish & Go to Dashboard
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
