"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle, ArrowLeft, Camera, IdCard, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "nhis", label: "NHIS Card" },
  { value: "driver_license", label: "Driver's License" },
];

function BecomeResellerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState({
    storeName: "", nationalIdType: "ghana_card", nationalIdNumber: "",
    momoProvider: "", momoNumber: "", bankName: "", bankAccountNumber: "", bankAccountName: "",
  });
  const [picture, setPicture] = useState("");
  const [nationalIdImage, setNationalIdImage] = useState("");
  const [uploading, setUploading] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pictureRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  // Ensure logged in (and not already a reseller)
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.replace("/login"); return; }
      if (d.reseller) { router.replace("/dashboard"); return; }
      setAuthChecked(true);
    }).catch(() => router.replace("/login"));
  }, [router]);

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("picture");
    try { setPicture(await uploadFile(file, "intactconnect/resellers")); }
    catch { setError("Photo upload failed"); }
    setUploading("");
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("id");
    try { setNationalIdImage(await uploadFile(file, "intactconnect/ids")); }
    catch { setError("ID upload failed"); }
    setUploading("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.storeName.trim()) e.storeName = "Store name required";
    if (!form.nationalIdNumber.trim()) e.nationalIdNumber = "ID number required";
    if (!picture) e.picture = "Photo required";
    if (!nationalIdImage) e.nationalIdImage = "ID image required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/become-reseller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, picture, nationalIdImage, ref: searchParams.get("ref") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
    setLoading(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl max-w-md w-full text-center border border-border shadow-lg p-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Application Submitted!</h2>
          <p className="text-text-muted text-sm mb-6">
            Our team will review your reseller application within 24 hours. We&apos;ll email you once approved.
          </p>
          <Link href="/"><Button className="rounded-full px-8">Back to Home</Button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">Become a Reseller</h1>
              <p className="text-text-muted text-sm">Complete your store & ID details — your account info carries over.</p>
            </div>
          </div>

          {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mt-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Store Info */}
            <div>
              <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Your Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-text block mb-1">Store Name *</label>
                  <Input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} placeholder="My Tech Store" className={errors.storeName ? "border-danger" : ""} />
                  {errors.storeName && <p className="text-danger text-xs mt-1">{errors.storeName}</p>}
                </div>
              </div>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="text-sm font-medium text-text block mb-2">Profile Photo *</label>
              <div className="flex items-center gap-4">
                <div onClick={() => pictureRef.current?.click()} className={`w-20 h-20 rounded-full border-2 border-dashed ${errors.picture ? "border-danger" : "border-border"} flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors`}>
                  {picture ? (
                    <img src={picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : uploading === "picture" ? (
                    <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-text-muted" />
                  )}
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => pictureRef.current?.click()} disabled={uploading === "picture"}>
                    <Upload className="w-4 h-4 mr-1" /> Upload Photo
                  </Button>
                  {errors.picture && <p className="text-danger text-xs mt-1">{errors.picture}</p>}
                </div>
              </div>
              <input ref={pictureRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
            </div>

            {/* National ID */}
            <div>
              <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">National ID Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-1">ID Type *</label>
                  <select value={form.nationalIdType} onChange={(e) => update("nationalIdType", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                    {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1">ID Number *</label>
                  <Input value={form.nationalIdNumber} onChange={(e) => update("nationalIdNumber", e.target.value)} placeholder="GHA-XXXXXXXXX-X" className={errors.nationalIdNumber ? "border-danger" : ""} />
                  {errors.nationalIdNumber && <p className="text-danger text-xs mt-1">{errors.nationalIdNumber}</p>}
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium text-text block mb-2">Upload ID Image *</label>
                <div onClick={() => idRef.current?.click()} className={`border-2 border-dashed ${errors.nationalIdImage ? "border-danger" : "border-border"} rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors`}>
                  {nationalIdImage ? (
                    <img src={nationalIdImage} alt="ID" className="max-h-32 mx-auto rounded-lg" />
                  ) : uploading === "id" ? (
                    <Loader2 className="w-8 h-8 text-text-muted animate-spin mx-auto" />
                  ) : (
                    <>
                      <IdCard className="w-8 h-8 text-text-muted mx-auto mb-2" />
                      <p className="text-text-muted text-sm">Click to upload your ID</p>
                    </>
                  )}
                </div>
                {errors.nationalIdImage && <p className="text-danger text-xs mt-1">{errors.nationalIdImage}</p>}
              </div>
              <input ref={idRef} type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
            </div>

            {/* Payout Info */}
            <div>
              <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Payout Details (optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-1">MoMo Provider</label>
                  <select value={form.momoProvider} onChange={(e) => update("momoProvider", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="">Select</option>
                    <option value="mtn">MTN</option>
                    <option value="vodafone">Vodafone</option>
                    <option value="airteltigo">AirtelTigo</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1">MoMo Number</label>
                  <Input value={form.momoNumber} onChange={(e) => update("momoNumber", e.target.value)} placeholder="0XX XXX XXXX" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Submit Application
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function BecomeResellerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BecomeResellerForm />
    </Suspense>
  );
}
