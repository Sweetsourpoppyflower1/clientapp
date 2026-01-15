import React, { useState, useEffect } from "react";
import "../../styles/masterPages/a_stockOverviewStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function AStockOverview() {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const navigate = useNavigate();

    const [plants, setPlants] = useState([]);
    const [logo, setLogo] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [error, setError] = useState(null);
    const [auctionLots, setAuctionLots] = useState([]);

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const normalizeUrl = (url) => {
        if (!url) return null;
        const t = url.trim();
        if (t.startsWith("http://") || t.startsWith("https://")) return t;
        return API_BASE ? `${API_BASE}${t.startsWith("/") ? t : `/${t}`}` : (t.startsWith("/") ? t : `/${t}`);
    };

    const handleDeletePlant = async (plantId, plantName) => {
        if (!window.confirm(`Are you sure you want to delete "${plantName}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(prev => ({ ...prev, [plantId]: true }));
        setError(null);

        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${API_BASE}/api/Plants/${plantId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (!res.ok) {
                const errMsg = await res.text().catch(() => `Failed to delete (${res.status})`);
                throw new Error(errMsg);
            }

            setPlants(prev => prev.filter(p => p.plantId !== plantId));
            setExpandedIndex(null);
            alert(`"${plantName}" has been deleted successfully.`);
        } catch (err) {
            console.error("Delete error:", err);
            setError(`Failed to delete plant: ${err.message}`);
        } finally {
            setDeleting(prev => ({ ...prev, [plantId]: false }));
        }
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/plant/overview`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch plants");
                return res.json();
            })
            .then((data) => setPlants(data))
            .catch((err) => {
                console.error("Error loading plants:", err);
                setPlants([]);
            });
    }, []);

    useEffect(() => {
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch media");
                return res.json();
            })
            .then((m) => {
                setLogo({ url: normalizeUrl(m.url), alt: m.alt_text ?? "Flauction logo" });
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/api/AuctionLots`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch auction lots");
                return res.json();
            })
            .then((data) => setAuctionLots(data))
            .catch((err) => {
                console.error("Error loading auction lots:", err);
                setAuctionLots([]);
            });
    }, []);

    const getRemainingQuantity = (plantId) => {
        const lot = auctionLots.find(l => Number(l.plant_id) === Number(plantId));
        return lot ? lot.remaining_quantity : null;
    };

    return (
        <div className="stock-page">
            <header className="stock-header">
                <div role="region" aria-label="brand-logo">
                    {logo ? (
                        <img src={logo.url} alt={logo.alt} className="stock-logo" />
                    ) : (
                        <span className="loading-label">Loading…</span>
                    )}
                </div>
            </header>

            <section className="stock-welcome-section" role="region" aria-label="stock-overview-banner">
                <div className="stock-welcome-header">
                    <div className="stock-welcome-text">
                        <p className="stock-welcome-subtitle">
                            Review your complete stock inventory across all suppliers and manage plant details.
                        </p>
                    </div>
                </div>
            </section>

            <main className="stock-main">
                <div className="stock-container">
                    <div className="stock-section-header">
                        <h1 className="stock-section-title">Overview Stock</h1>
                        <p className="stock-section-subtitle">{plants.length} plant{plants.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="stock-body" role="region" aria-label="stock-inventory">
                        {error && <div className="stock-status-text stock-error">{error}</div>}
                        
                        <div className="stock-table-wrapper">
                            <table className="stock-table" aria-label="stock-table">
                                <thead>
                                    <tr>
                                        <th className="stock-th">Stock name</th>
                                        <th className="stock-th">Supplier name</th>
                                        <th className="stock-th">Remaining quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plants.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="stock-td no-stock">No stock loaded</td>
                                        </tr>
                                    ) : (
                                        plants.map((p, i) => (
                                            <React.Fragment key={p.plantId ?? i}>
                                                <tr
                                                    className={`stock-row ${expandedIndex === i ? 'stock-expanded' : ''}`}
                                                    onClick={() => toggleExpand(i)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            toggleExpand(i);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-expanded={expandedIndex === i}
                                                >
                                                    <td className="stock-td stock-plant-name">{p.plantName}</td>
                                                    <td className="stock-td stock-supplier">{p.supplier}</td>
                                                    <td className="stock-td">{getRemainingQuantity(p.plantId) ?? "—"}</td>
                                                </tr>

                                                {expandedIndex === i && (
                                                    <tr className="stock-details-row">
                                                        <td colSpan={3} className="stock-details-cell">
                                                            <div className="stock-details-container">
                                                                <div className="stock-details-image">
                                                                    {p.imageUrl ? (
                                                                        <img
                                                                            src={normalizeUrl(p.imageUrl)}
                                                                            alt={p.imageAlt ?? p.productName}
                                                                            className="stock-picture"
                                                                        />
                                                                    ) : (
                                                                        <div className="stock-image-placeholder">No image available</div>
                                                                    )}
                                                                </div>

                                                                <div className="stock-details-content">
                                                                    <div className="stock-details-grid">
                                                                        <div>
                                                                            <div><span className="stock-label">Product Name</span>{p.productName}</div>
                                                                            <div><span className="stock-label">Category</span>{p.category}</div>
                                                                            <div><span className="stock-label">Form</span>{p.form}</div>
                                                                        </div>

                                                                        <div>
                                                                            <div><span className="stock-label">Stems/Bunch</span>{p.stemsBunch}</div>
                                                                            <div><span className="stock-label">Maturity</span>{p.maturity}</div>
                                                                            <div><span className="stock-label">Min Price</span>{p.minPrice ?? p.min_price ?? "—"}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {p.desc && (
                                                                <div className="stock-description-box">
                                                                    <span className="stock-label">Description</span>
                                                                    <p>{p.desc}</p>
                                                                </div>
                                                            )}

                                                            <div className="stock-actions">
                                                                <button
                                                                    className="stock-delete-btn"
                                                                    onClick={() => handleDeletePlant(p.plantId, p.plantName)}
                                                                    disabled={deleting[p.plantId]}
                                                                    aria-label={`Delete ${p.plantName}`}
                                                                >
                                                                    {deleting[p.plantId] ? "Deleting..." : "Delete Plant"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="stock-footer-actions">
                            <button
                                className="stock-back-btn"
                                onClick={() => navigate("/auctionmasterDashboard")}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu />
        </div>
    );
}
