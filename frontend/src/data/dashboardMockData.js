export const kpiCardsData = [
  {
    id: 'total-stock',
    title: 'Tổng tồn kho',
    value: '245.680 kg',
    trend: '+12%',
    trendText: 'so với tuần trước',
    trendType: 'positive',
    iconName: 'Boxes',
    colorScheme: 'blue',
  },
  {
    id: 'import-today',
    title: 'Phiếu nhập hôm nay',
    value: '12',
    trend: '+33%',
    trendText: 'so với hôm qua',
    trendType: 'positive',
    iconName: 'Download',
    colorScheme: 'green',
  },
  {
    id: 'export-today',
    title: 'Phiếu xuất hôm nay',
    value: '8',
    trend: '+14%',
    trendText: 'so với hôm qua',
    trendType: 'positive',
    iconName: 'Upload',
    colorScheme: 'orange',
  },
  {
    id: 'expiring-lots',
    title: 'Lô sắp hết hạn',
    value: '6',
    trend: '+2',
    trendText: 'so với tuần trước',
    trendType: 'negative',
    iconName: 'Clock',
    colorScheme: 'red',
  },
  {
    id: 'low-stock-alerts',
    title: 'Cảnh báo tồn thấp',
    value: '8',
    trend: '+3',
    trendText: 'so với tuần trước',
    trendType: 'negative',
    iconName: 'AlertTriangle',
    colorScheme: 'amber',
  },
];

export const weeklyInOutData = [
  { date: '01/08', importQty: 1700, exportQty: 11000 },
  { date: '02/08', importQty: 19000, exportQty: 13000 },
  { date: '03/08', importQty: 22000, exportQty: 17000 },
  { date: '04/08', importQty: 1100, exportQty: 9000 },
  { date: '05/08', importQty: 24000, exportQty: 17000 },
  { date: '06/08', importQty: 35000, exportQty: 20000 },
  { date: '07/08', importQty: 2600, exportQty: 14000 },
];

export const stockStructureData = [
  { name: 'Nguyên liệu', value: 142500, percentage: 58, formattedValue: '142.500 kg', color: '#2563eb' },
  { name: 'Thành phẩm', value: 89200, percentage: 36, formattedValue: '89.200 kg', color: '#10b981' },
  { name: 'Hàng lỗi / Trả về', value: 13980, percentage: 6, formattedValue: '13.980 kg', color: '#f43f5e' },
];

export const inventoryTrendData = [
  { month: 'T2/2024', stock: 160000 },
  { month: 'T3/2024', stock: 190000 },
  { month: 'T4/2024', stock: 230000 },
  { month: 'T5/2024', stock: 225000 },
  { month: 'T6/2024', stock: 260000 },
  { month: 'T7/2024', stock: 245680 },
];

export const lowStockMaterialsData = [
  { code: 'NL-PP-001', name: 'Hạt nhựa PP', currentStock: '1.200 kg', minStock: '2.000 kg', status: 'Sắp hết' },
  { code: 'NL-PE-002', name: 'Hạt nhựa PE', currentStock: '800 kg', minStock: '1.500 kg', status: 'Sắp hết' },
  { code: 'NL-MA-003', name: 'Chất màu trắng', currentStock: '150 kg', minStock: '500 kg', status: 'Sắp hết' },
  { code: 'NL-AD-004', name: 'Phụ gia chống dính', currentStock: '80 kg', minStock: '300 kg', status: 'Sắp hết' },
  { code: 'NL-ST-005', name: 'Hạt nhựa PET', currentStock: '600 kg', minStock: '1.000 kg', status: 'Sắp hết' },
];

export const expiringLotsData = [
  { code: 'LOT-PP-240801', item: 'Hạt nhựa PP', expiryDate: '15/08/2024', daysLeft: 8, status: 'Sắp hết hạn' },
  { code: 'LOT-PE-240725', item: 'Hạt nhựa PE', expiryDate: '18/08/2024', daysLeft: 11, status: 'Sắp hết hạn' },
  { code: 'LOT-AD-240718', item: 'Phụ gia chống dính', expiryDate: '20/08/2024', daysLeft: 13, status: 'Sắp hết hạn' },
  { code: 'LOT-MA-240722', item: 'Chất màu trắng', expiryDate: '25/08/2024', daysLeft: 18, status: 'Cần theo dõi' },
  { code: 'LOT-ST-240701', item: 'Hạt nhựa PET', expiryDate: '28/08/2024', daysLeft: 21, status: 'Cần theo dõi' },
];

export const todayActivitiesData = [
  {
    id: 'act-1',
    code: 'PNK-NL-025',
    description: 'Nhập kho 5.000 kg hạt nhựa PP - Lô PP240807-01',
    time: '10:24',
    user: 'Trần Văn Minh',
    iconName: 'Download',
    colorScheme: 'blue',
  },
  {
    id: 'act-2',
    code: 'PXK-NL-018',
    description: 'Xuất kho 2.000 kg hạt nhựa PE cho SX - Lệnh SX0123',
    time: '09:15',
    user: 'Lê Thị Hương',
    iconName: 'Upload',
    colorScheme: 'green',
  },
  {
    id: 'act-3',
    code: 'QC-NL-109',
    description: 'Hoàn thành kiểm tra chất lượng - Lô PE240806-02',
    time: '08:45',
    user: 'Nguyễn Văn Nam',
    iconName: 'ShieldCheck',
    colorScheme: 'purple',
  },
  {
    id: 'act-4',
    code: 'KK-TH-001',
    description: 'Kiểm kê định kỳ khu vực kho thành phẩm - Ca 1',
    time: '08:20',
    user: 'Phạm Thị Mai',
    iconName: 'ClipboardCheck',
    colorScheme: 'orange',
  },
  {
    id: 'act-5',
    code: 'PNK-TP-012',
    description: 'Nhập kho 1.200 sản phẩm thành phẩm - Lô TP240807-01',
    time: '07:50',
    user: 'Hoàng Quốc Bảo',
    iconName: 'PackageCheck',
    colorScheme: 'blue',
  },
];

export const warehouseCapacityData = [
  {
    id: 'raw-mat',
    title: 'Kho nguyên liệu',
    used: 85200,
    total: 120000,
    unit: 'kg',
    percentage: 72,
    color: 'blue',
    iconName: 'Warehouse',
  },
  {
    id: 'fg',
    title: 'Kho thành phẩm',
    used: 44800,
    total: 80000,
    unit: 'kg',
    percentage: 56,
    color: 'emerald',
    iconName: 'Building2',
  },
  {
    id: 'defective',
    title: 'Kho lỗi / Trả về',
    used: 3500,
    total: 10000,
    unit: 'kg',
    percentage: 35,
    color: 'rose',
    iconName: 'AlertTriangle',
  },
];
