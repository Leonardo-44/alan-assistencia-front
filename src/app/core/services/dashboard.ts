import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/enviroment';

import { DashboardData } from '../models/dashboard/dashboard-module';
import { Cliente } from '../models/cliente/cliente-module';
import {
  ResumoFinanceiro,
} from '../models/movimentacao-financeira/movimentacao-financeira-module';
import { OrdemServico } from '../models/ordem-servico/ordem-servico-module';
import { Venda } from '../models/venda/venda-module';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obterDashboard(): Observable<DashboardData> {
    return forkJoin({
      clientes: this.http
        .get<Cliente[]>(`${this.baseUrl}/clientes`)
        .pipe(
          catchError((erro) => {
            console.error('Erro ao buscar clientes:', erro);
            return of([] as Cliente[]);
          })
        ),

      resumoFinanceiro: this.http
        .get<ResumoFinanceiro>(
          `${this.baseUrl}/movimentacoes-financeiras/resumo`
        )
        .pipe(
          catchError((erro) => {
            console.error('Erro ao buscar resumo financeiro:', erro);

            return of({
              totalEntradas: 0,
              totalSaidas: 0,
              saldo: 0,
            } as ResumoFinanceiro);
          })
        ),

      ordensServico: this.http
        .get<OrdemServico[]>(`${this.baseUrl}/ordens-servico`)
        .pipe(
          catchError((erro) => {
            console.error('Erro ao buscar ordens de serviço:', erro);
            return of([] as OrdemServico[]);
          })
        ),

      vendas: this.http
        .get<Venda[]>(`${this.baseUrl}/vendas`)
        .pipe(
          catchError((erro) => {
            console.error('Erro ao buscar vendas:', erro);
            return of([] as Venda[]);
          })
        ),
    }).pipe(
      map(
        ({
          clientes,
          resumoFinanceiro,
          ordensServico,
          vendas,
        }) => ({
          resumoFinanceiro,

          totalClientes: clientes.length,

          totalOrdensServico: ordensServico.length,

          ordensAbertas: ordensServico.filter(
            (o) => o.status === 'ABERTA'
          ).length,

          ordensConcluidas: ordensServico.filter(
            (o) => o.status === 'CONCLUIDA'
          ).length,

          totalVendas: vendas.length,

          faturamentoVendas: vendas.reduce(
            (sum, venda) => sum + (venda.valor ?? 0),
            0
          ),

          ultimasOrdens: ordensServico.slice(0, 5),

          ultimasVendas: vendas.slice(0, 5),
        }) as DashboardData
      )
    );
  }
}
