import React, { useEffect, useState } from 'react';
import '../../styles/masterPages/auctionmasterDashboardStyle.css';
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function AuctionmasterDashboard() {
    const [logo, setLogo] = useState(null);
    const [buttonLogos, setButtonLogos] = useState([null, null, null, null]);
    const navigate = useNavigate();

    useEffect(() => {
        // Top logo (media id 1)
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text });
            })
            .catch(() => { /* silent fallback */ });
    }, []);

    useEffect(() => {
        // Button media IDs: tile1 -> 2, tile2 -> 3, tile3 -> 4, tile4 -> 5
        const ids = [2, 3, 4, 5];
        Promise.all(
            ids.map(id =>
                fetch(`${API_BASE}/api/Media/${id}`)
                    .then(res => (res.ok ? res.json() : null))
                    .catch(() => null)
            )
        ).then(results => {
            const normalized = results.map(r => {
                if (!r || !r.url) return null;
                const normalizedUrl = r.url.startsWith('/') ? r.url : `/${r.url}`;
                return {
                    url: `${API_BASE}${normalizedUrl}`,
                    alt: r.alt_text ?? ''
                };
            });
            setButtonLogos(normalized);
        });
    }, []);

    const handleCreateAuction = () => {
        window.location.href = '/aCreateAuction';
    };

    const handleUpcomingAuctions = () => {
        window.location.href = '/auctionCalender';
    };

    const handleOverviewStock = () => {
        window.location.href = '/aStockOverview';
    };

    const handleOverviewAcceptances = () => {
        window.location.href = '/AOverviewAcceptances';
    };

    const renderTileContent = (index, placeholderSvg) => {
        const media = buttonLogos[index];
        if (media) {
            return (
                <img
                    src={media.url}
                    alt={media.alt}
                    className="tile-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            );
        }

        return placeholderSvg;
    };

    const placeholderSvg = (
        <svg viewBox="0 0 24 24" className="iconPlaceholder" aria-hidden="true" style={{ width: 96, height: 96 }}>
            <circle cx="12" cy="12" r="8" fill="none" stroke="#fff" strokeWidth="10" />
        </svg>
    );

    return (
        <div className="dashboard-container" aria-label="dashboard-sections">
            <div className="section-top" role="region" aria-label="section-1">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="top-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </div>

            <div className="section-middle" role="region" aria-label="section-2">
                <div className="banner" role="note" aria-label="welcome-banner">
                    <h1 className="banner-title">Welcome!</h1>
                    <p className="banner-text">
                        Use the buttons below to create new auctions, review completed, active and upcoming ones,
                        check the stock of suppliers, and review acceptances.
                    </p>
                </div>
            </div>

            <div className="section-bottom" role="region" aria-label="section-3">
                <div className="tiles-row" role="navigation" aria-label="dashboard-actions">
                    <button className="tile tile1" aria-label="Create auction" onClick={handleCreateAuction}>
                        {renderTileContent(0, placeholderSvg)}
                    </button>

                    <button className="tile tile2" aria-label="Auction Calendar" onClick={handleUpcomingAuctions}>
                        {renderTileContent(1, placeholderSvg)}
                    </button>

                    <button className="tile tile3" aria-label="Overview Stock" onClick={handleOverviewStock}>
                        {renderTileContent(2, placeholderSvg)}
                    </button>

                    <button className="tile tile4" aria-label="Review Acceptances" onClick={handleOverviewAcceptances}>
                        {renderTileContent(3, placeholderSvg)}
                    </button>
                </div>
            </div>

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />

            <AccountDropdownMenu/>
        </div>
    );
}
