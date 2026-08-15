import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';

import { FinanceiroService } from '../../core/services/financeiro';

import {
  MovimentacaoFinanceira,
  MovimentacaoFinanceiraRequest,
  ResumoFinanceiro,
  TipoMovimentacao,
} from '../../core/models/movimentacao-financeira/movimentacao-financeira-module';

type FiltroTipo = TipoMovimentacao | 'TODAS';
type FiltroPeriodo = 'HOJE' | 'SEMANA' | 'MES' | 'TODAS';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
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
  filtroPeriodo: FiltroPeriodo = 'TODAS';

  readonly periodos: { valor: FiltroPeriodo; label: string }[] = [
    { valor: 'HOJE', label: 'Hoje' },
    { valor: 'SEMANA', label: 'Esta semana' },
    { valor: 'MES', label: 'Este mês' },
    { valor: 'TODAS', label: 'Tudo' },
  ];

  // =========================
  // MODAL DE NOVA DESPESA
  // =========================

  modalAberto = false;
  salvando = false;
  erroSalvar = false;

  readonly categorias = [
    'Aluguel',
    'Peças / Estoque',
    'Salário',
    'Contas (água, luz, internet)',
    'Manutenção',
    'Outros',
  ];

  readonly formasPagamento = [
    'Dinheiro',
    'Pix',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Boleto',
  ];

  novaDespesa = this.despesaVazia();

  // =========================
  // MODAL DE EDIÇÃO
  // =========================

  modalEdicaoAberto = false;
  salvandoEdicao = false;
  erroEdicao = false;

  movimentacaoEditando: MovimentacaoFinanceira | null = null;

  edicao = {
    descricao: '',
    valor: 0,
    formaPagamento: '',
  };

  // =========================
  // EXCLUSÃO
  // =========================

  excluindoId: number | null = null;
  confirmandoExclusaoId: number | null = null;

  ngOnInit(): void {
    this.carregarFinanceiro();
  }

  carregarFinanceiro(): void {
    this.carregando = true;
    this.erro = false;

    forkJoin({
      resumo: this.financeiroService.resumo(),
      movimentacoes: this.financeiroService.listarTodos(),
    })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ resumo, movimentacoes }) => {
          this.resumo = resumo;
          this.movimentacoes = movimentacoes ?? [];
          this.erro = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.resumo = null;
          this.movimentacoes = [];
          this.erro = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // FILTRO DE PERÍODO
  // =========================

  private inicioDoDiaAtual(): Date {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
  }

  private inicioDaSemanaAtual(): Date {
    const hoje = this.inicioDoDiaAtual();
    const diaDaSemana = hoje.getDay(); // 0 = domingo
    hoje.setDate(hoje.getDate() - diaDaSemana);
    return hoje;
  }

  private inicioDoMesAtual(): Date {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  private dataInicioParaPeriodo(periodo: FiltroPeriodo): Date | null {
    switch (periodo) {
      case 'HOJE':
        return this.inicioDoDiaAtual();
      case 'SEMANA':
        return this.inicioDaSemanaAtual();
      case 'MES':
        return this.inicioDoMesAtual();
      default:
        return null;
    }
  }

  private movimentacoesDoPeriodo(periodo: FiltroPeriodo): MovimentacaoFinanceira[] {
    const inicio = this.dataInicioParaPeriodo(periodo);

    if (!inicio) {
      return this.movimentacoes;
    }

    return this.movimentacoes.filter((mov) => {
      const data = new Date(mov.dataMovimentacao);
      return data >= inicio;
    });
  }

  get movimentacoesFiltradas(): MovimentacaoFinanceira[] {

    const porPeriodo = this.movimentacoesDoPeriodo(this.filtroPeriodo);

    if (this.filtroTipo === 'TODAS') {
      return porPeriodo;
    }

    return porPeriodo.filter((mov) => mov.tipo === this.filtroTipo);
  }

  get resumoPeriodoAtual(): { entradas: number; saidas: number; saldo: number } {

    const doPeriodo = this.movimentacoesDoPeriodo(this.filtroPeriodo);

    const entradas = doPeriodo
      .filter((m) => m.tipo === 'ENTRADA')
      .reduce((total, m) => total + m.valor, 0);

    const saidas = doPeriodo
      .filter((m) => m.tipo === 'SAIDA')
      .reduce((total, m) => total + m.valor, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }

  get percentualEntradas(): number {
    if (!this.resumo) {
      return 0;
    }

    const total = this.resumo.totalEntradas + this.resumo.totalSaidas;

    if (!total) {
      return 0;
    }

    return Math.round((this.resumo.totalEntradas / total) * 100);
  }

  // =========================
  // MODAL DE NOVA DESPESA
  // =========================

  private despesaVazia() {
    return {
      categoria: '',
      detalhe: '',
      valor: 0,
      formaPagamento: '',
    };
  }

  abrirModal(): void {
    this.novaDespesa = this.despesaVazia();
    this.erroSalvar = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.erroSalvar = false;
  }

  salvarDespesa(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.salvando = true;
    this.erroSalvar = false;

    const descricao = this.novaDespesa.detalhe.trim()
      ? `${this.novaDespesa.categoria} - ${this.novaDespesa.detalhe.trim()}`
      : this.novaDespesa.categoria;

    const dto: MovimentacaoFinanceiraRequest = {
      tipo: 'SAIDA',
      descricao,
      valor: this.novaDespesa.valor,
      formaPagamento: this.novaDespesa.formaPagamento || undefined,
    };

    this.financeiroService
      .salvar(dto)
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (movimentacaoCriada) => {
          this.movimentacoes = [movimentacaoCriada, ...this.movimentacoes];
          this.ajustarResumo(movimentacaoCriada.tipo, movimentacaoCriada.valor);
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
  // MODAL DE EDIÇÃO
  // =========================

  abrirEdicao(mov: MovimentacaoFinanceira): void {
    this.movimentacaoEditando = mov;
    this.edicao = {
      descricao: mov.descricao,
      valor: mov.valor,
      formaPagamento: mov.formaPagamento ?? '',
    };
    this.erroEdicao = false;
    this.modalEdicaoAberto = true;
  }

  fecharEdicao(): void {
    this.modalEdicaoAberto = false;
    this.movimentacaoEditando = null;
    this.erroEdicao = false;
  }

  salvarEdicao(form: NgForm): void {
    if (form.invalid || !this.movimentacaoEditando) {
      return;
    }

    const original = this.movimentacaoEditando;
    const valorAntigo = original.valor;

    this.salvandoEdicao = true;
    this.erroEdicao = false;

    const dto: MovimentacaoFinanceiraRequest = {
      tipo: original.tipo,
      descricao: this.edicao.descricao,
      valor: this.edicao.valor,
      formaPagamento: this.edicao.formaPagamento || undefined,
    };

    this.financeiroService
      .atualizar(original.id, dto)
      .pipe(
        finalize(() => {
          this.salvandoEdicao = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (atualizada) => {
          this.movimentacoes = this.movimentacoes.map((m) =>
            m.id === atualizada.id ? atualizada : m
          );

          this.ajustarResumo(original.tipo, -valorAntigo);
          this.ajustarResumo(atualizada.tipo, atualizada.valor);

          this.modalEdicaoAberto = false;
          this.movimentacaoEditando = null;
          this.cdr.detectChanges();
        },

        error: () => {
          this.erroEdicao = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // EXCLUSÃO
  // =========================

  pedirConfirmacaoExclusao(id: number): void {
    this.confirmandoExclusaoId = id;
  }

  cancelarExclusao(): void {
    this.confirmandoExclusaoId = null;
  }

  confirmarExclusao(mov: MovimentacaoFinanceira): void {
    this.excluindoId = mov.id;

    this.financeiroService
      .remover(mov.id)
      .pipe(
        finalize(() => {
          this.excluindoId = null;
          this.confirmandoExclusaoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.movimentacoes = this.movimentacoes.filter((m) => m.id !== mov.id);
          this.ajustarResumo(mov.tipo, -mov.valor);
          this.cdr.detectChanges();
        },

        error: () => {
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // HELPERS
  // =========================

  private ajustarResumo(tipo: TipoMovimentacao, delta: number): void {
    if (!this.resumo) {
      return;
    }

    if (tipo === 'ENTRADA') {
      this.resumo = {
        ...this.resumo,
        totalEntradas: this.resumo.totalEntradas + delta,
        saldo: this.resumo.saldo + delta,
      };
    } else {
      this.resumo = {
        ...this.resumo,
        totalSaidas: this.resumo.totalSaidas + delta,
        saldo: this.resumo.saldo - delta,
      };
    }
  }
}