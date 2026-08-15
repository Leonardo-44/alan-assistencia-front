import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  menuAberto = false;

  /**
   * Abre ou fecha o menu lateral no mobile.
   */
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  /**
   * Fecha o menu lateral.
   *
   * É chamado quando o usuário:
   * - clica em uma opção do menu;
   * - clica no overlay.
   */
  fecharMenu(): void {
    this.menuAberto = false;
  }
}
