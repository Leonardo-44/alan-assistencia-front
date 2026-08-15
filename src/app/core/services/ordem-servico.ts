import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../../environments/enviroment';

import {
  Garantia,
  OrdemServico,
  OrdemServicoRequest,
  ComprovanteRequest,
} from '../models/ordem-servico/ordem-servico-module';

@Injectable({
  providedIn: 'root',
})
export class OrdemServicoService {
  private readonly baseUrl = `${environment.apiUrl}/ordens-servico`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<OrdemServico[]> {
    return this.http
      .get<OrdemServico[]>(this.baseUrl)
      .pipe(timeout(10000));
  }

  buscarPorId(id: number): Observable<OrdemServico> {
    return this.http
      .get<OrdemServico>(`${this.baseUrl}/${id}`)
      .pipe(timeout(10000));
  }

  salvar(dto: OrdemServicoRequest): Observable<OrdemServico> {
    return this.http
      .post<OrdemServico>(this.baseUrl, dto)
      .pipe(timeout(10000));
  }

  atualizar(
    id: number,
    dto: OrdemServicoRequest
  ): Observable<OrdemServico> {
    return this.http
      .put<OrdemServico>(
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

  verificarGarantia(id: number): Observable<Garantia> {
    return this.http
      .get<Garantia>(
        `${this.baseUrl}/${id}/garantia`
      )
      .pipe(timeout(10000));
  }

  gerarComprovantePdf(id: number, dados: ComprovanteRequest): Observable<Blob> {
  return this.http
    .post(`${this.baseUrl}/${id}/comprovante-pdf`, dados, {
      responseType: 'blob',
    })
    .pipe(timeout(15000));
}
}