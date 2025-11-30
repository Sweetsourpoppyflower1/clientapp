import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/masterDashboardStyle.css";

function ActiveAuctionsMA() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("auctionMaster");
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
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        const API_BASE = process.env.REACT_APP_API_URL ?? "https://localhost:7036";
        const url = `${API_BASE}/api/Auction`;

        let cancelled = false;
        setLoading(true);
        setError("");

        (async () => {
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(txt || "Failed to fetch auctions");
                }
                const data = await resp.json();
                if (!Array.isArray(data)) {
                    throw new Error("Unexpected response format");
                }
                if (!cancelled) setAuctions(data);
            } catch (ex) {
                if (!cancelled) setError(ex?.message ?? "Network error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const getAuctionMasterId = (a) =>
        Number(
            a?.auctionmaster_id ??
            a?.auctionMasterId ??
            a?.auctionmasterId ??
            a?.auction_master_id ??
            a?.AuctionMasterId ??
            a?.auctionMaster ??
            a?.auctionmaster ??
            NaN
        );

    const getStatus = (a) =>
        (a?.au_status ?? a?.status ?? a?.AuStatus ?? "").toString().toLowerCase();

    const visibleAuctions = auctions.filter(
        (a) => getAuctionMasterId(a) === Number(user?.AuctionMasterId) && getStatus(a) === "active"
    );

    const handleRefresh = () => {
        window.location.reload();
    };

    if (!user) return null; 

    if (loading) return <div className="loading">Loading active auctions...</div>;

    return (
        <div className="container">
            <header className="header">
                <div className="header-left">
                    <h1 className="title">Active Auctions</h1>
                    <div className="subtitle">
                        Signed in as <strong>{user?.Name}</strong> ({user?.Email})
                    </div>
                </div>

                <div className="header-actions">
                    <button className="button" onClick={() => navigate("/auctionmasterDashboard")} style={{ marginRight: 8 }}>
                        Dashboard
                    </button>
                    <button className="button" onClick={() => { localStorage.removeItem("auctionMaster"); navigate("/login"); }}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="section">
                <section className="section-small">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0 }}>Auctions currently marked as <strong>active</strong> and owned by you.</p>
                        <div>
                            <button className="button" onClick={handleRefresh} style={{ marginRight: 8 }}>Refresh</button>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <h2>List ({visibleAuctions.length})</h2>

                    {error && <div className="error">{error}</div>}

                    {visibleAuctions.length === 0 ? (
                        <div style={{ padding: 12, color: "#555" }}>No active auctions found.</div>
                    ) : (
                        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                            {visibleAuctions.map((auction) => {
                                const id = auction?.auction_id ?? auction?.AuctionId ?? auction?.id;
                                const plant = auction?.plant_id ?? auction?.plantId ?? "-";
                                const current = auction?.au_current_price ?? auction?.currentPrice ?? "-";
                                const start = auction?.au_start_time ?? auction?.startTime ?? auction?.au_start_time;
                                const end = auction?.au_end_time ?? auction?.endTime ?? auction?.au_end_time;

                                const fmt = (v) => (v ? new Date(v).toLocaleString() : "-");

                                return (
                                    <div key={id} className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Auction #{id} — {auction?.au_status ?? auction?.status}</div>
                                            <div style={{ color: "#666", marginTop: 6 }}>
                                                Plant: {plant} — Current: {current} <br />
                                                Start: {fmt(start)} — End: {fmt(end)}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                className="button"
                                                onClick={() => navigate(`/auction/${id}`)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ActiveAuctionsMA;