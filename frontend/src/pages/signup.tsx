import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "../components/auth/AuthForm";
import { authService } from "../services/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      await authService.signup({ username, password });
      navigate("/signin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to sign up.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <AuthForm
        title="Create your account"
        description="Sign up to start saving articles, audio, and video into your MindVault dashboard."
        submitLabel={isSubmitting ? "Creating account..." : "Sign up"}
        footerLabel="Already have an account?"
        footerLinkLabel="Sign in"
        footerHref="/signin"
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
