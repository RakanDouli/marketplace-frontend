import { Loading } from '@/components/slices';

export default function SubscriptionsLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      padding: 'var(--space-xl) 0'
    }}>
      <Loading type="svg" />
    </div>
  );
}
