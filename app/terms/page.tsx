import { LegalDocPage } from "@/components/Legal/LegalDocPage";
import doc from "@/content/legal/terms.en.json";

export default function TermsPage() {
  return <LegalDocPage doc={doc} />;
}
