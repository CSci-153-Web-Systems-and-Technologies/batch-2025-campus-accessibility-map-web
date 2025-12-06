"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CookieConsentTooltip } from "@/components/CookieConsentModal";

export function AuthForm({
  className,
  defaultMode = "signin",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { defaultMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      if (rememberMe) {
        document.cookie = `remember_me=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } else {
        document.cookie = `remember_me=false; path=/; max-age=0; SameSite=Lax`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      document.cookie = `remember_me=; path=/; max-age=0`;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      });
      if (error) throw error;
      router.push("/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = mode === "signin";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="text-2xl text-center">
            {isSignIn ? "Welcome" : "Create a new account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          <form onSubmit={isSignIn ? handleSignIn : handleSignUp}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {!isSignIn && (
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {isSignIn && (
                <div className="flex items-center justify-between">
                  <div 
                    className="relative flex items-center space-x-2"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                    <CookieConsentTooltip
                      isOpen={showTooltip}
                    />
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (isSignIn ? "Signing in..." : "Creating account...") 
                  : (isSignIn ? "Sign in" : "Sign up")
                }
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {isSignIn ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setPassword("");
                      setRepeatPassword("");
                    }}
                    className="underline underline-offset-4 hover:no-underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setRepeatPassword("");
                    }}
                    className="underline underline-offset-4 hover:no-underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

