import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_instructors",
  title: "Buscar instrutores",
  description:
    "Busca instrutores aprovados na plataforma, com preço por hora, avaliação, cidade e experiência. Aceita filtro por cidade e preço máximo.",
  inputSchema: {
    city: z.string().trim().optional().describe("Filtra por cidade (correspondência parcial, sem diferenciar maiúsculas)."),
    maxPricePerHour: z.number().positive().optional().describe("Preço máximo por hora em reais."),
    limit: z.number().int().min(1).max(50).default(20).describe("Máximo de instrutores retornados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, maxPricePerHour, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("get_all_approved_instructors");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    let list = (data ?? []) as Array<Record<string, unknown>>;
    if (city) {
      const needle = city.toLowerCase();
      list = list.filter((i) => String(i.city ?? "").toLowerCase().includes(needle));
    }
    if (maxPricePerHour != null) {
      list = list.filter((i) => Number(i.price_per_hour ?? Infinity) <= maxPricePerHour);
    }
    list = list.slice(0, limit ?? 20);

    return {
      content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      structuredContent: { instructors: list },
    };
  },
});
