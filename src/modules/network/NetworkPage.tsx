import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/data/store';
import { NET, REGION_NAME } from '@/data/vocab';
import { PageTitle } from '@/components/PageTitle';
import { NodesTable } from '@/components/NodesTable';
import { NodeMap } from '@/components/NodeMap';
import { Button } from '@/components/ui/button';
import { StandUpDialog } from './StandUpDialog';

/** SPEC.md § 6.5 – map of all nodes, the nodes table with Lead and Place, and "+ Stand up node". */
export function NetworkPage() {
  const nodes = useStore((s) => s.nodes);
  const clock = useStore((s) => s.clock);
  const ehrOutage = useStore((s) => s.ehrOutage);
  const ehrOutageSince = useStore((s) => s.ehrOutageSince);
  const navigate = useNavigate();
  const [standingUp, setStandingUp] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title={NET.title} scope={REGION_NAME} />
        <Button variant="tertiary" onClick={() => setStandingUp(true)}>
          {NET.standUp}
        </Button>
      </div>
      <div className="h-[360px] overflow-hidden rounded-lg border border-border">
        <NodeMap nodes={nodes} onSelect={(id) => navigate(`/network/${id}`)} />
      </div>
      <NodesTable nodes={nodes} clock={clock} outage={{ ehrOutage, ehrOutageSince }} extended />
      <StandUpDialog open={standingUp} onOpenChange={setStandingUp} />
    </div>
  );
}
