"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Eye, EyeOff, Loader2, CheckCircle, Camera, IdCard, Wallet, ChevronRight, ChevronLeft, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "@/components/auth/AuthShell";

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "nhis", label: "NHIS Card" },
  { value: "driver_license", label: "Driver's License" },
];

const STEPS = [
  { label: "Account", icon: User },
  { label: "Identity", icon: ShieldCheck },
  { label: "Payout", icon: Wallet },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    storeName: "", nationalIdType: "ghana_card", nationalIdNumber: "",
    momoProvider: "", momoNumber: "", bankName: "", bankAccountNumber: "", bankAccountName: "",
  });
  const [picture, setPicture] = useState<string>("");
  const [nationalIdImage, setNationalIdImage] = useState<string>("");
  const [uploading, setUploading] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pictureRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

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
    try {
      const url = await uploadFile(file, "intactconnect/resellers");
      setPicture(url);
    } catch { setError("Photo upload failed"); }
    setUploading("");
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("id");
    try {
      const url = await uploadFile(file, "intactconnect/ids");
      setNationalIdImage(url);
    } catch { setError("ID upload failed"); }
    setUploading("");
  };

  // Validate only the fields belonging to the current step
  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Name required";
      if (!form.email.trim()) e.email = "Email required";
      if (!form.phone.trim()) e.phone = "Phone required";
      if (!form.storeName.trim()) e.storeName = "Store name required";
      if (!form.password || form.password.length < 8) e.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    if (step === 1) {
      if (!form.nationalIdNumber.trim()) e.nationalIdNumber = "ID number required";
      if (!picture) e.picture = "Photo required";
      if (!nationalIdImage) e.nationalIdImage = "ID image required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { next(); return; }
    setLoading(true);
    setError("");
    setExistingAccount(false);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, picture, nationalIdImage, ref: searchParams.get("ref") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EXISTING_ACCOUNT") setExistingAccount(true);
        throw new Error(data.error || "Registration failed");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl max-w-md w-full text-center border border-border shadow-lg overflow-hidden">
          <div className="relative h-40">
            <Image src="/img/african-american-woman-with-laptop-cafe.jpg" alt="Success" fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
          </div>
          <div className="px-8 pb-8 -mt-8 relative">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">You&apos;re Almost In!</h2>
            <p className="text-text-muted mb-2 text-sm">Check your email to verify your account.</p>
            <p className="text-text-muted mb-6 text-xs">After verification, our team will review and approve your account within 24 hours. Get ready to start earning!</p>
            <Link href="/login"><Button className="rounded-full px-8">Go to Login</Button></Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputCls = (key: string) => errors[key] ? "border-danger" : "";

  return (
    <AuthShell wide>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-text tracking-tight">Create your account</h1>
        <p className="text-text-muted text-sm mt-1.5 mb-6">Become a reseller in 3 quick steps.</p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.label}>
                    <div className={`flex items-center gap-2 ${i === step ? "text-primary" : i < step ? "text-success" : "text-text-muted"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === step ? "bg-primary text-white" : i < step ? "bg-success text-white" : "bg-surface border border-border"}`}>
                        {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-text" : ""}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-success" : "bg-border"}`} />}
                  </React.Fragment>
                ))}
              </div>

              {error && (
                <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
                  {error}
                  {existingAccount && (
                    <p className="mt-2">
                      <Link href="/login" className="font-semibold underline">Log in to continue →</Link>
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                    {/* ── Step 0: Account ── */}
                    {step === 0 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Full Name *</label>
                              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" className={inputCls("name")} />
                              {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Email *</label>
                              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" className={inputCls("email")} />
                              {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Phone *</label>
                              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0XX XXX XXXX" className={inputCls("phone")} />
                              {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Store Name *</label>
                              <Input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} placeholder="My Tech Store" className={inputCls("storeName")} />
                              {errors.storeName && <p className="text-danger text-xs mt-1">{errors.storeName}</p>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Password</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Password *</label>
                              <div className="relative">
                                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className={errors.password ? "border-danger pr-10" : "pr-10"} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-text block mb-1">Confirm Password *</label>
                              <Input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={inputCls("confirmPassword")} />
                              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 1: Identity ── */}
                    {step === 1 && (
                      <div className="space-y-6">
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
                              <Input value={form.nationalIdNumber} onChange={(e) => update("nationalIdNumber", e.target.value)} placeholder="GHA-XXXXXXXXX-X" className={inputCls("nationalIdNumber")} />
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
                      </div>
                    )}

                    {/* ── Step 2: Payout ── */}
                    {step === 2 && (
                      <div>
                        <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Payout Details <span className="text-text-muted font-normal normal-case">(optional)</span></h3>
                        <p className="text-text-muted text-xs mb-3">You can add or update these later in Settings.</p>
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
                          <div>
                            <label className="text-sm font-medium text-text block mb-1">Bank Name</label>
                            <Input value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="e.g. GCB Bank" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text block mb-1">Account Number</label>
                            <Input value={form.bankAccountNumber} onChange={(e) => update("bankAccountNumber", e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-text block mb-1">Account Name</label>
                            <Input value={form.bankAccountName} onChange={(e) => update("bankAccountName", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Nav buttons */}
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-xl h-12 px-6">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 rounded-xl h-12 text-base" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {step < STEPS.length - 1 ? (<>Continue <ChevronRight className="w-4 h-4 ml-1" /></>) : "Create Account"}
                  </Button>
                </div>

                <p className="text-center text-text-muted text-sm mt-4">
                  Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log In</Link>
                </p>
              </form>
      </motion.div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
