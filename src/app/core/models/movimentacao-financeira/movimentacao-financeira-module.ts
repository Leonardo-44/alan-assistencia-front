// Espelha o enum TipoMovimentacao (back-end)
// ⚠️ Confirme os valores exatos do enum no back-end; ajuste aqui se forem diferentes
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

// Espelha MovimentacaoFinanceiraResponseDTO
export interface MovimentacaoFinanceira {
  id: number;
  tipo: TipoMovimentacao;
  descricao: string;
  valor: number;
  formaPagamento: string | null;
  dataMovimentacao: string; // LocalDateTime -> chega como string ISO
}

// Espelha MovimentacaoFinanceiraRequestDTO
export interface MovimentacaoFinanceiraRequest {
  tipo: TipoMovimentacao;
  descricao: string;
  valor: number;
  formaPagamento?: string;
}

// Espelha ResumoFinanceiroResponseDTO
export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}