export interface Fiado {
  id: number;
  nomeCliente: string;
  descricao?: string;
  valor: number;
  dataFiado: string;
  pago: boolean;
  dataPagamento?: string;
}

export interface FiadoRequest {
  nomeCliente: string;
  descricao?: string;
  valor: number;
}