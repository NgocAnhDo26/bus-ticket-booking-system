import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/auth-layout";
import { login, loginWithGoogle } from "../api";
import { loginSchema, type LoginFormValues } from "../schema";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login success, data:", data);
      setError("");
      setAuth(data);
      console.log("Auth set, navigating to dashboard");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      setError(errorMessage);
      console.error("Login error:", errorMessage);
    },
  });

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      setError("");
      setAuth(data);
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Google login failed";
      setError(errorMessage);
      console.error("Google login error:", errorMessage);
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout>
      <LoginForm
        form={form}
        error={error}
        isSubmitting={loginMutation.isPending}
        onSubmit={onSubmit}
        onGoogleLogin={(credential) => googleMutation.mutate({ credential })}
        onGoogleError={() => {
          setError("Google login failed");
        }}
      />
    </AuthLayout>
  );
};
