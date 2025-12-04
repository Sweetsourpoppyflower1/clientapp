import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/masterDashboardStyle.css";

function SupplierDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [stats, setStats] = useState({ total: 0, active: 0, draft: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("supplier");

        if (!stored) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsed = JSON.parse(stored);
            const normalized = {
                SupplierId:
                    parsed?.SupplierId ??
                    parsed?.supplierId ??
                    parsed?.supplier_id ??
                    parsed?.id ??
                    null,
                Name:
                    parsed?.Name ??
                    parsed?.name ??
                    parsed?.s_name ??
                    "",
                Email:
                    parsed?.Email ??
                    parsed?.email ??
                    parsed?.s_email ??
                    ""
            };

            if (!normalized.SupplierId && !normalized.Email) throw new Error("invalid user");

            setUser(normalized);
        } catch {
            localStorage.removeItem("supplier");
            navigate("/login", { replace: true });
            return;
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        const API_BASE = process.env.REACT_APP_API_URL ?? "";
        const url = API_BASE ? `${API_BASE}/api/Plant` : "/api/Plant";

        let cancelled = false;
        setStatsLoading(true);
        setStatsError("");
        setStats({ total: 0, active: 0, draft: 0 });

        (async () => {
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(txt || "Failed to fetch plants");
                }

                const data = await resp.json();
                if (!Array.isArray(data)) throw new Error("Unexpected response format from plants API");

                const ownerId = Number(user?.SupplierId);
                const counts = data.reduce(
                    (acc, p) => {
                         
                        const raw = (p?.pl_status ?? p?.status ?? p?.plantStatus ?? "")?.toString()?.toLowerCase()?.trim() ?? "";

                        let status = "";
                        if (raw) {
                            if (raw.includes("active")) status = "active";
                            else if (raw.includes("draft") || raw.includes("pending")) status = "draft";
                            else if (raw.includes("inactive") || raw.includes("archived") || raw.includes("removed")) status = "inactive";
                        }

                         
                        if (!status) {
                            const available = p?.available ?? p?.isAvailable;
                            if (available === true) status = "active";
                            else if (available === false) status = "inactive";
                        }

                        const pOwnerId = Number(
                            p?.supplier_id ??
                            p?.SupplierId ??
                            p?.supplierId ??
                            p?.ownerId ??
                            NaN
                        );

                        if (!Number.isNaN(pOwnerId) && pOwnerId === ownerId) {
                            acc.total++;
                            if (status === "active") acc.active++;
                            else if (status === "draft") acc.draft++;
                        }

                        return acc;
                    },
                    { total: 0, active: 0, draft: 0 }
                );

                if (!cancelled) setStats(counts);
            } catch (ex) {
                if (!cancelled) setStatsError(ex?.message ?? "Network error");
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem("supplier");
        navigate("/login", { replace: true });
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <header className="header">
                <div className="header-left">
                    <h1 className="title">Supplier Dashboard</h1>
                    <div className="subtitle">
                        Signed in as <strong>{user?.Name}</strong> ({user?.Email})
                    </div>
                </div>

                <div className="header-actions">
                    <button className="button" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="section">
                <section className="section-small">
                    <div className="actions">
                        <button className="button" onClick={() => navigate("/createPlant")}>Add Plant</button>
                        <button className="button" onClick={() => navigate("/myPlants")}>My Plants</button>
                    </div>
                </section>

                <section className="section">
                    <h2>Quick stats</h2>
                    <div className="stats">
                        <div className="stat-card">
                            <div className="stat-label">Total Plants</div>
                            <div className="stat-value">{statsLoading ? "ÅE : stats.total}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Active Plants</div>
                            <div className="stat-value">{statsLoading ? "ÅE : stats.active}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Draft / Pending</div>
                            <div className="stat-value">{statsLoading ? "ÅE : stats.draft}</div>
                        </div>
                    </div>

                    {statsError && <div className="error" style={{ marginTop: 12 }}>{statsError}</div>}
                </section>

                {error && (
                    <section>
                        <div className="error">{error}</div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default SupplierDashboard;