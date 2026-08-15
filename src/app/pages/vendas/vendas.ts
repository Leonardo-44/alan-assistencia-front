import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';

import { VendaService } from '../../core/services/venda';
import { Venda, VendaRequest } from '../../core/models/venda/venda-module';

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
          // Garante que o loading seja encerrado
          // tanto em sucesso quanto em erro.
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (dados) => {
          console.log('Vendas carregadas:', dados);

          this.vendas = dados ?? [];
          this.erro = false;

          this.cdr.detectChanges();
        },

        error: (erro) => {
          console.error(
            'Erro ao buscar vendas:',
            erro
          );

          this.vendas = [];
          this.erro = true;

          this.cdr.detectChanges();
        },
      });
  }

  get vendasFiltradas(): Venda[] {

    const termo =
      this.termoBusca.trim().toLowerCase();

    if (!termo) {
      return this.vendas;
    }

    return this.vendas.filter(
      (venda) =>
        venda.aparelho
          ?.toLowerCase()
          .includes(termo) ||
        venda.formaPagamento
          ?.toLowerCase()
          .includes(termo)
    );
  }

  get totalVendido(): number {
    return this.vendas.reduce(
      (total, venda) =>
        total + (venda.valor ?? 0),
      0
    );
  }

  get ticketMedio(): number {

    if (!this.vendas.length) {
      return 0;
    }

    return (
      this.totalVendido /
      this.vendas.length
    );
  }

  // =========================
  // MODAL DE CADASTRO
  // =========================

  private vendaVazia(): VendaRequest {
    return {
      aparelho: '',
      imei: '',
      valor: 0,
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

    // Remove campos vazios opcionais antes de enviar.
    const dto: VendaRequest = {
      ...this.novaVenda,
      imei: this.novaVenda.imei?.trim() || undefined,
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
          console.log('Venda cadastrada:', vendaCriada);

          this.vendas = [vendaCriada, ...this.vendas];
          this.modalAberto = false;

          this.cdr.detectChanges();
        },

        error: (erro) => {
          console.error('Erro ao salvar venda:', erro);

          this.erroSalvar = true;

          this.cdr.detectChanges();
        },
      });
  }
}