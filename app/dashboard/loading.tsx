import { Loading } from '@/components/slices';
import sharedStyles from '@/components/dashboard/SharedDashboardPanel.module.scss';

export default function DashboardLoading() {
  return (
    <div className={sharedStyles.loadingState}>
      <Loading type="svg" />
    </div>
  );
}
