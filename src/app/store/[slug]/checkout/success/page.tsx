"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const method = searchParams.get("method") || "";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-border shadow-lg"
    >
      <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-text mb-2">Payment Received!</h2>
      <p className="text-text-muted mb-2">
        Your {method ? `${method} ` : ""}payment for order{" "}
        <span className="font-mono font-bold text-text">{ref}</span> was successful.
      </p>
      <p className="text-text-muted text-sm mb-6">
        Your order has been received and is being processed.
      </p>
      <Link href={`/store/${slug}`}>
        <Button className="rounded-full w-full">
          <Store className="w-4 h-4 mr-2" /> Continue Shopping
        </Button>
      </Link>
    </motion.div>
  );
}

export default function StoreCheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
