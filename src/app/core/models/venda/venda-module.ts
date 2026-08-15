export type StatusPagamento = 'PAGO' | 'PARCIAL' | 'PENDENTE';

// Espelha VendaResponseDTO
export interface Venda {
  id: number;
  clienteId: number | null;
  aparelho: string;
  imei: string | null;
  valor: number;
  valorPago: number;
  valorRestante: number;
  statusPagamento: StatusPagamento;
  formaPagamento: string;
  dataVenda: string;
}

// Espelha VendaRequestDTO
export interface VendaRequest {
  clienteId?: number;
  aparelho: string;
  imei?: string;
  valor: number;
  valorPago?: number;
  formaPagamento: string;
}