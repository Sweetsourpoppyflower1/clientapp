import React, { useState } from "react";
import "../../styles/login_registerPages/registerStyle.css";
import * as IBAN from "iban";

export default function RegisterCompany() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        companyName: "",
        address: "",
        postalCode: "",
        country: "",
        vat: "",
        iban: "",
        bic: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!IBAN.isValid(form.iban)) {
            setError("Invalid IBAN number.");
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
            const res = await fetch("/api/companies/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(true);
                setForm({
                    email: "",
                    password: "",
                    companyName: "",
                    address: "",
                    postalCode: "",
                    country: "",
                    vat: "",
                    iban: "",
                    bic: ""
                });
                window.location.href = "/login_regiser/login";

            } else {
                const body = await res.json();
                setError(body?.error || JSON.stringify(body));
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
                            <input name="country" value={form.country} onChange={onChange} required
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}/>
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