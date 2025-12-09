import React, { useEffect, useState } from "react";
import "../../styles/login_registerPages/registerStyle.css";
import * as IBAN from "iban";

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
    const [logo, setLogo] = useState(null);
    const isValidPostalCode = (code) => /^[0-9]{4}[A-Za-z]{2}$/.test(code);
    const countries = ["Netherlands", "Belgium", "Luxemburg"];

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!IBAN.isValid(form.iban)) {
            setError("Invalid IBAN number.");
            return;
        }

        if (!isValidPostalCode(form.postalCode)) {
            setError("Invalid postal code. Format must be 4 digits followed by 2 letters.");
            return;
        }

        if (!countries.includes(form.country)) {
            setError("Invalid country selected.");
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
                window.location.href = "/login_register/login";

            } else {
                const body = await res.json().catch(() => null);
                setError(body || JSON.stringify(body) || `Status ${res.status}`);
            }
        } catch (ex) {
            setError(ex.message);
        }
    };

    return (
        <div className="r-parent">

            <div className="r-header">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="u-top-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </div>

            {error && <div style={{ color: "red" }}>{typeof error === "string" ? error : JSON.stringify(error)}</div>}
            {success && <div style={{ color: "green" }}>Registration successful</div>}

            <div className="r-register">

                <div className="r-register-form">

                    <form className="form" onSubmit={onSubmit}>
                        <div>
                            <label>Email</label>
                            <input name="email" type="email" value={form.email} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Password</label>
                            <input name="password" type="password" value={form.password} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Supplier name</label>
                            <input name="supplierName" value={form.supplierName} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Address</label>
                            <input name="address" value={form.address} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Postal code</label>
                            <input name="postalCode" value={form.postalCode} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Country</label>
                            <select
                                name="country"
                                value={form.country}
                                onChange={onChange}
                                required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
                            >
                                {countries.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>IBAN</label>
                            <input name="iban" value={form.iban} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label>Description (max 500 chars)</label>
                            <textarea
                                name="desc"
                                value={form.desc}
                                onChange={onChange}
                                required
                                maxLength={500}
                                rows={4}
                            />
                        </div>

                        <button className="r-register-btn" type="submit">Register</button>

                        <div className="r-login-placeholder">
                            Already a member? Log in here:
                        </div>

                        <button
                            type="button"
                            className="r-login-btn"
                            onClick={() => (window.location.href = "/login_register/login")}
                        >
                            Login
                        </button>

                    </form>

                </div>

            </div>

            <div className="r-empty">

            </div>

        </div>
    );
}