import { AppShell } from "../../components/layout/AppShell";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { UserPreferenceForm } from "../../components/settings/UserPreferenceForm";
import { PreferenceSummary } from "../../components/settings/PreferenceSummary";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <SectionHeader
          eyebrow="User preference"
          title="사용자 맞춤 설정"
          description="캐릭터의 성격과 말투는 유지하고, 사용자의 이해 수준에 맞게 표현 난이도와 설명 방식을 조절합니다."
        />
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <UserPreferenceForm />
          <PreferenceSummary />
        </div>
      </div>
    </AppShell>
  );
}
