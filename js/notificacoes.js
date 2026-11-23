/* Notificações de aplicação: avisam no horário cadastrado em Meus protocolos.
   - Com o app ou a página aberta (ou em segundo plano recente): verificação a cada 30 s.
   - Com o app fechado: só onde o navegador aceita notificações agendadas (showTrigger, hoje restrito a parte do Chrome/Android).
   - Em qualquer aparelho: arquivo .ics para o calendário do celular. */
const CH_NOTIF = "notif_ativas_v1", CH_NOTIF_ENVIADAS = "notif_enviadas_v1";
const HORA_PERIODO = { "Ao acordar": "07:00", "Em jejum": "07:00", "Manhã": "09:00", "Com refeição": "12:30", "Tarde": "15:00", "Noite": "20:00", "Antes de dormir": "22:00" };
const notifSuportada = "Notification" in window;
const notifAtiva = () => notifSuportada && Notification.permission === "granted" && localStorage.getItem(CH_NOTIF) === "1";
const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* Horários (HH:MM) das aplicações de um protocolo em uma data; vazio quando não há horário cadastrado. */
function horariosDoDia(x, iso) {
  if (x.status !== "ativo" || !dataProgramada(x, iso)) return [];
  const n = doseDiariaProgramada(x);
  if (n > 1) {
    const h = x.horariosDia?.length ? x.horariosDia : [x.horaPrimeira, x.horaSegunda].filter(Boolean);
    return h.length === n ? h : [];
  }
  const h = /^\d{2}:\d{2}$/.test(x.hora) ? x.hora : HORA_PERIODO[x.hora];
  return h ? [h] : [];
}
function agendaProxima(dias) {
  const out = [], base = new Date();
  base.setHours(12, 0, 0, 0);
  const protocolos = lerProtocolos();
  for (let i = 0; i < dias; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i);
    const iso = isoLocal(d);
    protocolos.forEach(x => horariosDoDia(x, iso).forEach((hora, indice) => {
      const [h, m] = hora.split(":").map(Number);
      out.push({ x, iso, hora, indice, quando: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime(), chave: `${x.id}|${iso}|${hora}` });
    }));
  }
  return out.sort((a, b) => a.quando - b.quando);
}
const textoAplicacao = ev => `${ev.x.nome}${ev.x.dose ? " · " + ev.x.dose + " " + ev.x.unid : ""} · ${ev.hora}`;
const lerEnviadas = () => { try { return JSON.parse(localStorage.getItem(CH_NOTIF_ENVIADAS)) || []; } catch { return []; } };

async function mostrarNotificacao(titulo, opcoes) {
  const op = { icon: "icons/icon-192.png", badge: "icons/icon-192.png", lang: "pt-BR", data: { url: "meus-protocolos.html" }, ...opcoes };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) return reg.showNotification(titulo, op);
  } catch { /* cai para a notificação direta */ }
  new Notification(titulo, op);
}
function verificarNotificacoes() {
  if (!notifAtiva()) return;
  const agora = Date.now(), enviadas = lerEnviadas(), novas = [];
  agendaProxima(1).forEach(ev => {
    if (ev.quando > agora || agora - ev.quando > 30 * 60e3 || enviadas.includes(ev.chave)) return;
    const feitas = (ev.x.tomadas || []).filter(d => d === ev.iso).length;
    if (ev.indice < feitas) return;
    novas.push(ev.chave);
    mostrarNotificacao("💉 Hora da aplicação", { body: textoAplicacao(ev), tag: ev.chave });
  });
  if (novas.length) localStorage.setItem(CH_NOTIF_ENVIADAS, JSON.stringify([...enviadas, ...novas].slice(-300)));
}
/* Onde houver suporte, deixa as próximas 48 h agendadas no sistema, para avisar com o app fechado. */
async function cancelarAgendadas() {
  try {
    const reg = await navigator.serviceWorker.ready;
    (await reg.getNotifications({ includeTriggered: false })).forEach(n => n.close());
  } catch { /* sem service worker: nada agendado */ }
}

async function agendarFuturas() {
  if (!notifAtiva() || !("showTrigger" in Notification.prototype) || typeof TimestampTrigger === "undefined") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await cancelarAgendadas();
    agendaProxima(2).filter(ev => ev.quando > Date.now()).forEach(ev =>
      reg.showNotification("💉 Hora da aplicação", { body: textoAplicacao(ev), tag: ev.chave, icon: "icons/icon-192.png", lang: "pt-BR", data: { url: "meus-protocolos.html" }, showTrigger: new TimestampTrigger(ev.quando) }));
  } catch { /* sem suporte real: segue só com a verificação em página aberta */ }
}

function baixarAgendaICS() {
  const esc = t => String(t).replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const fmt = t => { const d = new Date(t); return `${isoLocal(d).replace(/-/g, "")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`; };
  const carimbo = new Date().toISOString().replace(/[-:]|\.\d+/g, "");
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Guia de Peptideos//Meus protocolos//PT", "CALSCALE:GREGORIAN"];
  const eventos = agendaProxima(60);
  eventos.forEach(ev => linhas.push("BEGIN:VEVENT", `UID:${ev.chave.replace(/\|/g, "-")}@guiapeptideos`, `DTSTAMP:${carimbo}`, `DTSTART:${fmt(ev.quando)}`, `DTEND:${fmt(ev.quando + 15 * 60e3)}`,
    `SUMMARY:${esc("Aplicação: " + ev.x.nome)}`, `DESCRIPTION:${esc(textoAplicacao(ev) + "\nLembrete pessoal do Guia de Peptídeos. Não é prescrição.")}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc("Aplicação: " + ev.x.nome)}`, "TRIGGER:PT0S", "END:VALARM", "END:VEVENT"));
  linhas.push("END:VCALENDAR");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  a.download = "agenda-protocolos.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return eventos.length;
}

function montarPainelNotificacoes() {
  const alvo = document.getElementById("acomp-semanal");
  if (!alvo || document.getElementById("notif-painel")) return;
  const sec = document.createElement("section");
  sec.id = "notif-painel"; sec.className = "boas";
  alvo.before(sec);
  const desenhar = msg => {
    const semHora = lerProtocolos().filter(x => x.status === "ativo" && x.freq !== "Se necessário" && !horariosDoDia({ ...x, inicio: "2000-01-01", fim: "", diasSemana: [0, 1, 2, 3, 4, 5, 6] }, "2030-01-01").length).length;
    const estado = !notifSuportada ? "Este navegador não oferece notificações." : Notification.permission === "denied" ? "Bloqueadas no navegador. Libere nas configurações do site para usar." : notifAtiva() ? "Ativadas neste aparelho." : "Desativadas.";
    sec.innerHTML = `<h3>🔔 Notificações de aplicação</h3>
      <p>${estado} O aviso sai no horário cadastrado de cada protocolo ativo (períodos como “Manhã” usam um horário aproximado).${semHora ? ` ${semHora} protocolo(s) sem horário não geram aviso.` : ""}</p>
      <p><small>Com o app instalado e aberto, ou em segundo plano recente, o aviso chega no horário. Com o app totalmente fechado, só alguns navegadores (Chrome no Android) entregam; no iPhone e nos demais, use a agenda do calendário abaixo. É um lembrete pessoal, não uma prescrição.</small></p>
      <p><button type="button" class="btn" id="notif-alternar" ${notifSuportada && Notification.permission !== "denied" ? "" : "disabled"}>${notifAtiva() ? "Desativar notificações" : "Ativar notificações"}</button>
      <button type="button" class="btn btn-sec" id="notif-teste" ${notifAtiva() ? "" : "disabled"}>Enviar teste</button>
      <button type="button" class="btn btn-sec" id="notif-ics">📅 Baixar agenda (.ics)</button></p>
      <p id="notif-msg" role="status"><small>${msg || ""}</small></p>`;
    sec.querySelector("#notif-alternar").onclick = async () => {
      if (notifAtiva()) { localStorage.setItem(CH_NOTIF, "0"); cancelarAgendadas(); return desenhar("Notificações desativadas."); }
      const r = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (r === "granted") { localStorage.setItem(CH_NOTIF, "1"); verificarNotificacoes(); agendarFuturas(); desenhar("Notificações ativadas."); } else desenhar("Permissão não concedida.");
    };
    sec.querySelector("#notif-teste").onclick = () => mostrarNotificacao("💉 Teste de notificação", { body: "Se você viu isto, os avisos estão funcionando.", tag: "teste" });
    sec.querySelector("#notif-ics").onclick = () => { const n = baixarAgendaICS(); desenhar(n ? `Agenda com ${n} aplicações dos próximos 60 dias baixada. Abra o arquivo para importar no calendário.` : "Nenhuma aplicação com horário nos próximos 60 dias."); };
  };
  desenhar();
}

if (notifSuportada) {
  setInterval(verificarNotificacoes, 30e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) verificarNotificacoes(); });
  verificarNotificacoes();
  agendarFuturas();
}
montarPainelNotificacoes();
