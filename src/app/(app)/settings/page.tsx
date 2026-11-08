import { formatPhoneDisplay } from "@/lib/phone";
import { requireUser } from "@/lib/session";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <SettingsClient
      phoneDisplay={formatPhoneDisplay(user.phone)}
      initialFullName={user.fullName ?? ""}
      initialUniversity={user.university ?? ""}
      initialMajor={user.major ?? ""}
      initialTelegramConnected={Boolean(
        user.telegramChatId && user.telegramLinkedAt
      )}
    />
  );
}
