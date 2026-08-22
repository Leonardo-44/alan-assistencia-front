import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';
import { Fiado, FiadoRequest } from '../models/fiado/fiado-module';

@Injectable({ providedIn: 'root' })
export class FiadoService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fiados`;

  listarTodos(): Observable<Fiado[]> {
    return this.http.get<Fiado[]>(this.baseUrl);
  }

  salvar(dto: FiadoRequest): Observable<Fiado> {
    return this.http.post<Fiado>(this.baseUrl, dto);
  }

  atualizar(id: number, dto: FiadoRequest): Observable<Fiado> {
    return this.http.put<Fiado>(`${this.baseUrl}/${id}`, dto);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  alternarPagamento(id: number): Observable<Fiado> {
    return this.http.patch<Fiado>(`${this.baseUrl}/${id}/pagamento`, {});
  }
}