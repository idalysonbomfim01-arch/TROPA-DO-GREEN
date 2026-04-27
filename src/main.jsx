import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Trophy,
  Plus,
  LogOut,
  Wallet,
  Flame,
  ShieldCheck,
  TrendingUp,
  Target,
  Medal,
  Trash2,
  UserPlus,
  Lock,
  RefreshCcw
} from 'lucide-react';
import { supabase } from './supabaseClient';
import './style.css';

const markets = [
  'Resultado final',
  'Over gols',
  'Under gols',
  'Ambas marcam',
  'Handicap',
  'Escanteios',
  'Cartões',
  'Dupla chance',
  'Empate anula',
  'Outro'
];

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function calcUserStats(profile, bets) {
  const list = bets.filter((bet) => bet.user_id === profile.id);
  const totalStake = list.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);
  const greens = list.filter((bet) => bet.result === 'green');
  const reds = list.filter((bet) => bet.result === 'red');

  const profit = list.reduce((sum, bet) => {
    const stake = Number(bet.stake || 0);
    const odd = Number(bet.odd || 1);

    if (bet.result === 'green') return sum + stake * odd - stake;
    if (bet.result === 'red') return sum - stake;
    return sum;
  }, 0);

  const settled = greens.length + reds.length;
  const winRate = settled ? (greens.length / settled) * 100 : 0;
  const roi = totalStake ? (profit / totalStake) * 100 : 0;
  const score = Math.max(
    0,
    Math.round(profit * 0.6 + winRate * 2 + greens.length * 8 - reds.length * 5)
  );

return {
  profile,
  profit,
  roi,
  score,
  settled,
  greens,
  reds,
  lastResults: userBets
    .filter(b => b.result !== 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(b => b.result)
}
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <RefreshCcw className="spin" /> Carregando TROPA RANK...
      </div>
    );
  }

  if (!session) return <Landing />;
  return <Dashboard session={session} />;
}

function Landing() {
  const [mode, setMode] = useState('login');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = async (event) => {
    event.preventDefault();
    setErr('');
    setOk('');
    setBusy(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });

        if (error) setErr('Email ou senha inválidos.');
      } else {
        if (!form.name || !form.email || form.password.length < 6) {
          throw new Error('Preencha nome, email e senha com no mínimo 6 caracteres.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              name: form.name,
              email: form.email
            },
            { onConflict: 'id' }
          );
        }

        setOk('Conta criada. Se seu Supabase exigir confirmação por email, confirme antes de entrar.');
      }
    } catch (error) {
      setErr(error.message || 'Erro ao autenticar.');
    }

    setBusy(false);
  };

  return (
    <main className="landing">
      <section className="hero">
        <div className="brand">
          <span className="logo">
            <Trophy size={26} />
          </span>
          <b>TROPA RANK</b>
        </div>

        <div className="ball-wrap">
          <div className="ball">⚽</div>
          <div className="shadow"></div>
        </div>

        <h1>Ranking de apostadores com greens, reds, ROI e lucro em tempo real.</h1>
        <p>
          Cada usuário cadastra suas bets, mercados, múltiplas e bilhetes únicos.
          O ranking atualiza rapidamente pelo Supabase Realtime.
        </p>

        <div className="hero-cards">
          <span><Flame /> Greens</span>
          <span><ShieldCheck /> Gestão</span>
          <span><Medal /> Ranking</span>
        </div>
      </section>

      <section className="auth-card">
        <h2>{mode === 'login' ? 'Entrar na tropa' : 'Criar conta'}</h2>
        <p>
          {mode === 'login'
            ? 'Acesse seu painel e registre suas apostas.'
            : 'Entre no ranking e comece a medir seus resultados.'}
        </p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Nome
              <input
                placeholder="Seu nome"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>

          {err && <div className="error">{err}</div>}
          {ok && <div className="success">{ok}</div>}

          <button disabled={busy} className="primary">
            {mode === 'login' ? <Lock /> : <UserPlus />}
            {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          className="ghost"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setErr('');
            setOk('');
          }}
        >
          {mode === 'login' ? 'Não tenho conta' : 'Já tenho conta'}
        </button>
      </section>
    </main>
  );
}

function Dashboard({ session }) {
  const [tab, setTab] = useState('rank');
  const [profiles, setProfiles] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = session.user.id;
  const fallbackProfile = {
    id: userId,
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
    email: session.user.email || ''
  };
  const currentProfile = profiles.find((profile) => profile.id === userId) || fallbackProfile;

  const ensureProfile = async () => {
    await supabase.from('profiles').upsert(fallbackProfile, { onConflict: 'id' });
  };

  const load = async () => {
    setLoading(true);
    await ensureProfile();

    const [{ data: profilesData }, { data: betsData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('bets').select('*').order('created_at', { ascending: false })
    ]);

    setProfiles(profilesData || []);
    setBets(betsData || []);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel('tropa-rank-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const ranking = useMemo(
    () => profiles.map((profile) => ({ profile, ...calcUserStats(profile, bets) })).sort((a, b) => b.score - a.score),
    [profiles, bets]
  );

  const myStats = calcUserStats(currentProfile, bets);
  const logout = () => supabase.auth.signOut();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand small">
          <span className="logo">
            <Trophy size={22} />
          </span>
          <b>TROPA RANK</b>
        </div>

        <nav>
          <button className={tab === 'rank' ? 'active' : ''} onClick={() => setTab('rank')}>
            <Medal /> Ranking
          </button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>
            <Plus /> Adicionar bet
          </button>
          <button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>
            <Wallet /> Minhas bets
          </button>
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut /> Sair
        </button>
      </aside>

      <main className="content">
        <header className="top">
          <div>
            <p>Bem-vindo,</p>
            <h2>{currentProfile.name || 'Usuário'}</h2>
          </div>
          <div className="live-dot"><span></span> Supabase Realtime ativo</div>
        </header>

        {loading ? (
          <div className="panel">Carregando dados...</div>
        ) : (
          <>
            <Stats stats={myStats} />
            {tab === 'rank' && <Rank ranking={ranking} />}
            {tab === 'add' && <AddBet userId={userId} afterSave={() => { setTab('rank'); load(); }} />}
            {tab === 'my' && <MyBets bets={bets} userId={userId} afterChange={load} />}
          </>
        )}
      </main>
    </div>
  );
}

function Stats({ stats }) {
  return (
    <section className="stats">
      <Card icon={<TrendingUp />} title="Lucro" value={money(stats.profit)} good={stats.profit >= 0} />
      <Card icon={<Target />} title="Winrate" value={pct(stats.winRate)} />
      <Card icon={<Flame />} title="Greens / Reds" value={`${stats.greens} / ${stats.reds}`} />
      <Card icon={<Trophy />} title="Score" value={stats.score} />
    </section>
  );
}

function Card({ icon, title, value, good = true }) {
  return (
    <div className="stat-card">
      <div className={good ? 'i good' : 'i bad'}>{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Rank({ ranking }) {
  return (
    <section className="panel">
      <h3>Ranking da Tropa</h3>
      <div className="rank-list">
        {ranking.length === 0 ? (
          <p className="muted">Nenhum usuário no ranking ainda.</p>
        ) : (
          ranking.map((item, index) => (
            <div className="rank-row" key={item.profile?.id || index}>
              <div className="pos">#{index + 1}</div>
              <div>
                <strong>{item.profile?.name || 'Usuário'}</strong>
                <span>
  {item.settled} bets finalizadas • ROI {pct(item.roi)}
</span>

<div className="last-bets">
  Últimas bets:{' '}
  {item.lastResults?.length ? (
    item.lastResults.map((result, i) => (
      <span key={i} className="bet-dot">
        {result === 'green' ? '🟢' : '🔴'}
      </span>
    ))
  ) : (
    <span className="muted">Sem histórico</span>
  )}
</div>
              </div>
              <div className="rank-metrics">
                <b>{item.score} pts</b>
                <span className={item.profit >= 0 ? 'green' : 'red'}>{money(item.profit)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function AddBet({ userId, afterSave }) {
  const [form, setForm] = useState({
    event: '',
    stake: '',
    odd: '',
    result: 'green',
    markets: ['Resultado final'],
    ticket: 'single'
  });
  const [busy, setBusy] = useState(false);

  const toggleMarket = (market) => {
    setForm({
      ...form,
      markets: form.markets.includes(market)
        ? form.markets.filter((item) => item !== market)
        : [...form.markets, market]
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.event || !form.stake || !form.odd) return;

    setBusy(true);
    const { error } = await supabase.from('bets').insert({
      user_id: userId,
      event: form.event,
      stake: Number(form.stake),
      odd: Number(form.odd),
      result: form.result,
      ticket: form.ticket,
      markets: form.markets
    });
    setBusy(false);

    if (!error) afterSave();
    else alert(error.message);
  };

  return (
    <section className="panel">
      <h3>Adicionar aposta</h3>
      <form className="bet-form" onSubmit={submit}>
        <label>
          Jogo / Evento
          <input
            placeholder="Ex: Flamengo x Palmeiras"
            value={form.event}
            onChange={(event) => setForm({ ...form, event: event.target.value })}
          />
        </label>

        <div className="grid2">
          <label>
            Valor da bet
            <input
              type="number"
              step="0.01"
              value={form.stake}
              onChange={(event) => setForm({ ...form, stake: event.target.value })}
            />
          </label>

          <label>
            Odd
            <input
              type="number"
              step="0.01"
              value={form.odd}
              onChange={(event) => setForm({ ...form, odd: event.target.value })}
            />
          </label>
        </div>

        <div className="grid2">
          <label>
            Resultado
            <select value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })}>
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="pending">Pendente</option>
            </select>
          </label>

          <label>
            Tipo do bilhete
            <select value={form.ticket} onChange={(event) => setForm({ ...form, ticket: event.target.value })}>
              <option value="single">Bilhete único</option>
              <option value="multiple">Múltipla</option>
            </select>
          </label>
        </div>

        <p className="muted">Mercados adicionados</p>
        <div className="chips">
          {markets.map((market) => (
            <button
              type="button"
              className={form.markets.includes(market) ? 'chip on' : 'chip'}
              onClick={() => toggleMarket(market)}
              key={market}
            >
              {market}
            </button>
          ))}
        </div>

        <button disabled={busy} className="primary">
          <Plus /> {busy ? 'Salvando...' : 'Salvar bet'}
        </button>
      </form>
    </section>
  );
}

function MyBets({ bets, userId, afterChange }) {
  const mine = bets.filter((bet) => bet.user_id === userId);

  const del = async (id) => {
    await supabase.from('bets').delete().eq('id', id);
    afterChange();
  };

  return (
    <section className="panel">
      <h3>Minhas apostas</h3>
      {mine.length === 0 ? (
        <p className="muted">Nenhuma aposta adicionada ainda.</p>
      ) : (
        <div className="bets">
          {mine.map((bet) => (
            <div className="bet" key={bet.id}>
              <div>
                <strong>{bet.event}</strong>
                <span>{bet.ticket === 'multiple' ? 'Múltipla' : 'Bilhete único'} • {(bet.markets || []).join(', ')}</span>
              </div>
              <div className="bet-right">
                <b>{money(bet.stake)} @ {bet.odd}</b>
                <span className={bet.result === 'green' ? 'green' : bet.result === 'red' ? 'red' : 'muted'}>
                  {bet.result.toUpperCase()}
                </span>
                <button onClick={() => del(bet.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
