import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/styles/Login.css";

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        Email: "",
        Wachtwoord: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const looksLikeAuctionMaster = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        return (
            "auctionMasterId" in obj ||
            "AuctionMasterId" in obj ||
            "email" in obj ||
            "Email" in obj ||
            "name" in obj ||
            "Name" in obj
        );
    };

    const looksLikeSupplier = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        return (
            "supplierId" in obj ||
            "SupplierId" in obj ||
            "supplier_id" in obj ||
            "email" in obj ||
            "Email" in obj ||
            "name" in obj ||
            "Name" in obj
        );
    };

    const tryLogin = async (url) => {
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Username: form.Email,
                Password: form.Wachtwoord,
            }),
        });
        return resp;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const API_BASE = process.env.REACT_APP_API_URL ?? "https://localhost:7036";
        const amUrl = `${API_BASE}/api/AuctionMaster/login`;
        const supUrl = `${API_BASE}/api/Supplier/login`;

        try {
            let resp = await tryLogin(amUrl);

            if (!resp.ok) {
                const respSup = await tryLogin(supUrl);

                if (!respSup.ok) {
                    if (resp.status === 401 && respSup.status === 401) {
                        setError("Invalid email or password.");
                    } else {
                        const txt = await respSup.text().catch(() => "");
                        setError(txt || "Login failed.");
                    }
                    return;
                }

                const data = await respSup.json();
                const supplier =
                    data?.supplier ?? data?.Supplier ?? (looksLikeSupplier(data) ? data : null);

                if (supplier) {
                    localStorage.setItem("supplier", JSON.stringify(supplier));
                    navigate("/supplierDashboard");
                } else {
                    localStorage.removeItem("supplier");
                    navigate("/homepage");
                }

                return;
            }

            const data = await resp.json();

            const auctionMaster =
                data?.auctionMaster ?? data?.AuctionMaster ?? (looksLikeAuctionMaster(data) ? data : null);

            if (auctionMaster) {
                localStorage.setItem("auctionMaster", JSON.stringify(auctionMaster));
                navigate("/auctionmasterDashboard");
            } else if (looksLikeSupplier(data)) {
                const supplier = data;
                localStorage.setItem("supplier", JSON.stringify(supplier));
                navigate("/supplierDashboard");
            } else {
                localStorage.removeItem("auctionMaster");
                navigate("/homepage");
            }
        } catch (ex) {
            console.error(ex);
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Inloggen</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="text"
                        name="Email"
                        value={form.Email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Wachtwoord:</label>
                    <input
                        type="password"
                        name="Wachtwoord"
                        value={form.Wachtwoord}
                        onChange={handleChange}
                        required
                    />
                </div>

                {error && <div className="login-error" style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? "Inloggen..." : "Inloggen"}
                </button>
            </form>
        </div>
    );
}

export default Login;
