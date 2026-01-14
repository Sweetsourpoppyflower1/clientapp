import React, { useEffect, useState } from 'react';
import '../../styles/supplierPages/supplierDashboardStyle.css';
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function SupplierDashboard() {
    const [logo, setLogo] = useState(null);
    const [plants, setPlants] = useState([]);
    const [loadingPlants, setLoadingPlants] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [userData, setUserData] = useState({ userName: 'Guest', userRole: 'Supplier' });
    const [error, setError] = useState(null);
    const [auctionLots, setAuctionLots] = useState([]);

    const navigate = useNavigate();

    /**
     * Normalize URL to ensure proper formatting
     */
    const normalizeUrl = (url) => {
        if (!url) return null;
        const trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
        return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    };

    /**
     * Extract supplier ID from various storage formats
     */
    const getSupplierId = () => {
        let supplierId = localStorage.getItem('supplierId');

        if (!supplierId) {
            const storageKeys = ['user_data', 'userdata', 'user'];
            for (const key of storageKeys) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        supplierId = parsed?.SupplierId || parsed?.supplierId || 
                                   parsed?.Data?.SupplierId || parsed?.Data?.supplierId ||
                                   parsed?.id || parsed?.Id || parsed?.userId || parsed?.UserId;
                        if (supplierId) break;
                    } catch {
                        // Not JSON, continue to next key
                    }
                }
            }
        }

        // Sanitize the supplier ID
        if (supplierId && typeof supplierId === 'string') {
            supplierId = supplierId.trim().replace(/^[^a-zA-Z0-9\-]+/, '');
        }

        return supplierId || null;
    };

    /**
     * Extract user data from storage
     */
    const loadUserData = () => {
        try {
            const raw = localStorage.getItem('user_data') || localStorage.getItem('userdata') || localStorage.getItem('user');
            if (raw) {
                const parsed = JSON.parse(raw);
                setUserData({
                    userName: parsed?.UserName || parsed?.userName || parsed?.Name || parsed?.name || 'Guest',
                    userRole: parsed?.Role || parsed?.role || 'Supplier'
                });
            }
        } catch (err) {
            console.warn("Could not parse user data from storage", err);
        }
    };

    /**
     * Fetch logo on mount
     */
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await fetch('/api/Media/1');
                if (!response.ok) throw new Error('Failed to fetch logo');
                const data = await response.json();
                setLogo({
                    url: normalizeUrl(data.url),
                    alt: data.alt_text || data.altText || data.Alt_Text || 'Logo'
                });
            } catch (err) {
                console.error("Logo fetch error:", err);
                setLogo(null);
            }
        };

        fetchLogo();
        loadUserData();
    }, []);

    /**
     * Fetch supplier plants on mount
     */
    useEffect(() => {
        const fetchPlants = async () => {
            const supplierId = getSupplierId();
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            if (!supplierId) {
                setError('Supplier ID not found. Please log in again.');
                setLoadingPlants(false);
                return;
            }

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };

                const url = `${API_BASE}/api/Suppliers/${encodeURIComponent(supplierId)}/plants`;
                const response = await fetch(url, { headers, method: 'GET' });

                if (response.status === 404) {
                    setPlants([]);
                    setError(null);
                    setLoadingPlants(false);
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                setPlants(data);
                setError(null);
            } catch (err) {
                console.error("Plant fetch error:", err);
                setError(`Failed to load plants: ${err.message}`);
                setPlants([]);
            } finally {
                setLoadingPlants(false);
            }
        };

        fetchPlants();
    }, []);

    useEffect(() => {
        fetch("/api/AuctionLots")
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

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleAddProducts = () => {
        navigate('/sAddProduct');
    };

    const handleEditPlant = (plant) => {
        navigate(`/sEditPlant/${plant.plantId || plant.plant_id || plant.id}`);
    };

    return (
        <div className="sd-page">
            {/* Header with Logo */}
            <header className="sd-topbar">
                <div className="sd-logo" role="region" aria-label="Logo section">
                    {logo?.url ? (
                        <img src={logo.url} alt={logo.alt} className="sd-top-logo" />
                    ) : (
                        <span className="sd-loading-label">Loading…</span>
                    )}
                </div>
            </header>

            {/* Welcome Section */}
            <section className="sd-welcome-section">
                <div className="sd-welcome-header">
                    <div className="sd-welcome-text">
                        <p className="sd-welcome-greeting">Welcome back</p>
                        <p className="sd-welcome-title">Supplier Dashboard</p>
                        <p className="sd-welcome-subtitle">
                            Manage your products and view auction opportunities in one place
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="sd-main">
                {/* Content Grid - Button and Stock Side by Side */}
                <div className="sd-content-grid">
                    {/* Add Products Button Tile */}
                    <div className="sd-buttons-section">
                        <button className="sd-action-btn sd-add-products-btn" onClick={handleAddProducts}>
                            <svg className="sd-btn-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                                <rect x="8" y="8" width="48" height="48" rx="6" fill="rgba(255,255,255,0.1)"/>
                                <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="sd-btn-label">Add Products</span>
                        </button>
                    </div>

                    {/* Stock View Section */}
                    <section className="sd-stock">
                        <div className="sd-stock-header">
                            <div className="sd-stock-icon">▦</div>
                            <div className="sd-stock-title">Stock View</div>
                        </div>

                        <div className="sd-stock-body" role="region" aria-label="Product inventory">
                            {/* Error Message */}
                            {error && (
                                <div className="sd-error-message" role="alert">
                                    <span className="sd-error-icon">⚠</span>
                                    {error}
                                </div>
                            )}

                            {/* Loading State */}
                            {loadingPlants && !error && (
                                <div className="sd-loading-message">
                                    <span className="sd-spinner"></span>
                                    Loading your products…
                                </div>
                            )}

                            {/* Empty State */}
                            {!loadingPlants && plants.length === 0 && !error && (
                                <div className="sd-empty-message">
                                    <span className="sd-empty-icon">📦</span>
                                    <p>No products in stock yet.</p>
                                    <p className="sd-empty-hint">Click 'Add Products' to get started.</p>
                                </div>
                            )}

                            {/* Products Table */}
                            {!loadingPlants && plants.length > 0 && (
                                <div className="sd-table-wrapper">
                                    <table className="sd-stock-table" aria-label="Supplier product inventory">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Form</th>
                                                <th>Quality</th>
                                                <th>Remaining Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {plants.map((plant, index) => (
                                                <React.Fragment key={plant.plantId || index}>
                                                    <tr
                                                        className={`sd-stock-row ${expandedIndex === index ? 'sd-expanded' : ''}`}
                                                        onClick={() => toggleExpand(index)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                toggleExpand(index);
                                                            }
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-expanded={expandedIndex === index}
                                                        aria-controls={`plant-details-${index}`}
                                                    >
                                                        <td>{plant.productName}</td>
                                                        <td>{plant.category}</td>
                                                        <td>{plant.form}</td>
                                                        <td>{plant.quality}</td>
                                                        <td>{getRemainingQuantity(plant.plantId) ?? "—"}</td>
                                                    </tr>

                                                    {expandedIndex === index && (
                                                        <tr className="sd-details-row" id={`plant-details-${index}`}>
                                                            <td colSpan="5" className="sd-details-cell">
                                                                <div className="sd-details-container">
                                                                    {/* Image on the left */}
                                                                    <div className="sd-details-image">
                                                                        {plant.imageUrl ? (
                                                                            <img
                                                                                src={normalizeUrl(plant.imageUrl)}
                                                                                alt={plant.imageAlt || plant.productName}
                                                                                className="sd-details-img"
                                                                            />
                                                                        ) : (
                                                                            <div className="sd-image-placeholder">No image</div>
                                                                        )}
                                                                    </div>

                                                                    {/* Details grid on the right */}
                                                                    <div className="sd-details-grid">
                                                                        <div>
                                                                            <div><span className="sd-label">Min Stems</span>{plant.minStem}</div>
                                                                            <div><span className="sd-label">Stems/Bunch</span>{plant.stemsBunch}</div>
                                                                            <div><span className="sd-label">Maturity</span>{plant.maturity}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div><span className="sd-label">Quality</span>{plant.quality}</div>
                                                                            <div><span className="sd-label">Min Price</span>€{plant.minPrice ?? '-'}</div>
                                                                            <div><span className="sd-label">Start Price</span>€{plant.startPrice ?? '-'}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Description - Full Width */}
                                                                <div className="sd-description-box">
                                                                    <span className="sd-label">Description</span>
                                                                    <p>{plant.description}</p>

                                                                    <button className="btn_editPlant" onClick={() => handleEditPlant(plant)}>
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Navigation and Account Menus */}
            <SupplierNavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu userName={userData.userName} userRole={userData.userRole} />
        </div>
    );
}
