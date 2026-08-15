import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../core/services/dashboard';
import { DashboardData } from '../../core/models/dashboard/dashboard-module';
import { StatusOrdemServico } from '../../core/models/ordem-servico/ordem-servico-module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  carregando = false;
  erro = false;

  dados: DashboardData | null = null;

  entradasPercentual = 0;

  private readonly statusLabels: Record<StatusOrdemServico, string> = {
    ABERTA: 'Aberta',
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_PECA: 'Aguardando peça',
    CONCLUIDA: 'Concluída',
    ENTREGUE: 'Entregue',
    CANCELADA: 'Cancelada',
  };

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
  }

  carregarDashboard(): void {
    this.carregando = true;
    this.erro = false;

    this.dashboardService.obterDashboard().subscribe({
      next: (dados) => {
        console.log('Dashboard carregado:', dados);

        this.dados = dados;

        this.entradasPercentual =
          this.calcularEntradasPercentual(dados);

        this.carregando = false;
        this.erro = false;

        // Força o Angular a atualizar a tela imediatamente.
        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao carregar dashboard:', erro);

        this.dados = null;
        this.entradasPercentual = 0;

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

  statusLabel(status: StatusOrdemServico): string {
    return this.statusLabels[status] ?? status;
  }

  private calcularEntradasPercentual(
    dados: DashboardData
  ): number {
    const { totalEntradas, totalSaidas } =
      dados.resumoFinanceiro;

    const total = totalEntradas + totalSaidas;

    if (!total) {
      return 0;
    }

    return Math.round(
      (totalEntradas / total) * 100
    );
  }
}
