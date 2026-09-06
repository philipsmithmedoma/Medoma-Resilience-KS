import { StubPage } from '@/components/StubPage';
import { LABELS } from '@/data/vocab';

/** SPEC.md § 8 – the five existing Medoma modules, rendered as stubs so the navigation is real. */
export function ExistingModuleStub({ title }: { title: string }) {
  return <StubPage title={title} sentence={LABELS.stubSentence} linkTo="/command-center" linkLabel={LABELS.goToCommandCenter} />;
}
