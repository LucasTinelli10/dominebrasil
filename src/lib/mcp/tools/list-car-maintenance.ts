import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_car_maintenance",
  title: "Histórico de manutenção",
  description: "Lista os registros de manutenção dos veículos do usuário autenticado (tipo de serviço, custo, km e próxima revisão).",
  inputSchema: {
    carId: z.string().uuid().optional().describe("Filtra por um veículo específico."),
    limit: z.number().int().min(1).max(100).default(30).describe("Máximo de registros retornados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ carId, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("car_maintenance")
      .select("id, car_id, type, description, cost, km, date, next_date, next_km, created_at")
      .eq("owner_id", ctx.getUserId())
      .order("date", { ascending: false })
      .limit(limit ?? 30);
    if (carId) query = query.eq("car_id", carId);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { maintenance: data ?? [] },
    };
  },
});
