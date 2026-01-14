import React, { useEffect, useState } from "react";
import "../../styles/login_registerPages/loginStyle.css";

const API_BASE = process.env.REACT_APP_API_URL || "";
const AUTH_ENDPOINT = `${API_BASE}/api/Auth/login`;

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const mediaId = 1;
    fetch(`${API_BASE}/api/Media/${mediaId}`)
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

  function redirectForRole(role) {
    if (!role) {
      console.error("No role provided for redirect");
      return;
    }
    const r = String(role).toLowerCase().trim();
    console.log(`🔀 Redirecting for role: ${r}`);

    if (r === "client") {
      window.location.href = "/companyDashboard";
    } else if (r === "supplier") {
      window.location.href = "/supplierDashboard";
    } else if (r === "admin") {
      window.location.href = "/auctionmasterDashboard";
    } else {
      console.warn(`Unknown role: ${r}`);
      window.location.href = "/login";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Sending login request...");

      const res = await fetch(AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email,
          password: password
        }),
      });

      console.log(`📊 Login response status: ${res.status}`);

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("❌ Login failed response:", text);
        throw new Error(text || `Login failed (${res.status})`);
      }

      const data = await res.json();
      console.log("✅ Login response received:", {
        hasToken: !!data?.token,
        hasRoles: !!data?.roles,
        hasData: !!data?.data,
        email: data?.email
      });

      // Priority 1: Check for roles in response
      const roles = data?.roles || data?.Roles || [];
      
      if (Array.isArray(roles) && roles.length > 0) {
        console.log(`✅ Roles found in response: ${roles.join(", ")}`);
        
        // Store user information
        localStorage.setItem("user_email", data?.email || "");
        localStorage.setItem("user_roles", JSON.stringify(roles));
        
        // Store supplier data if available
        if (data?.data) {
          localStorage.setItem("user_data", JSON.stringify(data.data));
          if (data.data.SupplierId) {
            localStorage.setItem("supplierId", data.data.SupplierId);
            console.log(`✅ Supplier ID stored: ${data.data.SupplierId}`);
          }
        }

        // Store token if provided
        if (data?.token) {
          localStorage.setItem("auth_token", data.token);
          console.log(`✅ JWT Token stored (length: ${data.token.length})`);
        }

        redirectForRole(roles[0]);
        return;
      }

      // Priority 2: Check for token and decode roles from it
      const token = data?.token || data?.access_token || data?.accessToken;
      if (token) {
        console.log("✅ Token found in response, storing and decoding...");
        localStorage.setItem("auth_token", token);

        const payload = decodeJwt(token);
        console.log("🔍 Token payload:", payload);

        if (payload) {
          // Try different role claim formats
          const claimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
          let rolesFromToken = payload?.role || 
                               payload?.roles || 
                               payload?.[claimKey] || 
                               [];

          // Ensure it's an array
          if (typeof rolesFromToken === 'string') {
            rolesFromToken = [rolesFromToken];
          }

          if (Array.isArray(rolesFromToken) && rolesFromToken.length > 0) {
            console.log(`✅ Roles decoded from token: ${rolesFromToken.join(", ")}`);
            
            // Store user information
            localStorage.setItem("user_email", data?.email || "");
            localStorage.setItem("user_roles", JSON.stringify(rolesFromToken));

            if (data?.data) {
              localStorage.setItem("user_data", JSON.stringify(data.data));
              if (data.data.SupplierId) {
                localStorage.setItem("supplierId", data.data.SupplierId);
                console.log(`✅ Supplier ID stored: ${data.data.SupplierId}`);
              }
            }

            redirectForRole(rolesFromToken[0]);
            return;
          }
        }
      }

      // If we reach here, we couldn't get roles or token
      console.error("❌ No roles or token found in login response");
      console.log("Full response:", data);
      setError("Login succeeded but no role information returned. Please contact support.");
      setLoading(false);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Header */}
      <header className="login-topbar">
        <div className="login-logo" role="region" aria-label="logo-section">
          {logo ? (
            <img src={logo.url} alt={logo.alt} className="login-top-logo" />
          ) : (
            <span className="loading-label">Loading…</span>
          )}
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="login-welcome-section" role="region" aria-label="welcome-banner">
        <div className="login-welcome-header">
          <div className="login-welcome-text">
            <p className="login-welcome-greeting">Welcome to Flauction</p>
            <p className="login-welcome-title">Auction Platform</p>
            <p className="login-welcome-subtitle">
              Access your account to manage auctions, orders, and inventory in one integrated platform
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="login-content-section">
        {/* Error Message */}
        {error && (
          <div className="login-error-banner" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-label">Password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>

            <button
              className="login-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-divider">or</div>

          <div className="login-register-section">
            <p className="login-register-text">Don't have an account?</p>
            <button
              className="login-register-btn"
              type="button"
              onClick={() => (window.location.href = "/registerOptions")}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
