import { useState } from "react";
import "./LoginPage.css";
import { signIn, confirmSignIn, signOut } from "aws-amplify/auth";

// Simple email check: something@something.something
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Turns Cognito's error names into messages a teacher understands
  function friendlyError(err) {
    switch (err.name) {
      case "NotAuthorizedException":
        return "Wrong email or password.";
      case "InvalidPasswordException":
        return "Password needs 8+ characters with uppercase, lowercase, a number and a symbol.";
      case "UserAlreadyAuthenticatedException":
        return "You're already signed in. Sign out first.";
      default:
        return err.message;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Second screen: the teacher is setting their permanent password
    if (needsNewPassword) {
      return handleNewPassword();
    }

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError("That email doesn't look right. Check for typos.");
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });

      if (isSignedIn) {
        setSignedIn(true);
      } else if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        // First login with the temporary password: ask for a new one
        setNeedsNewPassword(true);
      } else {
        setError(`Unexpected step: ${nextStep.signInStep}`);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false); // runs whether it worked or failed
    }
  }

  async function handleNewPassword() {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { isSignedIn } = await confirmSignIn({ challengeResponse: newPassword });
      if (isSignedIn) setSignedIn(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }
  if (signedIn) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Signed in </h2>
        <button
          onClick={async () => {
            await signOut();
            setSignedIn(false);
            setNeedsNewPassword(false);
            setPassword("");
            setNewPassword("");
          }}
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="login-page">
      {/* LEFT PANEL: branding and pitch (hidden on small phones) */}
      <section className="login-brand">
        <div className="brand-logo">
          <div className="brand-mark">₵</div>
          <div>
            <p className="brand-name">FeeTrack</p>
            <p className="brand-sub">School fees, sorted</p>
          </div>
        </div>

        <p className="eyebrow">MoMo and bank payments in one place</p>
        <h1 className="brand-headline">
          Know who has paid. Skip the chasing.
        </h1>
        <p className="brand-text">
          Payment alerts become records automatically, balances stay up to
          date, and parents get a message the moment fees are cleared.
        </p>

        <div className="feature-strip">
          <div className="feature">
            <p className="feature-title">MoMo</p>
            <p className="feature-sub">Alerts recorded</p>
          </div>
          <div className="feature">
            <p className="feature-title">Balances</p>
            <p className="feature-sub">Per student</p>
          </div>
          <div className="feature">
            <p className="feature-title">Parents</p>
            <p className="feature-sub">SMS on full payment</p>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: the sign-in form */}
      <section className="login-form-side">
        <p className="help-link">
          Need help? <a href="#support">Contact support</a>
        </p>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <p className="eyebrow">Teacher access</p>
          <h2 className="card-title">Welcome back</h2>
          <p className="card-text">Sign in to manage your school's fees.</p>

          <label htmlFor="email" className="field-label">
            Email <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            placeholder="you@school.edu.gh"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label htmlFor="password" className="field-label">
            Password <span className="required">*</span>
          </label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {needsNewPassword && (
            <>
              <label htmlFor="new-password" className="field-label">
                New password <span className="required">*</span>
              </label>
              <div className="password-wrap">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </>
          )}
          <a href="#forgot" className="forgot-link">
            Forgot password?
          </a>


          {/* Only shows when there is an error */}
          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? "Please wait…" : needsNewPassword ? "Set password" : "Sign in"}
          </button>

          <p className="card-footer">
            New school? <a href="#register">Request access</a>
          </p>
        </form>
      </section>
    </div>
  );
}