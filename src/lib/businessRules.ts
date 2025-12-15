// ============================================
// REGRAS DE NEGÓCIO - DOMINE BRASIL
// ============================================
// Este arquivo centraliza todas as constantes e regras
// financeiras da plataforma para manter consistência.

export const BUSINESS_RULES = {
  // Preços fixos da plataforma
  CAR_RENTAL_PRICE_PER_HOUR: 50, // R$ 50,00 - valor tabelado/fixo
  MIN_LESSON_PRICE_PER_HOUR: 90, // R$ 90,00 - valor mínimo por aula
  SYSTEM_FEE_PER_HOUR: 10, // R$ 10,00 - taxa do sistema por hora
  
  // Divisão de lucros do investidor
  INVESTOR_PROFIT_PERCENTAGE: 75, // 75% para o investidor
  PLATFORM_PROFIT_PERCENTAGE: 25, // 25% para a Domine
  
  // Valores sugeridos/padrão
  DEFAULT_LESSON_PRICE: 120, // R$ 120,00 - preço sugerido
  
  // Limites
  MAX_BADGES_PER_INSTRUCTOR: 5,
  MIN_INSTRUCTOR_AGE: 21,
  MAX_CAR_AGE_YEARS: 12,
} as const;

// Funções auxiliares para cálculos financeiros
export function calculateInstructorNetProfit(
  lessonPrice: number,
  usesRentalCar: boolean = true
): number {
  const systemFee = BUSINESS_RULES.SYSTEM_FEE_PER_HOUR;
  const carRental = usesRentalCar ? BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR : 0;
  return lessonPrice - systemFee - carRental;
}

export function calculateInvestorProfit(grossRevenue: number): number {
  return grossRevenue * (BUSINESS_RULES.INVESTOR_PROFIT_PERCENTAGE / 100);
}

export function calculatePlatformFee(grossRevenue: number): number {
  return grossRevenue * (BUSINESS_RULES.PLATFORM_PROFIT_PERCENTAGE / 100);
}

export function validateLessonPrice(price: number): { valid: boolean; message?: string } {
  if (price < BUSINESS_RULES.MIN_LESSON_PRICE_PER_HOUR) {
    return {
      valid: false,
      message: `O valor mínimo por aula é R$ ${BUSINESS_RULES.MIN_LESSON_PRICE_PER_HOUR},00`
    };
  }
  return { valid: true };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
