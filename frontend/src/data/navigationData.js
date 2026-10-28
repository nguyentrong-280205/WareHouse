export const navigationSections = [
  {
    items: [
      { id: 'home', label: 'Trang chủ', path: '/', iconName: 'Home' },
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', iconName: 'LayoutDashboard' },
      { id: 'orders', label: 'Đơn hàng', path: '/orders', iconName: 'FileText' },
      { id: 'production-plans', label: 'Kế hoạch sản xuất', path: '/production-plans', iconName: 'Calendar' },
      { id: 'workshop-assignments', label: 'Phân công xưởng', path: '/workshop-assignments', iconName: 'Users' },
      { id: 'purchases', label: 'Đơn mua nguyên liệu', path: '/purchases', iconName: 'FileText' },
      { id: 'material-requests', label: 'Yêu cầu cấp nguyên liệu', path: '/material-requests', iconName: 'FileText' },
      { id: 'product-requests', label: 'Yêu cầu nhập thành phẩm', path: '/product-requests', iconName: 'FileText' },
    ],
  },
  {
    items: [
      { id: 'materials-catalog', label: 'Danh mục nguyên liệu', path: '/materials/catalog', iconName: 'Boxes' },
      { id: 'products-catalog', label: 'Danh mục thành phẩm', path: '/finished-goods/catalog', iconName: 'PackageCheck' },
      { id: 'materials-receipts', label: 'Nhập kho nguyên liệu', path: '/materials/receipts', iconName: 'Download' },
      { id: 'materials-issues', label: 'Xuất kho nguyên liệu', path: '/materials/issues', iconName: 'Upload' },
      { id: 'materials-qc', label: 'QC nguyên liệu', path: '/materials/qc', iconName: 'ShieldCheck' },
      { id: 'material-deliveries', label: 'Giao nguyên liệu từ NCC', path: '/material-deliveries', iconName: 'Download' },
    ],
  },
  {
    items: [
      { id: 'finished-goods-receipts', label: 'Nhập kho thành phẩm', path: '/finished-goods/receipts', iconName: 'PackageCheck' },
      { id: 'finished-goods-issues', label: 'Xuất kho thành phẩm', path: '/finished-goods/issues', iconName: 'PackageMinus' },
      { id: 'inventory-counts', label: 'Kiểm kê kho', path: '/inventory-counts', iconName: 'ClipboardCheck' },
      { id: 'product-qc', label: 'QC thành phẩm', path: '/finished-goods/qc', iconName: 'ShieldCheck' },
      { id: 'deliveries', label: 'Giao hàng thành công', path: '/deliveries', iconName: 'PackageCheck' },
    ],
  },
  {
    items: [
      { id: 'lots', label: 'Lô hàng', path: '/lots', iconName: 'Boxes' },
      { id: 'storage-locations', label: 'Vị trí lưu kho', path: '/storage-locations', iconName: 'MapPin' },
      { id: 'reports', label: 'Báo cáo & Cảnh báo', path: '/reports', iconName: 'BarChart3' },
      { id: 'inventory', label: 'Tra cứu tồn và sổ kho', path: '/inventory', iconName: 'Boxes' },
      { id: 'alert-rules', label: 'Cấu hình cảnh báo', path: '/reports/alert-rules', iconName: 'BarChart3' },
    ],
  },
  {
    items: [
      { id: 'return-requests', label: 'Yêu cầu trả hàng', path: '/returns/requests', iconName: 'FileText' },
      { id: 'return-receptions', label: 'Tiếp nhận hàng trả', path: '/returns/receptions', iconName: 'Download' },
      { id: 'return-qc', label: 'QC hàng trả', path: '/returns/qc', iconName: 'ShieldCheck' },
      { id: 'return-receipts', label: 'Nhập hàng trả đạt', path: '/returns/receipts', iconName: 'PackageCheck' },
      { id: 'unknown-returns', label: 'Hàng chưa định danh', path: '/returns/unidentified', iconName: 'Boxes' },
      { id: 'rejected-receipts', label: 'Tiếp nhận hàng lỗi', path: '/returns/rejected-receipts', iconName: 'Download' },
      { id: 'dispositions', label: 'Xử lý lỗi / tái xử lý', path: '/returns/dispositions', iconName: 'ClipboardCheck' },
      { id: 'users', label: 'Người dùng', path: '/users', iconName: 'User' },
    ],
  },
];
