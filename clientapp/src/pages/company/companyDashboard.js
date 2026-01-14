import React, { useEffect, useState } from 'react';
import '../../styles/companyPages/companyDashboardStyle.css';
import { useNavigate } from 'react-router-dom';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function CompanyDashboard() {
    const [logo, setLogo] = useState(null);
    const [buttonLogos, setButtonLogos] = useState([null, null]);
    const [companyName, setCompanyName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
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
        const ids = [2, 4];
        Promise.all(
            ids.map(id =>
                fetch(`${API_BASE}/api/Media/${id}`)
                    .then(res => (res.ok ? res.json() : null))
                    .catch(() => null)
            )
        ).then(results => {
            const normalized = results.map(r => {
                if (!r || !r.url) return null;
                return {
                    url: r.url.startsWith('/') ? r.url : `/${r.url}`,
                    alt: r.alt_text ?? ''
                };
            });
            setButtonLogos(normalized);
        });
    }, []);

    useEffect(() => {
        // Try to get company name from local storage or localStorage
        const storedCompanyName = localStorage.getItem('companyName');
        if (storedCompanyName) {
            setCompanyName(storedCompanyName);
        }
    }, []);

    const handleButton1 = () => {
        window.location.href = '/CAuctions';
    };

    const handleButton2 = () => {
        window.location.href = '/CMyOrders';
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

            <section className="cd-welcome-section" role="region" aria-label="welcome-banner">
                <div className="cd-welcome-header">
                    <div className="cd-welcome-text">
                        <p className="cd-welcome-greeting">Welcome back</p>
                        <p className="cd-welcome-subtitle">
                            Browse available auctions and manage your orders all in one place. Start exploring to find new opportunities.
                        </p>
                    </div>
                </div>
            </section>

            <div className="cd-buttons-section" role="region" aria-label="company-actions">
                <p className="cd-buttons-label">What would you like to do?</p>
                <div className="cd-tiles-row" role="navigation" aria-label="dashboard-actions">
                    <button className="cd-tile cd-tile1" aria-label="View Auctions" onClick={handleButton1}>
                        {renderTileContent(0, placeholderSvg)}
                    </button>

                    <button className="cd-tile cd-tile2" aria-label="View My Orders" onClick={handleButton2}>
                        {renderTileContent(1, placeholderSvg)}
                    </button>
                </div>
            </div>

            <AccountDropdownMenu />
            <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
        </div>
    );
}
