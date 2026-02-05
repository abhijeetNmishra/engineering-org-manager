import React from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const AppLoader: React.FC = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Neutral light gradient
        }}>
            <div className="glass-card" style={{
                padding: '48px 80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
            }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
                <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: 18, color: '#555' }}>Shipt Org Manager</Text>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Loading organization data...</Text>
                    </div>
                </div>
            </div>
        </div>
    );
};
