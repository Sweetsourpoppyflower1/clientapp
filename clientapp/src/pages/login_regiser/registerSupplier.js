import React, { useState } from "react";
import "../../styles/login_registerPages/registerStyle.css";
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

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

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
                <h2>Flauction</h2>
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
                            <input name="country" value={form.country} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
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