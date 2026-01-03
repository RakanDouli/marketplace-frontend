import { Loading } from '@/components/slices';

export default function MessagesLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      padding: 'var(--space-xl) 0'
    }}>
      <Loading type="svg" />
    </div>
  );
}
