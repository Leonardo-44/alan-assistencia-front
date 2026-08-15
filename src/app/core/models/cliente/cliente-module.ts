// Espelha ClienteReponseDTO (back-end)
export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
}

// Espelha ClienteRequestDTO (back-end) — usado ao criar/editar
export interface ClienteRequest {
  nome: string;
  telefone: string;
  email: string;
}