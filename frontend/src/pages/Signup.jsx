import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import Nav from '../components/Nav';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h1 style={styles.title}>Create your account</h1>
            <p style={styles.subtitle}>Get personalized AI checkout & order tracking</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={17} color="var(--coral)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={17} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrapper}>
                <Mail size={17} style={styles.inputIcon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password (min. 6 characters)</label>
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

            <div style={styles.securityNote}>
              <ShieldCheck size={16} color="var(--sage)" />
              <span>Orders and policy audit trails are tied securely to your account.</span>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div style={styles.footer}>
            <span>Already have an account?</span>{' '}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} style={styles.link}>
              Sign in
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
    padding: '40px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid rgba(239, 232, 218, 0.9)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px'
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
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--slate)',
    margin: 0,
    lineHeight: '1.5'
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
    marginBottom: '20px'
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
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: 'var(--slate)',
    background: 'var(--cream)',
    padding: '10px 14px',
    borderRadius: '10px',
    lineHeight: '1.4'
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
    marginTop: '6px',
    boxShadow: '0 4px 14px rgba(240, 101, 74, 0.3)',
    transition: 'all 0.2s ease'
  },
  footer: {
    marginTop: '24px',
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
