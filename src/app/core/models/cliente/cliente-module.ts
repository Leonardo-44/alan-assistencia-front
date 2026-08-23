// Espelha ClienteResponseDTO (back-end)
// OBS: o back-end ainda manda esse campo como "email" no JSON.
// Aqui ele é usado para guardar o ENDEREÇO do cliente (a UI mostra "Endereço").
export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
}

// Espelha ClienteRequestDTO (back-end) — usado ao criar/editar
export interface ClienteRequest {
  nome: string;
  telefone: string;
  endereco?: string; // na prática guarda o endereço
}