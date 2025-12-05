import React, { useState } from "react";

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
        <div>
            <h2>Register Supplier</h2>
            {error && <div style={{ color: "red" }}>{typeof error === "string" ? error : JSON.stringify(error)}</div>}
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
                    <label>Supplier name</label>
                    <input name="supplierName" value={form.supplierName} onChange={onChange} required />
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
                    <label>IBAN</label>
                    <input name="iban" value={form.iban} onChange={onChange} required />
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
                <button type="submit">Register</button>
            </form>
        </div>
    );
}