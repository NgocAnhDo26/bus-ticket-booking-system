import { type RegisterFormValues } from "@/features/auth/schema"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type UseFormReturn } from "react-hook-form"
import { Link } from "react-router-dom"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type Props = {
  form: UseFormReturn<RegisterFormValues>
  onSubmit: (values: RegisterFormValues) => void
  isSubmitting?: boolean
  error?: string
  className?: string
}

export function RegisterForm({
  form,
  onSubmit,
  isSubmitting,
  error,
  className,
  ...props
}: Props & Omit<React.ComponentPropsWithoutRef<"form">, keyof Props>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form
      className={cn("space-y-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to get started
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <FormField label="Full name" error={errors.fullName?.message}>
        <Input placeholder="Jane Doe" {...register("fullName")} />
      </FormField>
      <FormField label="Email address" error={errors.email?.message}>
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
      </FormField>
      <FormField label="Password" error={errors.password?.message}>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("password")}
        />
      </FormField>
      <FormField label="Confirm password" error={errors.confirmPassword?.message}>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Sign up"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}


