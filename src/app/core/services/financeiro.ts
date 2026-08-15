import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../environments/enviroment';

import {
  MovimentacaoFinanceira,
  MovimentacaoFinanceiraRequest,
  ResumoFinanceiro,
} from '../models/movimentacao-financeira/movimentacao-financeira-module';

@Injectable({
  providedIn: 'root',
})
export class FinanceiroService {
  private readonly baseUrl = `${environment.apiUrl}/movimentacoes-financeiras`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<MovimentacaoFinanceira[]> {
    return this.http
      .get<MovimentacaoFinanceira[]>(this.baseUrl)
      .pipe(timeout(10000));
  }

  resumo(): Observable<ResumoFinanceiro> {
    return this.http
      .get<ResumoFinanceiro>(`${this.baseUrl}/resumo`)
      .pipe(timeout(10000));
  }

  buscarPorId(id: number): Observable<MovimentacaoFinanceira> {
    return this.http
      .get<MovimentacaoFinanceira>(`${this.baseUrl}/${id}`)
      .pipe(timeout(10000));
  }

  salvar(
    dto: MovimentacaoFinanceiraRequest
  ): Observable<MovimentacaoFinanceira> {
    return this.http
      .post<MovimentacaoFinanceira>(this.baseUrl, dto)
      .pipe(timeout(10000));
  }

  atualizar(
    id: number,
    dto: MovimentacaoFinanceiraRequest
  ): Observable<MovimentacaoFinanceira> {
    return this.http
      .put<MovimentacaoFinanceira>(
        `${this.baseUrl}/${id}`,
        dto
      )
      .pipe(timeout(10000));
  }

  remover(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(timeout(10000));
  }
}