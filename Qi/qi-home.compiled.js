/* Generated from qi-home.jsx. Do not edit manually. */
const spb = {
  bg: 'oklch(0.165 0.013 265)',
  panel: 'oklch(0.205 0.014 265)',
  panel2: 'oklch(0.245 0.015 265)',
  ink: 'oklch(0.97 0.002 265)',
  sub: 'oklch(0.71 0.015 265)',
  faint: 'oklch(0.56 0.015 265)',
  line: 'oklch(0.31 0.014 265)',
  blue: 'oklch(0.72 0.15 242)',
  blueSoft: 'oklch(0.78 0.12 240)',
  violet: 'oklch(0.74 0.15 292)',
  glow: 'oklch(0.72 0.15 242 / 0.6)',
  disp: '"Space Grotesk", "Helvetica Neue", sans-serif',
  mono: '"Space Mono", monospace'
};
const MARKET_URL = typeof location !== 'undefined' && location.protocol === 'file:' ? 'http://127.0.0.1:8765/kpl?v=6' : 'https://market.dreamerqi.com';
const STANNING_URL = typeof location !== 'undefined' && location.protocol === 'file:' ? '#stanning' : 'https://stanning.dreamerqi.com';
const EXPLORE_URL = typeof location !== 'undefined' && location.protocol === 'file:' ? '#discover' : 'https://explore.dreamerqi.com';
const CHAT_URL = '#chat';
const ADMIN_URL = typeof location !== 'undefined' && location.protocol === 'file:' ? 'http://127.0.0.1:8765/admin' : '/admin';
const ADMIN_SERVER_BASE = typeof location !== 'undefined' && location.protocol === 'file:' ? 'http://127.0.0.1:8765' : '';
const ADMIN_TOKEN_STORAGE = 'panda_admin_token_v1';
const AUTH_USERS_KEY = 'qi_home_users_v1';
const AUTH_SESSION_KEY = 'qi_home_session_v1';
const SHARED_AUTH_TOKEN_COOKIE = 'panda_admin_token';
const SHARED_AUTH_SESSION_COOKIE = 'panda_account_session';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const SERVICE_EMAIL = 'service@dreamerqi.com';
const CHAT_PREVIEW_IMAGE = 'assets/chatter-cute-preview.png';
const HOME_PAGES = new Set(['home', 'discover', 'stanning', 'chat', 'about', 'contact', 'privacy', 'terms']);
function defaultHomePageForHost() {
  const host = String(typeof location !== 'undefined' && location.hostname || '').toLowerCase();
  if (host === 'stanning.dreamerqi.com') return 'stanning';
  if (host === 'explore.dreamerqi.com') return 'discover';
  return 'home';
}
function readJsonStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function writeJsonStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function isDreamerQiHost() {
  const host = String(typeof location !== 'undefined' && location.hostname || '').toLowerCase();
  return host === 'dreamerqi.com' || host.endsWith('.dreamerqi.com');
}
function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const row = String(document.cookie || '').split('; ').find(item => item.startsWith(prefix));
  if (!row) return '';
  try {
    return decodeURIComponent(row.slice(prefix.length));
  } catch {
    return row.slice(prefix.length);
  }
}
function writeCookie(name, value, maxAge = AUTH_COOKIE_MAX_AGE) {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(String(value || ''));
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  const domain = isDreamerQiHost() ? '; Domain=.dreamerqi.com' : '';
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`;
  if (!domain) document.cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}
function clearCookie(name) {
  writeCookie(name, '', 0);
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
function readSharedAuthToken() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE) || readCookie(SHARED_AUTH_TOKEN_COOKIE) || '';
}
function writeSharedAuthToken(token) {
  if (!token) return;
  localStorage.setItem(ADMIN_TOKEN_STORAGE, token);
  writeCookie(SHARED_AUTH_TOKEN_COOKIE, token);
}
function readSharedAccountSession(fallback = null) {
  const saved = readJsonStore(AUTH_SESSION_KEY, null);
  if (saved?.name) return saved;
  const raw = readCookie(SHARED_AUTH_SESSION_COOKIE);
  if (!raw) return fallback;
  try {
    const session = JSON.parse(raw);
    return session?.name ? session : fallback;
  } catch {
    return fallback;
  }
}
function writeSharedAccountSession(session) {
  if (!session?.name) return;
  const cleanSession = {
    name: session.name,
    admin: !!session.admin
  };
  writeJsonStore(AUTH_SESSION_KEY, cleanSession);
  writeCookie(SHARED_AUTH_SESSION_COOKIE, JSON.stringify(cleanSession));
}
function clearSharedAuthState() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE);
  localStorage.removeItem(AUTH_SESSION_KEY);
  clearCookie(SHARED_AUTH_TOKEN_COOKIE);
  clearCookie(SHARED_AUTH_SESSION_COOKIE);
}
function QiLogo({
  h = 38,
  animated = true,
  ink = spb.ink,
  orbit = spb.line,
  blue = spb.blue
}) {
  const w = h * 160 / 135;
  return React.createElement("svg", {
    width: w,
    height: h,
    viewBox: "0 0 160 135",
    fill: "none",
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, React.createElement("ellipse", {
    cx: "65",
    cy: "68",
    rx: "53.2",
    ry: "22",
    transform: "rotate(-28 65 68)",
    stroke: orbit,
    strokeWidth: "2.5"
  }), React.createElement("circle", {
    cx: "61",
    cy: "68",
    r: "30",
    stroke: ink,
    strokeWidth: "11",
    fill: "none"
  }), React.createElement("path", {
    d: "M78 84 L92 98",
    stroke: ink,
    strokeWidth: "11",
    strokeLinecap: "round"
  }), React.createElement("rect", {
    x: "106.5",
    y: "61",
    width: "11",
    height: "37",
    rx: "5.5",
    fill: ink
  }), animated ? React.createElement("g", {
    transform: "rotate(-28 65 68)"
  }, React.createElement("circle", {
    className: "qi-spark",
    r: "9",
    fill: blue
  })) : React.createElement("circle", {
    cx: "112",
    cy: "43",
    r: "9",
    fill: blue,
    style: {
      filter: `drop-shadow(0 0 6px ${spb.glow})`
    }
  }));
}
function SpbNavResponsive({
  user,
  page = 'home',
  onPage,
  onLogin,
  onRegister,
  onLogout
}) {
  const item = {
    fontSize: 15,
    color: spb.sub,
    textDecoration: 'none',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  };
  const navShell = {
    minHeight: 92,
    borderBottom: `1px solid ${spb.line}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 'clamp(16px, 3vw, 28px)',
    flexWrap: 'wrap',
    padding: '14px clamp(20px, 4vw, 56px)'
  };
  const navCenter = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: '0 1 auto',
    flexWrap: 'wrap',
    gap: 'clamp(18px, 2.4vw, 34px)',
    minWidth: 0
  };
  const rightDock = {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: '0 1 auto',
    flexWrap: 'wrap',
    gap: 12,
    minWidth: 0
  };
  const ghostButton = {
    border: `1px solid ${spb.line}`,
    background: 'oklch(0.205 0.014 265 / 0.58)',
    cursor: 'pointer',
    fontSize: 14.5,
    color: spb.sub,
    fontFamily: 'inherit',
    fontWeight: 600,
    padding: '9px 15px',
    borderRadius: 999,
    boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.06)'
  };
  const primaryButton = {
    border: 'none',
    cursor: 'pointer',
    fontSize: 14.5,
    fontWeight: 700,
    color: spb.bg,
    background: `linear-gradient(135deg, ${spb.blue}, ${spb.blueSoft})`,
    padding: '10px 18px',
    borderRadius: 999,
    fontFamily: 'inherit',
    boxShadow: `0 0 22px oklch(0.72 0.15 242 / 0.24)`
  };
  const accountPill = {
    minHeight: 44,
    maxWidth: 'min(360px, 100%)',
    flexWrap: 'wrap',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 8px 7px 14px',
    borderRadius: 999,
    border: `1px solid ${spb.line}`,
    background: 'oklch(0.205 0.014 265 / 0.72)',
    boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.08), 0 14px 34px rgba(0,0,0,0.20)',
    backdropFilter: 'blur(18px) saturate(150%)',
    WebkitBackdropFilter: 'blur(18px) saturate(150%)'
  };
  const avatar = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: spb.bg,
    background: `linear-gradient(135deg, ${spb.blue}, ${spb.violet})`,
    fontFamily: spb.disp,
    fontSize: 13,
    fontWeight: 800,
    flex: '0 0 auto'
  };
  const roleBadge = {
    fontSize: 12,
    color: spb.blueSoft,
    border: '1px solid oklch(0.72 0.15 242 / 0.42)',
    borderRadius: 999,
    padding: '4px 9px',
    whiteSpace: 'nowrap'
  };
  const pageLink = target => ({
    ...item,
    color: page === target ? spb.ink : spb.sub,
    fontWeight: page === target ? 700 : 500
  });
  const goPage = target => event => {
    if (!onPage) return;
    event.preventDefault();
    onPage(target);
  };
  return React.createElement("div", {
    style: navShell
  }, React.createElement("a", {
    href: "#",
    onClick: goPage('home'),
    style: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      minWidth: 0,
      flex: '0 0 auto'
    },
    "aria-label": "Qi home"
  }, React.createElement(QiLogo, {
    h: 82
  })), React.createElement("div", {
    style: navCenter
  }, React.createElement("a", {
    style: item,
    href: MARKET_URL
  }, "\u884C\u60C5"), React.createElement("a", {
    style: pageLink('stanning'),
    href: STANNING_URL
  }, "\u5A31\u4E50"), React.createElement("a", {
    style: pageLink('discover'),
    href: EXPLORE_URL
  }, "\u63A2\u7D22"), React.createElement("a", {
    style: pageLink('chat'),
    href: CHAT_URL,
    onClick: goPage('chat')
  }, "\u778E\u804A\u804A"), React.createElement("a", {
    style: pageLink('about'),
    href: "#about",
    onClick: goPage('about')
  }, "\u5173\u4E8E"), React.createElement("a", {
    style: pageLink('contact'),
    href: "#contact",
    onClick: goPage('contact')
  }, "\u8054\u7CFB")), React.createElement("div", {
    style: rightDock
  }, user ? React.createElement("div", {
    style: accountPill
  }, React.createElement("span", {
    style: avatar
  }, String(user.name || 'Q').slice(0, 1).toUpperCase()), React.createElement("span", {
    style: {
      fontSize: 15,
      color: spb.ink,
      maxWidth: 136,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontWeight: 650
    }
  }, user.name), React.createElement("span", {
    style: roleBadge
  }, user.admin ? '管理员' : '用户'), user.admin ? React.createElement("a", {
    href: ADMIN_URL,
    style: {
      ...item,
      color: spb.blueSoft
    }
  }, "\u540E\u53F0") : null, React.createElement("button", {
    type: "button",
    onClick: onLogout,
    style: {
      ...ghostButton,
      padding: '7px 12px',
      fontSize: 13.5
    }
  }, "\u9000\u51FA")) : React.createElement(React.Fragment, null, React.createElement("button", {
    type: "button",
    onClick: onLogin,
    style: ghostButton
  }, "\u767B\u5F55"), React.createElement("button", {
    type: "button",
    onClick: onRegister,
    style: primaryButton
  }, "\u6CE8\u518C"))));
}
function AuthModal({
  mode,
  setMode,
  onClose,
  onAuth
}) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailCode, setEmailCode] = React.useState('');
  const [resetCode, setResetCode] = React.useState('');
  const [resetPasswordValue, setResetPasswordValue] = React.useState('');
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';
  const authMessage = err => {
    const raw = String(err || '').toLowerCase();
    if (raw.includes('smtp not configured')) return '管理员还没有配置验证码发信邮箱，暂时不能发送验证码';
    if (raw.includes('email delivery failed') || raw.includes('smtp-error')) return '验证码邮件发送失败，请联系管理员检查发信邮箱配置';
    if (raw.includes('invalid username')) return '账号格式不正确，请使用 2-32 位账号';
    if (raw.includes('invalid email')) return '邮箱格式不正确';
    if (raw.includes('phone required')) return '请填写手机号';
    if (raw.includes('invalid phone')) return '手机号格式不正确';
    if (raw.includes('password must be at least')) return '密码至少 8 位';
    if (raw.includes('password cannot be only numbers')) return '密码不能是纯数字';
    if (raw.includes('password cannot be only letters')) return '密码不能是纯字母';
    if (raw.includes('username already exists')) return '这个账号已经被注册';
    if (raw.includes('email already exists')) return '这个邮箱已经被注册';
    if (raw.includes('phone already exists')) return '这个手机号已经被注册';
    if (raw.includes('email verification code required')) return '请填写邮箱验证码';
    if (raw.includes('invalid email verification code')) return '邮箱验证码不正确或已过期';
    if (raw.includes('invalid reset code')) return '验证码不正确或已过期';
    return String(err || '操作失败，请稍后重试');
  };
  const postAuth = async (path, payload) => {
    const res = await fetch(`${ADMIN_SERVER_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(authMessage(data.error || `HTTP ${res.status}`));
    if (data.delivery && data.delivery !== 'smtp') {
      throw new Error(authMessage(data.smtpConfigured ? 'email delivery failed' : 'smtp not configured'));
    }
    return data;
  };
  const cleanRegisterPayload = () => ({
    username: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password: password.trim()
  });
  const clearNotice = () => {
    setError('');
    setInfo('');
  };
  const switchMode = nextMode => {
    clearNotice();
    setMode(nextMode);
  };
  const requestRegisterCode = async () => {
    clearNotice();
    try {
      const data = await postAuth('/api/auth/register/request-code', cleanRegisterPayload());
      setInfo(`验证码已发送到邮箱，${data.expiresInMinutes || 15} 分钟内有效`);
    } catch (err) {
      setError(authMessage(err.message));
    }
  };
  const requestResetCode = async () => {
    clearNotice();
    try {
      await postAuth('/api/auth/password-reset/request', {
        email: email.trim().toLowerCase()
      });
      setInfo('如果邮箱存在，验证码已发送，请在 15 分钟内使用');
    } catch (err) {
      setError(authMessage(err.message));
    }
  };
  const submit = async event => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    if (isReset) {
      clearNotice();
      try {
        await postAuth('/api/auth/password-reset/confirm', {
          email: cleanEmail,
          code: resetCode.trim(),
          newPassword: resetPasswordValue
        });
        setInfo('密码已重置，请使用新密码登录');
        setName(cleanEmail);
        setPassword('');
        setResetCode('');
        setResetPasswordValue('');
        setMode('login');
      } catch (err) {
        setError(authMessage(err.message));
      }
      return;
    }
    if (!cleanName || !cleanPassword) {
      setError(isRegister ? '请输入账号、邮箱、手机和密码' : '请输入账号和密码');
      return;
    }
    if (isRegister && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('请输入有效邮箱');
      return;
    }
    if (isRegister && !/^\+?\d[\d\s-]{5,19}$/.test(cleanPhone)) {
      setError('请输入有效手机号');
      return;
    }
    try {
      const res = await fetch(`${ADMIN_SERVER_BASE}${isRegister ? '/api/auth/register' : '/api/auth/login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: cleanPassword,
          emailCode: emailCode.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(authMessage(data.error || `HTTP ${res.status}`));
      const user = data.user || {};
      const session = {
        name: user.username || data.username || cleanName,
        admin: !!data.admin || user.role === 'admin'
      };
      writeSharedAuthToken(data.token);
      writeSharedAccountSession(session);
      onAuth(session);
      onClose();
    } catch (err) {
      setError(`${isRegister ? '注册' : '登录'}失败：${authMessage(err.message)}`);
    }
    return;
  };
  const inputStyle = {
    width: '100%',
    height: 44,
    borderRadius: 11,
    border: `1px solid ${spb.line}`,
    outline: 'none',
    background: 'oklch(0.175 0.012 265)',
    color: spb.ink,
    padding: '0 14px',
    fontSize: 14.5,
    fontFamily: 'inherit'
  };
  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: spb.faint,
    marginBottom: 7,
    letterSpacing: '0.03em'
  };
  const fieldStyle = {
    display: 'grid',
    gap: 0
  };
  const formGridStyle = {
    display: 'grid',
    gap: 13,
    marginTop: 18,
    padding: 16,
    border: `1px solid ${spb.line}`,
    borderRadius: 16,
    background: 'oklch(0.18 0.012 265 / 0.72)'
  };
  const codeRowStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 118px',
    gap: 10,
    alignItems: 'end'
  };
  const secondaryButtonStyle = {
    height: 44,
    border: `1px solid ${spb.line}`,
    borderRadius: 11,
    background: 'oklch(0.205 0.014 265)',
    color: spb.ink,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'inherit'
  };
  const modeButtonStyle = active => ({
    flex: 1,
    height: 36,
    border: 'none',
    borderRadius: 10,
    background: active ? 'oklch(0.72 0.15 242 / 0.18)' : 'transparent',
    color: active ? spb.ink : spb.sub,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'inherit'
  });
  const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18
  };
  const primaryActionStyle = {
    minWidth: isReset ? 126 : isRegister ? 144 : 104,
    height: 44,
    border: 'none',
    borderRadius: 12,
    background: spb.blue,
    color: spb.bg,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: `0 12px 28px oklch(0.72 0.15 242 / 0.24)`
  };
  const modalTitle = isReset ? '重置密码' : isRegister ? '创建账号' : '登录 Qi';
  const modalDesc = isReset ? '输入邮箱验证码后设置新密码' : '用于 DreamerQi 全站的登录状态';
  return React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,0,0.58)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(16px)',
      padding: 16
    },
    onClick: onClose
  }, React.createElement("form", {
    onSubmit: submit,
    onClick: event => event.stopPropagation(),
    style: {
      width: 'min(452px, calc(100vw - 32px))',
      borderRadius: 22,
      border: `1px solid ${spb.line}`,
      background: 'linear-gradient(180deg, oklch(0.235 0.018 265 / 0.98), oklch(0.19 0.014 265 / 0.98))',
      padding: 28,
      boxShadow: '0 30px 90px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 18
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.disp,
      fontSize: 27,
      fontWeight: 600,
      color: spb.ink,
      letterSpacing: '-0.02em'
    }
  }, modalTitle), React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 13.5,
      color: spb.sub
    }
  }, modalDesc)), React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "\u5173\u95ED",
    style: {
      width: 34,
      height: 34,
      borderRadius: 17,
      border: `1px solid ${spb.line}`,
      background: 'transparent',
      color: spb.sub,
      cursor: 'pointer',
      fontSize: 22,
      lineHeight: 1
    }
  }, "\xD7")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      padding: 4,
      marginTop: 20,
      border: `1px solid ${spb.line}`,
      borderRadius: 14,
      background: 'oklch(0.16 0.012 265 / 0.74)'
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => switchMode('login'),
    style: modeButtonStyle(!isRegister && !isReset)
  }, "\u767B\u5F55"), React.createElement("button", {
    type: "button",
    onClick: () => switchMode('register'),
    style: modeButtonStyle(isRegister)
  }, "\u6CE8\u518C"), React.createElement("button", {
    type: "button",
    onClick: () => switchMode('reset'),
    style: modeButtonStyle(isReset)
  }, "\u5FD8\u8BB0\u5BC6\u7801")), React.createElement("div", {
    style: formGridStyle
  }, !isReset ? React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u8D26\u53F7"), React.createElement("input", {
    value: name,
    onChange: event => {
      setName(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: isRegister ? '输入账号' : '账号 / 邮箱 / 手机',
    autoFocus: true
  })) : null, isRegister || isReset ? React.createElement(React.Fragment, null, React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u90AE\u7BB1"), React.createElement("input", {
    value: email,
    onChange: event => {
      setEmail(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: "name@example.com",
    type: "email",
    autoFocus: isReset
  })), isRegister ? React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u624B\u673A"), React.createElement("input", {
    value: phone,
    onChange: event => {
      setPhone(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: "\u624B\u673A\u53F7",
    inputMode: "tel"
  })) : null) : null, !isReset ? React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u5BC6\u7801"), React.createElement("input", {
    value: password,
    onChange: event => {
      setPassword(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: isRegister ? '至少 8 位，不能纯数字或纯字母' : '输入密码',
    type: "password"
  })) : null, isRegister ? React.createElement("div", {
    style: codeRowStyle
  }, React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u9A8C\u8BC1\u7801"), React.createElement("input", {
    value: emailCode,
    onChange: event => {
      setEmailCode(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: "\u90AE\u7BB1\u9A8C\u8BC1\u7801",
    inputMode: "numeric"
  })), React.createElement("button", {
    type: "button",
    onClick: requestRegisterCode,
    style: secondaryButtonStyle
  }, "\u53D1\u9001\u9A8C\u8BC1\u7801")) : null, isReset ? React.createElement(React.Fragment, null, React.createElement("div", {
    style: codeRowStyle
  }, React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u9A8C\u8BC1\u7801"), React.createElement("input", {
    value: resetCode,
    onChange: event => {
      setResetCode(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: "\u90AE\u7BB1\u9A8C\u8BC1\u7801",
    inputMode: "numeric"
  })), React.createElement("button", {
    type: "button",
    onClick: requestResetCode,
    style: secondaryButtonStyle
  }, "\u53D1\u9001\u9A8C\u8BC1\u7801")), React.createElement("label", {
    style: fieldStyle
  }, React.createElement("span", {
    style: labelStyle
  }, "\u65B0\u5BC6\u7801"), React.createElement("input", {
    value: resetPasswordValue,
    onChange: event => {
      setResetPasswordValue(event.target.value);
      clearNotice();
    },
    style: inputStyle,
    placeholder: "\u81F3\u5C11 8 \u4F4D\uFF0C\u4E0D\u80FD\u7EAF\u6570\u5B57\u6216\u7EAF\u5B57\u6BCD",
    type: "password"
  }))) : null), info ? React.createElement("div", {
    style: {
      marginTop: 12,
      padding: '10px 12px',
      borderRadius: 12,
      background: 'oklch(0.25 0.06 145 / 0.18)',
      border: '1px solid oklch(0.58 0.12 145 / 0.28)',
      color: 'oklch(0.82 0.12 145)',
      fontSize: 13.5
    }
  }, info) : null, error ? React.createElement("div", {
    style: {
      marginTop: 12,
      padding: '10px 12px',
      borderRadius: 12,
      background: 'oklch(0.25 0.08 24 / 0.18)',
      border: '1px solid oklch(0.62 0.18 24 / 0.30)',
      color: 'oklch(0.78 0.18 24)',
      fontSize: 13.5
    }
  }, error) : null, React.createElement("div", {
    style: footerStyle
  }, React.createElement("button", {
    type: "button",
    onClick: () => {
      switchMode(isRegister || isReset ? 'login' : 'register');
    },
    style: {
      border: 'none',
      background: 'transparent',
      color: spb.blueSoft,
      cursor: 'pointer',
      fontSize: 14,
      fontFamily: 'inherit',
      padding: '8px 0'
    }
  }, isRegister || isReset ? '返回登录' : '创建账号'), React.createElement("button", {
    type: "submit",
    style: primaryActionStyle
  }, isReset ? '重置密码' : isRegister ? '完成注册' : '登录'))));
}
function SpbHero() {
  return React.createElement("div", {
    style: {
      position: 'relative',
      padding: 'clamp(68px, 8vw, 96px) clamp(20px, 4vw, 48px) clamp(54px, 7vw, 76px)',
      textAlign: 'center',
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    className: "qi-breath",
    style: {
      position: 'absolute',
      top: -120,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(720px, 92vw)',
      height: 420,
      background: `radial-gradient(ellipse at center, oklch(0.72 0.15 242 / 0.20), transparent 70%)`,
      pointerEvents: 'none'
    }
  }), React.createElement("svg", {
    className: "qi-hero-orbit",
    width: "760",
    height: "320",
    viewBox: "0 0 760 320",
    fill: "none",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 18,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(760px, 96vw)',
      maxWidth: '100%',
      pointerEvents: 'none'
    }
  }, React.createElement("ellipse", {
    cx: "380",
    cy: "160",
    rx: "330",
    ry: "120",
    transform: "rotate(-12 380 160)",
    stroke: "oklch(0.72 0.15 242 / 0.16)",
    strokeWidth: "1.5"
  }), React.createElement("g", {
    transform: "rotate(-12 380 160)"
  }, React.createElement("circle", {
    className: "qi-hero-spark",
    r: "4",
    fill: spb.blue
  }))), React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, React.createElement("h1", {
    style: {
      fontFamily: spb.disp,
      margin: 0,
      fontSize: 'clamp(46px, 8vw, 78px)',
      lineHeight: 1.02,
      letterSpacing: '-0.035em',
      fontWeight: 600,
      color: spb.ink
    }
  }, "\u4E00\u5904\u5165\u53E3\uFF0C", React.createElement("span", {
    style: {
      color: spb.blue
    }
  }, "\u4E07\u7269"), "\u76F8\u8FDE\u3002"), React.createElement("p", {
    style: {
      fontSize: 18.5,
      lineHeight: 1.6,
      color: spb.sub,
      maxWidth: 560,
      margin: '26px auto 0'
    }
  }, "\u628A\u76D8\u4E2D\u89C2\u5BDF\u3001\u5174\u8DA3\u5185\u5BB9\u548C\u57CE\u5E02\u63A2\u7D22\u653E\u8FDB\u540C\u4E00\u5957\u79E9\u5E8F\u91CC\u3002\u9700\u8981\u5224\u65AD\u65F6\u770B\u884C\u60C5\uFF0C\u9700\u8981\u653E\u677E\u65F6\u770B\u5A31\u4E50\uFF0C\u9700\u8981\u51FA\u95E8\u65F6\u770B\u63A2\u7D22\u3002"), React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 14,
      marginTop: 38,
      flexWrap: 'wrap'
    }
  }, React.createElement("a", {
    href: MARKET_URL,
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: spb.bg,
      background: spb.blue,
      padding: '15px 28px',
      borderRadius: 8,
      textDecoration: 'none',
      boxShadow: `0 0 30px oklch(0.72 0.15 242 / 0.4)`
    }
  }, "\u8FDB\u5165\u884C\u60C5"), React.createElement("a", {
    href: "#about",
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: spb.ink,
      padding: '15px 24px',
      borderRadius: 8,
      textDecoration: 'none',
      border: `1px solid ${spb.line}`,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      whiteSpace: 'nowrap'
    }
  }, React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 13 13",
    fill: "currentColor"
  }, React.createElement("path", {
    d: "M2 1l9 5.5L2 12z"
  })), "\u4E86\u89E3\u6211\u4EEC"))));
}
function SpbPillars() {
  const p = [['01', '行情', '盯紧每日 A 股大盘情绪，短线热点实时追踪，资金流向清晰可循 —— 把握节奏，再做决策。', '大盘情绪 · 短线热点 · 资金流向', '实时盯盘 · A股全市场', spb.blue, MARKET_URL], ['02', '娱乐', '时尚热点同步更新，追星看剧第一手资讯 —— 碎片时间也过得尽兴。', '时尚热点 · 追星看剧', '每周 500+ 新内容', spb.violet, STANNING_URL], ['03', '探索', '本地新开的网红店、宝藏美食与好去处，按位置为你精选 —— Qi 替你先一步探索。', '网红探店 · 美食推荐 · 周边好去处', '每日精选 · 本地好去处', spb.blue, EXPLORE_URL], ['04', '瞎聊聊', '给所有用户随手发图、写想法、分享日常的公共卡片流 —— 不用太正式，轻松聊。', '图片动态 · 用户发帖 · 随手记录', '全员可看 · 登录可发', spb.violet, CHAT_URL]];
  return React.createElement("div", {
    style: {
      padding: '0 clamp(20px, 4vw, 48px)'
    }
  }, React.createElement("div", {
    style: {
      borderTop: `1px solid ${spb.line}`,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'
    }
  }, p.map((x, i) => React.createElement("a", {
    key: i,
    href: x[6],
    className: "qi-pillar",
    style: {
      display: 'block',
      padding: 'clamp(34px, 5vw, 54px) clamp(20px, 3vw, 36px)',
      borderLeft: i === 0 ? 'none' : `1px solid ${spb.line}`,
      textDecoration: 'none',
      color: 'inherit'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 13,
      color: x[5]
    }
  }, x[0]), React.createElement("div", {
    style: {
      fontFamily: spb.disp,
      fontSize: 28,
      fontWeight: 600,
      color: spb.ink,
      marginTop: 18,
      letterSpacing: '-0.02em'
    }
  }, x[1]), React.createElement("p", {
    style: {
      fontSize: 15.5,
      lineHeight: 1.62,
      color: spb.sub,
      marginTop: 12
    }
  }, x[2]), React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12,
      color: spb.faint,
      marginTop: 18
    }
  }, x[3]), React.createElement("div", {
    style: {
      marginTop: 24,
      paddingTop: 18,
      borderTop: `1px solid ${spb.line}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: spb.ink
    }
  }, x[4]), React.createElement("span", {
    className: "qi-arrow",
    style: {
      color: x[5],
      display: 'flex'
    }
  }, React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, React.createElement("path", {
    d: "M4 9h10M9 4l5 5-5 5"
  }))))))));
}
function SpbShowcase() {
  const [cards, setCards] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    const absoluteAsset = url => {
      const value = String(url || '').trim();
      if (!value) return '';
      if (/^https?:\/\//i.test(value)) return value;
      return `${ADMIN_SERVER_BASE}${value.startsWith('/') ? value : `/${value}`}`;
    };
    Promise.allSettled([fetch(`${ADMIN_SERVER_BASE}/api/dashboard-live?zs_type=6&_=${Date.now()}`, {
      cache: 'no-store'
    }).then(res => res.json()), fetch(`${ADMIN_SERVER_BASE}/api/yule/home-teaser?_=${Date.now()}`, {
      cache: 'no-store'
    }).then(res => res.json()), fetch(`${ADMIN_SERVER_BASE}/api/discovery?_=${Date.now()}`, {
      cache: 'no-store'
    }).then(res => res.json())]).then(results => {
      if (!alive) return;
      const market = results[0].status === 'fulfilled' ? results[0].value : {};
      const yule = results[1].status === 'fulfilled' ? results[1].value?.teaser : null;
      const discovery = results[2].status === 'fulfilled' ? results[2].value : {};
      const db = market?.kpi?.DaBanList || {};
      const up = Number(db.SZJS ?? 0);
      const down = Number(db.XDJS ?? 0);
      const zt = Number(db.tZhangTing ?? 0);
      const dt = Number(db.tDieTing ?? 0);
      const total = up + down;
      const upPct = total ? Math.round(up * 100 / total) : 0;
      const exploreItems = (discovery.cities || []).flatMap(city => (city.items || []).map(item => ({
        ...item,
        cityName: city.name
      }))).sort((a, b) => Number(b.qualityScore || 0) - Number(a.qualityScore || 0) || String(b.discoveredAt || b.publishedAt || '').localeCompare(String(a.discoveredAt || a.publishedAt || '')));
      const topExplore = exploreItems[0] || null;
      setCards([{
        title: '今日大盘情绪',
        label: '行情',
        href: MARKET_URL,
        kind: 'market',
        value: total ? `${upPct}% 上涨` : '等待开盘数据',
        meta: `上涨 ${up || 0} · 下跌 ${down || 0}`,
        sub: `涨停 ${zt || 0} · 跌停 ${dt || 0}`
      }, {
        title: yule?.title || '娱乐热榜读取中',
        label: '娱乐热榜第一',
        href: STANNING_URL,
        kind: 'image',
        image: absoluteAsset(yule?.cover || ''),
        meta: yule?.category ? `热榜 · ${yule.category}` : '今日热榜',
        sub: yule?.summary || '暂未读取到娱乐热榜内容'
      }, {
        title: topExplore?.name || '探索热榜读取中',
        label: '探索热榜第一',
        href: EXPLORE_URL,
        kind: 'image',
        image: topExplore?.imageUrl ? `${ADMIN_SERVER_BASE}/api/discovery/image?url=${encodeURIComponent(topExplore.imageUrl)}` : '',
        meta: [topExplore?.cityName || topExplore?.city, topExplore?.category].filter(Boolean).join(' · ') || '城市探索',
        sub: topExplore?.editorialSummary || topExplore?.summary || '暂未读取到探索热榜内容'
      }, {
        title: '瞎聊聊',
        label: '社区帖子流',
        href: CHAT_URL,
        kind: 'image',
        image: CHAT_PREVIEW_IMAGE,
        meta: '图片 · 碎碎念 · 日常',
        sub: '晒图、唠嗑、盖楼回复，每天都有新鲜事'
      }]);
    });
    return () => {
      alive = false;
    };
  }, []);
  const fallbackCards = [{
    title: '今日大盘情绪',
    label: '行情',
    href: MARKET_URL,
    kind: 'market',
    value: '读取中',
    meta: '上涨 -- · 下跌 --',
    sub: '涨停 -- · 跌停 --'
  }, {
    title: '娱乐热榜第一',
    label: '娱乐',
    href: STANNING_URL,
    kind: 'plain',
    value: 'trending now',
    meta: '读取中',
    sub: '正在加载娱乐热榜'
  }, {
    title: '探索热榜第一',
    label: '探索',
    href: EXPLORE_URL,
    kind: 'plain',
    value: 'shop photo',
    meta: '读取中',
    sub: '正在加载探索热榜'
  }, {
    title: '瞎聊聊',
    label: '社区帖子流',
    href: CHAT_URL,
    kind: 'image',
    image: CHAT_PREVIEW_IMAGE,
    meta: '图片 · 碎碎念 · 日常',
    sub: '晒图、唠嗑、盖楼回复，每天都有新鲜事'
  }];
  const renderVisual = card => {
    if (card.kind === 'market') {
      return React.createElement("div", {
        style: {
          height: 144,
          padding: 18,
          background: 'linear-gradient(135deg, oklch(0.19 0.03 150 / 0.78), oklch(0.19 0.04 28 / 0.72))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }
      }, React.createElement("div", {
        style: {
          fontFamily: spb.mono,
          fontSize: 11.5,
          color: spb.faint
        }
      }, "TODAY BREADTH"), React.createElement("div", null, React.createElement("div", {
        style: {
          fontFamily: spb.disp,
          color: spb.ink,
          fontSize: 31,
          lineHeight: 1.05,
          fontWeight: 650
        }
      }, card.value), React.createElement("div", {
        style: {
          marginTop: 10,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 13.5,
          fontWeight: 760
        }
      }, React.createElement("span", {
        style: {
          color: 'oklch(0.72 0.18 28)'
        }
      }, card.meta?.split(' · ')[0] || '上涨 --'), React.createElement("span", {
        style: {
          color: 'oklch(0.70 0.15 150)'
        }
      }, card.meta?.split(' · ')[1] || '下跌 --'))));
    }
    if (card.kind === 'image' && card.image) {
      return React.createElement("div", {
        style: {
          position: 'relative',
          height: 144,
          background: spb.panel2,
          overflow: 'hidden'
        }
      }, React.createElement("img", {
        src: card.image,
        alt: card.title,
        loading: "lazy",
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }
      }), React.createElement("div", {
        style: {
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8,10,16,0.08), rgba(8,10,16,0.72))'
        }
      }), React.createElement("div", {
        style: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 13,
          color: spb.ink,
          fontSize: 13.5,
          fontWeight: 750,
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }
      }, card.title));
    }
    return React.createElement("div", {
      className: "ph",
      style: {
        height: 144,
        '--ph-a': 'oklch(0.72 0.15 242 / 0.14)',
        '--ph-t': spb.blueSoft,
        background: spb.panel2
      }
    }, card.value);
  };
  const liveCards = cards || fallbackCards;
  return React.createElement("div", {
    style: {
      padding: 'clamp(54px, 7vw, 76px) clamp(20px, 4vw, 48px)',
      borderTop: `1px solid ${spb.line}`
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: spb.blueSoft,
      marginBottom: 16
    }
  }, "Daily routes"), React.createElement("h2", {
    style: {
      fontFamily: spb.disp,
      margin: 0,
      fontSize: 38,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: spb.ink,
      maxWidth: 760
    }
  }, "\u6BCF\u5929\u6253\u5F00 DreamerQi\uFF0C\u5148\u8FDB\u5165\u4F60\u9700\u8981\u7684\u90A3\u4E00\u9762\u3002"), React.createElement("p", {
    style: {
      margin: '16px 0 0',
      maxWidth: 720,
      color: spb.sub,
      fontSize: 16,
      lineHeight: 1.75
    }
  }, "\u884C\u60C5\u8D1F\u8D23\u9AD8\u5BC6\u5EA6\u89C2\u5BDF\uFF0C\u5A31\u4E50\u8D1F\u8D23\u8F7B\u677E\u5185\u5BB9\uFF0C\u63A2\u7D22\u8D1F\u8D23\u57CE\u5E02\u751F\u6D3B\u3002\u4E09\u4E2A\u5165\u53E3\u5206\u5DE5\u660E\u786E\uFF0C\u4F46\u89C6\u89C9\u548C\u8D26\u53F7\u4F53\u7CFB\u4FDD\u6301\u4E00\u81F4\u3002"), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
      gap: 16,
      marginTop: 36
    }
  }, liveCards.map((card, i) => React.createElement("a", {
    key: i,
    href: card.href || '#',
    className: "qi-tile",
    style: {
      background: spb.panel,
      border: `1px solid ${spb.line}`,
      borderRadius: 12,
      overflow: 'hidden',
      textDecoration: 'none',
      display: 'block'
    }
  }, renderVisual(card), React.createElement("div", {
    style: {
      padding: '14px 16px'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 11,
      color: spb.faint,
      letterSpacing: '0.05em'
    }
  }, card.label), React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 650,
      color: spb.ink,
      marginTop: 6,
      lineHeight: 1.38,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, card.title), React.createElement("div", {
    style: {
      marginTop: 8,
      color: spb.sub,
      fontSize: 13.5,
      lineHeight: 1.48,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, card.sub))))));
}
function SpbDiscover() {
  const [payload, setPayload] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cityId, setCityId] = React.useState('all');
  const [category, setCategory] = React.useState('全部');
  const [selectedItem, setSelectedItem] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`${ADMIN_SERVER_BASE}/api/discovery?_=${Date.now()}`, {
      cache: 'no-store'
    }).then(res => res.json().then(data => ({
      ok: res.ok,
      data
    }))).then(({
      ok,
      data
    }) => {
      if (!alive) return;
      if (!ok) throw new Error(data?.error || '探索数据加载失败');
      setPayload(data);
      setError('');
    }).catch(err => {
      if (!alive) return;
      setError(err.message || '探索数据加载失败');
    }).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  const categories = React.useMemo(() => ['全部', ...(payload?.categories || []).filter(Boolean)], [payload]);
  const cities = payload?.cities || [];
  const visibleCities = cities.filter(city => cityId === 'all' || city.id === cityId).map(city => ({
    ...city,
    items: (city.items || []).filter(item => category === '全部' || item.category === category)
  }));
  const totalItems = cities.reduce((sum, city) => sum + (city.items || []).length, 0);
  const updatedText = payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString('zh-CN', {
    hour12: false
  }) : '等待首次更新';
  const shell = {
    padding: 'clamp(52px, 7vw, 78px) clamp(20px, 4vw, 48px) 80px',
    borderTop: `1px solid ${spb.line}`
  };
  const chip = active => ({
    border: `1px solid ${active ? 'oklch(0.72 0.15 242 / 0.58)' : spb.line}`,
    background: active ? 'oklch(0.72 0.15 242 / 0.14)' : 'oklch(0.205 0.014 265 / 0.64)',
    color: active ? spb.ink : spb.sub,
    borderRadius: 999,
    padding: '9px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13.5,
    fontWeight: active ? 700 : 550,
    boxShadow: active ? `0 0 22px oklch(0.72 0.15 242 / 0.12)` : 'none'
  });
  const cityCard = {
    background: 'linear-gradient(180deg, oklch(0.245 0.015 265 / 0.88), oklch(0.19 0.014 265 / 0.92))',
    border: `1px solid ${spb.line}`,
    borderRadius: 18,
    padding: 20,
    boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.08), 0 22px 58px rgba(0,0,0,0.22)'
  };
  const shopRow = {
    padding: '15px 0',
    borderTop: `1px solid ${spb.line}`
  };
  const getItemPhotos = item => {
    const photos = Array.isArray(item?.photos) ? item.photos.filter(Boolean) : [];
    return [...new Set([item?.imageUrl, ...photos].filter(Boolean))];
  };
  const getItemPhoto = item => getItemPhotos(item)[0] || '';
  const photoSrc = url => url ? `${ADMIN_SERVER_BASE}/api/discovery/image?url=${encodeURIComponent(url)}` : '';
  const hideBrokenImage = event => {
    event.currentTarget.style.display = 'none';
  };
  const sourceLabel = item => {
    const raw = String(item?.sourceName || '').trim();
    if (!raw) return '城市线索';
    if (/站内地点资料/.test(raw)) return '精选地点库';
    if (/百度新闻/.test(raw)) return '城市新闻';
    if (/微信文章/.test(raw)) return '本地公众号';
    if (/大众点评/.test(raw)) return '口碑榜单';
    return raw.replace(/线索/g, '').trim() || '城市线索';
  };
  const sourceTone = item => {
    if (item?.poi?.verified) return '地图已校验';
    const raw = String(item?.sourceName || '');
    if (/站内地点资料/.test(raw)) return '已整理';
    if (/大众点评|微信|百度新闻/.test(raw)) return '公开线索';
    return '待观察';
  };
  const poiLine = item => {
    const poi = item?.poi?.verified ? item.poi : null;
    if (!poi) return '';
    return [poi.businessArea || poi.district, poi.address].filter(Boolean).join(' · ');
  };
  const visitCheckText = item => {
    const poi = item?.poi?.verified ? item.poi : null;
    if (poi?.tel) return `地图已校验地址，可电话 ${poi.tel} 确认营业和排队`;
    if (poi?.address) return `地图已校验地址，出发前再确认营业时间和预约`;
    return '确认营业时间、预约和排队情况';
  };
  const itemReason = item => {
    const parts = [item?.sceneTag, item?.category, item?.poi?.businessArea || item?.district].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    return item?.tagline || '近期城市去处';
  };
  const sourcePlan = [['新店雷达', '新开、首店、试营业、快闪和上新，是探索页的第一层线索。'], ['口碑校验', '优先看本地公众号、榜单线索、城市新闻和地点资料，过滤泛资讯。'], ['地图核验', '配置地图服务后，会补充真实地址、商圈、电话和坐标，区分线索与可到达地点。'], ['路线价值', '不只列店名，还判断适合约饭、拍照、慢逛、看展还是夜间小聚。'], ['到店提醒', '详情里保留营业、预约、排队、临时调整等二次确认提醒。']];
  const openItem = (city, item) => {
    const photos = getItemPhotos(item);
    setSelectedItem({
      ...item,
      cityName: city.name,
      photo: photos[0] || '',
      photos
    });
  };
  const featuredItems = visibleCities.flatMap(city => (city.items || []).map(item => ({
    ...item,
    cityName: city.name,
    cityId: city.id
  }))).sort((a, b) => Number(b.qualityScore || 0) - Number(a.qualityScore || 0) || String(b.discoveredAt || b.publishedAt || '').localeCompare(String(a.discoveredAt || a.publishedAt || ''))).slice(0, 5);
  return React.createElement("section", {
    style: shell
  }, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gap: 24,
      alignItems: 'end'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: spb.blueSoft
    }
  }, "Explore"), React.createElement("h1", {
    style: {
      margin: '14px 0 0',
      fontFamily: spb.disp,
      fontSize: 'clamp(38px, 6vw, 62px)',
      lineHeight: 1.05,
      letterSpacing: '-0.035em',
      color: spb.ink,
      fontWeight: 600
    }
  }, "\u57CE\u5E02\u65B0\u5E97\u4E0E\u597D\u53BB\u5904"), React.createElement("p", {
    style: {
      margin: '16px 0 0',
      maxWidth: 620,
      color: spb.sub,
      fontSize: 16,
      lineHeight: 1.7
    }
  }, "\u628A\u8FD1\u671F\u65B0\u5F00\u3001\u9996\u5E97\u3001\u63A2\u5E97\u3001\u5C55\u89C8\u3001\u5E02\u96C6\u548C\u751F\u6D3B\u65B9\u5F0F\u7A7A\u95F4\u6574\u7406\u6210\u53EF\u9605\u8BFB\u7684\u57CE\u5E02\u8DEF\u7EBF\u3002\u5148\u770B\u662F\u5426\u503C\u5F97\u53BB\uFF0C\u518D\u51B3\u5B9A\u4EC0\u4E48\u65F6\u5019\u53BB\u3001\u548C\u54EA\u91CC\u4E00\u8D77\u901B\u3002")), React.createElement("div", {
    style: {
      minWidth: 190,
      justifySelf: 'end',
      border: `1px solid ${spb.line}`,
      borderRadius: 18,
      padding: '14px 16px',
      background: 'oklch(0.205 0.014 265 / 0.64)'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 11.5,
      color: spb.faint
    }
  }, "UPDATED"), React.createElement("div", {
    style: {
      marginTop: 6,
      color: spb.ink,
      fontSize: 14.5,
      fontWeight: 700
    }
  }, updatedText), React.createElement("div", {
    style: {
      marginTop: 6,
      color: spb.sub,
      fontSize: 13
    }
  }, totalItems, " \u6761\u7AD9\u5185\u5185\u5BB9"))), React.createElement("div", {
    style: {
      marginTop: 28,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
      gap: 12
    }
  }, sourcePlan.map(([title, text]) => React.createElement("div", {
    key: title,
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 16,
      padding: '15px 16px',
      background: 'linear-gradient(180deg, oklch(0.235 0.015 265 / 0.78), oklch(0.19 0.014 265 / 0.72))',
      boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.07)'
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 15,
      fontWeight: 800
    }
  }, title), React.createElement("div", {
    style: {
      marginTop: 7,
      color: spb.sub,
      fontSize: 13.5,
      lineHeight: 1.62
    }
  }, text)))), React.createElement("div", {
    style: {
      marginTop: 34,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => setCityId('all'),
    style: chip(cityId === 'all')
  }, "\u5168\u90E8\u57CE\u5E02"), cities.map(city => React.createElement("button", {
    key: city.id,
    type: "button",
    onClick: () => setCityId(city.id),
    style: chip(cityId === city.id)
  }, city.name))), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      flexWrap: 'wrap'
    }
  }, categories.map(item => React.createElement("button", {
    key: item,
    type: "button",
    onClick: () => setCategory(item),
    style: chip(category === item)
  }, item)))), error ? React.createElement("div", {
    style: {
      marginTop: 28,
      color: 'oklch(0.72 0.2 28)',
      fontSize: 15
    }
  }, error) : null, loading ? React.createElement("div", {
    style: {
      marginTop: 34,
      color: spb.sub,
      fontSize: 16
    }
  }, "\u6B63\u5728\u52A0\u8F7D\u4ECA\u65E5\u63A2\u7D22\u5185\u5BB9...") : null, !loading && featuredItems.length ? React.createElement("div", {
    style: {
      marginTop: 34
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-between',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: spb.blueSoft
    }
  }, "Today picks"), React.createElement("h2", {
    style: {
      margin: '9px 0 0',
      fontFamily: spb.disp,
      color: spb.ink,
      fontSize: 31,
      lineHeight: 1.12,
      letterSpacing: '-0.025em'
    }
  }, "\u4ECA\u65E5\u503C\u5F97\u5148\u770B\u7684\u53BB\u5904")), React.createElement("div", {
    style: {
      color: spb.sub,
      fontSize: 14,
      lineHeight: 1.6
    }
  }, "\u6309\u8FD1\u671F\u70ED\u5EA6\u3001\u56FE\u6587\u5B8C\u6574\u5EA6\u548C\u672C\u5730\u76F8\u5173\u6027\u6392\u5E8F")), React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
      gap: 16
    }
  }, featuredItems.map((item, index) => {
    const photo = getItemPhoto(item);
    const isLead = index === 0;
    return React.createElement("button", {
      key: `${item.cityId}-${item.id || item.name}-${index}`,
      type: "button",
      onClick: () => openItem({
        id: item.cityId,
        name: item.cityName
      }, item),
      style: {
        minHeight: isLead ? 310 : 244,
        gridColumn: isLead ? '1 / -1' : 'span 1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${spb.line}`,
        borderRadius: 18,
        padding: 0,
        background: 'oklch(0.2 0.014 265)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        boxShadow: '0 24px 64px rgba(0,0,0,0.24)'
      }
    }, photo ? React.createElement("img", {
      src: photoSrc(photo),
      alt: item.name,
      loading: "lazy",
      onError: hideBrokenImage,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }) : null, React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(6,8,14,0.08), rgba(6,8,14,0.38) 42%, rgba(6,8,14,0.86))'
      }
    }), React.createElement("div", {
      style: {
        position: 'relative',
        padding: isLead ? 22 : 18,
        width: '100%'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, [item.cityName, item.category, item.sceneTag].filter(Boolean).slice(0, 3).map(text => React.createElement("span", {
      key: text,
      style: {
        color: spb.ink,
        background: 'oklch(0.12 0.01 265 / 0.48)',
        border: '1px solid oklch(1 0 0 / 0.2)',
        borderRadius: 999,
        padding: '6px 9px',
        fontSize: 12,
        fontWeight: 760,
        backdropFilter: 'blur(10px)'
      }
    }, text)), React.createElement("span", {
      style: {
        color: spb.bg,
        background: spb.blueSoft,
        border: '1px solid oklch(1 0 0 / 0.16)',
        borderRadius: 999,
        padding: '6px 9px',
        fontSize: 12,
        fontWeight: 820
      }
    }, sourceTone(item))), React.createElement("div", {
      style: {
        marginTop: 13,
        color: spb.ink,
        fontFamily: spb.disp,
        fontSize: isLead ? 'clamp(28px, 4vw, 42px)' : 25,
        lineHeight: 1.08,
        letterSpacing: '-0.025em',
        fontWeight: 650
      }
    }, item.name), React.createElement("div", {
      style: {
        marginTop: 8,
        color: spb.blueSoft,
        fontSize: 13.5,
        fontWeight: 760
      }
    }, itemReason(item)), poiLine(item) ? React.createElement("div", {
      style: {
        marginTop: 7,
        color: 'oklch(0.82 0.045 150)',
        fontSize: 12.8,
        fontWeight: 760,
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }
    }, poiLine(item)) : null, React.createElement("div", {
      style: {
        marginTop: 10,
        color: 'oklch(0.9 0.02 255)',
        lineHeight: 1.58,
        fontSize: isLead ? 15.5 : 14.5,
        display: '-webkit-box',
        WebkitLineClamp: isLead ? 3 : 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }
    }, item.editorialSummary || item.summary || ''), React.createElement("div", {
      style: {
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        color: 'oklch(0.86 0.025 255 / 0.82)',
        fontSize: 12.5
      }
    }, React.createElement("span", null, sourceLabel(item)), React.createElement("span", null, "\u67E5\u770B\u8BE6\u60C5"))));
  }))) : null, React.createElement("div", {
    style: {
      marginTop: 34,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
      gap: 18
    }
  }, visibleCities.map(city => React.createElement("article", {
    key: city.id,
    style: cityCard
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 14
    }
  }, React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: spb.disp,
      fontSize: 27,
      letterSpacing: '-0.02em',
      color: spb.ink
    }
  }, city.name), React.createElement("span", {
    style: {
      color: spb.blueSoft,
      fontFamily: spb.mono,
      fontSize: 12
    }
  }, (city.items || []).length, "/", payload?.cityLimit || 5)), React.createElement("div", {
    style: {
      marginTop: 8,
      color: spb.faint,
      fontSize: 13.5
    }
  }, city.updatedAt ? `更新 ${new Date(city.updatedAt).toLocaleString('zh-CN', {
    hour12: false
  })}` : '等待更新'), (city.items || []).length ? React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, city.items.map(item => {
    const photo = getItemPhoto(item);
    return React.createElement("button", {
      key: item.id || item.name,
      type: "button",
      onClick: () => openItem(city, item),
      style: {
        ...shopRow,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '72px minmax(0, 1fr)',
        gap: 13,
        background: 'transparent',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit'
      }
    }, React.createElement("div", {
      style: {
        height: 72,
        borderRadius: 14,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, oklch(0.34 0.05 245), oklch(0.22 0.04 292))',
        border: `1px solid ${spb.line}`,
        boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.12)'
      }
    }, photo ? React.createElement("img", {
      src: photoSrc(photo),
      alt: item.name,
      loading: "lazy",
      onError: hideBrokenImage,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }) : React.createElement("div", {
      style: {
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: spb.blueSoft,
        fontFamily: spb.mono,
        fontSize: 11,
        letterSpacing: '0.08em'
      }
    }, item.category || 'SHOP')), React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }
    }, React.createElement("span", {
      style: {
        color: spb.ink,
        fontSize: 17.5,
        fontWeight: 760,
        lineHeight: 1.35,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, item.name), React.createElement("span", {
      style: {
        color: spb.bg,
        background: spb.blueSoft,
        borderRadius: 999,
        padding: '4px 8px',
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap'
      }
    }, item.category || '其他')), React.createElement("div", {
      style: {
        marginTop: 7,
        color: spb.sub,
        lineHeight: 1.58,
        fontSize: 14.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }
    }, item.editorialSummary || item.summary || item.tagline || ''), poiLine(item) ? React.createElement("div", {
      style: {
        marginTop: 8,
        color: 'oklch(0.82 0.045 150)',
        fontSize: 12.5,
        fontWeight: 720,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, poiLine(item)) : null, item.district || item.sceneTag || item?.poi?.verified ? React.createElement("div", {
      style: {
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, item.district ? React.createElement("span", {
      style: {
        color: spb.blueSoft,
        fontSize: 12.5
      }
    }, item.district) : null, item.sceneTag ? React.createElement("span", {
      style: {
        color: spb.faint,
        border: `1px solid ${spb.line}`,
        borderRadius: 999,
        padding: '3px 8px',
        fontSize: 12
      }
    }, item.sceneTag) : null, item?.poi?.verified ? React.createElement("span", {
      style: {
        color: 'oklch(0.82 0.045 150)',
        border: '1px solid oklch(0.72 0.1 150 / 0.35)',
        borderRadius: 999,
        padding: '3px 8px',
        fontSize: 12
      }
    }, "\u5730\u56FE\u5DF2\u6821\u9A8C") : null, React.createElement("span", {
      style: {
        color: spb.faint,
        border: `1px solid ${spb.line}`,
        borderRadius: 999,
        padding: '3px 8px',
        fontSize: 12
      }
    }, sourceLabel(item))) : null));
  })) : React.createElement("div", {
    style: {
      marginTop: 20,
      borderTop: `1px solid ${spb.line}`,
      paddingTop: 18,
      color: spb.sub,
      fontSize: 15,
      lineHeight: 1.7
    }
  }, "\u6682\u65E0\u65B0\u589E\uFF0C\u7B49\u5F85\u4E0B\u4E00\u6B21\u66F4\u65B0\u3002")))), selectedItem ? React.createElement("div", {
    onClick: () => setSelectedItem(null),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      background: 'rgba(5, 7, 12, 0.72)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      display: 'grid',
      placeItems: 'center',
      padding: 'clamp(18px, 4vw, 42px)'
    }
  }, React.createElement("article", {
    onClick: event => event.stopPropagation(),
    style: {
      width: 'min(820px, 100%)',
      maxHeight: 'min(86vh, 860px)',
      overflow: 'auto',
      background: 'linear-gradient(180deg, oklch(0.245 0.015 265 / 0.96), oklch(0.175 0.014 265 / 0.98))',
      border: `1px solid ${spb.line}`,
      borderRadius: 24,
      boxShadow: '0 34px 90px rgba(0,0,0,0.52), inset 0 1px 0 oklch(1 0 0 / 0.1)'
    }
  }, React.createElement("div", {
    style: {
      position: 'relative',
      minHeight: 260,
      background: 'linear-gradient(135deg, oklch(0.35 0.08 238), oklch(0.23 0.07 292))',
      overflow: 'hidden',
      borderRadius: '24px 24px 0 0'
    }
  }, selectedItem.photo ? React.createElement("img", {
    src: photoSrc(selectedItem.photo),
    alt: selectedItem.name,
    onError: hideBrokenImage,
    style: {
      width: '100%',
      height: 320,
      objectFit: 'cover',
      display: 'block'
    }
  }) : React.createElement("div", {
    style: {
      height: 320,
      display: 'grid',
      placeItems: 'center',
      color: spb.ink,
      fontFamily: spb.disp,
      fontSize: 44,
      fontWeight: 600,
      letterSpacing: '-0.03em'
    }
  }, selectedItem.category || selectedItem.cityName || 'Discovery'), React.createElement("button", {
    type: "button",
    onClick: () => setSelectedItem(null),
    "aria-label": "\u5173\u95ED",
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 42,
      height: 42,
      borderRadius: 999,
      border: `1px solid ${spb.line}`,
      background: 'oklch(0.165 0.013 265 / 0.72)',
      color: spb.ink,
      fontSize: 24,
      lineHeight: 1,
      cursor: 'pointer',
      boxShadow: '0 12px 32px rgba(0,0,0,0.26)'
    }
  }, "\xD7"), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 22,
      bottom: 20,
      display: 'flex',
      gap: 9,
      flexWrap: 'wrap'
    }
  }, [selectedItem.cityName || selectedItem.city, selectedItem.category, selectedItem.district, selectedItem?.poi?.verified ? '地图已校验' : ''].filter(Boolean).map(text => React.createElement("span", {
    key: text,
    style: {
      border: `1px solid oklch(1 0 0 / 0.22)`,
      background: 'oklch(0.12 0.01 265 / 0.5)',
      color: spb.ink,
      borderRadius: 999,
      padding: '7px 11px',
      fontSize: 12.5,
      fontWeight: 750,
      backdropFilter: 'blur(12px)'
    }
  }, text)))), React.createElement("div", {
    style: {
      padding: '26px clamp(22px, 4vw, 36px) 32px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12,
      letterSpacing: '0.08em',
      color: spb.blueSoft,
      textTransform: 'uppercase'
    }
  }, "Explore pick"), React.createElement("h2", {
    style: {
      margin: '10px 0 0',
      fontFamily: spb.disp,
      fontSize: 'clamp(30px, 5vw, 46px)',
      lineHeight: 1.06,
      letterSpacing: '-0.035em',
      color: spb.ink
    }
  }, selectedItem.name)), React.createElement("div", {
    style: {
      color: spb.faint,
      fontSize: 13,
      textAlign: 'right',
      lineHeight: 1.6
    }
  }, React.createElement("div", null, selectedItem.cityName || selectedItem.city), React.createElement("div", null, [selectedItem.category, selectedItem.sceneTag].filter(Boolean).join(' · ')), selectedItem?.poi?.verified ? React.createElement("div", {
    style: {
      color: 'oklch(0.82 0.045 150)'
    }
  }, "\u5730\u56FE\u5DF2\u6821\u9A8C") : null, React.createElement("div", null, sourceLabel(selectedItem)))), selectedItem.editorialTitle || selectedItem.tagline ? React.createElement("div", {
    style: {
      marginTop: 24,
      color: spb.ink,
      fontSize: 18,
      lineHeight: 1.55,
      fontWeight: 750
    }
  }, selectedItem.editorialTitle || selectedItem.tagline) : null, React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: 10
    }
  }, [['为什么看', itemReason(selectedItem)], ['信息来源', sourceLabel(selectedItem)], ['出发前', visitCheckText(selectedItem)], ...(selectedItem?.poi?.verified ? [['地址', selectedItem.poi.address], ['电话', selectedItem.poi.tel || '暂无公开电话']] : [])].map(([title, text]) => React.createElement("div", {
    key: title,
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 16,
      padding: '13px 14px',
      background: 'oklch(0.205 0.014 265 / 0.62)'
    }
  }, React.createElement("div", {
    style: {
      color: spb.faint,
      fontFamily: spb.mono,
      fontSize: 11.5,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, title), React.createElement("div", {
    style: {
      marginTop: 7,
      color: spb.ink,
      fontSize: 14.5,
      lineHeight: 1.5,
      fontWeight: 760
    }
  }, text)))), selectedItem.imageCaption ? React.createElement("div", {
    style: {
      marginTop: 12,
      border: `1px solid ${spb.line}`,
      borderRadius: 16,
      padding: '13px 15px',
      background: 'oklch(0.205 0.014 265 / 0.62)',
      color: spb.blueSoft,
      fontSize: 13.5,
      lineHeight: 1.65
    }
  }, selectedItem.imageCaption) : null, React.createElement("div", {
    style: {
      marginTop: 14,
      color: spb.sub,
      fontSize: 16.5,
      lineHeight: 1.82,
      whiteSpace: 'pre-wrap'
    }
  }, selectedItem.editorialDetail || selectedItem.editorialSummary || selectedItem.summary || ''), (selectedItem.highlights || []).length ? React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 12
    }
  }, selectedItem.highlights.map(item => React.createElement("div", {
    key: item.title || item,
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 16,
      padding: '14px 15px',
      background: 'oklch(0.205 0.014 265 / 0.62)'
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 14.5,
      fontWeight: 800
    }
  }, item.title || item), item.text ? React.createElement("div", {
    style: {
      marginTop: 7,
      color: spb.sub,
      fontSize: 13.5,
      lineHeight: 1.6
    }
  }, item.text) : null))) : null, (selectedItem.photos || []).slice(1, 5).length ? React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 10
    }
  }, (selectedItem.photos || []).slice(1, 5).map((photo, index) => React.createElement("div", {
    key: photo,
    style: {
      aspectRatio: index === 0 ? '1.25 / 1' : '1 / 1',
      gridColumn: index === 0 ? 'span 2' : 'span 1',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, oklch(0.34 0.05 245), oklch(0.22 0.04 292))',
      border: `1px solid ${spb.line}`
    }
  }, React.createElement("img", {
    src: photoSrc(photo),
    alt: selectedItem.name,
    loading: "lazy",
    onError: hideBrokenImage,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })))) : null))) : null);
}
const CHAT_TOPIC_PROMPTS = ['☕ 今天的第一杯咖啡/奶茶是什么？', '📷 晒一张刚拍的照片吧', '🍜 今天吃了什么好吃的？', '💭 用一句话记录现在的心情', '🎬 最近在追什么剧或电影？', '🌤 你那边今天天气怎么样？'];
const CHAT_STARTER_CHIPS = [['☕ 日常打卡', '今日份日常打卡：'], ['📷 晒一张图', '晒一张今天拍的图：'], ['🍜 干饭报告', '今天的干饭报告：'], ['💭 碎碎念', '此刻的碎碎念：'], ['🎬 追剧安利', '最近在看的剧/电影，安利一下：']];
function SpbChat({
  user,
  onLogin
}) {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [text, setText] = React.useState('');
  const [imageData, setImageData] = React.useState('');
  const [imageName, setImageName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');
  const [replySubmitting, setReplySubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [topicIndex, setTopicIndex] = React.useState(0);
  const fileInputRef = React.useRef(null);
  const composerRef = React.useRef(null);
  const composerCardRef = React.useRef(null);
  const loadPosts = React.useCallback(() => {
    setLoading(true);
    fetch(`${ADMIN_SERVER_BASE}/api/chatter/posts?_=${Date.now()}`, {
      cache: 'no-store'
    }).then(res => res.json().then(data => ({
      ok: res.ok,
      data
    }))).then(({
      ok,
      data
    }) => {
      if (!ok) throw new Error(data?.error || '瞎聊聊加载失败');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setError('');
    }).catch(err => setError(err.message || '瞎聊聊加载失败')).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  React.useEffect(() => {
    const timer = setInterval(() => setTopicIndex(prev => (prev + 1) % CHAT_TOPIC_PROMPTS.length), 4200);
    return () => clearInterval(timer);
  }, []);
  const applyStarter = starter => {
    setText(prev => prev.trim() ? prev : starter);
    composerRef.current?.focus();
  };
  const goCompose = () => {
    if (!user) {
      onLogin?.();
      return;
    }
    composerCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    setTimeout(() => composerRef.current?.focus(), 350);
  };
  const formatTime = value => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const chatterImageSrc = url => {
    if (!url) return '';
    if (/^(https?:|data:)/i.test(url)) return url;
    return `${ADMIN_SERVER_BASE}${url}`;
  };
  const closePost = () => {
    setSelectedPost(null);
    setReplyText('');
    setDetailLoading(false);
    setReplySubmitting(false);
  };
  const openPost = async post => {
    setSelectedPost(post);
    setReplyText('');
    setDetailLoading(true);
    try {
      const res = await fetch(`${ADMIN_SERVER_BASE}/api/chatter/posts/${encodeURIComponent(post.id)}?_=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || '帖子读取失败');
      if (data.post) {
        setSelectedPost(data.post);
        setPosts(prev => prev.map(item => item.id === data.post.id ? {
          ...item,
          ...data.post,
          comments: (data.post.comments || []).slice(-2)
        } : item));
      }
    } catch (err) {
      setError(err.message || '帖子读取失败');
    } finally {
      setDetailLoading(false);
    }
  };
  const pickImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) {
      setError('只支持 JPG、PNG、WebP 或 GIF 图片');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result || ''));
      setImageName(file.name || '图片');
      setError('');
    };
    reader.onerror = () => setError('图片读取失败');
    reader.readAsDataURL(file);
  };
  const clearImage = () => {
    setImageData('');
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const submitPost = async () => {
    if (!user) {
      onLogin?.();
      return;
    }
    const cleanText = text.trim();
    if (!cleanText && !imageData) {
      setError('写点文字或选一张图片再发布');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = readSharedAuthToken();
      const res = await fetch(`${ADMIN_SERVER_BASE}/api/chatter/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {
            'x-admin-token': token
          } : {})
        },
        body: JSON.stringify({
          text: cleanText,
          image: imageData ? {
            dataUrl: imageData,
            name: imageName
          } : null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) onLogin?.();
        throw new Error(data?.error === 'login required' ? '请先登录后再发布' : data?.error || '发布失败');
      }
      setText('');
      clearImage();
      setPosts(prev => [data.post, ...prev.filter(item => item.id !== data.post?.id)]);
    } catch (err) {
      setError(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };
  const submitReply = async () => {
    if (!selectedPost) return;
    if (!user) {
      onLogin?.();
      return;
    }
    const cleanText = replyText.trim();
    if (!cleanText) {
      setError('写点内容再回复');
      return;
    }
    setReplySubmitting(true);
    setError('');
    try {
      const token = readSharedAuthToken();
      const res = await fetch(`${ADMIN_SERVER_BASE}/api/chatter/posts/${encodeURIComponent(selectedPost.id)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {
            'x-admin-token': token
          } : {})
        },
        body: JSON.stringify({
          text: cleanText
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) onLogin?.();
        throw new Error(data?.error === 'login required' ? '请先登录后再回复' : data?.error || '回复失败');
      }
      if (data.post) {
        setSelectedPost(data.post);
        setPosts(prev => prev.map(item => item.id === data.post.id ? {
          ...item,
          ...data.post,
          comments: (data.post.comments || []).slice(-2)
        } : item));
      }
      setReplyText('');
    } catch (err) {
      setError(err.message || '回复失败');
    } finally {
      setReplySubmitting(false);
    }
  };
  const cardStyle = {
    border: `1px solid ${spb.line}`,
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.022)), oklch(0.192 0.014 265 / 0.94)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
    overflow: 'hidden'
  };
  const smallButton = {
    border: `1px solid ${spb.line}`,
    background: 'oklch(0.225 0.014 265 / 0.76)',
    color: spb.ink,
    borderRadius: 10,
    padding: '10px 14px',
    fontFamily: 'inherit',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer'
  };
  const primary = {
    ...smallButton,
    borderColor: 'oklch(0.72 0.15 242 / 0.36)',
    background: `linear-gradient(135deg, ${spb.blue}, ${spb.violet})`,
    color: spb.bg
  };
  const avatarStyle = (name = 'Q') => ({
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    color: spb.ink,
    fontSize: 14,
    fontWeight: 800,
    background: 'linear-gradient(135deg, oklch(0.72 0.15 242 / 0.82), oklch(0.77 0.13 318 / 0.82))',
    boxShadow: '0 8px 22px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.24)'
  });
  const firstChar = name => String(name || 'Q').trim().slice(0, 1).toUpperCase() || 'Q';
  const postCountText = post => {
    const count = Number(post?.commentCount || (post?.comments || []).length || 0);
    return count ? `${count} 条回复` : '打开帖子';
  };
  const chatStats = React.useMemo(() => {
    const imageCount = posts.filter(post => post.imageUrl).length;
    const replyCount = posts.reduce((sum, post) => sum + Number(post.commentCount || (post.comments || []).length || 0), 0);
    return {
      posts: posts.length,
      images: imageCount,
      replies: replyCount
    };
  }, [posts]);
  const visiblePosts = React.useMemo(() => posts.filter(post => {
    if (filter === 'image') return !!post.imageUrl;
    if (filter === 'reply') return Number(post.commentCount || (post.comments || []).length || 0) > 0;
    if (filter === 'text') return !post.imageUrl;
    return true;
  }), [posts, filter]);
  const filterTabs = [['all', '全部', chatStats.posts], ['image', '带图', chatStats.images], ['reply', '有回复', chatStats.replies], ['text', '文字', Math.max(chatStats.posts - chatStats.images, 0)]];
  const statChip = (label, value) => React.createElement("div", {
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 12,
      padding: '12px 14px',
      background: 'oklch(0.18 0.014 265 / 0.62)',
      minWidth: 116
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 24,
      fontWeight: 780,
      lineHeight: 1
    }
  }, value), React.createElement("div", {
    style: {
      marginTop: 7,
      color: spb.faint,
      fontSize: 12.5,
      fontWeight: 650
    }
  }, label));
  return React.createElement("section", {
    style: {
      padding: 'clamp(42px, 6vw, 72px) clamp(18px, 4vw, 48px) 86px',
      borderTop: `1px solid ${spb.line}`,
      background: 'radial-gradient(circle at 18% 0%, oklch(0.36 0.07 245 / 0.20), transparent 34%), radial-gradient(circle at 88% 12%, oklch(0.42 0.08 315 / 0.14), transparent 30%), linear-gradient(180deg, oklch(0.17 0.013 265), oklch(0.145 0.012 265))'
    }
  }, React.createElement("style", null, `
        @keyframes qiChatBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes qiChatFloat { 0%, 100% { transform: translateY(0) rotate(-0.6deg); } 50% { transform: translateY(-5px) rotate(0.8deg); } }
        @keyframes qiChatTwinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes qiChatPop { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; } }
        .qi-chat-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .qi-chat-card:hover { transform: translateY(-3px); box-shadow: 0 26px 56px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06); }
        .qi-chat-chip { transition: transform 0.15s ease, border-color 0.15s ease; }
        .qi-chat-chip:hover { transform: translateY(-2px); border-color: oklch(0.72 0.15 242 / 0.45); }
        @media (prefers-reduced-motion: reduce) {
          .qi-chat-card, .qi-chat-chip { transition: none; }
          .qi-chat-anim { animation: none !important; }
        }
      `), React.createElement("div", {
    style: {
      maxWidth: 1160,
      margin: '0 auto'
    }
  }, React.createElement("div", {
    style: {
      ...cardStyle,
      padding: 'clamp(18px, 3vw, 30px)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gap: 'clamp(18px, 4vw, 34px)',
      alignItems: 'stretch'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 28
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: spb.blueSoft
    }
  }, "Community Board"), React.createElement("h1", {
    style: {
      margin: '13px 0 0',
      fontFamily: spb.disp,
      fontSize: 'clamp(38px, 6vw, 62px)',
      lineHeight: 1.02,
      color: spb.ink,
      fontWeight: 650
    }
  }, "\u778E\u804A\u804A"), React.createElement("p", {
    style: {
      margin: '16px 0 0',
      maxWidth: 660,
      color: spb.sub,
      fontSize: 16.5,
      lineHeight: 1.75
    }
  }, "\u8FD9\u91CC\u662F DreamerQi \u7684\u9732\u5929\u8336\u8BDD\u4F1A\uFF1A\u6652\u56FE\u3001\u5520\u55D1\u3001\u788E\u788E\u5FF5\uFF0C\u60F3\u5230\u4EC0\u4E48\u53D1\u4EC0\u4E48\u3002\u6BCF\u6761\u5E16\u5B50\u90FD\u80FD\u76D6\u697C\u56DE\u590D\uFF0C\u6765\u665A\u4E86\u5C31\u53EA\u80FD\u8E72\u522B\u4EBA\u7684\u6C99\u53D1\u5566\uFF5E")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, statChip('📝 帖子', chatStats.posts), statChip('🖼️ 图片', chatStats.images), statChip('💬 回复', chatStats.replies))), React.createElement("div", {
    style: {
      position: 'relative',
      border: `1px solid ${spb.line}`,
      borderRadius: 14,
      overflow: 'hidden',
      minHeight: 220,
      background: 'linear-gradient(135deg, #e8f1ff 0%, #fdeef6 55%, #e9f9f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(14px, 3vw, 26px)',
      padding: '24px clamp(16px, 3vw, 26px)',
      flexWrap: 'wrap'
    }
  }, [['✦', '#f5a623', '7%', '10%', '3.2s', '0s'], ['✧', '#5b8def', '80%', '9%', '2.7s', '0.6s'], ['✦', '#57c48f', '11%', '78%', '3.6s', '1.1s'], ['✧', '#e86a92', '87%', '72%', '2.9s', '0.3s']].map(([glyph, color, left, top, duration, delay], idx) => React.createElement("span", {
    key: idx,
    "aria-hidden": "true",
    className: "qi-chat-anim",
    style: {
      position: 'absolute',
      left,
      top,
      color,
      fontSize: 20,
      animation: `qiChatTwinkle ${duration} ease-in-out ${delay} infinite`
    }
  }, glyph)), React.createElement("svg", {
    viewBox: "0 0 160 150",
    width: "132",
    height: "124",
    "aria-hidden": "true",
    className: "qi-chat-anim",
    style: {
      flex: '0 0 auto',
      animation: 'qiChatBob 4s ease-in-out infinite'
    }
  }, React.createElement("circle", {
    cx: "42",
    cy: "34",
    r: "20",
    fill: "#fdf3e7",
    stroke: "#454b6e",
    strokeWidth: "5"
  }), React.createElement("circle", {
    cx: "118",
    cy: "34",
    r: "20",
    fill: "#fdf3e7",
    stroke: "#454b6e",
    strokeWidth: "5"
  }), React.createElement("circle", {
    cx: "42",
    cy: "34",
    r: "9",
    fill: "#f7b8c8"
  }), React.createElement("circle", {
    cx: "118",
    cy: "34",
    r: "9",
    fill: "#f7b8c8"
  }), React.createElement("rect", {
    x: "18",
    y: "30",
    width: "124",
    height: "96",
    rx: "34",
    fill: "#fdf6ec",
    stroke: "#454b6e",
    strokeWidth: "5"
  }), React.createElement("circle", {
    cx: "60",
    cy: "74",
    r: "7",
    fill: "#2f3555"
  }), React.createElement("circle", {
    cx: "100",
    cy: "74",
    r: "7",
    fill: "#2f3555"
  }), React.createElement("circle", {
    cx: "62.5",
    cy: "71.5",
    r: "2.4",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "102.5",
    cy: "71.5",
    r: "2.4",
    fill: "#fff"
  }), React.createElement("ellipse", {
    cx: "46",
    cy: "92",
    rx: "10",
    ry: "6.5",
    fill: "#f7b8c8",
    opacity: "0.9"
  }), React.createElement("ellipse", {
    cx: "114",
    cy: "92",
    rx: "10",
    ry: "6.5",
    fill: "#f7b8c8",
    opacity: "0.9"
  }), React.createElement("path", {
    d: "M70 92 Q80 102 90 92",
    fill: "none",
    stroke: "#2f3555",
    strokeWidth: "4.5",
    strokeLinecap: "round"
  }), React.createElement("rect", {
    x: "34",
    y: "118",
    width: "26",
    height: "22",
    rx: "11",
    fill: "#fdf6ec",
    stroke: "#454b6e",
    strokeWidth: "5"
  }), React.createElement("rect", {
    x: "100",
    y: "118",
    width: "26",
    height: "22",
    rx: "11",
    fill: "#fdf6ec",
    stroke: "#454b6e",
    strokeWidth: "5"
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      justifyItems: 'start',
      minWidth: 0,
      flex: '1 1 220px',
      maxWidth: 320
    }
  }, React.createElement("div", {
    className: "qi-chat-anim",
    style: {
      background: '#dbe8ff',
      border: '1.5px solid #9db9ee',
      borderRadius: '16px 16px 16px 4px',
      padding: '10px 16px',
      color: '#33406b',
      fontSize: 16.5,
      fontWeight: 760,
      animation: 'qiChatFloat 5s ease-in-out infinite'
    }
  }, "\u4ECA\u5929\u804A\u70B9\u4EC0\u4E48\uFF1F"), React.createElement("div", {
    key: topicIndex,
    className: "qi-chat-anim",
    style: {
      background: '#fbdde8',
      border: '1.5px solid #eaa6bf',
      borderRadius: '16px 16px 4px 16px',
      padding: '9px 15px',
      color: '#7c3f58',
      fontSize: 14,
      fontWeight: 680,
      animation: 'qiChatPop 0.45s ease both'
    }
  }, CHAT_TOPIC_PROMPTS[topicIndex]), React.createElement("div", {
    style: {
      background: '#dcf3e5',
      border: '1.5px solid #93cfae',
      borderRadius: 999,
      padding: '7px 14px',
      color: '#2f6b4c',
      fontSize: 12.5,
      fontWeight: 750
    }
  }, "DreamerQi Chatter \xB7 \u6BCF\u5929\u90FD\u6709\u65B0\u9C9C\u4E8B")))), React.createElement("div", {
    ref: composerCardRef,
    style: {
      margin: '22px auto 0',
      maxWidth: 880,
      ...cardStyle,
      padding: '18px clamp(16px, 3vw, 22px)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, React.createElement("div", {
    style: avatarStyle(user?.name || 'Q')
  }, firstChar(user?.name || 'Q')), React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 18,
      fontWeight: 780
    }
  }, "\u53D1\u4E00\u6761\u5E16\u5B50"), React.createElement("div", {
    style: {
      marginTop: 3,
      color: spb.faint,
      fontSize: 12.5
    }
  }, user ? `当前账号：${user.name}，想到什么就聊点什么～` : '未登录也可以围观，发布和回复需要登录。'))), React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, React.createElement("span", {
    style: {
      color: spb.faint,
      fontSize: 12.5
    }
  }, "\u6CA1\u7075\u611F\uFF1F\u8BD5\u8BD5\uFF1A"), CHAT_STARTER_CHIPS.map(([label, starter]) => React.createElement("button", {
    key: label,
    type: "button",
    className: "qi-chat-chip",
    onClick: () => applyStarter(starter),
    style: {
      ...smallButton,
      borderRadius: 999,
      padding: '7px 13px',
      fontSize: 12.5
    }
  }, label))), React.createElement("textarea", {
    ref: composerRef,
    value: text,
    onChange: event => setText(event.target.value.slice(0, 1200)),
    placeholder: user ? `今天想发点什么？比如：${CHAT_TOPIC_PROMPTS[topicIndex]}` : '登录后可以发布文字和图片',
    style: {
      marginTop: 14,
      width: '100%',
      minHeight: 112,
      resize: 'vertical',
      borderRadius: 14,
      border: `1px solid ${spb.line}`,
      background: 'oklch(0.145 0.012 265 / 0.72)',
      color: spb.ink,
      padding: 14,
      font: 'inherit',
      lineHeight: 1.65,
      outline: 'none'
    }
  }), imageData ? React.createElement("div", {
    style: {
      marginTop: 12,
      position: 'relative',
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${spb.line}`,
      background: spb.panel
    }
  }, React.createElement("img", {
    src: imageData,
    alt: imageName || '预览图',
    style: {
      width: '100%',
      maxHeight: 340,
      objectFit: 'contain',
      display: 'block',
      background: 'oklch(0.12 0.01 265)'
    }
  }), React.createElement("button", {
    type: "button",
    onClick: clearImage,
    style: {
      ...smallButton,
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'oklch(0.12 0.01 265 / 0.72)'
    }
  }, "\u79FB\u9664")) : null, React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    onChange: pickImage,
    style: {
      display: 'none'
    }
  }), React.createElement("div", {
    style: {
      marginTop: 13,
      display: 'flex',
      gap: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => fileInputRef.current?.click(),
    style: smallButton
  }, "\u9009\u62E9\u56FE\u7247"), React.createElement("span", {
    style: {
      color: error ? 'oklch(0.72 0.2 28)' : spb.faint,
      fontSize: 12.5
    }
  }, error || '支持 JPG、PNG、WebP、GIF，图片不超过 5MB。')), React.createElement("button", {
    type: "button",
    onClick: submitPost,
    disabled: submitting,
    style: {
      ...primary,
      opacity: submitting ? 0.62 : 1
    }
  }, user ? submitting ? '发布中...' : '发布帖子' : '登录后发布'))), React.createElement("div", {
    style: {
      marginTop: 30,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12,
      color: spb.blueSoft,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Recent posts"), React.createElement("h2", {
    style: {
      margin: '8px 0 0',
      fontFamily: spb.disp,
      color: spb.ink,
      fontSize: 31,
      lineHeight: 1.12
    }
  }, "\u5E16\u5B50\u5E7F\u573A")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, filterTabs.map(([key, label, count]) => React.createElement("button", {
    key: key,
    type: "button",
    onClick: () => setFilter(key),
    style: {
      ...smallButton,
      color: filter === key ? spb.bg : spb.sub,
      borderColor: filter === key ? 'oklch(0.72 0.15 242 / 0.42)' : spb.line,
      background: filter === key ? spb.blue : 'oklch(0.205 0.014 265 / 0.70)'
    }
  }, label, count ? ` ${count}` : '')), React.createElement("button", {
    type: "button",
    onClick: loadPosts,
    style: smallButton
  }, "\u5237\u65B0"))), loading ? React.createElement("div", {
    style: {
      marginTop: 28,
      color: spb.sub,
      fontSize: 15.5
    }
  }, "\u6B63\u5728\u8BFB\u53D6\u5E16\u5B50...") : null, !loading && !posts.length ? React.createElement("div", {
    style: {
      marginTop: 22,
      ...cardStyle,
      padding: '30px 24px',
      textAlign: 'center'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 40,
      lineHeight: 1
    }
  }, "\uD83D\uDECB\uFE0F"), React.createElement("div", {
    style: {
      marginTop: 12,
      color: spb.ink,
      fontSize: 17,
      fontWeight: 760
    }
  }, "\u6C99\u53D1\u8FD8\u7A7A\u7740\uFF01"), React.createElement("div", {
    style: {
      marginTop: 8,
      color: spb.sub,
      fontSize: 14.5,
      lineHeight: 1.7
    }
  }, "\u7B2C\u4E00\u6761\u5E16\u5B50\u7684\u4F4D\u7F6E\u865A\u4F4D\u4EE5\u5F85\uFF0C\u53D1\u5F20\u56FE\u6216\u5199\u53E5\u8BDD\uFF0C\u8BA9\u5E7F\u573A\u70ED\u95F9\u8D77\u6765\uFF5E"), React.createElement("button", {
    type: "button",
    onClick: goCompose,
    style: {
      ...primary,
      marginTop: 16
    }
  }, user ? '抢下第一帖' : '登录后抢第一帖')) : null, !loading && posts.length > 0 && !visiblePosts.length ? React.createElement("div", {
    style: {
      marginTop: 22,
      ...cardStyle,
      padding: 24,
      color: spb.sub,
      lineHeight: 1.7
    }
  }, "\u8FD9\u4E2A\u5206\u7C7B\u8FD8\u6CA1\u6709\u5E16\u5B50\uFF0C\u6362\u4E2A\u6807\u7B7E\u901B\u901B\uFF0C\u6216\u8005\u81EA\u5DF1\u6765\u8865\u4E00\u6761\uFF5E") : null, React.createElement("div", {
    style: {
      margin: '18px auto 0',
      display: 'grid',
      gap: 16,
      maxWidth: 880
    }
  }, visiblePosts.map(post => React.createElement("button", {
    key: post.id,
    type: "button",
    className: "qi-chat-card",
    onClick: () => openPost(post),
    style: {
      ...cardStyle,
      width: '100%',
      padding: 0,
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'inherit',
      color: 'inherit',
      animation: 'qiChatPop 0.4s ease both'
    }
  }, React.createElement("div", {
    style: {
      padding: '15px 18px 13px',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      borderBottom: post.imageUrl ? `1px solid ${spb.line}` : 'none'
    }
  }, React.createElement("div", {
    style: avatarStyle(post.author || 'Q')
  }, firstChar(post.author || 'Q')), React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 14.5,
      fontWeight: 780,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, post.author || '用户', post.authorRole === 'admin' ? ' · 管理员' : ''), React.createElement("div", {
    style: {
      marginTop: 3,
      color: spb.faint,
      fontSize: 12.2
    }
  }, formatTime(post.createdAt) || '刚刚')), React.createElement("span", {
    style: {
      color: spb.blueSoft,
      fontSize: 12.5,
      fontWeight: 760
    }
  }, "\u5E16\u5B50")), post.imageUrl ? React.createElement("div", {
    style: {
      margin: '0 18px 16px',
      border: `1px solid ${spb.line}`,
      borderRadius: 14,
      overflow: 'hidden',
      background: 'oklch(0.12 0.01 265)'
    }
  }, React.createElement("img", {
    src: chatterImageSrc(post.imageUrl),
    alt: "",
    loading: "lazy",
    decoding: "async",
    style: {
      width: '100%',
      height: 'auto',
      maxHeight: 520,
      objectFit: 'contain',
      display: 'block'
    }
  })) : null, React.createElement("div", {
    style: {
      padding: post.imageUrl ? '0 18px 17px' : '17px 18px'
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 15.5,
      lineHeight: 1.72,
      whiteSpace: 'pre-wrap'
    }
  }, post.text || '分享了一张图片'), post.commentCount || (post.comments || []).length ? React.createElement("div", {
    style: {
      marginTop: 14,
      borderTop: `1px solid ${spb.line}`,
      paddingTop: 12,
      display: 'grid',
      gap: 8
    }
  }, (post.comments || []).slice(-2).map(comment => React.createElement("div", {
    key: comment.id,
    style: {
      color: spb.sub,
      fontSize: 13.5,
      lineHeight: 1.58,
      background: 'oklch(0.155 0.012 265 / 0.54)',
      borderRadius: 10,
      padding: '8px 10px'
    }
  }, React.createElement("span", {
    style: {
      color: spb.blueSoft,
      fontWeight: 750
    }
  }, comment.author || '用户', "\uFF1A"), comment.text))) : null, React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10,
      color: spb.faint,
      fontSize: 12.5,
      alignItems: 'center'
    }
  }, React.createElement("span", null, postCountText(post)), React.createElement("span", {
    style: {
      color: spb.blueSoft,
      fontWeight: 760
    }
  }, "\u67E5\u770B"))))))), selectedPost ? React.createElement("div", {
    onClick: closePost,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      background: 'rgba(5,7,12,0.74)',
      backdropFilter: 'blur(18px)',
      display: 'grid',
      placeItems: 'center',
      padding: 'clamp(18px, 4vw, 42px)'
    }
  }, React.createElement("article", {
    onClick: event => event.stopPropagation(),
    style: {
      width: 'min(860px, 100%)',
      maxHeight: '88vh',
      overflow: 'auto',
      ...cardStyle
    }
  }, selectedPost.imageUrl ? React.createElement("div", {
    style: {
      background: 'oklch(0.11 0.01 265)',
      borderBottom: `1px solid ${spb.line}`
    }
  }, React.createElement("img", {
    src: chatterImageSrc(selectedPost.imageUrl),
    alt: "",
    style: {
      width: '100%',
      maxHeight: '72vh',
      objectFit: 'contain',
      display: 'block'
    }
  })) : null, React.createElement("div", {
    style: {
      padding: '24px clamp(20px, 4vw, 34px) 30px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      alignItems: 'center'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: avatarStyle(selectedPost.author || 'Q')
  }, firstChar(selectedPost.author || 'Q')), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      color: spb.ink,
      fontSize: 15,
      fontWeight: 780,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, selectedPost.author || '用户', selectedPost.authorRole === 'admin' ? ' · 管理员' : ''), React.createElement("div", {
    style: {
      marginTop: 3,
      color: spb.faint,
      fontSize: 12.5
    }
  }, formatTime(selectedPost.createdAt)))), React.createElement("button", {
    type: "button",
    onClick: closePost,
    style: smallButton
  }, "\u5173\u95ED")), React.createElement("div", {
    style: {
      marginTop: 18,
      color: spb.ink,
      fontSize: 18,
      lineHeight: 1.88,
      whiteSpace: 'pre-wrap'
    }
  }, selectedPost.text || '分享了一张图片'), React.createElement("div", {
    style: {
      marginTop: 24,
      borderTop: `1px solid ${spb.line}`,
      paddingTop: 22
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 14,
      alignItems: 'baseline'
    }
  }, React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: spb.disp,
      color: spb.ink,
      fontSize: 24,
      letterSpacing: '-0.02em'
    }
  }, "\u8BC4\u8BBA\u4E92\u52A8"), React.createElement("span", {
    style: {
      color: spb.faint,
      fontSize: 13
    }
  }, detailLoading ? '读取中...' : `${selectedPost.commentCount || 0} 条回复`)), (selectedPost.comments || []).length ? React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'grid',
      gap: 12
    }
  }, (selectedPost.comments || []).map(comment => React.createElement("div", {
    key: comment.id,
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 14,
      padding: '13px 14px',
      background: 'oklch(0.195 0.014 265 / 0.68)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      color: spb.faint,
      fontSize: 12.5
    }
  }, React.createElement("span", {
    style: {
      color: spb.blueSoft,
      fontWeight: 780
    }
  }, comment.author || '用户', comment.authorRole === 'admin' ? ' · 管理员' : ''), React.createElement("span", null, formatTime(comment.createdAt))), React.createElement("div", {
    style: {
      marginTop: 8,
      color: spb.sub,
      fontSize: 15,
      lineHeight: 1.72,
      whiteSpace: 'pre-wrap'
    }
  }, comment.text)))) : React.createElement("div", {
    style: {
      marginTop: 16,
      color: spb.sub,
      fontSize: 14.5,
      lineHeight: 1.7
    }
  }, "\u8FD8\u6CA1\u6709\u56DE\u590D\uFF0C\u53EF\u4EE5\u5750\u7B2C\u4E00\u4E2A\u6C99\u53D1\u3002"), React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'grid',
      gap: 10
    }
  }, React.createElement("textarea", {
    value: replyText,
    onChange: event => setReplyText(event.target.value.slice(0, 600)),
    placeholder: user ? '写一条回复...' : '登录后可以评论互动',
    style: {
      width: '100%',
      minHeight: 92,
      resize: 'vertical',
      borderRadius: 14,
      border: `1px solid ${spb.line}`,
      background: 'oklch(0.145 0.012 265 / 0.72)',
      color: spb.ink,
      padding: 13,
      font: 'inherit',
      lineHeight: 1.65,
      outline: 'none'
    }
  }), React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, React.createElement("span", {
    style: {
      color: spb.faint,
      fontSize: 12.5
    }
  }, user ? `以 ${user.name} 回复` : '未登录也可以看评论，回复需要登录。'), React.createElement("button", {
    type: "button",
    onClick: submitReply,
    disabled: replySubmitting,
    style: {
      ...primary,
      opacity: replySubmitting ? 0.62 : 1
    }
  }, user ? replySubmitting ? '回复中...' : '回复' : '登录后回复'))))))) : null);
}
const INFO_PAGE_DATA = {
  about: {
    eyebrow: 'About DreamerQi',
    title: '关于我们',
    intro: 'DreamerQi 是一个把市场观察、兴趣内容和本地探索放在同一处的综合数字平台。我们希望每个入口都清晰、有秩序，也能长期沉淀成属于自己的信息系统。',
    lead: '平台由行情、娱乐、探索和文档几个方向组成：行情负责理性观察，娱乐负责兴趣和内容，探索负责生活方式与城市发现，文档负责保存长期想法。',
    cards: [{
      title: '行情',
      body: '行情入口用于观察 A 股市场情绪、板块强弱、涨停复盘和策略观察。它更像一个安静的工作台，帮助用户把市场变化整理得更清楚。'
    }, {
      title: '娱乐',
      body: '娱乐用来承接追星、影视、时尚和兴趣内容。它关注的是热爱、审美和情绪价值，让平台不只是工具，也有轻松、鲜活的一面。'
    }, {
      title: '探索',
      body: '探索入口面向城市生活、新店、美食和好去处。它把分散的本地内容整理出来，让用户更容易发现值得去看、去吃、去体验的地方。'
    }, {
      title: '文档与沉淀',
      body: '文档区用于保存原则、想法、笔记和长期计划。无论来自行情、内容还是生活探索，重要的东西都应该可以被记录、回看和继续整理。'
    }],
    sections: [{
      title: '我们想做什么',
      body: 'DreamerQi 不是单一工具，也不是简单的信息列表。我们希望把每天会用到的不同内容放在同一个秩序里：需要判断时有数据，需要放松时有兴趣内容，需要出门时有探索内容，需要沉淀时有文档。'
    }, {
      title: '我们的设计原则',
      body: '清晰、克制、舒服、可持续。页面不追求堆满信息，而是让不同栏目各自明确：行情要高效，娱乐要有氛围，探索要好逛，文档要安静可靠。'
    }, {
      title: '未来方向',
      body: '平台会继续完善市场观察、兴趣内容、本地探索和个人沉淀能力。我们希望 DreamerQi 最终成为一个既实用又有温度的个人数字入口。'
    }]
  },
  contact: {
    eyebrow: 'Contact',
    title: '联系我们',
    intro: '如果你在账号使用、页面访问、内容展示、功能体验或合作沟通中遇到问题，可以通过邮箱联系我们。',
    lead: `服务邮箱：${SERVICE_EMAIL}`,
    cards: [{
      title: '服务邮箱',
      body: SERVICE_EMAIL,
      mail: true
    }, {
      title: '问题反馈',
      body: '请尽量说明你看到的问题、发生时间、使用的页面和账号信息。涉及截图时，请避免包含密码、验证码、Cookie 或 API Key。'
    }, {
      title: '合作与建议',
      body: '如果你对产品体验、内容栏目、城市探索、兴趣内容或合作方式有建议，也可以发邮件说明。我们会优先处理影响正常使用的问题。'
    }],
    sections: [{
      title: '邮件建议包含',
      body: '你的账号或联系方式、问题页面、操作步骤、错误提示、期望结果。信息越完整，我们越容易定位问题。'
    }, {
      title: '安全提醒',
      body: '我们不会通过邮件向你索要密码、邮箱验证码、同步密钥、API Key 或支付验证码。请不要把这些敏感信息写进邮件。'
    }]
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: '隐私政策',
    intro: '我们重视你的个人信息和使用数据。本政策说明 DreamerQi 在你使用网站、注册账号、登录、保存文档和使用行情功能时，可能如何收集、使用和保护相关信息。',
    lead: '最后更新：2026-07-04。本页面为网站基础隐私说明，如后续功能变化，我们会继续更新。',
    cards: [{
      title: '我们可能收集的信息',
      body: '账号信息，例如用户名、邮箱、手机号；登录和安全记录，例如登录时间、状态和必要的会话信息；你主动保存的文档内容、页面偏好和必要的功能配置。'
    }, {
      title: '我们如何使用信息',
      body: '用于完成注册登录、邮箱验证码、账号安全、页面展示、文档保存、数据同步、问题排查和服务改进。我们不会出售你的个人信息。'
    }, {
      title: '本地与云端保存',
      body: '部分页面状态可能先保存在浏览器本地，用于提升访问体验；需要跨设备保留的内容会保存到云端。你在公共设备上使用后，应主动退出登录。'
    }],
    sections: [{
      title: '验证码与邮件',
      body: '当你注册或重置密码时，系统会向你填写的邮箱发送验证码。邮件发送过程中会使用后台配置的发信服务，并记录必要的发送状态用于排查。'
    }, {
      title: '行情与策略数据',
      body: '行情、复盘和策略页面会读取公开数据源、后台数据库和页面配置。平台展示的信息用于研究、整理和辅助观察，不构成投资建议。'
    }, {
      title: '信息保护',
      body: '密码会以加密摘要方式保存；管理员密码、同步密钥、邮件配置、API Key 等敏感配置不会写入前端页面。我们会尽量限制只有必要的后台功能可以访问相关数据。'
    }, {
      title: '你的选择',
      body: `如需咨询账号、删除请求或隐私相关问题，请联系 ${SERVICE_EMAIL}。为了保护账号安全，我们可能需要验证你的身份后再处理。`
    }]
  },
  terms: {
    eyebrow: 'Terms of Service',
    title: '服务条款',
    intro: '欢迎使用 DreamerQi。使用本网站即表示你理解并同意这些基础服务规则。我们会尽量让服务稳定、清晰、可维护，也需要用户以安全、合规的方式使用。',
    lead: '最后更新：2026-07-04。本条款用于说明网站使用边界，不替代具体法律文件或专业意见。',
    cards: [{
      title: '账号责任',
      body: '你需要妥善保管账号、密码和验证码。因你主动泄露、共用账号或在不安全设备上登录造成的问题，需要由你自行承担相应风险。'
    }, {
      title: '内容和数据',
      body: '网站中的行情、复盘、策略和文档功能用于信息整理与研究辅助。数据可能来自公开渠道、后台采集、人工整理或系统计算，不能保证完全无误或实时无延迟。'
    }, {
      title: '禁止行为',
      body: '不得攻击、爬取、破坏网站服务，不得尝试绕过权限、获取他人账号或敏感配置，不得上传违法、侵权或恶意内容。'
    }],
    sections: [{
      title: '非投资建议',
      body: '行情、涨停复盘、主因归纳和策略分析仅作为信息展示和研究辅助，不构成任何买卖建议、收益承诺或投资顾问服务。投资决策应由用户独立判断并自行承担风险。'
    }, {
      title: '服务变更',
      body: '我们可能根据安全、数据源、产品体验或维护需要调整页面、接口、栏目和同步规则。重要调整会尽量在页面或交接记录中说明。'
    }, {
      title: '知识产权',
      body: '网站界面、品牌元素、页面设计、整理逻辑和原创内容归相应权利人所有。第三方数据和内容归其原始权利方所有，展示时仅用于学习、研究和信息整理。'
    }, {
      title: '联系我们',
      body: `如对条款、账号、内容或服务有疑问，请联系 ${SERVICE_EMAIL}。`
    }]
  }
};
function SpbInfoPage({
  pageKey
}) {
  const data = INFO_PAGE_DATA[pageKey] || INFO_PAGE_DATA.about;
  const showSummaryCard = pageKey !== 'about';
  return React.createElement("section", {
    style: {
      padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 48px) 94px',
      borderTop: `1px solid ${spb.line}`
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 1120,
      margin: '0 auto'
    }
  }, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: showSummaryCard ? 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' : 'minmax(0, 900px)',
      gap: 'clamp(28px, 6vw, 72px)',
      alignItems: 'start'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      color: spb.blueSoft,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontSize: 12.5
    }
  }, data.eyebrow), React.createElement("h1", {
    style: {
      margin: '16px 0 0',
      fontFamily: spb.disp,
      fontSize: 'clamp(40px, 6vw, 68px)',
      lineHeight: 1.06,
      color: spb.ink,
      letterSpacing: '-0.035em',
      fontWeight: 650
    }
  }, data.title), React.createElement("p", {
    style: {
      marginTop: 22,
      color: spb.sub,
      fontSize: 18,
      lineHeight: 1.82,
      maxWidth: 780
    }
  }, data.intro), React.createElement("p", {
    style: {
      marginTop: 18,
      color: spb.ink,
      fontSize: 17,
      lineHeight: 1.78,
      maxWidth: 780
    }
  }, data.lead)), showSummaryCard ? React.createElement("div", {
    style: {
      border: `1px solid ${spb.line}`,
      borderRadius: 18,
      padding: 22,
      background: 'linear-gradient(180deg, oklch(0.225 0.018 265 / 0.9), oklch(0.18 0.014 265 / 0.9))',
      boxShadow: '0 18px 55px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.06)'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 12,
      color: spb.faint,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "DreamerQi"), React.createElement("div", {
    style: {
      marginTop: 14,
      color: spb.ink,
      fontSize: 23,
      lineHeight: 1.35,
      fontFamily: spb.disp,
      fontWeight: 650
    }
  }, "\u628A\u590D\u6742\u4FE1\u606F\u6574\u7406\u6210\u53EF\u7406\u89E3\u3001\u53EF\u590D\u76D8\u3001\u53EF\u7EE7\u7EED\u6539\u8FDB\u7684\u9875\u9762\u3002"), React.createElement("div", {
    style: {
      marginTop: 20,
      height: 1,
      background: spb.line
    }
  }), React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'grid',
      gap: 11,
      color: spb.sub,
      fontSize: 14.5,
      lineHeight: 1.65
    }
  }, React.createElement("span", null, "\u5B9E\u65F6\u89C2\u5BDF"), React.createElement("span", null, "\u6765\u6E90\u7559\u75D5"), React.createElement("span", null, "\u7B56\u7565\u5F52\u7EB3"), React.createElement("span", null, "\u957F\u671F\u6C89\u6DC0"))) : null), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
      gap: 16,
      marginTop: 44
    }
  }, (data.cards || []).map(card => React.createElement("article", {
    key: card.title,
    style: {
      minHeight: 190,
      border: `1px solid ${spb.line}`,
      borderRadius: 18,
      padding: 24,
      background: spb.panel,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.disp,
      fontSize: 22,
      color: spb.ink,
      fontWeight: 650,
      letterSpacing: '-0.01em'
    }
  }, card.title), card.mail ? React.createElement("a", {
    href: `mailto:${SERVICE_EMAIL}`,
    style: {
      display: 'inline-flex',
      marginTop: 16,
      color: spb.blueSoft,
      fontSize: 19,
      fontWeight: 750,
      textDecoration: 'none',
      wordBreak: 'break-all'
    }
  }, card.body) : React.createElement("p", {
    style: {
      margin: '14px 0 0',
      color: spb.sub,
      fontSize: 15.5,
      lineHeight: 1.78
    }
  }, card.body)))), React.createElement("div", {
    style: {
      marginTop: 46,
      display: 'grid',
      gap: 18
    }
  }, (data.sections || []).map(section => React.createElement("section", {
    key: section.title,
    style: {
      borderTop: `1px solid ${spb.line}`,
      paddingTop: 22
    }
  }, React.createElement("h2", {
    style: {
      margin: 0,
      color: spb.ink,
      fontFamily: spb.disp,
      fontSize: 'clamp(23px, 3vw, 31px)',
      letterSpacing: '-0.02em'
    }
  }, section.title), React.createElement("p", {
    style: {
      margin: '12px 0 0',
      color: spb.sub,
      fontSize: 16.5,
      lineHeight: 1.85,
      maxWidth: 900
    }
  }, section.body))))));
}
function SpbSimplePage({
  title,
  body
}) {
  return React.createElement("section", {
    style: {
      padding: 'clamp(70px, 9vw, 110px) clamp(20px, 4vw, 48px) 90px',
      borderTop: `1px solid ${spb.line}`
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 760
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      color: spb.blueSoft,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontSize: 12.5
    }
  }, "Qi"), React.createElement("h1", {
    style: {
      margin: '16px 0 0',
      fontFamily: spb.disp,
      fontSize: 'clamp(38px, 6vw, 62px)',
      color: spb.ink,
      letterSpacing: '-0.035em'
    }
  }, title), React.createElement("p", {
    style: {
      marginTop: 20,
      color: spb.sub,
      fontSize: 18,
      lineHeight: 1.75
    }
  }, body)));
}
function SpbStats() {
  return React.createElement("div", {
    style: {
      padding: '0 clamp(20px, 4vw, 48px) 80px'
    }
  }, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
      gap: 16
    }
  }, [['A股', '全市场情绪实时盯盘', spb.blue], ['每日', '本地新店与美食上新', spb.violet], ['第一手', '时尚热点与追星资讯', spb.blue]].map((s, i) => React.createElement("div", {
    key: i,
    style: {
      background: spb.panel,
      border: `1px solid ${spb.line}`,
      borderRadius: 16,
      padding: 24
    }
  }, React.createElement("div", {
    style: {
      fontFamily: spb.disp,
      fontSize: 34,
      fontWeight: 600,
      color: s[2]
    }
  }, s[0]), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: spb.sub,
      marginTop: 6
    }
  }, s[1])))));
}
function SpbFooter() {
  const cols = [['产品', [['Qi行情', MARKET_URL]]], ['公司', [['关于我们', '#about'], ['联系我们', '#contact']]], ['资源', [['隐私政策', '#privacy'], ['服务条款', '#terms']]]];
  return React.createElement("div", {
    style: {
      padding: '60px clamp(20px, 4vw, 48px) 44px',
      borderTop: `1px solid ${spb.line}`
    }
  }, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
      gap: 40
    }
  }, React.createElement("div", null, React.createElement(QiLogo, {
    h: 32
  }), React.createElement("p", {
    style: {
      fontSize: 14,
      color: spb.sub,
      marginTop: 16,
      maxWidth: 240,
      lineHeight: 1.6
    }
  }, "\u4E00\u5904\u5165\u53E3\uFF0C\u4E07\u7269\u76F8\u8FDE\u3002")), cols.map((c, i) => React.createElement("div", {
    key: i
  }, React.createElement("div", {
    style: {
      fontFamily: spb.mono,
      fontSize: 11.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: spb.faint
    }
  }, c[0]), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      marginTop: 16
    }
  }, c[1].map(([label, href]) => React.createElement("a", {
    key: label,
    href: href,
    style: {
      fontSize: 14.5,
      color: spb.sub,
      textDecoration: 'none'
    }
  }, label)))))), React.createElement("div", {
    style: {
      marginTop: 44,
      paddingTop: 22,
      borderTop: `1px solid ${spb.line}`,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: spb.mono,
      fontSize: 12,
      color: spb.faint
    }
  }, React.createElement("span", null, "\xA9 2026 Qi"), React.createElement("span", null, "\u6CAAICP\u59072026029617\u53F7")));
}
function homePageFromHash() {
  const hash = String(typeof location !== 'undefined' && location.hash || '').replace('#', '').trim().toLowerCase();
  if (hash === 'entertainment') return 'stanning';
  if (HOME_PAGES.has(hash)) return hash || 'home';
  return defaultHomePageForHost();
}
function QiHome() {
  const [authMode, setAuthMode] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [page, setPage] = React.useState(homePageFromHash);
  const setHomePage = React.useCallback(nextPage => {
    const normalized = HOME_PAGES.has(nextPage) ? nextPage : 'home';
    setPage(normalized);
    if (typeof history !== 'undefined') {
      if (normalized === 'home') history.pushState(null, '', `${location.pathname}${location.search}`);else history.pushState(null, '', `#${normalized}`);
    }
  }, []);
  React.useEffect(() => {
    const onHash = () => setPage(homePageFromHash());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);
  React.useEffect(() => {
    let alive = true;
    const refreshSharedAuth = () => {
      const savedSession = readSharedAccountSession(null);
      if (savedSession?.name) setUser(savedSession);
      const token = readSharedAuthToken();
      if (!token) {
        clearSharedAuthState();
        setUser(null);
        return;
      }
      writeSharedAuthToken(token);
      fetch(`${ADMIN_SERVER_BASE}/api/auth/me?_=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'x-admin-token': token
        }
      }).then(res => res.json()).then(data => {
        if (!alive) return;
        if (data && data.user) {
          const session = {
            name: data.user.username || 'user',
            admin: !!data.admin
          };
          writeSharedAccountSession(session);
          setUser(session);
        } else {
          clearSharedAuthState();
          setUser(null);
        }
      }).catch(() => {});
    };
    refreshSharedAuth();
    window.addEventListener('focus', refreshSharedAuth);
    window.addEventListener('pageshow', refreshSharedAuth);
    return () => {
      alive = false;
      window.removeEventListener('focus', refreshSharedAuth);
      window.removeEventListener('pageshow', refreshSharedAuth);
    };
  }, []);
  const logout = () => {
    clearSharedAuthState();
    setUser(null);
  };
  return React.createElement("div", {
    style: {
      width: '100%',
      minHeight: '100vh',
      overflowX: 'hidden',
      background: spb.bg,
      color: spb.ink,
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }
  }, React.createElement(SpbNavResponsive, {
    page: page,
    onPage: setHomePage,
    user: user,
    onLogin: () => setAuthMode('login'),
    onRegister: () => setAuthMode('register'),
    onLogout: logout
  }), page === 'discover' ? React.createElement(SpbDiscover, null) : page === 'chat' ? React.createElement(SpbChat, {
    user: user,
    onLogin: () => setAuthMode('login')
  }) : page === 'stanning' ? React.createElement(SpbSimplePage, {
    title: "\u5A31\u4E50",
    body: "\u8FD9\u4E2A\u680F\u76EE\u4F1A\u7EE7\u7EED\u63A5\u5165\u65F6\u5C1A\u70ED\u70B9\u3001\u8FFD\u661F\u770B\u5267\u548C\u5174\u8DA3\u5185\u5BB9\u3002\u5F53\u524D\u5148\u4FDD\u7559\u7EDF\u4E00\u5165\u53E3\u3002"
  }) : page === 'about' ? React.createElement(SpbInfoPage, {
    pageKey: "about"
  }) : page === 'contact' ? React.createElement(SpbInfoPage, {
    pageKey: "contact"
  }) : page === 'privacy' ? React.createElement(SpbInfoPage, {
    pageKey: "privacy"
  }) : page === 'terms' ? React.createElement(SpbInfoPage, {
    pageKey: "terms"
  }) : React.createElement(React.Fragment, null, React.createElement(SpbHero, null), React.createElement(SpbShowcase, null), React.createElement(SpbStats, null)), React.createElement(SpbFooter, null), authMode ? React.createElement(AuthModal, {
    mode: authMode,
    setMode: setAuthMode,
    onClose: () => setAuthMode(null),
    onAuth: setUser
  }) : null);
}
window.QiHome = QiHome;
window.QiLogo = QiLogo;
