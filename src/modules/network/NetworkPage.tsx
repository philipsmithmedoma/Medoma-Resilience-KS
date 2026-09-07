import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/data/store';
import { CAP, NET, REGION_NAME } from '@/data/vocab';
import { PageTitle } from '@/components/PageTitle';
import { NodesTable } from '@/components/NodesTable';
import { NodeMap } from '@/components/NodeMap';
import { Button } from '@/components/ui/button';
import { StandUpDialog } from './StandUpDialog';

/** SPEC.md § 6.9 – map of all nodes, the nine-column nodes table and "Etablera nod". */
export function NetworkPage() {
  const nodes = useStore((s) => s.nodes);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const navigate = useNavigate();
  const [standingUp, setStandingUp] = useState(false);
  const scenario = useStore((s) => s.scenario);
  const openScenarioPanel = useStore((s) => s.openScenarioPanel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title={NET.title} scope={REGION_NAME} />
        <div className="flex items-center gap-4">
          <Button variant="tertiary" onClick={() => setStandingUp(true)}>
            {NET.standUp}
          </Button>
          <Button variant="secondary" onClick={() => openScenarioPanel(scenario?.key ?? null)}>
            {CAP.scenario}
          </Button>
        </div>
      </div>
      <div className="h-[400px] overflow-hidden rounded-lg border border-border">
        <NodeMap nodes={nodes} onSelect={(id) => navigate(`/natverk/${id}`)} />
      </div>
      <NodesTable nodes={nodes} clock={clock} outage={{ ehrOutage, ehrOutageSince }} />
      <StandUpDialog open={standingUp} onOpenChange={setStandingUp} />
    </div>
  );
}
