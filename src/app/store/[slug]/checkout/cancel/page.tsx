"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, Store, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function CancelContent() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const method = searchParams.get("method") || "";
  const status = searchParams.get("status") || "cancelled";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-border shadow-lg"
    >
      <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-text mb-2">Payment Not Completed</h2>
      <p className="text-text-muted mb-2">
        Your {method ? `${method} ` : ""}payment for order{" "}
        <span className="font-mono font-bold text-text">{ref}</span> was {status}.
      </p>
      <p className="text-text-muted text-sm mb-6">
        No charge was made. You can return to the store and try again.
      </p>
      <div className="flex flex-col gap-3">
        <Link href={`/store/${slug}`}>
          <Button variant="outline" className="rounded-full w-full">
            <Store className="w-4 h-4 mr-2" /> Back to Store
          </Button>
        </Link>
        <Link href={`/store/${slug}/checkout`}>
          <Button className="rounded-full w-full">
            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function StoreCheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Suspense fallback={null}>
        <CancelContent />
      </Suspense>
    </div>
  );
}
