import { Link } from 'react-router-dom';
import { PageTitle } from './PageTitle';
import { LABELS } from '@/data/vocab';

interface StubPageProps {
  title: string;
  sentence: string;
  linkTo?: string;
  linkLabel?: string;
}

export function StubPage({ title, sentence, linkTo, linkLabel }: StubPageProps) {
  return (
    <div className="space-y-4">
      <PageTitle title={title} />
      <p>{sentence}</p>
      {linkTo ? (
        <Link to={linkTo} className="text-primary hover:text-primary-hover hover:underline">
          {linkLabel ?? LABELS.goToCommandCenter}
        </Link>
      ) : null}
    </div>
  );
}
