import { OrdemServico } from '../ordem-servico/ordem-servico-module';
import { ResumoFinanceiro } from '../movimentacao-financeira/movimentacao-financeira-module';
import { Venda } from '../venda/venda-module';

// Este model não existe como DTO no back-end: é montado no front
// combinando /clientes, /movimentacoes-financeiras/resumo,
// /ordens-servico e /vendas em uma única estrutura para o Dashboard.
export interface DashboardData {
  resumoFinanceiro: ResumoFinanceiro;
  totalClientes: number;
  totalOrdensServico: number;
  ordensAbertas: number;
  ordensConcluidas: number;
  totalVendas: number;
  faturamentoVendas: number;
  ultimasOrdens: OrdemServico[];
  ultimasVendas: Venda[];
}