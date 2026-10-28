import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import EmptyState from '../components/common/EmptyState';
import { Construction } from 'lucide-react';

function PlaceholderPage({ title = 'Chức năng WMS' }) {
  return (
    <AppLayout title={title} subtitle="Màn hình thuộc hệ thống WMS Nhà Máy">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs">
        <EmptyState
          icon={Construction}
          title="Chức năng đang được phát triển"
          description={`Màn hình "${title}" đang trong quá trình hoàn thiện. Bạn có thể quay lại Trang chủ hoặc Dashboard để tiếp tục trải nghiệm.`}
        />
      </div>
    </AppLayout>
  );
}

export default PlaceholderPage;
