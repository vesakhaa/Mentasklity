import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.onboardingDone) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <OnboardingWizard
        initialFullName={user.fullName ?? ""}
        initialUniversity={user.university ?? ""}
        initialMajor={user.major ?? ""}
      />
    </div>
  );
}
