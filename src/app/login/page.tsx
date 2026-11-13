"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/ui-kit";
import { api, unwrap } from "@/lib/api/client";
import { useOnce } from "@/lib/use-once";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

const DEMO = [
  { label: "Student (paid, with history)", email: "student1@stargeneration.test" },
  { label: "Student (not enrolled)", email: "student2@stargeneration.test" },
  { label: "Student (not enrolled)", email: "student3@stargeneration.test" },
  { label: "Tutor (Math Group A)", email: "tutor1@stargeneration.test" },
  { label: "Tutor (no class yet)", email: "tutor2@stargeneration.test" },
];

export default function LoginPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const login = useMutation({
    mutationFn: (v: Values) => unwrap(api.POST("/auth/login", { body: v })),
    // Full navigation so the proxy sees the new cookie and routes by role.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    onSuccess: (r) => window.location.assign(`/${r.user.role}`),
    meta: { silent: true },
  });
  const loginOnce = useOnce(login.mutate, login.isPending);
  const errors = form.formState.errors;

  return (
    <main className="flex min-h-screen flex-col bg-primary text-primary-foreground">
      <div className="flex flex-1 flex-col justify-end px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-8">
        <Image src="/brand/wordmark.png" alt="Star Generation" width={280} height={41} priority className="mb-2" />
        <h1 className="mt-2 text-3xl leading-tight font-semibold">Your classes, hours and progress.</h1>
      </div>

      <form
        onSubmit={form.handleSubmit((v) => loginOnce(v))}
        noValidate
        className="space-y-5 rounded-t-3xl bg-background px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-foreground"
      >
        <div className="mx-auto max-w-sm space-y-5">
          {login.error && (
            <Alert variant="destructive">
              <AlertDescription>{login.error.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="h-11" aria-invalid={!!errors.email} {...form.register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              className="h-11"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
            {login.isPending && <Spinner />}
            Sign in
          </Button>

          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <p className="mb-2">Demo accounts (password Password123!):</p>
            <ul className="space-y-1">
              {DEMO.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => {
                      form.setValue("email", d.email);
                      form.setFocus("password");
                    }}
                  >
                    <span className="font-medium text-foreground">{d.email}</span> — {d.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </form>
    </main>
  );
}
