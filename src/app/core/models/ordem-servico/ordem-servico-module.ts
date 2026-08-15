// Espelha o enum StatusOrdemServico (back-end)
// ⚠️ Confirme os valores exatos do enum no back-end; ajuste aqui se forem diferentes
export type StatusOrdemServico =
  | 'ABERTA'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_PECA'
  | 'CONCLUIDA'
  | 'ENTREGUE'
  | 'CANCELADA';

// Status considerados "finalizados" para efeito de KPIs do Dashboard
export const STATUS_FINALIZADOS: StatusOrdemServico[] = [
  'CONCLUIDA',
  'ENTREGUE',
  'CANCELADA'
];

// Espelha OrdemServicoResponseDTO
export interface OrdemServico {
  id: number;
  clienteId: number;
  clienteNome: string;
  aparelho: string;
  imei: string | null;
  defeito: string;
  servicoRealizado: string | null;
  peca: string | null;
  valor: number | null;
  garantiaDias: number | null;
  garantiaInicio: string | null;
  garantiaFim: string | null;
  status: StatusOrdemServico;
  dataEntrada: string;
  dataEntrega: string | null;
}

// Espelha OrdemServicoRequestDTO
export interface OrdemServicoRequest {
  clienteId: number;
  aparelho: string;
  imei?: string;
  defeito: string;
  servicoRealizado?: string;
  peca?: string;
  valor?: number;
  garantiaDias?: number;
  status?: StatusOrdemServico;
}

// Espelha GarantiaResponseDTO
export interface Garantia {
  ordemServico: number;
  emGarantia: boolean;
  garantiaInicial: string | null;
  garantiaFim: string | null;
}

export interface ComprovanteRequest {
  nomeProduto?: string;
  nomeCliente?: string;
  servicoRealizado?: string;
  valor?: number;
  garantiaDias?: number;
}