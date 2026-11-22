const fs = require('node:fs'),
	path = require('node:path');
for (const name of ['api_contract.yaml', 'runtime_api.json']) {
	const file = path.resolve(__dirname, '../../docs', name),
		api = JSON.parse(fs.readFileSync(file, 'utf8'));
	const root = name === 'runtime_api.json' ? '/api/v1' : '';
	const operation = structuredClone(
		api.paths[root + '/material-requests/{id}/issue-suggestions']
	);
	const get = operation.get;
	get.operationId = 'issues.saleSuggestions';
	get.summary = 'Gợi ý phân bổ thành phẩm giao hàng theo FEFO';
	get.description =
		'Chỉ đọc cho đơn hàng xác nhận/đang giao và kho trong phạm vi issues.allocate; gợi ý mọi dòng còn cần xuất theo đơn vị cơ sở, trừ phần đã xuất/giữ, chia nhiều lô/vị trí theo cùng thứ tự FEFO của xác nhận. Không tạo phiếu, giữ hoặc trừ tồn. Lưu/xác nhận/ghi sổ vẫn kiểm lại quota, QC, FEFO và tồn trong transaction.';
	const data = get.responses['200'].content['application/json'].schema.properties.data.properties;
	data.orderId = data.requestId;
	delete data.requestId;
	data.lines.items.properties.lotKind.enum = ['PRODUCT'];
	const shortage = data.shortages.items.properties;
	shortage.productCode = shortage.materialCode;
	delete shortage.materialCode;
	shortage.productName = shortage.materialName;
	delete shortage.materialName;
	api.paths[root + '/orders/{id}/issue-suggestions'] = operation;
	fs.writeFileSync(file, JSON.stringify(api, null, 2) + '\n');
}
console.log('Sale FEFO issue suggestions contract synchronized.');
