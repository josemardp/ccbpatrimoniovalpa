import { Resend } from "resend";
import { MESES } from "@/lib/sprint1";

export type ResumoPendenciaItem = {
  casa?: string;
  competenciaAno: number;
  competenciaMes: number;
  descricao: string;
  status: string;
};

export type ResumoPendencias = {
  ano: number;
  mes: number;
  form148: ResumoPendenciaItem[];
  controleGeral: ResumoPendenciaItem[];
  totalBensRegistrados: number;
  appUrl: string;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderList(items: ResumoPendenciaItem[], empty: string) {
  if (items.length === 0) {
    return `<p style="color:#64748b;font-size:14px;">${escapeHtml(empty)}</p>`;
  }

  return `<ul style="padding-left:20px;color:#334155;font-size:14px;line-height:1.6;">
    ${items
      .map(
        (item) =>
          `<li><strong>${escapeHtml(MESES[item.competenciaMes - 1])}/${escapeHtml(item.competenciaAno)}</strong> — ${
            item.casa ? `${escapeHtml(item.casa)} — ` : ""
          }${escapeHtml(item.descricao)} <span style="color:#b45309;">(${escapeHtml(item.status)})</span></li>`,
      )
      .join("")}
  </ul>`;
}

export function montarResumoMensalHtml(dados: ResumoPendencias) {
  const competencia = `${MESES[dados.mes - 1]}/${dados.ano}`;

  return `<!doctype html>
  <html lang="pt-BR">
    <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <main style="max-width:720px;margin:0 auto;padding:24px;">
        <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
          <p style="margin:0 0 8px;color:#1d4ed8;font-size:12px;font-weight:bold;text-transform:uppercase;">CCB Patrimônio</p>
          <h1 style="margin:0 0 8px;font-size:22px;">Resumo de pendências ${escapeHtml(competencia)}</h1>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Administração Valparaíso/SP — Patrimônio Bens Móveis</p>

          <h2 style="font-size:16px;margin:24px 0 8px;">Form. 14.8 por Casa de Oração</h2>
          ${renderList(dados.form148, "Nenhuma pendência do Form. 14.8 no período.")}

          <h2 style="font-size:16px;margin:24px 0 8px;">Controle Geral</h2>
          ${renderList(dados.controleGeral, "Nenhuma tarefa pendente/vazia no Controle Geral.")}

          <div style="margin-top:24px;padding:16px;border-radius:8px;background:#eff6ff;color:#1e3a8a;font-size:14px;">
            Total de bens registrados: <strong>${escapeHtml(dados.totalBensRegistrados)}</strong>
          </div>

          <p style="margin:24px 0 0;color:#64748b;font-size:13px;">
            Acesse o sistema em <a href="${escapeHtml(dados.appUrl)}" style="color:#1d4ed8;">${escapeHtml(dados.appUrl)}</a>.
          </p>
        </section>
      </main>
    </body>
  </html>`;
}

export async function enviarResumoMensal(destinatario: string, dados: ResumoPendencias) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Variável de ambiente ausente: RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  const competencia = `${MESES[dados.mes - 1]}/${dados.ano}`;

  return resend.emails.send({
    from: "patrimonio@ccb.notificacoes",
    to: destinatario,
    subject: `CCB Patrimônio — Resumo de pendências ${competencia}`,
    html: montarResumoMensalHtml(dados),
  });
}
