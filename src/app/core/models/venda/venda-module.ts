// Espelha VendaResponseDTO
export interface Venda {
  id: number;
  clienteId: number | null;
  aparelho: string;
  imei: string | null;
  valor: number;
  formaPagamento: string;
  dataVenda: string;
}

// Espelha VendaRequestDTO
export interface VendaRequest {
  clienteId?: number;
  aparelho: string;
  imei?: string;
  valor: number;
  formaPagamento: string;
}