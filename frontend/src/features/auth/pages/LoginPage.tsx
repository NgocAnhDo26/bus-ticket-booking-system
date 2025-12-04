import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { AxiosError } from "axios";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuthStore } from "@/store/auth-store";
import { login, loginWithGoogle } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { loginSchema, type LoginFormValues } from "../schema";
import { getDashboardPath } from "@/lib/navigation";

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

  type ErrorResponse = { message?: string };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login success, data:", data);
      setError("");
      setAuth(data);
      console.log("Auth set, navigating to dashboard");
      navigate(getDashboardPath(data.user.role));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
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
      navigate(getDashboardPath(data.user.role));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
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
