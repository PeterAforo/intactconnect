"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Camera, IdCard, Wallet, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REGISTER_IMG = "/img/girls-walk-along-streets-city.jpg";

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "nhis", label: "NHIS Card" },
  { value: "driver_license", label: "Driver's License" },
];

export default function RegisterPage() {
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.email.trim()) e.email = "Email required";
    if (!form.phone.trim()) e.phone = "Phone required";
    if (!form.password || form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, picture, nationalIdImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
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

  return (
    <div className="min-h-screen flex">
      {/* Left — Image Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] relative bg-primary shrink-0">
        <Image src={REGISTER_IMG} alt="Young Ghanaian entrepreneurs" fill sizes="480px" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/"><Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto brightness-0 invert" /></Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4 leading-tight">Start Your Hustle Today.</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Sign up, get your own store, and earn commissions selling Intact Ghana products to your network. No stock needed.
            </p>
            <div className="space-y-3">
              {[
                { icon: Users, text: "Get your own branded storefront" },
                { icon: TrendingUp, text: "Earn commission on every sale" },
                { icon: Wallet, text: "Withdraw to MoMo or bank anytime" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Powered by Intact Ghana</p>
        </div>
      </div>

      {/* Right — Registration Form */}
      <div className="flex-1 bg-surface overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 lg:py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-5">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
              <Image src="/img/logo.png" alt="IntactConnect" width={200} height={56} className="h-14 w-auto mb-2" />
              <h1 className="text-xl font-bold text-text mb-1">Become a Reseller</h1>
              <p className="text-text-muted mb-6 text-sm">Fill in the form below to create your account.</p>

              {error && <div className="bg-danger/10 text-danger rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Full Name *</label>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" className={errors.name ? "border-danger" : ""} />
                      {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Email *</label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" className={errors.email ? "border-danger" : ""} />
                      {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1">Phone *</label>
                      <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0XX XXX XXXX" className={errors.phone ? "border-danger" : ""} />
                      {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
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

                {/* Password */}
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
                      <Input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={errors.confirmPassword ? "border-danger" : ""} />
                      {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>

                {/* Payout Info */}
                <div>
                  <h3 className="font-semibold text-text mb-3 text-sm uppercase tracking-wide">Payout Details (optional)</h3>
                  <p className="text-text-muted text-xs mb-3">You can add or update these later.</p>
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
                  Create Account
                </Button>

                <p className="text-center text-text-muted text-sm">
                  Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log In</Link>
                </p>
              </form>
            </div>

            {/* Mobile-only feature highlights */}
            <div className="lg:hidden mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Own Storefront" },
                { icon: TrendingUp, label: "Earn Commission" },
                { icon: Wallet, label: "MoMo Payouts" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-3 text-center">
                  <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-text-muted font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
