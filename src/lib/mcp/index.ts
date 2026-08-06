import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyBookings from "./tools/list-my-bookings";
import searchInstructors from "./tools/search-instructors";
import listMyTransactions from "./tools/list-my-transactions";
import listMyCars from "./tools/list-my-cars";
import listCarMaintenance from "./tools/list-car-maintenance";
import addCarMaintenance from "./tools/add-car-maintenance";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "dominebrasil",
  title: "DomineBrasil",
  version: "0.1.0",
  instructions:
    "Ferramentas da DomineBrasil, marketplace de aulas práticas de direção. Todas as ferramentas atuam em nome do usuário autenticado: consulte perfil, aulas agendadas, extrato financeiro, frota de veículos e manutenções, e busque instrutores aprovados.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    listMyBookings,
    searchInstructors,
    listMyTransactions,
    listMyCars,
    listCarMaintenance,
    addCarMaintenance,
  ],
});
