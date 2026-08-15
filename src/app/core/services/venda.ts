import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../environments/enviroment';

import {
  Venda,
  VendaRequest,
} from '../models/venda/venda-module';

@Injectable({
  providedIn: 'root',
})
export class VendaService {
  private readonly baseUrl = `${environment.apiUrl}/vendas`;

  constructor(private http: HttpClient) {}

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
}