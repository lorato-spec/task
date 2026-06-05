import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate("/dashboard");
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <p className="eyebrow">TaskFlow</p>
        <h1>Organize work with a sharper, calmer dashboard.</h1>
        <p className="hero-text">
          Secure login, fast task updates, search, filters, and a clean workflow
          built for the internship brief.
        </p>
        <div className="showcase-grid">
          <article className="showcase-card">
            <span>JWT Auth</span>
            <strong>Protected routes and persistent sessions</strong>
          </article>
          <article className="showcase-card">
            <span>Task Control</span>
            <strong>Create, edit, delete, and toggle status</strong>
          </article>
          <article className="showcase-card">
            <span>Bonus Ready</span>
            <strong>Search, filters, and pagination included</strong>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your workspace</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="form-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
