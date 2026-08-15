import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../core/services/cliente';
import { Cliente } from '../../core/models/cliente/cliente-module';

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
        console.log('Clientes recebidos:', dados);

        this.clientes = dados;
        this.carregando = false;
        this.erro = false;

        // Força o Angular a atualizar a tela imediatamente.
        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('ERRO AO BUSCAR CLIENTES:', erro);

        this.erro = true;
        this.carregando = false;

        // Força a atualização da tela também em caso de erro.
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
}

