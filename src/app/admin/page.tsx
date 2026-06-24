"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Store, Phone, Mail, Check, X, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Reseller = {
  id: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  email: string;
  nationalIdType: string;
  nationalIdNumber: string;
  nationalIdImage: string;
  picture: string;
  status: "pending" | "approved" | "rejected";
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
  createdAt: string;
};

export default function AdminDashboard() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resellers");
      const data = await res.json();
      if (data.resellers) setResellers(data.resellers);
    } catch (error) {
      console.error("Failed to fetch resellers:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (resellerId: string) => {
    try {
      const res = await fetch(`/api/admin/resellers/${resellerId}/approve`, { method: "POST" });
      if (res.ok) {
        fetchResellers();
      }
    } catch (error) {
      console.error("Failed to approve reseller:", error);
    }
  };

  const handleReject = async (resellerId: string) => {
    try {
      const res = await fetch(`/api/admin/resellers/${resellerId}/reject`, { method: "POST" });
      if (res.ok) {
        fetchResellers();
      }
    } catch (error) {
      console.error("Failed to reject reseller:", error);
    }
  };

  const filteredResellers = resellers.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      search === "" ||
      r.storeName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: resellers.length,
    pending: resellers.filter((r) => r.status === "pending").length,
    approved: resellers.filter((r) => r.status === "approved").length,
    rejected: resellers.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Resellers", value: stats.total, icon: Users, color: "bg-accent" },
          { label: "Pending Approval", value: stats.pending, icon: Store, color: "bg-warning" },
          { label: "Approved", value: stats.approved, icon: Check, color: "bg-success" },
          { label: "Rejected", value: stats.rejected, icon: X, color: "bg-red-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="text-3xl font-bold text-text mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resellers List */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading resellers...</div>
        ) : filteredResellers.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No resellers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Store</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">ID Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">Applied</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResellers.map((reseller) => (
                  <tr key={reseller.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface overflow-hidden">
                          {reseller.picture ? (
                            <img src={reseller.picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                              {reseller.storeName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">{reseller.storeName}</p>
                          <p className="text-xs text-text-muted">{reseller.user.name || "No name"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-text flex items-center gap-1">
                          <Mail className="w-3 h-3 text-text-muted" />
                          {reseller.email}
                        </p>
                        <p className="text-sm text-text flex items-center gap-1">
                          <Phone className="w-3 h-3 text-text-muted" />
                          {reseller.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text capitalize">{reseller.nationalIdType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          reseller.status === "approved"
                            ? "success"
                            : reseller.status === "rejected"
                            ? "danger"
                            : "default"
                        }
                      >
                        {reseller.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(reseller.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReseller(reseller)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {reseller.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprove(reseller.id)}
                              className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReject(reseller.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-600 hover:bg-red-600/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReseller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReseller(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Reseller Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReseller(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-surface overflow-hidden">
                  {selectedReseller.picture ? (
                    <img src={selectedReseller.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      {selectedReseller.storeName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedReseller.storeName}</h3>
                  <p className="text-text-muted">{selectedReseller.user.name || "No name"}</p>
                  <Badge
                    variant={
                      selectedReseller.status === "approved"
                        ? "success"
                        : selectedReseller.status === "rejected"
                        ? "danger"
                        : "default"
                    }
                    className="mt-2"
                  >
                    {selectedReseller.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-muted">Email</p>
                  <p className="font-medium">{selectedReseller.email}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Phone</p>
                  <p className="font-medium">{selectedReseller.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">ID Type</p>
                  <p className="font-medium capitalize">{selectedReseller.nationalIdType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">ID Number</p>
                  <p className="font-medium">{selectedReseller.nationalIdNumber}</p>
                </div>
              </div>

              {selectedReseller.nationalIdImage && (
                <div>
                  <p className="text-sm text-text-muted mb-2">ID Image</p>
                  <img src={selectedReseller.nationalIdImage} alt="ID" className="rounded-lg border border-border max-h-64 object-contain" />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                {selectedReseller.status === "pending" && (
                  <>
                    <Button onClick={() => { handleApprove(selectedReseller.id); setSelectedReseller(null); }} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => { handleReject(selectedReseller.id); setSelectedReseller(null); }}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
