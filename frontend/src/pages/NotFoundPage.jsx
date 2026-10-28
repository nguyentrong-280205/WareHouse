import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import { AlertCircle, Home } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Trang không tồn tại">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-2xs flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">404 - không tìm thấy trang</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị di chuyển.
        </p>
        <Button icon={Home} onClick={() => navigate('/')}>
          Về Trang chủ
        </Button>
      </div>
    </AppLayout>
  );
}

export default NotFoundPage;
