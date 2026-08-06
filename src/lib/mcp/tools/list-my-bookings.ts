import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_bookings",
  title: "Minhas aulas agendadas",
  description:
    "Lista as aulas do usuário autenticado (como aluno ou instrutor), com data, horário, status e valor. Permite filtrar por status.",
  inputSchema: {
    status: z
      .enum(["pending", "confirmed", "completed", "cancelled"])
      .optional()
      .describe("Filtra pelo status da aula."),
    limit: z.number().int().min(1).max(100).default(20).describe("Máximo de registros retornados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    let query = supabase
      .from("bookings")
      .select("id, date, time_slot, status, total_price, notes, student_id, instructor_id, car_id, created_at")
      .or(`student_id.eq.${userId},instructor_id.eq.${userId}`)
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { bookings: data ?? [] },
    };
  },
});
