import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login_registerPages/registerOptionsStyle.css";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function RegisterOptions() {
    const navigate = useNavigate();
    const [logo, setLogo] = useState(null);

    useEffect(() => {
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
            .catch(() => { });
    }, []);

    return (
        <div className="op-parent">
            {/* Header */}
            <header className="logo-au-header" role="banner" aria-label="logo-section">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="u-top-logo" />
                ) : (
                    <span className="loading-label">Loading�</span>
                )}
            </header>

            {/* Welcome Banner */}
            <section className="op-welcome-section" role="region" aria-label="welcome-banner">
                <div className="op-welcome-header">
                    <div className="op-welcome-text">
                        <p className="op-welcome-greeting">Get Started</p>
                        <p className="op-welcome-title">Choose Account Type</p>
                        <p className="op-welcome-subtitle">
                            Select how you'd like to use Flauction and create your account
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="body-upc">
                <div className="op-action-box" role="group" aria-label="Register options">
                    <div className="register-as">
                        <h3>Register as:</h3>
                    </div>

                    <div className="combtn-place">
                        <button
                            type="button"
                            className="company-btn"
                            onClick={() => navigate("/registerCompany")}
                            aria-label="Register as company"
                            title="Register as company"
                        >
                            Company
                        </button>
                    </div>

                    <div className="supbtn-place">
                        <button
                            type="button"
                            className="supplier-btn"
                            onClick={() => navigate("/registerSupplier")}
                            aria-label="Register as supplier"
                            title="Register as supplier"
                        >
                            Supplier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}