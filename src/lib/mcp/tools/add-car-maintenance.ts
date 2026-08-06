import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_car_maintenance",
  title: "Registrar manutenção",
  description:
    "Registra uma manutenção de um veículo do usuário autenticado (ex.: troca de óleo, pneus, motor), com custo, km e próxima revisão.",
  inputSchema: {
    carId: z.string().uuid().describe("ID do veículo (use list_my_cars)."),
    type: z.string().trim().min(1).describe("Tipo de serviço, ex.: 'Troca de óleo'."),
    cost: z.number().min(0).default(0).describe("Custo do serviço em reais."),
    date: z.string().optional().describe("Data do serviço no formato YYYY-MM-DD. Padrão: hoje."),
    km: z.number().int().min(0).optional().describe("Quilometragem atual do veículo."),
    description: z.string().trim().optional().describe("Observações do serviço."),
    nextDate: z.string().optional().describe("Data da próxima revisão (YYYY-MM-DD)."),
    nextKm: z.number().int().min(0).optional().describe("Quilometragem da próxima revisão."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ carId, type, cost, date, km, description, nextDate, nextKm }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("car_maintenance")
      .insert({
        owner_id: ctx.getUserId(),
        car_id: carId,
        type,
        cost: cost ?? 0,
        date: date ?? new Date().toISOString().slice(0, 10),
        km: km ?? null,
        description: description ?? null,
        next_date: nextDate ?? null,
        next_km: nextKm ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Manutenção registrada: ${JSON.stringify(data)}` }],
      structuredContent: { maintenance: data },
    };
  },
});
