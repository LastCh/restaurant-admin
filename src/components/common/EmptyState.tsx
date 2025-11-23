import { Empty } from 'antd';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = 'Данные отсутствуют' }) => (
  <Empty description={message} />
);

export default EmptyState;
