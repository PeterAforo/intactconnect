"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle, Camera, IdCard } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "nhis", label: "NHIS Card" },
  { value: "driver_license", label: "Driver's License" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[#e2e0da] bg-white text-sm text-[#1c1917] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#0d0b09]/15 focus:border-[#0d0b09]/40 transition";

const labelCls = "text-[13px] font-medium text-[#1c1917] block mb-1.5";
const sectionCls = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b665e] mb-3";

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
      <AuthShell switchHref="/" switchLabel="Home" wide>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#0d0b09]/40" />
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell switchHref="/" switchLabel="Home" wide>
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: EASE }} className="text-center py-10">
          <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-[#2e7d32]" />
          </div>
          <h2 className="text-[20px] font-bold text-[#1c1917] tracking-tight mb-2">Application submitted</h2>
          <p className="text-[13px] text-[#6b665e] leading-relaxed mb-6">
            Our team will review your reseller application within 24 hours. We&apos;ll email you once approved.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#0d0b09] text-white text-[13px] font-semibold hover:bg-[#2a251d] transition-colors"
          >
            Back to home
          </a>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell switchHref="/" switchLabel="Home" wide>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <h1 className="text-[22px] font-bold text-[#1c1917] tracking-tight leading-snug">Become a reseller</h1>
        <p className="text-[13px] text-[#6b665e] mt-1 mb-6">Complete your store &amp; ID details — your account info carries over.</p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-4 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Info */}
          <div>
            <h3 className={sectionCls}>Your store</h3>
            <div>
              <label className={labelCls}>Store name *</label>
              <input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} placeholder="My Tech Store" className={`${inputCls} ${errors.storeName ? "border-red-300" : ""}`} />
              {errors.storeName && <p className="text-red-600 text-xs mt-1">{errors.storeName}</p>}
            </div>
          </div>

          {/* Profile Photo */}
          <div>
            <label className={labelCls}>Profile photo *</label>
            <div className="flex items-center gap-4">
              <div onClick={() => pictureRef.current?.click()} className={`w-16 h-16 rounded-full border-2 border-dashed ${errors.picture ? "border-red-300" : "border-[#e2e0da]"} bg-[#fbfaf8] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0d0b09]/40 transition-colors`}>
                {picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picture} alt="Profile" className="w-full h-full object-cover" />
                ) : uploading === "picture" ? (
                  <Loader2 className="w-5 h-5 text-[#a8a29a] animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-[#a8a29a]" />
                )}
              </div>
              <div>
                <button type="button" onClick={() => pictureRef.current?.click()} disabled={uploading === "picture"} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#e2e0da] text-[13px] font-medium text-[#3a362f] hover:bg-[#f5f4f1] transition-colors disabled:opacity-60">
                  <Upload className="w-3.5 h-3.5" /> Upload photo
                </button>
                {errors.picture && <p className="text-red-600 text-xs mt-1">{errors.picture}</p>}
              </div>
            </div>
            <input ref={pictureRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
          </div>

          {/* National ID */}
          <div>
            <h3 className={sectionCls}>National ID verification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>ID type *</label>
                <select value={form.nationalIdType} onChange={(e) => update("nationalIdType", e.target.value)} className={inputCls}>
                  {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>ID number *</label>
                <input value={form.nationalIdNumber} onChange={(e) => update("nationalIdNumber", e.target.value)} placeholder="GHA-XXXXXXXXX-X" className={`${inputCls} ${errors.nationalIdNumber ? "border-red-300" : ""}`} />
                {errors.nationalIdNumber && <p className="text-red-600 text-xs mt-1">{errors.nationalIdNumber}</p>}
              </div>
            </div>
            <div className="mt-3.5">
              <label className={labelCls}>Upload ID image *</label>
              <div onClick={() => idRef.current?.click()} className={`border-2 border-dashed ${errors.nationalIdImage ? "border-red-300" : "border-[#e2e0da]"} rounded-lg p-5 bg-[#fbfaf8] text-center cursor-pointer hover:border-[#0d0b09]/40 transition-colors`}>
                {nationalIdImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={nationalIdImage} alt="ID" className="max-h-32 mx-auto rounded-lg" />
                ) : uploading === "id" ? (
                  <Loader2 className="w-6 h-6 text-[#a8a29a] animate-spin mx-auto" />
                ) : (
                  <>
                    <IdCard className="w-6 h-6 text-[#a8a29a] mx-auto mb-1.5" />
                    <p className="text-[#6b665e] text-[13px]">Click to upload your ID</p>
                  </>
                )}
              </div>
              {errors.nationalIdImage && <p className="text-red-600 text-xs mt-1">{errors.nationalIdImage}</p>}
            </div>
            <input ref={idRef} type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
          </div>

          {/* Payout Info */}
          <div>
            <h3 className={sectionCls}>Payout details <span className="normal-case font-normal">(optional)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>MoMo provider</label>
                <select value={form.momoProvider} onChange={(e) => update("momoProvider", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="mtn">MTN</option>
                  <option value="vodafone">Vodafone</option>
                  <option value="airteltigo">AirtelTigo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>MoMo number</label>
                <input value={form.momoNumber} onChange={(e) => update("momoNumber", e.target.value)} placeholder="0XX XXX XXXX" className={inputCls} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#0d0b09] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2a251d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit application"}
          </button>
        </form>
      </motion.div>
    </AuthShell>
  );
}

export default function BecomeResellerPage() {
  return (
    <Suspense fallback={
      <AuthShell switchHref="/" switchLabel="Home" wide>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#0d0b09]/40" />
        </div>
      </AuthShell>
    }>
      <BecomeResellerForm />
    </Suspense>
  );
}
