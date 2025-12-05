import React, { useState } from "react";
import "../../styles/login_registerPages/loginStyle.css";

const AUTH_ENDPOINT = "/api/Auth/login"; 

function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return decoded;
    } catch (e) {
        return null;
    }
}

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function redirectForRole(role) {
        if (!role) return;
        const r = String(role).toLowerCase();
        if (r === "client" || r === "Client") {
            window.location.href = "/companyDashboard";
        } else if (r === "supplier" || r === "Supplier") {
            window.location.href = "/supplierDashboard";
        } else if (r === "admin" || r === "Admin") {
            window.location.href = "/auctionmasterDashboard";
        } else {
            window.location.href = "/login_register/login";
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(AUTH_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Email: email, Password: password }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(text || `Login failed (${res.status})`);
            }

            const data = await res.json();

            const token = data?.token ?? data?.access_token ?? data?.accessToken;
            if (token) {
                localStorage.setItem("auth_token", token);

                const payload = decodeJwt(token);
                let roles = [];
                if (payload) {
                    if (payload.role) roles = Array.isArray(payload.role) ? payload.role : [payload.role];
                    if (payload.roles) roles = roles.concat(Array.isArray(payload.roles) ? payload.roles : [payload.roles]);
                    const claimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
                    if (payload[claimKey]) roles = roles.concat(Array.isArray(payload[claimKey]) ? payload[claimKey] : [payload[claimKey]]);
                }

                const role = (roles.length && roles[0]) || null;
                redirectForRole(role);
                return;
            }

            if (data) {
                const roles = data.roles ?? data.role ?? data.Roles ?? data.Role;
                if (Array.isArray(roles) && roles.length > 0) {
                    redirectForRole(roles[0]);
                    return;
                }
                if (typeof roles === "string") {
                    redirectForRole(roles);
                    return;
                }

                try {
                    const whoRes = await fetch(`/api/Auctionmasters/${encodeURIComponent(email)}/${encodeURIComponent(password)}`);
                    if (whoRes.ok) {
                        const user = await whoRes.json();
                        const uroles = user?.roles ?? user?.Roles ?? user?.role;
                        if (Array.isArray(uroles) && uroles.length) {
                            redirectForRole(uroles[0]);
                            return;
                        }
                        if (typeof uroles === "string") {
                            redirectForRole(uroles);
                            return;
                        }
                    }
                } catch (_) {

                }

                setError("Login succeeded but no role information returned. Check backend response.");
                setLoading(false);
                return;
            }

            setError("Unexpected response from server.");
            setLoading(false);
        } catch (err) {
            setError(err.message || "Login failed");
            setLoading(false);
        }
    }

    return (
        <html>
            <head>
                <h2 className="header">Log in</h2>
            </head>
            <body>
                <div className="login-page">
                    <div className="login-container" style={{ maxWidth: 420 }}>
                        <div className="form">
                            <form onSubmit={handleSubmit}>
                                <label className="bold">
                                    Email
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="username"
                                        style={{ display: "block", width: "100%", marginBottom: 10 }}
                                    />
                                </label>

                                <label className="bold">
                                    Password
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        style={{ display: "block", width: "100%", marginBottom: 50 }}
                                    />
                                </label>

                                <button className="button" type="submit" disabled={loading}>
                                    {loading ? "Signing in..." : "Sign in"}
                                </button>

                                {error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}
                            </form>
                            <div className="register">
                                <p className="no-account">No account? Register here: </p>
                                <button className="register-btn">Register</button>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        
    );
}