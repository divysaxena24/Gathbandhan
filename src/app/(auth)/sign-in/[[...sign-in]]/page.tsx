import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-charcoal">
          Sign In to Workspace
        </h1>
        <p className="mt-1 text-sm text-charcoal-400">
          Enter your agency credentials to access Gathbandhan
        </p>
      </div>
      <div className="flex justify-center">
        <SignIn
          appearance={{
            elements: {
              card: "shadow-lg border border-border bg-card",
              primaryButton: "bg-charcoal text-ivory hover:bg-charcoal-700",
            },
          }}
        />
      </div>
    </div>
  );
}

