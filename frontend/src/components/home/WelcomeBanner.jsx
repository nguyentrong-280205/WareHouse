import React from 'react';
import { welcomeBannerData } from '../../data/homeMockData';

function WelcomeBanner({ data = welcomeBannerData }) {
	return (
		<section className="wms-panel space-y-1 px-4 py-3">
			<h2 className="wms-section-title">WMS Nhà Máy</h2>
			<p className="max-w-prose text-sm text-slate-600">{data.subtitle}</p>
		</section>
	);
}

export default WelcomeBanner;
