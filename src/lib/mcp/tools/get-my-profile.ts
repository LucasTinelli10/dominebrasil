import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Meu perfil",
  description: "Retorna o perfil e o papel (aluno, instrutor, investidor, admin) do usuário autenticado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, city, neighborhood, phone, status, verification_status, balance, balance_pending, total_withdrawn, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const result = { ...profile, roles: (roles ?? []).map((r) => r.role) };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { profile: result },
    };
  },
});
