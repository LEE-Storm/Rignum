import { LegalDocPage } from "../../components/Legal/LegalDocPage";
import doc from "../../content/legal/disclaimer.en.json";

export default function DisclaimerPage() {
  return <LegalDocPage doc={doc} />;
}
