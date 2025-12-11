import React, { useEffect, useState } from "react";
import "../../styles/masterPages/a_overviewAcceptances.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json().catch(() => null) : null;
    } catch {
        return null;
    }
};

function AcceptanceCard({ acceptance, onAccept, onRefuse }) {
    const [processing, setProcessing] = useState(false);

    const handleAccept = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            await onAccept(acceptance);
        } finally {
            setProcessing(false);
        }
    };

    const handleRefuse = async () => {
        if (processing) return;
        if (!window.confirm("Are you sure you want to refuse this acceptance?")) return;
        
        setProcessing(true);
        try {
            await onRefuse(acceptance);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="acceptance-card">
            <div className="acceptance-card-header">
                <div className="acceptance-info">
                    <div className="acceptance-title">{acceptance.plantName || "Unknown Plant"}</div>
                    <div className="acceptance-company">Company: {acceptance.companyName || "Unknown"}</div>
                </div>
                <div className="acceptance-price">
                    <div className="price-label">Accepted Price</div>
                    <div className="price-value">€ {Number(acceptance.accepted_price || 0).toFixed(2)}</div>
                </div>
            </div>

            <div className="acceptance-details">
                <div className="detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{acceptance.accepted_quantity || 0}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Auction ID:</span>
                    <span className="detail-value">{acceptance.auction_id || "—"}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">
                        {acceptance.time ? new Date(acceptance.time).toLocaleString() : "—"}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Tick Number:</span>
                    <span className="detail-value">{acceptance.tick_number ?? "—"}</span>
                </div>
            </div>

            <div className="acceptance-actions">
                <button
                    className="accept-btn"
                    onClick={handleAccept}
                    disabled={processing}
                >
                    {processing ? "Processing..." : "✓ Accept"}
                </button>
                <button
                    className="refuse-btn"
                    onClick={handleRefuse}
                    disabled={processing}
                >
                    {processing ? "Processing..." : "✗ Refuse"}
                </button>
            </div>
        </div>
    );
}

export default function AOverviewAcceptances() {
    const [acceptances, setAcceptances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logo, setLogo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch logo
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: normalizedUrl, alt: m.alt_text });
            })
            .catch(() => { /* silent fallback */ });
    }, []);

    useEffect(() => {
        loadAcceptances();
    }, []);

    const loadAcceptances = async () => {
        setLoading(true);
        try {
            // Fetch acceptances
            const acceptancesData = await fetchMaybe("/api/Acceptances");
            if (!acceptancesData || !Array.isArray(acceptancesData)) {
                setAcceptances([]);
                return;
            }

            // Get unique auction IDs and company IDs
            const auctionIds = [...new Set(acceptancesData.map(a => a.auction_id).filter(Boolean))];
            const companyIds = [...new Set(acceptancesData.map(a => a.company_id).filter(Boolean))];

            // Fetch auctions to get plant info
            const auctionsPromises = auctionIds.map(id => fetchMaybe(`/api/Auctions/${id}`));
            const auctions = await Promise.all(auctionsPromises);
            const auctionsMap = new Map(auctions.filter(Boolean).map(a => [a.auction_id, a]));

            // Fetch plants
            const plantIds = [...new Set(auctions.filter(Boolean).map(a => a.plant_id).filter(Boolean))];
            const plantsPromises = plantIds.map(id => fetchMaybe(`/api/Plants/${id}`));
            const plants = await Promise.all(plantsPromises);
            const plantsMap = new Map(plants.filter(Boolean).map(p => [p.plant_id, p]));

            // Fetch companies
            const companiesPromises = companyIds.map(id => fetchMaybe(`/api/Companies/${id}`));
            const companies = await Promise.all(companiesPromises);
            const companiesMap = new Map(companies.filter(Boolean).map(c => [c.id || c.company_id, c]));

            // Enrich acceptances with additional data
            const enriched = acceptancesData.map(acc => {
                const auction = auctionsMap.get(acc.auction_id);
                const plant = auction ? plantsMap.get(auction.plant_id) : null;
                const company = companiesMap.get(acc.company_id);

                return {
                    ...acc,
                    plantName: plant?.productname || plant?.productName || "Unknown Plant",
                    companyName: company?.name || company?.displayName || "Unknown Company",
                };
            });

            setAcceptances(enriched);
        } catch (err) {
            console.error("Failed to load acceptances:", err);
            setAcceptances([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (acceptance) => {
        try {
            // Here you would call your API to mark the acceptance as accepted
            // For now, we'll just remove it from the list
            alert(`Acceptance for ${acceptance.plantName} has been accepted!`);
            setAcceptances(prev => prev.filter(a => a.id !== acceptance.id));
        } catch (err) {
            console.error("Failed to accept:", err);
            alert("Failed to accept the order. Please try again.");
        }
    };

    const handleRefuse = async (acceptance) => {
        try {
            // Delete the acceptance
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/Acceptances/${acceptance.id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (!res.ok) {
                throw new Error(`Failed to delete (${res.status})`);
            }

            alert(`Acceptance for ${acceptance.plantName} has been refused and removed.`);
            setAcceptances(prev => prev.filter(a => a.id !== acceptance.id));
        } catch (err) {
            console.error("Failed to refuse:", err);
            alert("Failed to refuse the order. Please try again.");
        }
    };

    return (
        <div className="acceptances-page">
            {/* Header with logo */}
            <header className="acceptances-header">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="acceptances-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </header>

            {/* Welcome section */}
            <section className="acceptances-welcome-section" role="region" aria-label="acceptances-banner">
                <div className="acceptances-welcome-header">
                    <div className="acceptances-welcome-text">
                        <h1 className="acceptances-welcome-title">Overview Acceptances</h1>
                        <p className="acceptances-welcome-subtitle">
                            Review and manage all pending acceptances from companies. Accept or refuse orders based on availability and business requirements.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main content */}
            <main className="acceptances-main">
                <div className="acceptances-container">
                    <div className="acceptances-section-header">
                        <h2 className="acceptances-section-title">Pending Acceptances</h2>
                        <p className="acceptances-section-subtitle">
                            {acceptances.length} acceptance{acceptances.length !== 1 ? 's' : ''} pending review
                        </p>
                    </div>

                    {loading ? (
                        <div className="acceptances-loading">Loading acceptances...</div>
                    ) : acceptances.length === 0 ? (
                        <div className="acceptances-empty">
                            <div className="empty-icon">✓</div>
                            <div className="empty-message">No pending acceptances</div>
                            <p className="empty-hint">All acceptances have been processed</p>
                        </div>
                    ) : (
                        <div className="acceptances-grid">
                            {acceptances.map((acceptance, index) => (
                                <AcceptanceCard
                                    key={acceptance.id || index}
                                    acceptance={acceptance}
                                    onAccept={handleAccept}
                                    onRefuse={handleRefuse}
                                />
                            ))}
                        </div>
                    )}

                    <div className="acceptances-footer-actions">
                        <button
                            className="acceptances-back-btn"
                            onClick={() => navigate("/auctionmasterDashboard")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu />
        </div>
    );
}
