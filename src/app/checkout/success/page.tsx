"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const method = searchParams.get("method") || "";
  const status = searchParams.get("status") || "";
  const failed = status === "cancelled" || status === "failed";

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-border shadow-lg">
      {failed ? (
        <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
      ) : (
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
      )}
      <h2 className="text-2xl font-bold text-text mb-2">
        {failed ? "Payment Not Completed" : "Payment Received!"}
      </h2>
      <p className="text-text-muted mb-2">
        {failed
          ? `Your ${method || "payment"} payment for order ${ref} was not completed.`
          : `Order ${ref} has been received and is being processed.`}
      </p>
      <Link href="/">
        <Button className="rounded-full mt-4">{failed ? "Try Again" : "Continue"}</Button>
      </Link>
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
