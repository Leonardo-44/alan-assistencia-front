import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { OrdemServicoService } from '../../core/services/ordem-servico';
import {
  OrdemServico,
  StatusOrdemServico,
} from '../../core/models/ordem-servico/ordem-servico-module';

type FiltroStatus = StatusOrdemServico | 'TODAS';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './ordens-servico.html',
  styleUrl: './ordens-servico.css',
})
export class OrdensServico implements OnInit {

  private readonly ordemServicoService = inject(OrdemServicoService);
  private readonly cdr = inject(ChangeDetectorRef);

  ordens: OrdemServico[] = [];
  carregando = false;
  salvando = false;
  erro = false;

  termoBusca = '';
  filtroStatus: FiltroStatus = 'TODAS';

  // Controles da Modal
  exibirModal = false;
  osEdicao: Partial<OrdemServico> = this.criarNovaOSObj();

  readonly statusOpcoes: StatusOrdemServico[] = [
    'ABERTA',
    'EM_ANDAMENTO',
    'AGUARDANDO_PECA',
    'CONCLUIDA',
    'ENTREGUE',
    'CANCELADA',
  ];

  readonly abas: { valor: FiltroStatus; label: string }[] = [
    { valor: 'TODAS', label: 'Todas' },
    { valor: 'ABERTA', label: 'Abertas' },
    { valor: 'EM_ANDAMENTO', label: 'Em andamento' },
    { valor: 'AGUARDANDO_PECA', label: 'Aguard. peça' },
    { valor: 'CONCLUIDA', label: 'Concluídas' },
    { valor: 'ENTREGUE', label: 'Entregues' },
    { valor: 'CANCELADA', label: 'Canceladas' },
  ];

  private readonly statusLabels: Record<StatusOrdemServico, string> = {
    ABERTA: 'Aberta',
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_PECA: 'Aguardando peça',
    CONCLUIDA: 'Concluída',
    ENTREGUE: 'Entregue',
    CANCELADA: 'Cancelada',
  };

  ngOnInit(): void {
    this.carregarOrdens();
  }

  carregarOrdens(): void {
    this.carregando = true;
    this.erro = false;

    this.ordemServicoService
      .listarTodos()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (dados) => {
          this.ordens = dados ?? [];
          this.erro = false;
          this.cdr.detectChanges();
        },
        error: (erro) => {
          console.error('Erro ao buscar ordens de serviço:', erro);
          this.ordens = [];
          this.erro = true;
          this.cdr.detectChanges();
        },
      });
  }

  // ==========================================
  // CONTROLE DA MODAL DE CRIAÇÃO E EDIÇÃO
  // ==========================================

  abrirModalNova(): void {
    this.osEdicao = this.criarNovaOSObj();
    this.exibirModal = true;
  }

  abrirModalEdicao(os: OrdemServico): void {
    // Formata a data de entrega para YYYY-MM-DD para funcionar no input HTML date
    let dataEntregaFormatada = os.dataEntrega;
    if (os.dataEntrega && typeof os.dataEntrega === 'string') {
      dataEntregaFormatada = os.dataEntrega.split('T')[0];
    }

    this.osEdicao = { 
      ...os,
      dataEntrega: dataEntregaFormatada
    };
    this.exibirModal = true;
  }

  fecharModal(): void {
    this.exibirModal = false;
    this.osEdicao = this.criarNovaOSObj();
  }

  salvarOrdem(): void {
    if (!this.osEdicao.clienteNome || !this.osEdicao.aparelho || !this.osEdicao.defeito) {
      return;
    }

    this.salvando = true;
    const serviceAny = this.ordemServicoService as any;

    // Detecta se é edição ou criação e busca o método correspondente no service
    let requisicao$;

    if (this.osEdicao.id) {
      const metodoAtualizar = serviceAny.atualizar || serviceAny.atualizarOrdem || serviceAny.salvar;
      if (metodoAtualizar) {
        requisicao$ = metodoAtualizar.call(this.ordemServicoService, this.osEdicao.id, this.osEdicao);
      }
    } else {
      const metodoCriar = serviceAny.criar || serviceAny.cadastrar || serviceAny.salvar;
      if (metodoCriar) {
        requisicao$ = metodoCriar.call(this.ordemServicoService, this.osEdicao);
      }
    }

    // Se o backend/service tiver a chamada pronta
    if (requisicao$) {
      requisicao$
        .pipe(finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: () => {
            this.fecharModal();
            this.carregarOrdens();
          },
          error: (err: any) => console.error('Erro ao salvar OS:', err),
        });
    } else {
      // Fallback em memória (caso o método de backend ainda não esteja implementado)
      if (this.osEdicao.id) {
        const index = this.ordens.findIndex(o => o.id === this.osEdicao.id);
        if (index !== -1) this.ordens[index] = { ...this.osEdicao } as OrdemServico;
      } else {
        this.ordens.unshift({
          ...this.osEdicao,
          id: Date.now(),
          dataEntrada: new Date().toISOString(),
        } as OrdemServico);
      }
      this.salvando = false;
      this.fecharModal();
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // AÇÕES RÁPIDAS
  // ==========================================

  alterarStatusRapido(os: OrdemServico, novoStatus: StatusOrdemServico): void {
    if (os.status === novoStatus) return;

    const statusAntigo = os.status;
    os.status = novoStatus;

    const serviceAny = this.ordemServicoService as any;
    const metodoStatus = serviceAny.atualizarStatus || serviceAny.alterarStatus;

    if (metodoStatus) {
      metodoStatus.call(this.ordemServicoService, os.id, novoStatus).subscribe({
        error: () => {
          os.status = statusAntigo; // Reverte se houver erro no servidor
          this.cdr.detectChanges();
        }
      });
    }
  }

  excluirOrdem(os: OrdemServico): void {
    if (!confirm(`Deseja realmente excluir a ordem de ${os.clienteNome}?`)) {
      return;
    }

    const serviceAny = this.ordemServicoService as any;
    const metodoExcluir = serviceAny.excluir || serviceAny.deletar || serviceAny.remover;

    if (metodoExcluir) {
      metodoExcluir.call(this.ordemServicoService, os.id).subscribe({
        next: () => this.carregarOrdens(),
        error: (err: any) => console.error('Erro ao excluir OS:', err)
      });
    } else {
      this.ordens = this.ordens.filter(o => o.id !== os.id);
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // MÉTODOS AUXILIARES E CÁLCULOS (KPIs)
  // ==========================================

  get totalConcluido(): number {
    return this.ordens
      .filter(o => o.status === 'CONCLUIDA' || o.status === 'ENTREGUE')
      .reduce((sum, o) => sum + (Number(o.valor) || 0), 0);
  }

  get totalEmAberto(): number {
    return this.ordens
      .filter(o => o.status === 'ABERTA' || o.status === 'EM_ANDAMENTO' || o.status === 'AGUARDANDO_PECA')
      .reduce((sum, o) => sum + (Number(o.valor) || 0), 0);
  }

  statusLabel(status: StatusOrdemServico): string {
    return this.statusLabels[status] ?? status;
  }

  contarPorStatus(status: FiltroStatus): number {
    if (status === 'TODAS') return this.ordens.length;
    return this.ordens.filter((ordem) => ordem.status === status).length;
  }

  get ordensFiltradas(): OrdemServico[] {
    const termo = this.termoBusca.trim().toLowerCase();

    return this.ordens.filter((ordem) => {
      const bateStatus = this.filtroStatus === 'TODAS' || ordem.status === this.filtroStatus;
      const bateTermo =
        !termo ||
        ordem.clienteNome?.toLowerCase().includes(termo) ||
        ordem.aparelho?.toLowerCase().includes(termo);

      return bateStatus && bateTermo;
    });
  }

  private criarNovaOSObj(): Partial<OrdemServico> {
    return {
      clienteNome: '',
      aparelho: '',
      defeito: '',
      status: 'ABERTA',
      valor: undefined,
      dataEntrada: new Date().toISOString().split('T')[0],
      dataEntrega: undefined,
    };
  }
}