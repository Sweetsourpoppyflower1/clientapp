import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login_registerPages/registerOptionsStyle.css";

export default function RegisterOptions() {
    const navigate = useNavigate();
    const [logo, setLogo] = useState(null);


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
            .catch(() => { });
    }, []);

    return (
        <div className="op-parent">

            <div className="logo-au-header">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="u-top-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </div>

            <div className="body-upc">

                <div className="op-action-box" role="group" aria-label="Register options">

                    <div className="combtn-place">

                        <div className="register-as">
                            <h3>Register as:</h3>
                        </div>

                        <button
                            type="button"
                            className="company-btn"
                            onClick={() => navigate("/login_register/registerCompany")}
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
                            onClick={() => navigate("/login_register/registerSupplier")}
                            aria-label="Register as supplier"
                            title="Register as supplier"
                        >
                            Supplier
                        </button>
                    </div>

                </div>

                <div className="empty" />

            </div>

        </div>
    );
}