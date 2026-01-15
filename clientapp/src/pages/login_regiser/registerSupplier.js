import React, { useEffect, useState } from "react";
import "../../styles/login_registerPages/registerStyle.css";
import * as IBAN from "iban";

const API_BASE = process.env.REACT_APP_API_URL || '';

// Registratiepagina voor leveranciers om een nieuw account aan te maken
export default function RegisterSupplier() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        supplierName: "",
        address: "",
        postalCode: "",
        country: "",
        iban: "",
        desc: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState(null);
    const isValidPostalCode = (code) => /^[0-9]{4}[A-Za-z]{2}$/.test(code);
    const countries = ["Netherlands", "Belgium", "Luxembourg"];

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        if (!form.email || !form.password || !form.supplierName || !form.address || !form.postalCode || !form.country || !form.iban || !form.desc) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        if (!IBAN.isValid(form.iban)) {
            setError("Invalid IBAN number.");
            setLoading(false);
            return;
        }

        if (!isValidPostalCode(form.postalCode)) {
            setError("Invalid postal code. Format must be 4 digits followed by 2 letters (e.g., 1234AB).");
            setLoading(false);
            return;
        }

        if (!countries.includes(form.country)) {
            setError("Invalid country selected.");
            setLoading(false);
            return;
        }

        const payload = {
            SupplierEmail: form.email,
            Password: form.password,
            SupplierName: form.supplierName,
            Address: form.address,
            PostalCode: form.postalCode,
            Country: form.country,
            Iban: form.iban,
            Desc: form.desc
        };

        try {
            const res = await fetch("/api/suppliers/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(true);
                setForm({
                    email: "",
                    password: "",
                    supplierName: "",
                    address: "",
                    postalCode: "",
                    country: "",
                    iban: "",
                    desc: ""
                });
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                const body = await res.json().catch(() => null);
                setError(body?.message || body?.error || JSON.stringify(body) || `Status ${res.status}`);
            }
        } catch (ex) {
            setError(ex.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="r-parent">
            <header className="r-header">
                <div className="r-logo" role="region" aria-label="logo-section">
                    {logo ? (
                        <img src={logo.url} alt={logo.alt} className="u-top-logo" />
                    ) : (
                        <span className="loading-label">Loading…</span>
                    )}
                </div>
            </header>

            <section className="r-welcome-section" role="region" aria-label="welcome-banner">
                <div className="r-welcome-header">
                    <div className="r-welcome-text">
                        <p className="r-welcome-greeting">Create Your Account</p>
                        <p className="r-welcome-title">Supplier Registration</p>
                        <p className="r-welcome-subtitle">
                            Register as a supplier to list your products and participate in auctions
                        </p>
                    </div>
                </div>
            </section>

            <div className="r-content-section">
                {error && (
                    <div className="r-error-banner" role="alert">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                {success && (
                    <div className="r-success-banner" role="status">
                        <span>✅ Registration successful! Redirecting to login...</span>
                    </div>
                )}

                <div className="r-form-card">
                    <div className="r-form-header">
                        <h2>Sign Up</h2>
                        <p>Enter your supplier details</p>
                    </div>

                    <form className="form" onSubmit={onSubmit}>
                        <div>
                            <label>Email Address</label>
                            <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="your@email.com" />
                        </div>

                        <div>
                            <label>Password</label>
                            <input name="password" type="password" value={form.password} onChange={onChange} required placeholder="Enter a strong password" />
                        </div>

                        <div>
                            <label>Supplier Name</label>
                            <input name="supplierName" value={form.supplierName} onChange={onChange} required placeholder="Your Supplier Name" />
                        </div>

                        <div>
                            <label>Address</label>
                            <input name="address" value={form.address} onChange={onChange} required placeholder="Street and number" />
                        </div>

                        <div>
                            <label>Postal Code</label>
                            <input name="postalCode" value={form.postalCode} onChange={onChange} required placeholder="1234AB" />
                        </div>

                        <div>
                            <label>Country</label>
                            <select name="country" value={form.country} onChange={onChange} required>
                                <option value="">Select a country</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>IBAN</label>
                            <input name="iban" value={form.iban} onChange={onChange} required placeholder="NL91ABNA0417164300" />
                        </div>

                        <div>
                            <label>Description</label>
                            <textarea
                                name="desc"
                                value={form.desc}
                                onChange={onChange}
                                required
                                maxLength={500}
                                rows={4}
                                placeholder="Describe your business (max 500 characters)"
                            />
                        </div>

                        <button className="r-register-btn" type="submit" disabled={loading}>
                            {loading ? "Creating Account..." : "Register"}
                        </button>

                        <div className="r-login-placeholder">or</div>

                        <div style={{ textAlign: "center", marginBottom: "8px" }}>
                            <p style={{ fontSize: "12px", color: "#666", margin: "0 0 10px 0" }}>Already have an account?</p>
                            <button
                                type="button"
                                className="r-login-btn"
                                onClick={() => (window.location.href = "/login")}
                            >
                                Sign In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
