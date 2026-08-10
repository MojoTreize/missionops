import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Réinitialisation — MissionOps" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          Lien de réinitialisation incomplet ou expiré.
        </p>
        <Link href="/forgot-password" className="text-sm text-field hover:underline">
          Refaire une demande
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
