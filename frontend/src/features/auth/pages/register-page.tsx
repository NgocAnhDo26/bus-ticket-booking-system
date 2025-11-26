import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/auth-layout";
import { register as registerApi } from "../api";
import { registerSchema, type RegisterFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { Link, useNavigate } from "react-router-dom";

export const RegisterPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data);
      navigate("/dashboard");
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start booking smarter, faster, and safer."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Full name" error={errors.fullName?.message}>
          <Input placeholder="Jane Doe" {...register("fullName")} />
        </FormField>
        <FormField label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
        </FormField>
        <FormField
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <Input
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
        </FormField>
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
