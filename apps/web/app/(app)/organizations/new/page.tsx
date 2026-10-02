import { getT } from "@/lib/i18n/server";

import { CreateOrganisationForm } from "./create-organisation-form";

export default async function NewOrganisationPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("organizations.new.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("organizations.new.description")}</p>
      </div>
      <CreateOrganisationForm />
    </div>
  );
}
