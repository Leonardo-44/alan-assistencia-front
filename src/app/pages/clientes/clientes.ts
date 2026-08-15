import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../core/services/cliente';
import { Cliente, ClienteRequest } from '../../core/models/cliente/cliente-module';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {

  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  clientes: Cliente[] = [];

  carregando = false;
  erro = false;
  termoBusca = '';

  modalAberto = false;
  salvando = false;
  erroSalvar = false;

  novoCliente: ClienteRequest = {
    nome: '',
    telefone: '',
    email: '',
  };

  private readonly coresAvatar = [
    'av-1',
    'av-2',
    'av-3',
    'av-4',
    'av-5',
    'av-6',
  ];

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.carregando = true;
    this.erro = false;

    this.clienteService.listarTodos().subscribe({
      next: (dados) => {
        this.clientes = dados;
        this.carregando = false;
        this.erro = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        this.erro = true;
        this.carregando = false;

        this.cdr.detectChanges();
      },

      complete: () => {
        this.carregando = false;

        this.cdr.detectChanges();
      },
    });
  }

  get clientesFiltrados(): Cliente[] {
    const termo = this.termoBusca.trim().toLowerCase();

    if (!termo) {
      return this.clientes;
    }

    return this.clientes.filter((cliente) =>
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.email?.toLowerCase().includes(termo) ||
      cliente.telefone?.toLowerCase().includes(termo)
    );
  }

  iniciais(nome: string): string {
    if (!nome) {
      return '?';
    }

    const partes = nome.trim().split(/\s+/);

    const primeira = partes[0]?.[0] ?? '';

    const ultima =
      partes.length > 1
        ? partes[partes.length - 1][0]
        : '';

    return (primeira + ultima).toUpperCase();
  }

  corAvatar(nome: string): string {
    if (!nome) {
      return this.coresAvatar[0];
    }

    const soma = nome
      .split('')
      .reduce(
        (acc, ch) => acc + ch.charCodeAt(0),
        0
      );

    return this.coresAvatar[
      soma % this.coresAvatar.length
    ];
  }

  formatarTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digitos = input.value.replace(/\D/g, '').slice(0, 11);

    if (digitos.length > 10) {
      digitos = digitos.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    } else if (digitos.length > 6) {
      digitos = digitos.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (digitos.length > 2) {
      digitos = digitos.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (digitos.length > 0) {
      digitos = digitos.replace(/^(\d*)/, '($1');
    }

    this.novoCliente.telefone = digitos;
    input.value = digitos;
  }

  formatarTelefoneExibicao(telefone: string): string {
    if (!telefone) {
      return '—';
    }

    const digitos = telefone.replace(/\D/g, '');

    if (digitos.length === 11) {
      return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }

    if (digitos.length === 10) {
      return digitos.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }

    return telefone;
  }

  abrirModal(): void {
    this.novoCliente = { nome: '', telefone: '', email: '' };
    this.erroSalvar = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvarCliente(): void {
    if (!this.novoCliente.nome?.trim()) {
      return;
    }

    this.salvando = true;
    this.erroSalvar = false;

    const dto: ClienteRequest = {
      nome: this.novoCliente.nome.trim(),
      telefone: this.novoCliente.telefone?.trim() || '',
      email: this.novoCliente.email?.trim() || '',
    };

    this.clienteService.salvar(dto).subscribe({
      next: (clienteCriado) => {
        this.clientes = [...this.clientes, clienteCriado];
        this.salvando = false;
        this.modalAberto = false;

        this.cdr.detectChanges();
      },

      error: () => {
        this.erroSalvar = true;
        this.salvando = false;

        this.cdr.detectChanges();
      },
    });
  }
}