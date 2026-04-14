'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        onLogin();
      }
    } catch {
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '0 18px',
      }}>
        <div style={{
          background: 'var(--sur)',
          borderRadius: '12px',
          boxShadow: 'var(--sh)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'var(--g)',
            padding: '24px 28px',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}>
              共栄紙業 / <span style={{ color: '#4ade80' }}>Arc Home</span>
            </div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
            }}>
              現場回収管理システム
            </h1>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: '4px',
              }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@kyoeishigyo.co.jp"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid var(--bdr)',
                  borderRadius: '7px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: 'var(--tx)',
                  background: 'var(--sur2)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: '4px',
              }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid var(--bdr)',
                  borderRadius: '7px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: 'var(--tx)',
                  background: 'var(--sur2)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--rdl)',
                color: 'var(--rd)',
                padding: '10px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--g)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
