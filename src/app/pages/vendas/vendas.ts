import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';

import { VendaService } from '../../core/services/venda';
import { Venda, VendaRequest, StatusPagamento } from '../../core/models/venda/venda-module';

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
  // MODAL DE CADASTRO
  // =========================

  modalAberto = false;
  salvando = false;
  erroSalvar = false;

  novaVenda: VendaRequest = this.vendaVazia();

  readonly formasPagamento = [
    'Dinheiro',
    'Pix',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Boleto',
  ];

  // =========================
  // MODAL DE PAGAMENTO
  // =========================

  modalPagamentoAberto = false;
  salvandoPagamento = false;
  erroPagamento = '';

  vendaSelecionada: Venda | null = null;
  valorPagamento: number | null = null;

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

    if (!termo) {
      return this.vendas;
    }

    return this.vendas.filter(
      (venda) =>
        venda.aparelho?.toLowerCase().includes(termo) ||
        venda.formaPagamento?.toLowerCase().includes(termo)
    );
  }

  get totalVendido(): number {
    return this.vendas.reduce(
      (total, venda) => total + (venda.valor ?? 0),
      0
    );
  }

  get totalAReceber(): number {
    return this.vendas.reduce(
      (total, venda) => total + (venda.valorRestante ?? 0),
      0
    );
  }

  get ticketMedio(): number {
    if (!this.vendas.length) {
      return 0;
    }
    return this.totalVendido / this.vendas.length;
  }

  statusLabel(status: StatusPagamento): string {
    return this.statusLabels[status] ?? status;
  }

  // =========================
  // MODAL DE CADASTRO
  // =========================

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
    this.novaVenda = this.vendaVazia();
    this.erroSalvar = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.erroSalvar = false;
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

    this.vendaService
      .salvar(dto)
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (vendaCriada) => {
          this.vendas = [vendaCriada, ...this.vendas];
          this.modalAberto = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.erroSalvar = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // MODAL DE PAGAMENTO
  // =========================

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
}