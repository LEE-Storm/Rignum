import { LegalDocPage } from "@/components/Legal/LegalDocPage";
import doc from "@/content/legal/privacy.en.json";

export default function PrivacyPage() {
  return <LegalDocPage doc={doc} />;
}
