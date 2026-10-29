import { PersonInput } from "../../application/contracts";
export type FormValue = string | number | boolean | undefined;
export type FormModel = Record<string, FormValue>;
export interface FormField {
  key: string;
  label: string;
  type?: "text" | "date" | "email" | "number";
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: Array<{ value: FormValue; label: string }>;
}
export const PERSON_FIELDS: FormField[] = [
  { key: "nome", label: "Nome completo", required: true, max: 100 },
  {
    key: "cpf",
    label: "CPF (11 dígitos)",
    required: true,
    pattern: "[0-9]{11}",
  },
  { key: "dataNascimento", label: "Nascimento", type: "date", required: true },
  {
    key: "sexo",
    label: "Sexo",
    required: true,
    options: [
      { value: "F", label: "Feminino" },
      { value: "M", label: "Masculino" },
      { value: "O", label: "Outro" },
    ],
  },
  { key: "email", label: "E-mail", type: "email", required: true, max: 100 },
  {
    key: "telefone",
    label: "Telefone com DDD",
    required: true,
    pattern: "[0-9]{10,11}",
  },
  { key: "cep", label: "CEP (8 dígitos)", required: true, pattern: "[0-9]{8}" },
  { key: "logradouro", label: "Logradouro", required: true, max: 150 },
  { key: "numero", label: "Número", required: true, max: 10 },
  { key: "bairro", label: "Bairro", required: true, max: 100 },
  { key: "cidade", label: "Cidade", required: true, max: 100 },
  {
    key: "uf",
    label: "UF (sigla maiúscula)",
    required: true,
    pattern: "[A-Z]{2}",
  },
  { key: "complemento", label: "Complemento", max: 150 },
];
export function personInput(model: FormModel): PersonInput {
  const text = (key: string) => String(model[key] ?? "");
  return {
    nome: text("nome"),
    cpf: text("cpf"),
    dataNascimento: text("dataNascimento"),
    sexo: text("sexo"),
    email: text("email"),
    telefone: text("telefone"),
    endereco: {
      cep: text("cep"),
      logradouro: text("logradouro"),
      bairro: text("bairro"),
      cidade: text("cidade"),
      uf: text("uf"),
      numero: text("numero"),
      complemento: text("complemento"),
    },
  };
}
