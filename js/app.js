/* ============================================================
   Organizeitt — App (rotas por hash, paywall Pro, favoritos)
   ============================================================ */
(function () {
  'use strict';

  // ---------- Estado persistido ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('organizeitt_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('organizeitt_' + k, JSON.stringify(v)); } catch {} },
  };
  const state = {
    pro: store.get('pro', false),
    plano: store.get('plano', null),          // 'mensal' | 'anual'
    favoritos: store.get('favoritos', []),
    nome: store.get('nome', 'Visitante'),
    busca: '',
    subAcademia: 'todos',
    ordem: 'relevancia',
  };

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const screen = $('#screen');
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const kfmt = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' mil' : String(n);
  const off = (p) => p.precoDe ? Math.round((1 - p.preco / p.precoDe) * 100) : 0;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => PRODUTOS.find((p) => p.id === id);
  const catById = (id) => CATEGORIAS.find((c) => c.id === id);
  const isLocked = (p) => p.pro && !state.pro;
  const isFav = (id) => state.favoritos.includes(id);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function confetti() {
    const c = $('#confetti');
    c.innerHTML = '';
    const cores = ['#7c5cff', '#ee4d2d', '#f7b500', '#12b76a', '#ff5c8a'];
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = cores[i % cores.length];
      s.style.animationDelay = Math.random() * 0.6 + 's';
      c.appendChild(s);
    }
    setTimeout(() => (c.innerHTML = ''), 2400);
  }

  // ---------- Ordenação / filtro ----------
  function ordenar(lista) {
    const l = [...lista];
    switch (state.ordem) {
      case 'menor': return l.sort((a, b) => a.preco - b.preco);
      case 'maior': return l.sort((a, b) => b.preco - a.preco);
      case 'vendidos': return l.sort((a, b) => b.vendidos - a.vendidos);
      case 'desconto': return l.sort((a, b) => off(b) - off(a));
      default: return l.sort((a, b) => (b.tags.includes('mais vendido') - a.tags.includes('mais vendido')) || b.nota - a.nota);
    }
  }
  function filtrarBusca(lista, q) {
    if (!q) return lista;
    const n = q.toLowerCase();
    return lista.filter((p) => p.nome.toLowerCase().includes(n) || p.desc.toLowerCase().includes(n) || (catById(p.cat)?.nome.toLowerCase().includes(n)));
  }

  // ---------- Componentes ----------
  function cardProduto(p, opts = {}) {
    const locked = isLocked(p);
    const tag = p.tags[0];
    return `
      <button class="card ${locked ? 'locked' : ''}" data-open="${p.id}" aria-label="${esc(p.nome)}">
        <div class="thumb ${p.pro ? 'pro' : ''}"><span class="em">${p.emoji}</span></div>
        ${off(p) ? `<span class="off">-${off(p)}%</span>` : ''}
        ${tag && !locked ? `<span class="tag">${esc(tag)}</span>` : ''}
        <div class="body">
          <div class="nome">${esc(p.nome)}</div>
          <div class="preco"><b>${brl(p.preco)}</b>${p.precoDe ? `<s>${brl(p.precoDe)}</s>` : ''}</div>
          <div class="meta"><span class="star">★</span>${p.nota.toFixed(1)} · ${kfmt(p.vendidos)} vendidos</div>
          ${p.cupom && !locked ? `<span class="cupom">🎟️ ${esc(p.cupom)}</span>` : ''}
        </div>
        ${!locked ? `<span class="fav ${isFav(p.id) ? 'on' : ''}" data-fav="${p.id}">${isFav(p.id) ? '♥' : '♡'}</span>` : ''}
        ${locked ? `<div class="lock"><span class="ic">🔒</span><b>Exclusivo Pro</b><small>Toque para desbloquear</small></div>` : ''}
      </button>`;
  }

  function gridProdutos(lista, vazio = 'Nenhum achadinho por aqui ainda.') {
    if (!lista.length) return `<div class="empty"><div class="em">🔍</div><b>${esc(vazio)}</b>Tente outra busca ou filtro.</div>`;
    return `<div class="grid">${lista.map((p) => cardProduto(p)).join('')}</div>`;
  }

  function cardKit(k) {
    const itens = k.itens.map(byId);
    const total = itens.reduce((s, p) => s + p.preco, 0);
    const locked = k.pro && !state.pro;
    return `
      <button class="kit ${k.pro ? 'pro' : ''}" data-kit="${k.id}">
        ${locked ? `<span class="lockt">🔒 PRO</span>` : `<span class="total">${brl(total)}</span>`}
        <span class="em">${k.emoji}</span>
        <b>${esc(k.nome)}</b>
        <p>${esc(k.desc)}</p>
        <div class="items">${itens.map((p) => p.emoji).join('')}</div>
      </button>`;
  }

  function topbar(titulo, back = true, extra = '') {
    return `
      <div class="topbar">
        ${back ? `<button class="back" data-nav="back" aria-label="Voltar">‹</button>` : ''}
        <h1>${esc(titulo)}</h1>${extra}
      </div>`;
  }

  function proPill() {
    return state.pro
      ? `<a class="pro-pill active" href="#/pro">✓ PRO</a>`
      : `<a class="pro-pill" href="#/pro">⚡ Seja Pro</a>`;
  }

  // ---------- Páginas ----------
  const pages = {
    home() {
      const destaques = ordenar(PRODUTOS.filter((p) => p.tags.includes('mais vendido'))).slice(0, 6);
      const academia = ordenar(PRODUTOS.filter((p) => p.cat === 'academia')).slice(0, 6);
      return `
        <div class="topbar">
          <div class="logo"><span class="dot">O</span>Organizeitt</div>
          ${proPill()}
          <a class="icon-btn" href="#/favoritos" aria-label="Favoritos">♡${state.favoritos.length ? `<span class="badge">${state.favoritos.length}</span>` : ''}</a>
        </div>
        <label class="search">🔍<input id="busca" type="search" placeholder="Buscar achadinho (ex: garrafa, legging...)" value="${esc(state.busca)}"></label>
        <div id="busca-res"></div>
        <div id="home-body">
          <a class="hero academia" href="#/c/academia">
            <span class="bg-emoji">🏋️</span>
            <h2>Achadinhos de Academia<br>chegaram! 🔥</h2>
            <p>${PRODUTOS.filter((p) => p.cat === 'academia').length} produtos testados e aprovados com até 60% off na Shopee.</p>
            <span class="cta">Ver achadinhos →</span>
          </a>

          <div class="section">
            <div class="section-head px"><h2>Categorias</h2></div>
            <div class="cat-grid">
              ${CATEGORIAS.map((c) => `
                <a class="cat-card ${c.id === 'academia' ? 'new' : ''}" href="#/c/${c.id}" style="background:linear-gradient(135deg, ${c.cor}, ${c.cor}cc)">
                  <span class="em">${c.emoji}</span>
                  <div><b>${esc(c.nome)}</b><br><small>${PRODUTOS.filter((p) => p.cat === c.id).length} achadinhos</small></div>
                </a>`).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-head px"><h2>🔥 Mais vendidos</h2><a href="#/c/academia">ver todos</a></div>
            <div class="hscroll">${destaques.map((p) => cardProduto(p)).join('')}</div>
          </div>

          ${!state.pro ? `
          <a class="hero pro-hero" href="#/pro" style="margin-top:22px">
            <span class="bg-emoji">⚡</span>
            <h2>Desbloqueie o Pro</h2>
            <p>Achadinhos exclusivos, cupons antecipados e alertas de preço por ${brl(PLANO_PRO.precoMes)}/mês.</p>
            <span class="cta">Conhecer o plano →</span>
          </a>` : ''}

          <div class="section">
            <div class="section-head px"><h2>🏋️ Para o treino</h2><a href="#/c/academia">ver todos</a></div>
            <div class="hscroll">${academia.map((p) => cardProduto(p)).join('')}</div>
          </div>
        </div>`;
    },

    // ---- Página Academia (a nova página) ----
    academia() {
      const cat = catById('academia');
      let lista = PRODUTOS.filter((p) => p.cat === 'academia');
      if (state.subAcademia !== 'todos') lista = lista.filter((p) => p.sub === state.subAcademia);
      lista = ordenar(lista);
      const exclusivos = PRODUTOS.filter((p) => p.cat === 'academia' && p.pro);
      return `
        ${topbar('Academia', true, proPill())}
        <div class="hero academia" style="margin-top:6px">
          <span class="bg-emoji">${cat.emoji}</span>
          <h2>Achadinhos Shopee<br>para Academia 🏋️</h2>
          <p>${esc(cat.desc)} Atualizado toda semana.</p>
          <span class="cta">${lista.length} produtos · até ${Math.max(...PRODUTOS.filter((p) => p.cat === 'academia').map(off))}% off</span>
        </div>

        <div class="section">
          <div class="section-head px"><h2>Kits prontos</h2><span class="muted">monte de uma vez</span></div>
          <div class="hscroll">${KITS_ACADEMIA.map(cardKit).join('')}</div>
        </div>

        <div class="section">
          <div class="section-head px"><h2>Todos os achadinhos</h2></div>
          <div class="chips">
            ${SUB_ACADEMIA.map((s) => `<button class="chip ${state.subAcademia === s.id ? 'active' : ''}" data-sub="${s.id}">${esc(s.nome)}</button>`).join('')}
          </div>
          <div class="toolbar">
            <span class="muted">${lista.length} resultado${lista.length === 1 ? '' : 's'}</span>
            <select id="ordem">
              <option value="relevancia" ${state.ordem === 'relevancia' ? 'selected' : ''}>Relevância</option>
              <option value="vendidos" ${state.ordem === 'vendidos' ? 'selected' : ''}>Mais vendidos</option>
              <option value="menor" ${state.ordem === 'menor' ? 'selected' : ''}>Menor preço</option>
              <option value="maior" ${state.ordem === 'maior' ? 'selected' : ''}>Maior preço</option>
              <option value="desconto" ${state.ordem === 'desconto' ? 'selected' : ''}>Maior desconto</option>
            </select>
          </div>
          ${gridProdutos(lista)}
        </div>

        ${!state.pro ? `
        <div class="section">
          <div class="section-head px"><h2>🔒 Exclusivos Pro</h2><a href="#/pro">desbloquear</a></div>
          <p class="muted px" style="margin:0 0 4px">${exclusivos.length} achadinhos premium de academia liberados no plano Pro.</p>
          <div class="hscroll">${exclusivos.map((p) => cardProduto(p)).join('')}</div>
          <div class="px" style="margin-top:12px"><a class="btn btn-pro" href="#/pro">⚡ Seja Pro por ${brl(PLANO_PRO.precoMes)}/mês</a></div>
        </div>` : ''}`;
    },

    // ---- Página genérica de categoria ----
    categoria(id) {
      const cat = catById(id);
      if (!cat) return pages.notfound();
      const lista = ordenar(PRODUTOS.filter((p) => p.cat === id));
      return `
        ${topbar(cat.nome, true, proPill())}
        <div class="hero" style="margin-top:6px;background:linear-gradient(135deg, ${cat.cor}, ${cat.cor}aa);box-shadow:0 14px 34px ${cat.cor}55">
          <span class="bg-emoji">${cat.emoji}</span>
          <h2>${esc(cat.nome)}</h2>
          <p>${esc(cat.desc)}</p>
          <span class="cta">${lista.length} achadinhos</span>
        </div>
        <div class="section">
          <div class="toolbar">
            <span class="muted">${lista.length} resultado${lista.length === 1 ? '' : 's'}</span>
            <select id="ordem">
              <option value="relevancia" ${state.ordem === 'relevancia' ? 'selected' : ''}>Relevância</option>
              <option value="vendidos" ${state.ordem === 'vendidos' ? 'selected' : ''}>Mais vendidos</option>
              <option value="menor" ${state.ordem === 'menor' ? 'selected' : ''}>Menor preço</option>
              <option value="maior" ${state.ordem === 'maior' ? 'selected' : ''}>Maior preço</option>
              <option value="desconto" ${state.ordem === 'desconto' ? 'selected' : ''}>Maior desconto</option>
            </select>
          </div>
          ${gridProdutos(lista)}
        </div>`;
    },

    favoritos() {
      const lista = state.favoritos.map(byId).filter(Boolean);
      const limite = state.pro ? '∞' : `${lista.length}/${LIMITE_FAVORITOS_GRATIS}`;
      return `
        ${topbar('Favoritos', false, `<span class="muted">${limite}</span>`)}
        ${lista.length ? gridProdutos(lista) : `<div class="empty"><div class="em">💔</div><b>Nada salvo ainda</b>Toque no ♡ de um achadinho para guardar aqui.</div>`}
        ${!state.pro ? `<div class="px" style="margin-top:20px"><a class="btn btn-pro" href="#/pro">⚡ Favoritos ilimitados no Pro</a></div>` : ''}`;
    },

    // ---- Plano Pro ----
    pro() {
      const sel = state.planoSel || 'anual';
      const anualMes = PLANO_PRO.precoAno / 12;
      const economia = Math.round((1 - PLANO_PRO.precoAno / (PLANO_PRO.precoMes * 12)) * 100);
      if (state.pro) {
        return `
          ${topbar('Plano Pro', true)}
          <div class="hero pro-hero" style="margin-top:6px">
            <span class="bg-emoji">⚡</span>
            <h2>Você é Pro! 🎉</h2>
            <p>Plano ${state.plano === 'anual' ? 'anual' : 'mensal'} ativo. Todos os achadinhos exclusivos, kits e cupons estão liberados.</p>
            <a class="cta" href="#/c/academia">Ver exclusivos →</a>
          </div>
          <div class="section">
            <div class="section-head px"><h2>Seus benefícios</h2></div>
            <div class="benefits">${PLANO_PRO.beneficios.map((b) => `<div class="benefit"><span class="em">${b.emoji}</span><div><b>${esc(b.titulo)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}</div>
          </div>
          <div class="px" style="margin-top:22px"><button class="btn btn-outline" data-action="cancelar">Cancelar assinatura</button></div>`;
      }
      return `
        ${topbar('Plano Pro', true)}
        <div class="hero pro-hero" style="margin-top:6px">
          <span class="bg-emoji">⚡</span>
          <h2>Organizeitt Pro</h2>
          <p>Os melhores achadinhos antes de todo mundo, com cupom e alerta de preço.</p>
          <span class="cta">7 dias grátis</span>
        </div>

        <div class="section">
          <div class="section-head px"><h2>Escolha seu plano</h2></div>
          <div class="plans">
            <button class="plan ${sel === 'anual' ? 'sel' : ''}" data-plano="anual">
              <span class="tag">MAIS POPULAR</span>
              <small>Anual</small>
              <div class="p">${brl(anualMes)}<span>/mês</span></div>
              <span class="save">Economize ${economia}% · ${brl(PLANO_PRO.precoAno)}/ano</span>
            </button>
            <button class="plan ${sel === 'mensal' ? 'sel' : ''}" data-plano="mensal">
              <small>Mensal</small>
              <div class="p">${brl(PLANO_PRO.precoMes)}<span>/mês</span></div>
              <span class="muted" style="font-size:11px">Cancele quando quiser</span>
            </button>
          </div>
        </div>

        <div class="section">
          <div class="section-head px"><h2>O que você ganha</h2></div>
          <div class="benefits">${PLANO_PRO.beneficios.map((b) => `<div class="benefit"><span class="em">${b.emoji}</span><div><b>${esc(b.titulo)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}</div>
        </div>

        <div class="section">
          <div class="section-head px"><h2>Grátis vs Pro</h2></div>
          <div class="compare"><table>
            <tr><th style="text-align:left">Recurso</th><th>Grátis</th><th class="pro">Pro</th></tr>
            ${PLANO_PRO.comparativo.map((r) => `<tr><td>${esc(r.recurso)}</td><td>${cell(r.gratis)}</td><td class="pro">${cell(r.pro)}</td></tr>`).join('')}
          </table></div>
        </div>

        <div class="sticky-cta" style="margin-top:22px">
          <button class="btn btn-pro" data-action="assinar">⚡ Começar 7 dias grátis</button>
          <p class="muted" style="text-align:center;margin:8px 0 0;font-size:11px">Depois ${sel === 'anual' ? brl(PLANO_PRO.precoAno) + '/ano' : brl(PLANO_PRO.precoMes) + '/mês'}. Cancele a qualquer momento.</p>
        </div>`;

      function cell(v) {
        if (v === true) return '<span class="ok">✓</span>';
        if (v === false) return '<span class="no">—</span>';
        return esc(v);
      }
    },

    perfil() {
      return `
        ${topbar('Perfil', false)}
        <div class="profile-card">
          <div class="avatar">${esc(state.nome[0].toUpperCase())}</div>
          <div style="flex:1">
            <b style="font-size:16px">${esc(state.nome)}</b><br>
            <span class="muted">${state.pro ? '⚡ Assinante Pro' : 'Plano gratuito'}</span>
          </div>
          ${proPill()}
        </div>
        <div class="section">
          <div class="section-head px"><h2>Conta</h2></div>
          <div class="list">
            <button data-action="nome"><span class="em">✏️</span>Alterar nome<span class="arrow">›</span></button>
            <a href="#/favoritos"><span class="em">♥</span>Meus favoritos<span class="arrow">${state.favoritos.length} ›</span></a>
            <a href="#/pro"><span class="em">⚡</span>${state.pro ? 'Gerenciar assinatura' : 'Assinar o Pro'}<span class="arrow">›</span></a>
          </div>
        </div>
        <div class="section">
          <div class="section-head px"><h2>Sobre</h2></div>
          <div class="list">
            <a href="index.html"><span class="em">🏠</span>Página inicial<span class="arrow">›</span></a>
            <a href="https://shopee.com.br" target="_blank" rel="noopener"><span class="em">🛍️</span>Ir para a Shopee<span class="arrow">↗</span></a>
            <button data-action="reset"><span class="em">🧹</span>Limpar dados do app<span class="arrow">›</span></button>
          </div>
          <p class="muted px" style="margin-top:14px;font-size:11px">Os links deste app podem ser de afiliado. Você não paga nada a mais por isso e ajuda o Organizeitt a continuar gratuito. 💛</p>
        </div>`;
    },

    notfound() {
      return `${topbar('Ops', true)}<div class="empty"><div class="em">🤷</div><b>Página não encontrada</b><a href="#/home" style="color:var(--brand);font-weight:700">Voltar para o início</a></div>`;
    },
  };

  // ---------- Sheets (modais) ----------
  const backdrop = $('#backdrop');
  const sheet = $('#sheet');
  function openSheet(html) { sheet.innerHTML = `<div class="handle"></div>${html}`; sheet.classList.add('open'); backdrop.classList.add('open'); }
  function closeSheet() { sheet.classList.remove('open'); backdrop.classList.remove('open'); }
  backdrop.addEventListener('click', closeSheet);

  function sheetProduto(p) {
    if (isLocked(p)) return sheetPaywall(p);
    openSheet(`
      <div class="big-thumb ${p.pro ? 'pro' : ''}">${p.emoji}</div>
      <h3>${esc(p.nome)}</h3>
      <div class="muted"><span style="color:var(--yellow)">★</span> ${p.nota.toFixed(1)} · ${kfmt(p.vendidos)} vendidos · ${esc(catById(p.cat).nome)}</div>
      <div class="price-row"><b>${brl(p.preco)}</b>${p.precoDe ? `<s>${brl(p.precoDe)}</s><span class="off">-${off(p)}%</span>` : ''}</div>
      <p>${esc(p.desc)}</p>
      ${p.cupom ? `<div class="coupon-box"><div><small class="muted">Cupom de desconto</small><br><b>${esc(p.cupom)}</b></div><button data-copy="${esc(p.cupom)}">Copiar</button></div>` : ''}
      <a class="btn btn-brand" href="${p.link}" target="_blank" rel="noopener sponsored">🛒 Ver na Shopee</a>
      <button class="btn btn-ghost" data-fav="${p.id}">${isFav(p.id) ? '♥ Remover dos favoritos' : '♡ Salvar nos favoritos'}</button>`);
  }

  function sheetPaywall(p) {
    openSheet(`
      <div class="big-thumb pro" style="font-size:64px">🔒</div>
      <h3>${p ? esc(p.nome) : 'Conteúdo exclusivo'}</h3>
      <p>Este achadinho faz parte do <b style="color:var(--pro)">Organizeitt Pro</b>. Assine para liberar todos os produtos, kits e cupons exclusivos.</p>
      <div class="benefits" style="padding:0;margin:12px 0">
        ${PLANO_PRO.beneficios.slice(0, 3).map((b) => `<div class="benefit"><span class="em">${b.emoji}</span><div><b>${esc(b.titulo)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}
      </div>
      <a class="btn btn-pro" href="#/pro" data-close>⚡ Ver planos · a partir de ${brl(PLANO_PRO.precoAno / 12)}/mês</a>
      <button class="btn btn-ghost" data-close>Agora não</button>`);
  }

  function sheetKit(k) {
    if (k.pro && !state.pro) return sheetPaywall({ nome: k.nome });
    const itens = k.itens.map(byId);
    const total = itens.reduce((s, p) => s + p.preco, 0);
    const totalDe = itens.reduce((s, p) => s + (p.precoDe || p.preco), 0);
    openSheet(`
      <div class="big-thumb ${k.pro ? 'pro' : ''}">${k.emoji}</div>
      <h3>${esc(k.nome)}</h3>
      <p>${esc(k.desc)}</p>
      <div class="price-row"><b>${brl(total)}</b><s>${brl(totalDe)}</s><span class="off">-${Math.round((1 - total / totalDe) * 100)}%</span></div>
      <div class="list" style="margin:10px 0 14px">
        ${itens.map((p) => `<button data-open="${p.id}" data-close><span class="em">${p.emoji}</span><span style="flex:1">${esc(p.nome)}</span><b style="color:var(--brand)">${brl(p.preco)}</b></button>`).join('')}
      </div>
      <button class="btn btn-brand" data-favkit="${k.id}">♥ Salvar kit nos favoritos</button>
      <button class="btn btn-ghost" data-close>Fechar</button>`);
  }

  function sheetCheckout() {
    const plano = state.planoSel || 'anual';
    const valor = plano === 'anual' ? PLANO_PRO.precoAno : PLANO_PRO.precoMes;
    openSheet(`
      <h3>Confirmar assinatura</h3>
      <p>Plano <b>${plano === 'anual' ? 'Anual' : 'Mensal'}</b> · 7 dias grátis, depois <b>${brl(valor)}${plano === 'anual' ? '/ano' : '/mês'}</b>.</p>
      <div class="list" style="margin:12px 0 16px">
        <button data-pay="pix"><span class="em">💠</span>Pix<span class="arrow">›</span></button>
        <button data-pay="cartao"><span class="em">💳</span>Cartão de crédito<span class="arrow">›</span></button>
        <button data-pay="boleto"><span class="em">🧾</span>Boleto<span class="arrow">›</span></button>
      </div>
      <p class="muted" style="font-size:11px">Demonstração: nenhuma cobrança real é feita. Integre seu checkout (Mercado Pago, Stripe, Hotmart, Kiwify) na função <code>ativarPro()</code>.</p>
      <button class="btn btn-ghost" data-close>Cancelar</button>`);
  }

  // ---------- Ações ----------
  function toggleFav(id) {
    const i = state.favoritos.indexOf(id);
    if (i >= 0) { state.favoritos.splice(i, 1); toast('Removido dos favoritos'); }
    else {
      if (!state.pro && state.favoritos.length >= LIMITE_FAVORITOS_GRATIS) { closeSheet(); sheetPaywall({ nome: 'Limite de favoritos atingido' }); return; }
      state.favoritos.push(id); toast('Salvo nos favoritos ♥');
    }
    store.set('favoritos', state.favoritos);
    render();
  }

  // Ponto de integração com o gateway de pagamento
  function ativarPro(plano) {
    state.pro = true; state.plano = plano;
    store.set('pro', true); store.set('plano', plano);
    closeSheet(); confetti(); toast('Bem-vindo ao Pro! ⚡');
    render();
  }
  function cancelarPro() {
    state.pro = false; state.plano = null;
    store.set('pro', false); store.set('plano', null);
    toast('Assinatura cancelada');
    render();
  }

  // ---------- Delegação de eventos ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open],[data-fav],[data-favkit],[data-kit],[data-sub],[data-plano],[data-action],[data-copy],[data-pay],[data-close],[data-nav]');
    if (!t) return;
    if (t.dataset.close !== undefined) closeSheet();
    if (t.dataset.nav === 'back') { history.length > 1 ? history.back() : (location.hash = '#/home'); return; }
    if (t.dataset.fav) { e.preventDefault(); e.stopPropagation(); toggleFav(t.dataset.fav); if (sheet.classList.contains('open')) { const p = byId(t.dataset.fav); if (p) sheetProduto(p); } return; }
    if (t.dataset.favkit) { const k = KITS_ACADEMIA.find((x) => x.id === t.dataset.favkit); let add = 0; k.itens.forEach((id) => { if (!isFav(id) && (state.pro || state.favoritos.length < LIMITE_FAVORITOS_GRATIS)) { state.favoritos.push(id); add++; } }); store.set('favoritos', state.favoritos); closeSheet(); toast(add ? `${add} itens salvos ♥` : 'Limite de favoritos atingido'); render(); return; }
    if (t.dataset.open) { const p = byId(t.dataset.open); if (p) sheetProduto(p); return; }
    if (t.dataset.kit) { sheetKit(KITS_ACADEMIA.find((k) => k.id === t.dataset.kit)); return; }
    if (t.dataset.sub) { state.subAcademia = t.dataset.sub; render(true); return; }
    if (t.dataset.plano) { state.planoSel = t.dataset.plano; render(true); return; }
    if (t.dataset.copy) { navigator.clipboard?.writeText(t.dataset.copy).then(() => toast('Cupom copiado: ' + t.dataset.copy)).catch(() => toast('Cupom: ' + t.dataset.copy)); return; }
    if (t.dataset.pay) { ativarPro(state.planoSel || 'anual'); return; }
    if (t.dataset.action === 'assinar') { sheetCheckout(); return; }
    if (t.dataset.action === 'cancelar') { if (confirm('Cancelar sua assinatura Pro?')) cancelarPro(); return; }
    if (t.dataset.action === 'nome') { const n = prompt('Seu nome:', state.nome); if (n && n.trim()) { state.nome = n.trim().slice(0, 24); store.set('nome', state.nome); render(); } return; }
    if (t.dataset.action === 'reset') { if (confirm('Limpar favoritos e assinatura?')) { Object.keys(localStorage).filter((k) => k.startsWith('organizeitt_')).forEach((k) => localStorage.removeItem(k)); location.reload(); } return; }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'ordem') { state.ordem = e.target.value; render(true); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'busca') {
      state.busca = e.target.value;
      const res = $('#busca-res'); const body = $('#home-body');
      if (!state.busca.trim()) { res.innerHTML = ''; body.hidden = false; return; }
      body.hidden = true;
      const lista = ordenar(filtrarBusca(PRODUTOS, state.busca.trim()));
      res.innerHTML = `<div class="section"><div class="section-head px"><h2>${lista.length} resultado${lista.length === 1 ? '' : 's'}</h2><button data-clear>limpar</button></div>${gridProdutos(lista, 'Nada encontrado')}</div>`;
    }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) { state.busca = ''; render(); } });

  // ---------- Roteador ----------
  const TABS = [
    { id: 'home', href: '#/home', ic: '🏠', label: 'Início', match: (r) => r === 'home' },
    { id: 'academia', href: '#/c/academia', ic: '🏋️', label: 'Academia', match: (r) => r === 'c/academia' },
    { id: 'pro', href: '#/pro', ic: '⚡', label: 'Pro', match: (r) => r === 'pro', pro: true },
    { id: 'favoritos', href: '#/favoritos', ic: '♥', label: 'Favoritos', match: (r) => r === 'favoritos' },
    { id: 'perfil', href: '#/perfil', ic: '👤', label: 'Perfil', match: (r) => r === 'perfil' },
  ];

  function route() {
    const h = (location.hash || '#/home').replace(/^#\/?/, '');
    if (h === '' || h === 'home') return { page: 'home', html: pages.home() };
    if (h === 'c/academia') return { page: 'c/academia', html: pages.academia() };
    if (h.startsWith('c/')) return { page: h, html: pages.categoria(h.slice(2)) };
    if (h === 'favoritos') return { page: 'favoritos', html: pages.favoritos() };
    if (h === 'pro') return { page: 'pro', html: pages.pro() };
    if (h === 'perfil') return { page: 'perfil', html: pages.perfil() };
    return { page: '404', html: pages.notfound() };
  }

  function render(keepScroll = false) {
    const top = screen.scrollTop;
    const r = route();
    screen.innerHTML = `<div class="page">${r.html}</div>`;
    $('#tabbar').innerHTML = TABS.map((t) => `
      <a class="tab ${t.pro ? 'pro-tab' : ''} ${t.match(r.page) ? 'active' : ''}" href="${t.href}">
        <span class="ic ${t.pro ? 'pro-ic' : ''}">${t.ic}</span>${t.label}
      </a>`).join('');
    screen.scrollTop = keepScroll ? top : 0;
    document.title = 'Organizeitt · ' + ({ home: 'Início', 'c/academia': 'Academia', pro: 'Plano Pro', favoritos: 'Favoritos', perfil: 'Perfil' }[r.page] || 'Achadinhos');
    if (r.page === 'home' && state.busca) { const i = $('#busca'); if (i) i.dispatchEvent(new Event('input', { bubbles: true })); }
  }

  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  if (!location.hash) location.replace('#/home');
  render();
})();
