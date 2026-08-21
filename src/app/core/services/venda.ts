import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../environments/enviroment';

import {
  Venda,
  VendaRequest,
  ComprovanteVendaRequest,
} from '../models/venda/venda-module';

@Injectable({
  providedIn: 'root',
})
export class VendaService {
  private readonly baseUrl = `${environment.apiUrl}/vendas`;

  constructor(private http: HttpClient) { }

  registrarPagamento(
    id: number,
    valor: number
  ): Observable<Venda> {
    return this.http
      .patch<Venda>(`${this.baseUrl}/${id}/pagamento`, { valor })
      .pipe(timeout(10000));
  }

  listarTodos(): Observable<Venda[]> {
    return this.http
      .get<Venda[]>(this.baseUrl)
      .pipe(timeout(10000));
  }

  buscarPorId(id: number): Observable<Venda> {
    return this.http
      .get<Venda>(`${this.baseUrl}/${id}`)
      .pipe(timeout(10000));
  }

  salvar(dto: VendaRequest): Observable<Venda> {
    return this.http
      .post<Venda>(this.baseUrl, dto)
      .pipe(timeout(10000));
  }

  atualizar(
    id: number,
    dto: VendaRequest
  ): Observable<Venda> {
    return this.http
      .put<Venda>(
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

  gerarComprovantePdf(id: number, dados: ComprovanteVendaRequest): Observable<Blob> {
  return this.http
    .post(`${this.baseUrl}/${id}/comprovante`, dados, {
      responseType: 'blob',
    })
    .pipe(timeout(15000));
}
}