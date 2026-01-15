import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigate, useSubmit, useActionData, useNavigation } from "react-router";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  Box,
  Select,
  Banner,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import { ComplianceService } from "../modules/Core";
import { z } from "zod";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";

const PetProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  breed: z.string().min(1, "Breed is required"),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const id = params.id;

  // Security & Compliance Gating
  const complianceSettings = await ComplianceService.getSettings(session.shop);
  const s = session as any;
  if (s.collaborator && complianceSettings.limitCollaboratorAccess) {
    throw new Response("Forbidden: Collaborator access restricted", { status: 403 });
  }

  // Audit Logging
  await ComplianceService.logAccess({
    shop: session.shop,
    userId: s.userId || undefined,
    userName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Unknown",
    action: "VIEW_PET_PROFILE_DETAIL",
    resourceId: id,
  });

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const [profile, settings] = await Promise.all([
    PetProfileService.getProfile(session.shop, id),
    PetProfileService.getSettings(session.shop)
  ]);

  if (!profile) {
    throw new Response("Not Found", { status: 404 });
  }

  return data({ profile, settings });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const id = params.id;

  // Security & Compliance Gating
  const complianceSettings = await ComplianceService.getSettings(session.shop);
  const s = session as any;
  if (s.collaborator && complianceSettings.limitCollaboratorAccess) {
    throw new Response("Forbidden: Collaborator access restricted", { status: 403 });
  }

  if (!id) {
    return data({ error: "Missing ID" }, { status: 400 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const breed = formData.get("breed") as string;

  try {
    const validated = PetProfileUpdateSchema.parse({ name, type, breed });
    await PetProfileService.updateProfile(session.shop, id, validated);
    return data({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return data({ error: err.issues[0].message, success: false }, { status: 400 });
    }
    return data({ error: "Failed to update profile", success: false }, { status: 500 });
  }
};

export default function EditPetProfile() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage />;
  }

  if (!data) return null;
  const { profile, settings } = data;
  const actionData = useActionData<{ success?: boolean; error?: string }>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [name, setName] = useState(profile.name);
  const [type, setType] = useState(profile.type);
  const [breed, setBreed] = useState(profile.breed);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const petTypes = settings.types.map((t) => ({ label: t.label, value: t.id }));
  const breeds = settings.types.find((t) => t.id === type)?.breeds.map((b) => ({ label: b, value: b })) || [];

  const handleSave = () => {
    submit({ name, type, breed }, { method: "post" });
  };

  return (
    <Page
      title={`Edit ${profile.name}`}
      backAction={{ content: "Pet Profiles", onAction: () => navigate("/app/pet-profiles-admin") }}
      primaryAction={{ content: "Save", onAction: handleSave }}
    >
      <Layout>
        <Layout.Section>
          {isSaved && (
            <Box paddingBlockEnd="400">
              <Banner title="Profile updated successfully" tone="success" />
            </Box>
          )}
          {actionData?.error && (
            <Box paddingBlockEnd="400">
              <Banner title={actionData.error} tone="critical" />
            </Box>
          )}
          <Card>
            <BlockStack gap="400">
              <TextField
                label="Pet Name"
                value={name}
                onChange={setName}
                autoComplete="off"
              />
              <Select
                label="Pet Type"
                options={petTypes}
                value={type}
                onChange={(val) => {
                  setType(val);
                  setBreed(""); // Reset breed when type changes
                }}
              />
              <Select
                label="Breed"
                options={[{ label: "Select a breed", value: "" }, ...breeds]}
                value={breed}
                onChange={setBreed}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
