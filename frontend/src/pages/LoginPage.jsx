import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Boxes, Eye, EyeOff, Info, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import warehousePhoto from '../assets/login-warehouse.webp';
import './LoginPage.css';

const usernameKey = 'wms.login.username';
const usernamePattern = /^[a-z0-9][a-z0-9_.-]{0,99}$/;

function storedUsername() {
	try {
		const value = window.localStorage.getItem(usernameKey) ?? '';
		return usernamePattern.test(value) ? value : '';
	} catch {
		return '';
	}
}

function saveUsername(value) {
	try {
		if (value) window.localStorage.setItem(usernameKey, value);
		else window.localStorage.removeItem(usernameKey);
	} catch {
		// Browser storage can be unavailable in private or managed environments.
	}
}

export default function LoginPage() {
	const { session, loading, login, error: connectionError, refresh } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState(storedUsername);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberUsername, setRememberUsername] = useState(() => Boolean(username));
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	if (session) return <Navigate to="/" replace />;
	async function submit(event) {
		event.preventDefault();
		if (busy || loading) return;
		const loginName = username.trim().toLowerCase();
		const simpleDemo = [
			'khach01',
			'kehoach01',
			'muahang01',
			'giamdoc01',
			'quanlykho01',
			'nhanvienkho01',
			'qc01',
			'xuong01',
			'kiemke01',
			'uc01.staff',
			'nguyentrong',
			'vuthinh',
			'truongthinh'
		].includes(loginName);
		if (
			!usernamePattern.test(loginName) ||
			Array.from(password).length < (simpleDemo ? 6 : 12) ||
			Array.from(password).length > 128
		) {
			setError(
				simpleDemo
					? 'Kiểm tra tên đăng nhập và mật khẩu demo (6–128 ký tự).'
					: 'Kiểm tra tên đăng nhập và mật khẩu (12–128 ký tự).'
			);
			return;
		}
		setBusy(true);
		setError('');
		try {
			await login(loginName, password);
			saveUsername(rememberUsername ? loginName : '');
			setPassword('');
			navigate('/', { replace: true });
		} catch (err) {
			setPassword('');
			const remaining = Number(err.response?.headers?.['retry-after']);
			setError(
				err.response?.status === 429
					? Number.isFinite(remaining) && remaining > 0
						? `Đăng nhập tạm khóa. Vui lòng thử lại sau ${remaining} giây.`
						: 'Đăng nhập tạm khóa. Vui lòng thử lại sau.'
					: err.response?.status === 401
						? 'Tên đăng nhập hoặc mật khẩu không hợp lệ, hoặc tài khoản không khả dụng.'
						: 'Không thể đăng nhập. Vui lòng thử lại.'
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<main className="login-page">
			<section className="login-panel" aria-labelledby="login-title">
				<div className="login-shell">
					<header className="login-brand">
						<span className="login-brand-icon">
							<Box aria-hidden="true" />
						</span>
						<div>
							<p className="login-brand-name">WMS Nhà Máy</p>
							<p className="login-brand-description">Quản lý kho toàn diện</p>
						</div>
					</header>
					<h1 id="login-title">Đăng nhập hệ thống</h1>
					<p className="login-intro">Vui lòng nhập thông tin tài khoản để tiếp tục.</p>
					{connectionError && (
						<div role="alert" className="login-error">
							{connectionError}{' '}
							<button type="button" className="login-link" onClick={refresh}>
								Thử lại
							</button>
						</div>
					)}
					<form onSubmit={submit} className="login-form">
						<div className="login-field">
							<label htmlFor="username">
								<UserRound aria-hidden="true" />
								Tên đăng nhập
							</label>
							<input
								id="username"
								name="username"
								autoComplete="username"
								autoCapitalize="none"
								placeholder="Nhập tên đăng nhập"
								spellCheck={false}
								required
								maxLength={100}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={busy || loading}
							/>
						</div>
						<div className="login-field">
							<label htmlFor="password">
								<LockKeyhole aria-hidden="true" />
								Mật khẩu
							</label>
							<div className="login-password">
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									placeholder="Nhập mật khẩu"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={busy || loading}
								/>
								<button
									type="button"
									className="login-password-toggle"
									aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
									aria-controls="password"
									onClick={() => setShowPassword((shown) => !shown)}
								>
									{showPassword ? (
										<EyeOff aria-hidden="true" />
									) : (
										<Eye aria-hidden="true" />
									)}
								</button>
							</div>
						</div>
						<label className="login-remember">
							<input
								type="checkbox"
								checked={rememberUsername}
								disabled={busy || loading}
								onChange={(e) => {
									setRememberUsername(e.target.checked);
									if (!e.target.checked) saveUsername('');
								}}
							/>
							Ghi nhớ tên đăng nhập
						</label>
						{error && (
							<p role="alert" className="login-error">
								{error}
							</p>
						)}
						<button type="submit" disabled={busy || loading} className="login-submit">
							<LogIn aria-hidden="true" />
							{busy
								? 'Đang đăng nhập…'
								: loading
									? 'Đang kiểm tra phiên…'
									: 'Đăng nhập'}
						</button>
					</form>
					<footer className="login-help">
						<Info aria-hidden="true" />
						<p>Liên hệ quản trị viên nếu bạn cần hỗ trợ tài khoản.</p>
					</footer>
				</div>
			</section>
			<section
				className="login-hero"
				aria-labelledby="login-topic"
				style={{ '--login-warehouse-photo': `url("${warehousePhoto}")` }}
			>
				<header className="login-hero-brand">
					<Boxes aria-hidden="true" />
					<div>
						<p className="login-brand-name">WMS Nhà Máy</p>
						<p className="login-brand-description">Hệ thống quản lý kho</p>
					</div>
				</header>
				<h2 id="login-topic">
					Hệ thống quản lý kho cho nhà máy sản xuất nước ngọt đóng chai/lon
				</h2>
			</section>
		</main>
	);
}
