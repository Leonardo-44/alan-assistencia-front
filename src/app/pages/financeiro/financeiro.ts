import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';

import { FinanceiroService } from '../../core/services/financeiro';

import {
  MovimentacaoFinanceira,
  ResumoFinanceiro,
  TipoMovimentacao,
} from '../../core/models/movimentacao-financeira/movimentacao-financeira-module';

type FiltroTipo = TipoMovimentacao | 'TODAS';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.css',
})
export class Financeiro implements OnInit {

  private financeiroService = inject(FinanceiroService);
  private cdr = inject(ChangeDetectorRef);

  movimentacoes: MovimentacaoFinanceira[] = [];

  resumo: ResumoFinanceiro | null = null;

  carregando = false;
  erro = false;

  filtroTipo: FiltroTipo = 'TODAS';

  ngOnInit(): void {
    this.carregarFinanceiro();
  }

  carregarFinanceiro(): void {
    this.carregando = true;
    this.erro = false;

    this.financeiroService.resumo().subscribe({
      next: (dados) => {
        console.log('Financeiro carregado:', dados);

        this.resumo = dados;

        this.carregando = false;
        this.erro = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao carregar financeiro:', erro);

        this.resumo = null;
        this.carregando = false;
        this.erro = true;

        this.cdr.detectChanges();
      },

      complete: () => {
        this.carregando = false;

        this.cdr.detectChanges();
      },
    });
  }

  get movimentacoesFiltradas(): MovimentacaoFinanceira[] {
    if (this.filtroTipo === 'TODAS') {
      return this.movimentacoes;
    }

    return this.movimentacoes.filter(
      (movimentacao) =>
        movimentacao.tipo === this.filtroTipo
    );
  }

  get percentualEntradas(): number {
    if (!this.resumo) {
      return 0;
    }

    const total =
      this.resumo.totalEntradas +
      this.resumo.totalSaidas;

    if (!total) {
      return 0;
    }

    return Math.round(
      (this.resumo.totalEntradas / total) * 100
    );
  }
}