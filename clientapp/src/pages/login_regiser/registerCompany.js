import React, { useState } from "react";

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
            } else {
                const body = await res.json();
                setError(body?.error || JSON.stringify(body));
            }
        } catch (ex) {
            setError(ex.message);
        }
    };

    return (
        <div>
            <h2>Register Company</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            {success && <div style={{ color: "green" }}>Registration successful</div>}
            <form onSubmit={onSubmit}>
                <div>
                    <label>Email</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} required />
                </div>
                <div>
                    <label>Password</label>
                    <input name="password" type="password" value={form.password} onChange={onChange} required />
                </div>
                <div>
                    <label>Company name</label>
                    <input name="companyName" value={form.companyName} onChange={onChange} required />
                </div>
                <div>
                    <label>Address</label>
                    <input name="address" value={form.address} onChange={onChange} required />
                </div>
                <div>
                    <label>Postal code</label>
                    <input name="postalCode" value={form.postalCode} onChange={onChange} required />
                </div>
                <div>
                    <label>Country</label>
                    <input name="country" value={form.country} onChange={onChange} required />
                </div>
                <div>
                    <label>VAT</label>
                    <input name="vat" value={form.vat} onChange={onChange} required />
                </div>
                <div>
                    <label>IBAN</label>
                    <input name="iban" value={form.iban} onChange={onChange} required />
                </div>
                <div>
                    <label>BIC / Swift</label>
                    <input name="bic" value={form.bic} onChange={onChange} required />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}