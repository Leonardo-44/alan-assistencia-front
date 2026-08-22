import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';

import { FiadoService } from '../../core/services/fiado';
import { Fiado, FiadoRequest } from '../../core/models/fiado/fiado-module';

type StatusFiltro = 'todos' | 'pendentes' | 'pagos';

@Component({
  selector: 'app-fiados',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './fiados.html',
  styleUrl: './fiados.css',
})
export class Fiados implements OnInit {
  private fiadoService = inject(FiadoService);
  private readonly cdr = inject(ChangeDetectorRef);

  fiados: Fiado[] = [];
  carregando = false;
  erro = false;
  termoBusca = '';

  // =========================
  // FILTRO DE STATUS
  // =========================

  statusFiltro: StatusFiltro = 'todos';

  readonly statusOpcoes: { id: StatusFiltro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendentes', label: 'Pendentes' },
    { id: 'pagos', label: 'Pagos' },
  ];

  selecionarStatus(status: StatusFiltro): void {
    this.statusFiltro = status;
  }

  get fiadosPorStatus(): Fiado[] {
    if (this.statusFiltro === 'pendentes') return this.fiados.filter((f) => !f.pago);
    if (this.statusFiltro === 'pagos') return this.fiados.filter((f) => f.pago);
    return this.fiados;
  }

  get fiadosFiltrados(): Fiado[] {
    const termo = this.termoBusca.trim().toLowerCase();
    const base = this.fiadosPorStatus;

    if (!termo) {
      return base;
    }

    return base.filter(
      (f) =>
        f.nomeCliente.toLowerCase().includes(termo) ||
        f.descricao?.toLowerCase().includes(termo)
    );
  }

  get totalFiado(): number {
    return this.fiados.reduce((total, f) => total + (f.valor ?? 0), 0);
  }

  get totalPendente(): number {
    return this.fiados
      .filter((f) => !f.pago)
      .reduce((total, f) => total + (f.valor ?? 0), 0);
  }

  get totalPago(): number {
    return this.fiados
      .filter((f) => f.pago)
      .reduce((total, f) => total + (f.valor ?? 0), 0);
  }

  ngOnInit(): void {
    this.carregarFiados();
  }

  carregarFiados(): void {
    this.carregando = true;
    this.erro = false;

    this.fiadoService
      .listarTodos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (dados) => {
          this.fiados = dados ?? [];
          this.erro = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.fiados = [];
          this.erro = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // MODAL DE CADASTRO / EDIÇÃO
  // =========================

  modalAberto = false;
  salvando = false;
  erroSalvar = false;

  modoEdicao = false;
  fiadoEmEdicaoId: number | null = null;

  novoFiado: FiadoRequest = this.fiadoVazio();

  private fiadoVazio(): FiadoRequest {
    return {
      nomeCliente: '',
      descricao: '',
      valor: 0,
    };
  }

  abrirModal(): void {
    this.modoEdicao = false;
    this.fiadoEmEdicaoId = null;
    this.novoFiado = this.fiadoVazio();
    this.erroSalvar = false;
    this.modalAberto = true;
  }

  abrirModalEdicao(fiado: Fiado): void {
    this.modoEdicao = true;
    this.fiadoEmEdicaoId = fiado.id;

    this.novoFiado = {
      nomeCliente: fiado.nomeCliente,
      descricao: fiado.descricao ?? '',
      valor: fiado.valor,
    };

    this.erroSalvar = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.erroSalvar = false;
    this.modoEdicao = false;
    this.fiadoEmEdicaoId = null;
  }

  salvarFiado(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.salvando = true;
    this.erroSalvar = false;

    const dto: FiadoRequest = {
      ...this.novoFiado,
      descricao: this.novoFiado.descricao?.trim() || undefined,
    };

    const request$ = this.modoEdicao && this.fiadoEmEdicaoId
      ? this.fiadoService.atualizar(this.fiadoEmEdicaoId, dto)
      : this.fiadoService.salvar(dto);

    request$
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (fiadoSalvo) => {
          if (this.modoEdicao) {
            this.fiados = this.fiados.map((f) =>
              f.id === fiadoSalvo.id ? fiadoSalvo : f
            );
          } else {
            this.fiados = [fiadoSalvo, ...this.fiados];
          }

          this.modalAberto = false;
          this.modoEdicao = false;
          this.fiadoEmEdicaoId = null;
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

  fiadoParaExcluir: Fiado | null = null;

  abrirModalExcluir(fiado: Fiado): void {
    this.fiadoParaExcluir = fiado;
    this.erroExcluir = false;
    this.modalExcluirAberto = true;
  }

  fecharModalExcluir(): void {
    this.modalExcluirAberto = false;
    this.fiadoParaExcluir = null;
    this.erroExcluir = false;
  }

  confirmarExclusao(): void {
    if (!this.fiadoParaExcluir) {
      return;
    }

    const id = this.fiadoParaExcluir.id;

    this.excluindo = true;
    this.erroExcluir = false;

    this.fiadoService
      .remover(id)
      .pipe(
        finalize(() => {
          this.excluindo = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.fiados = this.fiados.filter((f) => f.id !== id);
          this.fecharModalExcluir();
        },
        error: () => {
          this.erroExcluir = true;
          this.cdr.detectChanges();
        },
      });
  }

  // =========================
  // ALTERNAR STATUS (pago / pendente)
  // =========================

  atualizandoStatusId: number | null = null;

  alternarStatusPago(fiado: Fiado): void {
    this.atualizandoStatusId = fiado.id;

    this.fiadoService
      .alternarPagamento(fiado.id)
      .pipe(
        finalize(() => {
          this.atualizandoStatusId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (atualizado) => {
          this.fiados = this.fiados.map((f) =>
            f.id === atualizado.id ? atualizado : f
          );
          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        },
      });
  }
}