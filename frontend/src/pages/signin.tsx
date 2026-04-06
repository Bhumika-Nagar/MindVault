import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthForm } from "../components/auth/AuthForm";
import { authService } from "../services/auth";
import { setStoredToken } from "../lib/auth";

export default function SigninPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.signin({ username, password });
      if (!response.token) {
        throw new Error("Token missing from signin response.");
      }

      setStoredToken(response.token);
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectTo || "/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <AuthForm
        title="Welcome back"
        description="Sign in to manage your saved content, share your brain, and keep your dashboard in sync."
        submitLabel={isSubmitting ? "Signing in..." : "Sign in"}
        footerLabel="Need an account?"
        footerLinkLabel="Sign up"
        footerHref="/signup"
        username={username}
        password={password}
        error={error}
        isSubmitting={isSubmitting}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </div>
  );
}
