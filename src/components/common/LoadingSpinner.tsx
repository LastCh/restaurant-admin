import { Spin } from 'antd';

export const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" />
  </div>
);

export default LoadingSpinner;
