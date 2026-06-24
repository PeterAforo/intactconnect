"use client";

import React from "react";
import { Settings, Shield, Bell, Database } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-text-muted">Configure admin and system settings</p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Admin Settings</h2>
        </div>
        <p className="text-text-muted text-sm mb-4">Manage admin accounts and permissions</p>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <p className="text-sm text-text-muted">Coming soon...</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <p className="text-text-muted text-sm mb-4">Configure email and notification preferences</p>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <p className="text-sm text-text-muted">Coming soon...</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">System</h2>
        </div>
        <p className="text-text-muted text-sm mb-4">Database and system configuration</p>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <p className="text-sm text-text-muted">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
