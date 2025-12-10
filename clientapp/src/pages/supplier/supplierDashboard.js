import React, { useEffect, useState } from 'react';
import '../../styles/supplierPages/supplierDashboardStyle.css';
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

export default function SupplierDashboard() {
    const [logo, setLogo] = useState(null);
    const [plants, setPlants] = useState([]);
    const [loadingPlants, setLoadingPlants] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const userName = 'user';
    const userRole = 'Supplier';

    const navigate = useNavigate();

    const normalizeUrl = (url) => {
        if (!url) return null;
        const t = url.trim();
        if (t.startsWith("http://") || t.startsWith("https://")) return t;
        return t.startsWith("/") ? t : `/${t}`;
    };

    useEffect(() => {
        // Top logo (media id 1)
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = normalizeUrl(m.url);
                setLogo({ url: normalizedUrl, alt: m.alt_text ?? m.altText ?? 'Logo' });
            })
            .catch(() => { /* silent fallback */ });
    }, []);

    useEffect(() => {
        // determine supplierId from possible storage shapes and sanitize it
        let supplierId = localStorage.getItem('supplierId');

        if (!supplierId) {
            const raw = localStorage.getItem('user_data') || localStorage.getItem('userdata') || localStorage.getItem('user');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    supplierId = parsed?.SupplierId || parsed?.supplierId || parsed?.Data?.SupplierId || parsed?.Data?.supplierId;
                } catch {
                    // not JSON
                }
            }
        }

        if (supplierId && typeof supplierId === 'string') {
            // sanitize: remove any leading characters like '.' or '/'
            supplierId = supplierId.trim().replace(/^[^a-zA-Z0-9\-]+/, '');
        }

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

        if (!supplierId) {
            // not logged in or id not available — don't try to call protected API
            setLoadingPlants(false);
            setPlants([]);
            return;
        }

        const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

        fetch(`/api/Suppliers/${encodeURIComponent(supplierId)}/plants`, { headers })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) return [];
                    throw new Error('Failed to fetch plants');
                }
                return res.json();
            })
            .then(data => {
                const mapped = (data || []).map(p => ({
                    plantId: p.plantId ?? p.PlantId ?? p.plant_id,
                    productName: p.productName ?? p.ProductName ?? p.productname,
                    category: p.category ?? p.Category,
                    form: p.form ?? p.Form,
                    quality: p.quality ?? p.Quality,
                    minStem: p.minStem ?? p.MinStem ?? p.min_stem,
                    stemsBunch: p.stemsBunch ?? p.StemsBunch ?? p.stems_bunch,
                    maturity: p.maturity ?? p.Maturity,
                    description: p.description ?? p.Description ?? p.desc,
                    supplierName: p.supplierName ?? p.SupplierName
                }));
                setPlants(mapped);
            })
            .catch(err => {
                console.error("Failed to load supplier plants:", err);
                setPlants([]);
            })
            .finally(() => setLoadingPlants(false));
    }, []);

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleAddProducts = () => navigate('/supplier/s_addProduct');

    return (
        <div className="sd-page">
            <header className="sd-topbar">
                <div className="sd-logo" role="region" aria-label="section-1">
                    {logo ? (
                        <img src={logo.url} alt={logo.alt} className="top-logo" />
                    ) : (
                        <span className="loading-label">Loading…</span>
                    )}
                </div>
            </header>

            <section className="sd-welcome">
                <h1>Welcome!</h1>
                <p>You can add products to the stock by clicking on the 'Add Products' button.<br/>You can also look at your stock.</p>
            </section>

            <main className="sd-main">
                <aside className="sd-left-card">
                    <div className="sd-add-card">
                        <div className="sd-add-graphic" aria-hidden>
                            <svg viewBox="0 0 64 64" width="96" height="96" aria-hidden>
                                <rect x="8" y="8" width="48" height="48" rx="6" fill="rgba(0,0,0,0.08)"/>
                                <rect x="22" y="22" width="20" height="20" rx="2" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none"/>
                                <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>

                        <div className="sd-add-footer">
                            <button className="sd-add-btn" onClick={handleAddProducts}>Add Products</button>
                        </div>
                    </div>
                </aside>

                <section className="sd-stock">
                    <div className="sd-stock-header">
                        <div className="sd-stock-icon">▦</div>
                        <div className="sd-stock-title">Stock View</div>
                    </div>

                    <div className="sd-stock-body" role="region" aria-label="Stock view content">
                        {loadingPlants ? (
                            <div>Loading stock…</div>
                        ) : plants.length === 0 ? (
                            <div>No plants in stock.</div>
                        ) : (
                            <table className="sd-stock-table" aria-label="Supplier plants">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Form</th>
                                        <th>Quality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plants.map((p, i) => (
                                        <React.Fragment key={p.plantId ?? i}>
                                            <tr
                                                className="sd-stock-row"
                                                onClick={() => toggleExpand(i)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") toggleExpand(i);
                                                }}
                                                aria-expanded={expandedIndex === i}
                                            >
                                                <td>{p.productName}</td>
                                                <td>{p.category}</td>
                                                <td>{p.form}</td>
                                                <td>{p.quality}</td>
                                            </tr>

                                            {expandedIndex === i && (
                                                <tr>
                                                    <td colSpan={4} className="sd-stock-details">
                                                        <div className="sd-details-grid">
                                                            <div><span className="sd-label">Min stems</span>{p.minStem}</div>
                                                            <div><span className="sd-label">Stems / bunch</span>{p.stemsBunch}</div>
                                                            <div><span className="sd-label">Maturity</span>{p.maturity}</div>
                                                            <div style={{ gridColumn: "1 / -1" }}><span className="sd-label">Description</span>{p.description}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </main>

            <SupplierNavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu userName={userName} userRole={userRole} />
        </div>
    );
}