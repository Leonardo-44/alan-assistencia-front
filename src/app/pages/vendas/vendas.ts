import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';

import { VendaService } from '../../core/services/venda';
import { Venda, VendaRequest, StatusPagamento, ComprovanteVendaRequest } from '../../core/models/venda/venda-module';

type PeriodoId = 'hoje' | '7dias' | 'mes' | 'personalizado';

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css',
})
export class Vendas implements OnInit {

  private vendaService = inject(VendaService);

  private readonly cdr = inject(ChangeDetectorRef);

  vendas: Venda[] = [];

  carregando = false;
  erro = false;

  termoBusca = '';

  private readonly statusLabels: Record<StatusPagamento, string> = {
    PAGO: 'Pago',
    PARCIAL: 'Parcial',
    PENDENTE: 'Pendente',
  };

  // =========================
  // FILTRO DE PERÍODO
  // =========================

  readonly periodos: { id: PeriodoId; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7dias', label: '7 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'personalizado', label: 'Personalizado' },
  ];

  periodoSelecionado: PeriodoId = 'mes';

  dataInicioPersonalizada = '';
  dataFimPersonalizada = '';

  selecionarPeriodo(periodo: PeriodoId): void {
    this.periodoSelecionado = periodo;
  }

  private inicioDoDia(data: Date): Date {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fimDoDia(data: Date): Date {
    const d = new Date(data);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private intervaloPeriodo(): { inicio: Date; fim: Date } | null {
    const hoje = new Date();

    switch (this.periodoSelecionado) {
      case 'hoje':
        return { inicio: this.inicioDoDia(hoje), fim: this.fimDoDia(hoje) };

      case '7dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 6);
        return { inicio: this.inicioDoDia(inicio), fim: this.fimDoDia(hoje) };
      }

      case 'mes': {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return { inicio: this.inicioDoDia(inicio), fim: this.fimDoDia(hoje) };
      }

      case 'personalizado': {
        if (!this.dataInicioPersonalizada || !this.dataFimPersonalizada) {
          return null;
        }

        const inicio = new Date(`${this.dataInicioPersonalizada}T00:00:00`);
        const fim = new Date(`${this.dataFimPersonalizada}T23:59:59`);
        return { inicio, fim };
      }

      default:
        return null;
    }
  }

  get vendasNoPeriodo(): Venda[] {
    const intervalo = this.intervaloPeriodo();

    if (!intervalo) {
      return this.vendas;
    }

    return this.vendas.filter((venda) => {
      if (!venda.dataVenda) {
        return false;
      }

      const data = new Date(venda.dataVenda);
      return data >= intervalo.inicio && data <= intervalo.fim;
    });
  }

  ngOnInit(): void {
    this.carregarVendas();
  }

  carregarVendas(): void {
    this.carregando = true;
    this.erro = false;

    this.vendaService
      .listarTodos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (dados) => {
          this.vendas = dados ?? [];
          this.erro = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.vendas = [];
          this.erro = true;
          this.cdr.detectChanges();
        },
      });
  }

  get vendasFiltradas(): Venda[] {

    const termo = this.termoBusca.trim().toLowerCase();
    const base = this.vendasNoPeriodo;

    if (!termo) {
      return base;
    }

    return base.filter(
      (venda) =>
        venda.aparelho?.toLowerCase().includes(termo) ||
        venda.formaPagamento?.toLowerCase().includes(termo)
    );
  }

  get totalVendido(): number {
    return this.vendasNoPeriodo.reduce(
      (total, venda) => total + (venda.valor ?? 0),
      0
    );
  }

  get totalAReceber(): number {
    return this.vendasNoPeriodo.reduce(
      (total, venda) => total + (venda.valorRestante ?? 0),
      0
    );
  }

  get ticketMedio(): number {
    if (!this.vendasNoPeriodo.length) {
      return 0;
    }
    return this.totalVendido / this.vendasNoPeriodo.length;
  }

  statusLabel(status: StatusPagamento): string {
    return this.statusLabels[status] ?? status;
  }

  // =========================
  // MODAL DE CADASTRO / EDIÇÃO
  // =========================

  modalAberto = false;
  salvando = false;
  erroSalvar = false;

  modoEdicao = false;
  vendaEmEdicaoId: number | null = null;

  novaVenda: VendaRequest = this.vendaVazia();

  readonly formasPagamento = [
    'Dinheiro',
    'Pix',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Boleto',
  ];

  private vendaVazia(): VendaRequest {
    return {
      aparelho: '',
      imei: '',
      valor: 0,
      valorPago: 0,
      formaPagamento: '',
    };
  }

  abrirModal(): void {
    this.modoEdicao = false;
    this.vendaEmEdicaoId = null;
    this.novaVenda = this.vendaVazia();
    this.erroSalvar = false;
    this.modalAberto = true;
  }

  abrirModalEdicao(venda: Venda): void {
    this.modoEdicao = true;
    this.vendaEmEdicaoId = venda.id;

    this.novaVenda = {
      aparelho: venda.aparelho,
      imei: venda.imei ?? '',
      valor: venda.valor,
      valorPago: venda.valorPago,
      formaPagamento: venda.formaPagamento,
    };

    this.erroSalvar = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.erroSalvar = false;
    this.modoEdicao = false;
    this.vendaEmEdicaoId = null;
  }

  salvarVenda(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.salvando = true;
    this.erroSalvar = false;

    const dto: VendaRequest = {
      ...this.novaVenda,
      imei: this.novaVenda.imei?.trim() || undefined,
      valorPago: this.novaVenda.valorPago ?? 0,
    };

    const request$ = this.modoEdicao && this.vendaEmEdicaoId
      ? this.vendaService.atualizar(this.vendaEmEdicaoId, dto)
      : this.vendaService.salvar(dto);

    request$
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (vendaSalva) => {
          if (this.modoEdicao) {
            this.vendas = this.vendas.map((v) =>
              v.id === vendaSalva.id ? vendaSalva : v
            );
          } else {
            this.vendas = [vendaSalva, ...this.vendas];
          }

          this.modalAberto = false;
          this.modoEdicao = false;
          this.vendaEmEdicaoId = null;
          this.cdr.detectChanges();
        },

        error: () => {
          this.erroSalvar = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // EXCLUSÃO
  // =========================

  modalExcluirAberto = false;
  excluindo = false;
  erroExcluir = false;

  vendaParaExcluir: Venda | null = null;

  abrirModalExcluir(venda: Venda): void {
    this.vendaParaExcluir = venda;
    this.erroExcluir = false;
    this.modalExcluirAberto = true;
  }

  fecharModalExcluir(): void {
    this.modalExcluirAberto = false;
    this.vendaParaExcluir = null;
    this.erroExcluir = false;
  }

  confirmarExclusao(): void {
    if (!this.vendaParaExcluir) {
      return;
    }

    const id = this.vendaParaExcluir.id;

    this.excluindo = true;
    this.erroExcluir = false;

    this.vendaService
      .remover(id)
      .pipe(
        finalize(() => {
          this.excluindo = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.vendas = this.vendas.filter((v) => v.id !== id);
          this.fecharModalExcluir();
        },

        error: () => {
          this.erroExcluir = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // MODAL DE PAGAMENTO
  // =========================

  modalPagamentoAberto = false;
  salvandoPagamento = false;
  erroPagamento = '';

  vendaSelecionada: Venda | null = null;
  valorPagamento: number | null = null;

  abrirModalPagamento(venda: Venda): void {
    this.vendaSelecionada = venda;
    this.valorPagamento = null;
    this.erroPagamento = '';
    this.modalPagamentoAberto = true;
  }

  fecharModalPagamento(): void {
    this.modalPagamentoAberto = false;
    this.vendaSelecionada = null;
    this.erroPagamento = '';
  }

  confirmarPagamento(): void {
    if (!this.vendaSelecionada || !this.valorPagamento || this.valorPagamento <= 0) {
      this.erroPagamento = 'Informe um valor válido.';
      return;
    }

    if (this.valorPagamento > this.vendaSelecionada.valorRestante) {
      this.erroPagamento = `O valor não pode ser maior que o restante (${this.vendaSelecionada.valorRestante}).`;
      return;
    }

    this.salvandoPagamento = true;
    this.erroPagamento = '';

    this.vendaService
      .registrarPagamento(this.vendaSelecionada.id, this.valorPagamento)
      .pipe(
        finalize(() => {
          this.salvandoPagamento = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (vendaAtualizada) => {
          this.vendas = this.vendas.map((v) =>
            v.id === vendaAtualizada.id ? vendaAtualizada : v
          );
          this.modalPagamentoAberto = false;
          this.vendaSelecionada = null;
          this.cdr.detectChanges();
        },

        error: (erro) => {
          this.erroPagamento =
            erro?.error?.mensagem ?? 'Não foi possível registrar o pagamento.';
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // MODAL DE COMPROVANTE
  // =========================

  modalComprovanteAberto = false;
  gerandoComprovante = false;

  comprovanteForm: ComprovanteVendaRequest & { vendaId: number | null } = this.comprovanteVazio();

  private comprovanteVazio(): ComprovanteVendaRequest & { vendaId: number | null } {
    return {
      vendaId: null,
      aparelho: '',
      imei: '',
      valor: undefined,
      valorPago: undefined,
      formaPagamento: '',
    };
  }

  abrirModalComprovante(venda: Venda): void {
    this.comprovanteForm = {
      vendaId: venda.id,
      aparelho: venda.aparelho,
      imei: venda.imei ?? '',
      valor: venda.valor,
      valorPago: venda.valorPago,
      formaPagamento: venda.formaPagamento,
    };

    this.modalComprovanteAberto = true;
  }

  fecharModalComprovante(): void {
    this.modalComprovanteAberto = false;
    this.comprovanteForm = this.comprovanteVazio();
  }

  confirmarGerarComprovante(): void {
    if (!this.comprovanteForm.vendaId) {
      return;
    }

    this.gerandoComprovante = true;

    const { vendaId, ...dados } = this.comprovanteForm;

    this.vendaService
      .gerarComprovantePdf(vendaId, dados)
      .pipe(
        finalize(() => {
          this.gerandoComprovante = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          a.href = url;
          a.download = `comprovante-venda-${vendaId}.pdf`;
          a.click();

          window.URL.revokeObjectURL(url);
          this.fecharModalComprovante();
        },

        error: (err) => {
          console.error('Erro ao gerar comprovante:', err);
        },
      });
  }
}