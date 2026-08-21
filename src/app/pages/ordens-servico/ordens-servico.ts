import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { OrdemServicoService } from '../../core/services/ordem-servico';
import { ClienteService } from '../../core/services/cliente'; // ajuste o path se necessário
import { Cliente } from '../../core/models/cliente/cliente-module'; // ajuste o path se necessário
import {
  OrdemServico,
  StatusOrdemServico,
  ComprovanteRequest,
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
  private readonly clienteService = inject(ClienteService);
  private readonly cdr = inject(ChangeDetectorRef);

  ordens: OrdemServico[] = [];
  clientes: Cliente[] = [];
  carregando = false;
  salvando = false;
  erro = false;

  termoBusca = '';
  filtroStatus: FiltroStatus = 'TODAS';

  // ==========================================
  // MODAL DE CADASTRO / EDIÇÃO
  // ==========================================

  exibirModal = false;

  osEdicao: Partial<OrdemServico> = this.criarNovaOSObj();

  // ==========================================
  // MODAL DE COMPROVANTE
  // ==========================================

  exibirModalComprovante = false;
  gerandoComprovante = false;

  comprovanteForm: ComprovanteRequest & {
    osId: number | null;
  } = this.criarComprovanteVazio();

  // ==========================================
  // STATUS
  // ==========================================

  readonly statusOpcoes: StatusOrdemServico[] = [
    'ABERTA',
    'EM_ANDAMENTO',
    'AGUARDANDO_PECA',
    'CONCLUIDA',
    'ENTREGUE',
    'CANCELADA',
  ];

  readonly abas: {
    valor: FiltroStatus;
    label: string;
  }[] = [
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

  // ==========================================
  // CICLO DE VIDA
  // ==========================================

  ngOnInit(): void {
    this.carregarOrdens();
    this.carregarClientes();
  }

  // ==========================================
  // CARREGAR ORDENS
  // ==========================================

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

        error: () => {
          this.ordens = [];
          this.erro = true;
          this.cdr.detectChanges();
        },
      });
  }

  // ==========================================
  // CARREGAR CLIENTES
  // ==========================================

  carregarClientes(): void {
    this.clienteService.listarTodos().subscribe({
      next: (dados) => {
        this.clientes = dados ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
      },
    });
  }

  // ==========================================
  // MODAL DE CRIAÇÃO / EDIÇÃO
  // ==========================================

  abrirModalNova(): void {
    this.osEdicao = this.criarNovaOSObj();
    this.exibirModal = true;
  }

  abrirModalEdicao(os: OrdemServico): void {
    let dataEntregaFormatada = os.dataEntrega;

    if (os.dataEntrega && typeof os.dataEntrega === 'string') {
      dataEntregaFormatada = os.dataEntrega.split('T')[0];
    }

    this.osEdicao = {
      ...os,
      dataEntrega: dataEntregaFormatada,
    };

    this.exibirModal = true;
  }

  fecharModal(): void {
    this.exibirModal = false;
    this.osEdicao = this.criarNovaOSObj();
  }

  // ==========================================
  // CLIENTE SELECIONADO NO FORM
  // ==========================================

  onClienteSelecionado(clienteId: number): void {
    const cliente = this.clientes.find(c => c.id === clienteId);
    this.osEdicao.clienteId = clienteId;
    this.osEdicao.clienteNome = cliente?.nome ?? '';
  }

  // ==========================================
  // SALVAR ORDEM
  // ==========================================

  salvarOrdem(): void {
    if (
      !this.osEdicao.clienteId ||
      !this.osEdicao.aparelho ||
      !this.osEdicao.defeito
    ) {
      return;
    }

    this.salvando = true;

    const serviceAny = this.ordemServicoService as any;

    let requisicao$;

    // EDIÇÃO
    if (this.osEdicao.id) {
      const metodoAtualizar =
        serviceAny.atualizar ||
        serviceAny.atualizarOrdem ||
        serviceAny.salvar;

      if (metodoAtualizar) {
        requisicao$ = metodoAtualizar.call(
          this.ordemServicoService,
          this.osEdicao.id,
          this.osEdicao
        );
      }

    // CRIAÇÃO
    } else {
      const metodoCriar =
        serviceAny.criar ||
        serviceAny.cadastrar ||
        serviceAny.salvar;

      if (metodoCriar) {
        requisicao$ = metodoCriar.call(
          this.ordemServicoService,
          this.osEdicao
        );
      }
    }

    // SE EXISTIR MÉTODO NO SERVICE
        if (requisicao$) {
      requisicao$
        .pipe(
          finalize(() => {
            this.salvando = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.fecharModal();
            this.carregarOrdens();
          },

          error: (err: any) => {
            console.error('Erro ao salvar OS:', err);
            alert('Erro: ' + JSON.stringify({ status: err.status, message: err.message, name: err.name }));
          },
        });

      return;
    }

    // FALLBACK EM MEMÓRIA
    if (this.osEdicao.id) {
      const index = this.ordens.findIndex(
        o => o.id === this.osEdicao.id
      );

      if (index !== -1) {
        this.ordens[index] = {
          ...this.ordens[index],
          ...this.osEdicao,
        } as OrdemServico;
      }

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

  // ==========================================
  // ALTERAR STATUS
  // ==========================================

  alterarStatusRapido(
    os: OrdemServico,
    novoStatus: StatusOrdemServico
  ): void {

    if (os.status === novoStatus) {
      return;
    }

    const statusAntigo = os.status;

    os.status = novoStatus;

    const serviceAny = this.ordemServicoService as any;

    const metodoStatus =
      serviceAny.atualizarStatus ||
      serviceAny.alterarStatus;

    if (metodoStatus) {
      metodoStatus
        .call(
          this.ordemServicoService,
          os.id,
          novoStatus
        )
        .subscribe({
          error: () => {
            os.status = statusAntigo;
            this.cdr.detectChanges();
          },
        });
    }
  }

  // ==========================================
  // EXCLUIR ORDEM
  // ==========================================

  excluirOrdem(os: OrdemServico): void {
    if (
      !confirm(
        `Deseja realmente excluir a ordem de ${os.clienteNome}?`
      )
    ) {
      return;
    }

    const serviceAny = this.ordemServicoService as any;

    const metodoExcluir =
      serviceAny.excluir ||
      serviceAny.deletar ||
      serviceAny.remover;

    if (metodoExcluir) {
      metodoExcluir
        .call(this.ordemServicoService, os.id)
        .subscribe({
          next: () => this.carregarOrdens(),

          error: (err: any) => {
            console.error('Erro ao excluir OS:', err);
          },
        });

    } else {
      this.ordens = this.ordens.filter(
        o => o.id !== os.id
      );

      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // MODAL DE COMPROVANTE
  // ==========================================

  abrirModalComprovante(os: OrdemServico): void {
  this.comprovanteForm = {
    osId: os.id,
    nomeProduto: os.aparelho,
    nomeCliente: os.clienteNome,
    servicoRealizado: os.servicoRealizado ?? undefined,
    valor: os.valor ?? undefined,
    garantiaDias: os.garantiaDias ?? 0,
    imei: os.imei ?? '',
  };

  this.exibirModalComprovante = true;
}

  fecharModalComprovante(): void {
    this.exibirModalComprovante = false;
    this.comprovanteForm = this.criarComprovanteVazio();
  }

  confirmarGerarComprovante(): void {
    if (!this.comprovanteForm.osId) {
      return;
    }

    this.gerandoComprovante = true;

    const { osId, ...dados } = this.comprovanteForm;

    this.ordemServicoService
      .gerarComprovantePdf(osId, dados)
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
          a.download = `comprovante-${osId}.pdf`;

          a.click();

          window.URL.revokeObjectURL(url);

          this.fecharModalComprovante();
        },

        error: (err) => {
          console.error(
            'Erro ao gerar comprovante:',
            err
          );
        },
      });
  }

  // ==========================================
  // COMPROVANTE VAZIO
  // ==========================================

  private criarComprovanteVazio(): ComprovanteRequest & { osId: number | null } {
  return {
    osId: null,
    nomeProduto: '',
    nomeCliente: '',
    servicoRealizado: '',
    valor: undefined,
    garantiaDias: 0,
    imei: '',
  };
}

  // ==========================================
  // KPIs
  // ==========================================

  get totalConcluido(): number {
    return this.ordens
      .filter(
        o =>
          o.status === 'CONCLUIDA' ||
          o.status === 'ENTREGUE'
      )
      .reduce(
        (sum, o) =>
          sum + (Number(o.valor) || 0),
        0
      );
  }

  get totalEmAberto(): number {
    return this.ordens
      .filter(
        o =>
          o.status === 'ABERTA' ||
          o.status === 'EM_ANDAMENTO' ||
          o.status === 'AGUARDANDO_PECA'
      )
      .reduce(
        (sum, o) =>
          sum + (Number(o.valor) || 0),
        0
      );
  }

  // ==========================================
  // STATUS
  // ==========================================

  statusLabel(
    status: StatusOrdemServico
  ): string {
    return this.statusLabels[status] ?? status;
  }

  contarPorStatus(
    status: FiltroStatus
  ): number {

    if (status === 'TODAS') {
      return this.ordens.length;
    }

    return this.ordens.filter(
      ordem => ordem.status === status
    ).length;
  }

  // ==========================================
  // FILTROS
  // ==========================================

  get ordensFiltradas(): OrdemServico[] {
    const termo =
      this.termoBusca.trim().toLowerCase();

    return this.ordens.filter(ordem => {

      const bateStatus =
        this.filtroStatus === 'TODAS' ||
        ordem.status === this.filtroStatus;

      const bateTermo =
        !termo ||
        ordem.clienteNome
          ?.toLowerCase()
          .includes(termo) ||
        ordem.aparelho
          ?.toLowerCase()
          .includes(termo);

      return bateStatus && bateTermo;
    });
  }

  // ==========================================
  // NOVA OS
  // ==========================================

  private criarNovaOSObj(): Partial<OrdemServico> {
  return {
    clienteId: undefined,
    clienteNome: '',
    aparelho: '',
    imei: '',
    defeito: '',
    status: 'ABERTA',
    valor: undefined,
    dataEntrada: new Date().toISOString().split('T')[0],
    dataEntrega: null,
  };
}
}