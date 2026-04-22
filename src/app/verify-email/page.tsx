"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        setMessage("Email verified successfully! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-lg">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-text mb-2">Verifying Email...</h2>
            <p className="text-text-muted text-sm">Please wait while we verify your email address.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">Email Verified!</h2>
            <p className="text-text-muted text-sm">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">Verification Failed</h2>
            <p className="text-text-muted text-sm mb-4">{message}</p>
            <Button onClick={() => router.push("/login")} variant="outline">Go to Login</Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
