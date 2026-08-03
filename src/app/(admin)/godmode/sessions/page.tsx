// FR8X-CON GodMode Active Session Management & Forced Termination
"use client";

import { useState, useEffect } from "react";
import { Shield, Smartphone, Monitor, LogOut, Search, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { queryDocuments, updateDocument, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type SessionUser = {
  id: string;
  uid: string;
  email: string;
  fullName?: string;
  displayName?: string;
  companyName?: string;
  lastLoginAt?: string;
  activeSessions?: {
    mobile?: { sessionId: string; lastActiveAt: string; userAgent: string };
    desktop?: { sessionId: string; lastActiveAt: string; userAgent: string };
  };
};

export default function GodModeSessionsPage() {
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchUsersWithSessions = async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<SessionUser>(COLLECTIONS.USERS, [limit(100)]);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching session users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithSessions();
  }, []);

  const handleForceLogoutMobile = async (uid: string) => {
    try {
      const userDoc = users.find((u) => u.id === uid || u.uid === uid);
      const updated = {
        ...(userDoc?.activeSessions || {}),
        mobile: null,
      };
      await updateDocument(COLLECTIONS.USERS, uid, { activeSessions: updated });
      setActionMsg(`Mobile session forcibly terminated for user ${uid.slice(0, 8)}...`);
      fetchUsersWithSessions();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to force logout mobile session.");
    }
  };

  const handleForceLogoutDesktop = async (uid: string) => {
    try {
      const userDoc = users.find((u) => u.id === uid || u.uid === uid);
      const updated = {
        ...(userDoc?.activeSessions || {}),
        desktop: null,
      };
      await updateDocument(COLLECTIONS.USERS, uid, { activeSessions: updated });
      setActionMsg(`Desktop session forcibly terminated for user ${uid.slice(0, 8)}...`);
      fetchUsersWithSessions();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to force logout desktop session.");
    }
  };

  const handleForceLogoutAll = async (uid: string) => {
    try {
      await updateDocument(COLLECTIONS.USERS, uid, {
        activeSessions: { mobile: null, desktop: null },
        activeSessionId: "INVALIDATED_BY_GODMODE",
      });
      setActionMsg(`All sessions forcibly terminated for user ${uid.slice(0, 8)}...`);
      fetchUsersWithSessions();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to force logout user.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(term) ||
      (u.displayName || "").toLowerCase().includes(term) ||
      (u.companyName || "").toLowerCase().includes(term) ||
      (u.uid || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 py-2">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h1 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
            Active Session Security & Device Control
          </h1>
          <p className="text-[10px] text-slate-500">
            GodMode Real-Time Session Audit: 1 Mobile + 1 Desktop max enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsersWithSessions}
            className="fr8x-btn-secondary text-[10px] py-1 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Refresh Sessions
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded p-2 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search user by email, name, company, or UID..."
          className="fr8x-input pl-8 text-[10px]"
        />
      </div>

      {/* User Session Table */}
      <div className="fr8x-card bg-white overflow-hidden border border-slate-200 rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-[10px]">Loading user session register...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-[10px]">No user sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>User & Company</th>
                  <th>Mobile Session (1 Max)</th>
                  <th>Desktop Session (1 Max)</th>
                  <th>Last Login</th>
                  <th>GodMode Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const hasMobile = !!u.activeSessions?.mobile?.sessionId;
                  const hasDesktop = !!u.activeSessions?.desktop?.sessionId;

                  return (
                    <tr key={u.id || u.uid} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <div>
                          <p className="font-bold text-slate-800 text-[10px]">{u.displayName || u.email}</p>
                          <p className="text-[8px] text-slate-500">{u.companyName || "Freight Forwarder"}</p>
                          <p className="text-[8px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </td>
                      <td>
                        {hasMobile ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                              <Smartphone className="h-2.5 w-2.5 text-emerald-600" /> Active Mobile
                            </span>
                            <p className="text-[8px] text-slate-400 truncate max-w-[150px]">
                              {u.activeSessions?.mobile?.userAgent}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">No Mobile Session</span>
                        )}
                      </td>
                      <td>
                        {hasDesktop ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[8px] px-1.5 py-0.5 rounded font-bold border border-blue-200">
                              <Monitor className="h-2.5 w-2.5 text-blue-600" /> Active Desktop
                            </span>
                            <p className="text-[8px] text-slate-400 truncate max-w-[150px]">
                              {u.activeSessions?.desktop?.userAgent}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">No Desktop Session</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-[8px] text-slate-500">
                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Recently"}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {hasMobile && (
                            <button
                              onClick={() => handleForceLogoutMobile(u.id || u.uid)}
                              className="text-[8px] bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                              title="Kill Mobile Session"
                            >
                              <LogOut className="h-2.5 w-2.5" /> Kill Mobile
                            </button>
                          )}
                          {hasDesktop && (
                            <button
                              onClick={() => handleForceLogoutDesktop(u.id || u.uid)}
                              className="text-[8px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                              title="Kill Desktop Session"
                            >
                              <LogOut className="h-2.5 w-2.5" /> Kill Desktop
                            </button>
                          )}
                          <button
                            onClick={() => handleForceLogoutAll(u.id || u.uid)}
                            className="text-[8px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded font-bold"
                            title="Force Logout All Devices"
                          >
                            Terminate All
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
