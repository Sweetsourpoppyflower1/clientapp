import React, { useEffect, useState } from "react";
import "../../styles/login_registerPages/registerStyle.css";
import * as IBAN from "iban";

export default function RegisterCompany() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        companyName: "",
        address: "",
        postalCode: "",
        country: "Netherlands",
        vat: "",
        iban: "",
        bic: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState(null);
    
    const isValidPostalCode = (code) => /^[0-9]{4}[A-Za-z]{2}$/.test(code);
    const isValidVAT = (vat) => /^NL\d{9}B\d{2}$/i.test(vat);
    const isValidBIC = (bic) => /^[A-Za-z]{4}[A-Za-z]{2}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(bic);
    const countries = ["Netherlands", "Belgium", "Luxembourg"];

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
            .catch((err) => {
                console.warn("Logo fetch failed:", err);
            });
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        // Client-side validation
        if (!form.email || !form.password || !form.companyName || !form.address || !form.postalCode || !form.country || !form.vat || !form.iban || !form.bic) {
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

        if (!isValidVAT(form.vat)) {
            setError("Invalid VAT number. Format: NL123456789B01");
            setLoading(false);
            return;
        }

        if (!isValidBIC(form.bic)) {
            setError("Invalid BIC / SWIFT code. Example: ABNANL2A");
            setLoading(false);
            return;
        }

        if (!countries.includes(form.country)) {
            setError("Invalid country selected.");
            setLoading(false);
            return;
        }

        const payload = {
            CompanyEmail: form.email,
            Password: form.password,
            CompanyName: form.companyName,
            Adress: form.address,
            PostalCode: form.postalCode,
            Country: form.country,
            Vat: form.vat,
            Iban: form.iban,
            BicSwift: form.bic
        };

        try {
            console.log("📡 Sending registration request...", payload);

            const res = await fetch("/api/companies/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            console.log(`📊 Response status: ${res.status}`);

            if (res.ok) {
                console.log("✅ Registration successful!");
                setSuccess(true);
                setForm({
                    email: "",
                    password: "",
                    companyName: "",
                    address: "",
                    postalCode: "",
                    country: "Netherlands",
                    vat: "",
                    iban: "",
                    bic: ""
                });
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = "/login_register/login";
                }, 2000);
            } else {
                // Try to parse JSON response
                let errorMessage = `Registration failed (${res.status})`;
                
                try {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const body = await res.json();
                        errorMessage = body?.message || body?.error || JSON.stringify(body);
                    } else {
                        const text = await res.text();
                        errorMessage = text || errorMessage;
                    }
                } catch (parseError) {
                    console.error("❌ Could not parse response:", parseError);
                }

                console.error("❌ Registration error:", errorMessage);
                setError(errorMessage);
            }
        } catch (ex) {
            console.error("❌ Network error:", ex);
            setError(`Network error: ${ex.message}`);
        } finally {
            setLoading(false);
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

            {error && <div style={{ color: "red" }}>{error}</div>}
            {success && <div style={{ color: "green" }}>Registration successful</div>}

            <div className="r-register">

                {/*<div className="r-register-infocard">*/}

                {/*    <div class="r-infocard">*/}
                {/*        <h2>Register</h2>*/}
                {/*        <p>Register your account at Flauction</p>*/}
                {/*    </div>*/}

                {/*</div>  */}

                <div className="r-register-form">

                    <form className="form" onSubmit={onSubmit}>

                        <div>
                            <label>Email Address</label>
                            <input name="email" type="email" value={form.email} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>Password</label>
                            <input name="password" type="password" value={form.password} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>Company Name</label>
                            <input name="companyName" value={form.companyName} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>Company Address</label>
                            <input name="address" value={form.address} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>Postal Code</label>
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
                            <label>VAT Number</label>
                            <input name="vat" value={form.vat} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>IBAN</label>
                            <input name="iban" value={form.iban} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
                        </div>

                        <div>
                            <label>BIC / SWIFT</label>
                            <input name="bic" value={form.bic} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
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