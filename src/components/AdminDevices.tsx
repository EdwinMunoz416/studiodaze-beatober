"use client";

import { useCallback, useEffect, useState } from "react";
import { ARCHIVED_MESSAGE } from "@/lib/archived";
import { AdminLoginPage, AdminShell } from "@/components/AdminShell";

type Device = {
  visitorId: string;
  role: "internal" | "ignore";
  label: string | null;
  updatedAt: string;
};

type Props = {
  initialAuthed: boolean;
};

export function AdminDevices({ initialAuthed }: Props) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [devices, setDevices] = useState<Device[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/devices");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as { devices: Device[] };
    setDevices(data.devices);
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  if (!authed) {
    return <AdminLoginPage title="Devices" />;
  }

  return (
    <AdminShell
      active="devices"
      title="Device management"
      subtitle="Registered browsers. Tagging is closed."
      onLogout={() => void logout()}
    >
      <p className="admin-dash__note">{ARCHIVED_MESSAGE}</p>
      <section className="admin-dash__panel">
        <h2 className="admin-dash__panel-title">Registered devices</h2>
        <ul className="admin-dash__device-list">
          {devices.length === 0 ? (
            <li className="admin-dash__empty-cell">No devices registered yet</li>
          ) : (
            devices.map((d) => (
              <li key={d.visitorId}>
                <span className="admin-dash__mono">{d.visitorId.slice(0, 12)}…</span>
                <span className="admin-dash__stream-event">{d.role}</span>
                {d.label ? <span>{d.label}</span> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </AdminShell>
  );
}
