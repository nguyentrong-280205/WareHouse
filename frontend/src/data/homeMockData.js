export const welcomeBannerData = {
  greeting: 'Chào mừng đến với',
  title: 'Hệ thống Quản lý Kho Nhà Máy',
  subtitle: 'Quản lý nhập kho, xuất kho, tồn kho, QC và kiểm kê một cách hiệu quả, minh bạch và chính xác, phục vụ sản xuất liên tục.',
  ctaText: 'Đồng hành cùng nhà máy vận hành hiệu quả hơn mỗi ngày',
  quote: '“Kiểm soát tốt kho hàng là nền tảng của sản xuất bền vững”',
};

export const quickActionsData = [
  {
    id: 'import',
    title: 'Tạo phiếu nhập kho',
    subtitle: 'Nhập kho nguyên liệu, vật tư',
    path: '/materials/receipts',
    iconName: 'Download',
    colorScheme: 'blue',
  },
  {
    id: 'export',
    title: 'Tạo phiếu xuất kho',
    subtitle: 'Xuất kho cho sản xuất, xuất bán',
    path: '/materials/issues',
    iconName: 'Upload',
    colorScheme: 'green',
  },
  {
    id: 'audit',
    title: 'Kiểm kê nhanh',
    subtitle: 'Tạo phiếu kiểm kê kho',
    path: '/inventory-counts',
    iconName: 'ClipboardList',
    colorScheme: 'orange',
  },
  {
    id: 'alerts',
    title: 'Xem cảnh báo',
    subtitle: 'Tồn kho thấp, sắp hết hạn',
    path: '/reports',
    iconName: 'AlertTriangle',
    colorScheme: 'red',
  },
];

export const quickAccessData = [
  {
    id: 'raw-material-wh',
    title: 'Kho nguyên liệu',
    subtitle: 'Quản lý tồn kho nguyên liệu, vật tư',
    path: '/materials/receipts',
    iconName: 'Warehouse',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'finished-goods-wh',
    title: 'Kho thành phẩm',
    subtitle: 'Quản lý tồn kho thành phẩm',
    path: '/finished-goods/receipts',
    iconName: 'Building2',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'prod-orders',
    title: 'Kế hoạch đã duyệt',
    subtitle: 'Theo dõi kế hoạch và phân công xưởng',
    path: '/production-orders',
    iconName: 'Settings',
    iconBg: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'qc-check',
    title: 'Kiểm tra chất lượng',
    subtitle: 'Quản lý QC nguyên liệu và thành phẩm',
    path: '/materials/qc',
    iconName: 'ShieldCheck',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'lots-mgmt',
    title: 'Quản lý lô',
    subtitle: 'Theo dõi lô hàng, hạn sử dụng',
    path: '/lots',
    iconName: 'Package',
    iconBg: 'bg-rose-50 text-rose-600',
  },
  {
    id: 'inv-report',
    title: 'Báo cáo tồn kho',
    subtitle: 'Xem báo cáo chi tiết tồn kho',
    path: '/reports',
    iconName: 'BarChart2',
    iconBg: 'bg-cyan-50 text-cyan-600',
  },
];

export const recentActivitiesData = [
  {
    id: 'act-1',
    code: 'PNK-NL-025',
    actionText: 'đã được tạo',
    description: 'Nhập kho 5.000 kg Hạt nhựa PP - Lô NL-202408-01',
    time: '10:24',
    iconName: 'FileText',
    badgeColor: 'blue',
  },
  {
    id: 'act-2',
    code: 'PXK-NL-018',
    actionText: 'chờ duyệt',
    description: 'Xuất kho 2.000 kg Hóa chất phụ gia cho SX',
    time: '09:15',
    iconName: 'Upload',
    badgeColor: 'orange',
  },
  {
    id: 'act-3',
    code: 'QC TP lô TP-092',
    actionText: 'đạt',
    description: 'Hoàn thành kiểm tra chất lượng thành phẩm - Lô TP-092',
    time: 'Hôm qua 16:30',
    iconName: 'CheckCircle2',
    badgeColor: 'green',
  },
  {
    id: 'act-4',
    code: 'Cảnh báo:',
    actionText: '3 nguyên liệu sắp hết',
    description: 'PP, PE, Hóa chất tẩy rửa sắp hết tồn kho (≤ 5 ngày)',
    time: 'Hôm qua 14:12',
    iconName: 'AlertTriangle',
    badgeColor: 'red',
  },
];

export const notificationsData = [
  {
    id: 'notif-1',
    badge: 'Tồn thấp',
    badgeType: 'danger',
    title: 'Hạt nhựa PP',
    description: 'Tồn kho hiện tại: 450 kg (≤ 500 kg)',
    time: '10:20',
  },
  {
    id: 'notif-2',
    badge: 'Sắp hết hạn',
    badgeType: 'warning',
    title: 'Hóa chất phụ gia HC-01',
    description: 'Lô HC-01-2408 hết hạn sau 5 ngày',
    time: '08:45',
  },
  {
    id: 'notif-3',
    badge: 'Kiểm kê hôm nay',
    badgeType: 'info',
    title: 'Kế hoạch kiểm kê định kỳ',
    description: 'Khu vực kho nguyên liệu - Ca 2',
    time: 'Hôm nay',
  },
];
