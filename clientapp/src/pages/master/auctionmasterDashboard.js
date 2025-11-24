import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/masterDashboardStyle.css";

function AuctionMasterDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error] = useState("");

    const [stats, setStats] = useState({ active: 0, upcoming: 0, completed: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("auctionMaster");

        // als het geen user is die auctionmaster is, dan naar login
        if (!stored) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsed = JSON.parse(stored);

            const normalized = {
                AuctionMasterId:
                    parsed?.AuctionMasterId ??
                    parsed?.auctionMasterId ??
                    parsed?.auctionmaster_id ??
                    parsed?.id ??
                    null,
                Name:
                    parsed?.Name ??
                    parsed?.name ??
                    parsed?.am_name ??
                    parsed?.Name ??
                    "",
                Email:
                    parsed?.Email ??
                    parsed?.email ??
                    parsed?.am_email ??
                    ""
            };

            if (!normalized.AuctionMasterId && !normalized.Email) throw new Error("invalid user");

            setUser(normalized);
        } catch {
            localStorage.removeItem("auctionMaster");
            navigate("/login", { replace: true });
            return;
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        const API_BASE = process.env.REACT_APP_API_URL ?? ""; 
        const url = API_BASE ? `${API_BASE}/api/Auction` : "/api/Auction";

        let cancelled = false;
        setStatsLoading(true);
        setStatsError("");

        (async () => {
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(txt || "Failed to fetch auctions");
                }
                const data = await resp.json();
                if (!Array.isArray(data)) throw new Error("Unexpected response format from auctions API");

                const now = new Date();
                const ownerId = Number(user?.AuctionMasterId);

                const counts = data.reduce(
                    (acc, a) => {
                        const raw = (a?.au_status ?? a?.status ?? "")?.toString()?.toLowerCase()?.trim() ?? "";

                        let status = "";
                        if (raw) {
                            if (raw.includes("active")) status = "active";
                            else if (raw.includes("upcom")) status = "upcoming";
                            else if (raw.includes("complete") || raw.includes("finished") || raw.includes("closed")) status = "completed";
                        }

                        if (!status) {
                            const s = a?.au_start_time ?? a?.startTime ?? a?.au_start_time ?? null;
                            const e = a?.au_end_time ?? a?.endTime ?? a?.au_end_time ?? null;
                            const start = s ? new Date(s) : null;
                            const end = e ? new Date(e) : null;

                            if (start && end) {
                                if (now < start) status = "upcoming";
                                else if (now >= start && now < end) status = "active";
                                else status = "completed";
                            }
                        }

                        const aOwnerId = Number(
                            a?.auctionmaster_id ??
                            a?.auctionMasterId ??
                            a?.auctionmasterId ??
                            a?.AuctionMasterId ??
                            NaN
                        );

                        if (!Number.isNaN(aOwnerId) && aOwnerId === ownerId) {
                            if (status === "active") acc.active++;
                            else if (status === "upcoming") acc.upcoming++;
                            else if (status === "completed") acc.completed++;
                        }

                        return acc;
                    },
                    { active: 0, upcoming: 0, completed: 0 }
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
        localStorage.removeItem("auctionMaster");
        navigate("/login", { replace: true });
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <header className="header">
                <div className="header-left">
                    <h1 className="title">Auction Master Dashboard</h1>
                    <div className="subtitle">
                        Signed in as <strong>{user?.Name}</strong> ({user?.Email})
                    </div>
                </div>

                <div className="header-actions">
                    <button className="button" onClick={() => navigate("/homepage")} style={{ marginRight: 8 }}>
                        Home
                    </button>
                    <button className="button" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="section">
                <section className="section-small">
                    <div className="actions">
                        <button className="button" onClick={() => navigate("/createAuctionMA")}>Create Auction</button>
                        <button className="button" onClick={() => navigate("/activeAuctionsMA")}>Active Auctions</button>
                        <button className="button" onClick={() => navigate("/upcomingAuctionsMA")}>Upcoming Auctions</button>
                        <button className="button" onClick={() => navigate("/acceptancesMA")}>Review Acceptances</button>
                    </div>
                </section>

                <section className="section">
                    <h2>Quick stats</h2>
                    <div className="stats">
                        <div className="stat-card">
                            <div className="stat-label">Active Auctions</div>
                            <div className="stat-value">{statsLoading ? "—" : stats.active}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Upcoming Auctions</div>
                            <div className="stat-value">{statsLoading ? "—" : stats.upcoming}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Completed Auctions</div>
                            <div className="stat-value">{statsLoading ? "—" : stats.completed}</div>
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

export default AuctionMasterDashboard;