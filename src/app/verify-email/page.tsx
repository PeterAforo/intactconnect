"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token provided."); return; }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Email verified! Our team will review your application and email you once approved.");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
      }
    }).catch(() => {
      setStatus("error");
      setMessage("Network error. Please try again.");
    });
  }, [token, router]);

  return (
    <AuthShell switchHref="/login" switchLabel="Log in">
      <div className="text-center py-10">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-[#0d0b09]/30 mx-auto mb-4 animate-spin" />
            <h2 className="text-[20px] font-bold text-[#1c1917] tracking-tight mb-2">Verifying email…</h2>
            <p className="text-[13px] text-[#6b665e]">Please wait while we verify your email address.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#2e7d32]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1c1917] tracking-tight mb-2">Email verified</h2>
            <p className="text-[13px] text-[#6b665e] leading-relaxed">{message}</p>
            <p className="text-[11px] text-[#a8a29a] mt-3">Redirecting to login…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1c1917] tracking-tight mb-2">Verification failed</h2>
            <p className="text-[13px] text-[#6b665e] leading-relaxed mb-5">{message}</p>
            <a
              href="/login"
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-[#e2e0da] text-[13px] font-medium text-[#3a362f] hover:bg-[#f5f4f1] transition-colors"
            >
              Go to login
            </a>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthShell switchHref="/login" switchLabel="Log in">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#0d0b09]/40" />
        </div>
      </AuthShell>
    }>
      <VerifyContent />
    </Suspense>
  );
}
