import React, { useEffect, useState } from 'react';
import '../../styles/companyPages/companyDashboardStyle.css';
import { useNavigate } from 'react-router-dom';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";

export default function CompanyDashboard() {
    const [logo, setLogo] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
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
        const tryActive = async () => {
            try {
                const r = await fetch('/api/Auction/active');
                if (r.ok) {
                    const data = await r.json();
                    setAuctions(Array.isArray(data) ? data : []);
                    setLoading(false);
                    return;
                }
            } catch { /* fallback */ }

            try {
                const r2 = await fetch('/api/Auction');
                if (r2.ok) {
                    const all = await r2.json();
                    const active = Array.isArray(all)
                        ? all.filter(a => (a.status || '').toLowerCase() === 'active')
                        : [];
                    setAuctions(active);
                } else {
                    setAuctions([]);
                }
            } catch {
                setAuctions([]);
            } finally {
                setLoading(false);
            }
        };

        tryActive();
    }, []);

    const handleVisitAuction = (id) => navigate(`/company/auction/${id}`);
    const handleAllAuctions = () => navigate('/company/auctions');

    const firstAuction = auctions.length ? auctions[0] : null;

    return (
        <div className="company-dashboard" aria-label="company-dashboard">
            <header className="cd-topbar">
                <div className="cd-logo" role="region" aria-label="section-1">
                    {logo ? (
                        <img src={logo.url} alt={logo.alt} className="top-logo" />
                    ) : (
                        <span className="loading-label">Loading…</span>
                    )}
                </div>
            </header>

            <main className="cd-panel" role="region" aria-label="active-now-panel">
                <div className="cd-left">
                    <h2 className="cd-section-title">Active Now</h2>

                    <div className="cd-card">
                        {loading ? (
                            <p className="cd-loading">Loading active auctions…</p>
                        ) : !firstAuction ? (
                            <div className="cd-no-active">
                                <img
                                    className="cd-auction-img"
                                    alt="no-active"
                                    src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=60&auto=format&fit=crop"
                                />
                                <h3>No active auctions</h3>
                                <p className="cd-muted">
                                    There are no auctions running right now for your company. Use the button
                                    to see all auctions or check back later.
                                </p>
                                <div className="cd-cta-wrap">
                                    <button className="cd-cta cd-cta-secondary" onClick={handleAllAuctions}>
                                        Visit this auction
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="cd-auction">
                                <img
                                    className="cd-auction-img"
                                    alt={`auction-${firstAuction.auction_id}`}
                                    src={firstAuction.imageUrl || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=60&auto=format&fit=crop'}
                                />
                                <h3 className="cd-auction-title">Auction #{firstAuction.auction_id}</h3>
                                <p className="cd-muted">
                                    {firstAuction.short_description || 'Live auction running now. Click below to visit the auction, view lots and place bids.'}
                                </p>
                                <div className="cd-cta-wrap">
                                    <button className="cd-cta" onClick={() => handleVisitAuction(firstAuction.auction_id)}>
                                        Visit This Auction
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="cd-right">
                    <div className="cd-card cd-summary">
                        <h3>Company Dashboard</h3>
                        <p className="cd-summary-text">
                            Monitor your active auctions here. Select an auction to enter the live view, review lot
                            details and follow bids. Use the Auctions button to browse all auctions.
                        </p>

                        <div className="cd-cta-wrap">
                            <button className="cd-cta cd-cta-light" onClick={handleAllAuctions}>Auctions</button>
                        </div>
                    </div>
                </aside>
            </main>

            <AccountDropdownMenu />
        </div>
    );
}