import { Loading } from '@/components/slices';
import Container from '@/components/slices/Container/Container';

export default function CategoryLoading() {
  return (
    <Container>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        padding: 'var(--space-xl) 0'
      }}>
        <Loading type="svg" />
      </div>
    </Container>
  );
}
