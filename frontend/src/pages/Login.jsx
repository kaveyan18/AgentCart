import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import Nav from '../components/Nav';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);

      // Role-based redirect
      if (redirectParam) {
        navigate(redirectParam);
      } else if (user?.role === 'merchant') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={styles.container}>
      <Nav />

      <div style={styles.authWrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.iconBadge}>
              <Sparkles size={20} color="#fff" />
            </div>
            <h1 style={styles.title}>Sign In to AgentCart</h1>
            <p style={styles.subtitle}>Access your customer orders or merchant management console</p>
          </div>

          {/* Demo Account Quick-Fill Buttons */}
          <div style={styles.demoBox}>
            <div style={styles.demoTitle}>🚀 Demo Accounts:</div>
            <div style={styles.demoButtons}>
              <button
                type="button"
                onClick={() => handleDemoFill('merchant@parcel.test', 'demo1234')}
                style={styles.demoBtn}
              >
                <ShieldCheck size={14} color="var(--sage)" />
                <span>Store Merchant</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('buyer@parcel.test', 'demo1234')}
                style={styles.demoBtn}
              >
                <UserCheck size={14} color="var(--coral)" />
                <span>Demo Buyer</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={17} color="var(--coral)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrapper}>
                <Mail size={17} style={styles.inputIcon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={17} style={styles.inputIcon} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Authenticating...' : 'Sign in'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div style={styles.footer}>
            <span>Don't have an account?</span>{' '}
            <Link to={`/signup${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`} style={styles.link}>
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px 60px'
  },
  authWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '30px 0'
  },
  card: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '36px 40px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid rgba(239, 232, 218, 0.9)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  iconBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 6px 16px rgba(240, 101, 74, 0.28)'
  },
  title: {
    fontFamily: 'var(--font-brand)',
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 6px 0'
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--slate)',
    margin: 0,
    lineHeight: '1.4'
  },
  demoBox: {
    background: 'var(--cream)',
    borderRadius: '14px',
    padding: '12px 14px',
    marginBottom: '20px',
    border: '1px solid var(--sand)'
  },
  demoTitle: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  demoButtons: {
    display: 'flex',
    gap: '8px'
  },
  demoBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px 10px',
    borderRadius: '8px',
    background: 'var(--white)',
    border: '1px solid var(--sand)',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#cf1322',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13.5px',
    marginBottom: '18px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--ink)'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--slate)',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    borderRadius: '12px',
    border: '1.5px solid var(--sand)',
    background: 'var(--cream)',
    fontSize: '14px',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px 20px',
    borderRadius: '14px',
    background: 'var(--coral)',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 4px 14px rgba(240, 101, 74, 0.3)',
    transition: 'all 0.2s ease'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13.5px',
    color: 'var(--slate)'
  },
  link: {
    color: 'var(--coral)',
    fontWeight: '600',
    textDecoration: 'none'
  }
};
