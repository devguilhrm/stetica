import {
  AdminResource,
  AdminRow,
  AdminTab,
  AdminWrite,
} from "../../../application/contracts";
import { Category } from "../../../domain/models";
import {
  FormField,
  FormModel,
  PERSON_FIELDS,
  personInput,
} from "../../shared/person-form";

export const ADMIN_MENU: Array<{ key: AdminTab; label: string }> = [
  { key: "resumo", label: "Visão geral" },
  { key: "itens", label: "Produtos e serviços" },
  { key: "categorias", label: "Categorias" },
  { key: "pessoas", label: "Clientes" },
  { key: "funcionarios", label: "Funcionários" },
  { key: "estoque", label: "Estoque" },
  { key: "entradaprodutos", label: "Entradas" },
  { key: "pedidos", label: "Pedidos" },
];
export const ADMIN_COLUMNS: Record<AdminResource, Array<keyof AdminRow>> = {
  itens: ["id", "nome", "categoria", "tipo", "preco", "estoque", "ativo"],
  categorias: ["id", "nome"],
  pessoas: ["id", "nome", "email", "telefone", "ativo"],
  funcionarios: ["id", "nome", "cargo", "ativo"],
  estoque: [
    "id",
    "nome",
    "descricao",
    "preco",
    "precoVenda",
    "unidade",
    "categoria",
    "quantidade",
    "ativo",
  ],
  entradaprodutos: ["id", "produtoId", "data", "quantidade", "valorUnitario"],
  pedidos: ["id", "cliente", "data", "total", "status"],
};
export function newAdminForm(): FormModel {
  return {
    tipo: "P",
    ativo: true,
    codigoPreco: 1,
    unidade: "UN",
    sexo: "O",
    data: new Date().toISOString().slice(0, 10),
  };
}
export function editAdminForm(row: AdminRow, tab: AdminTab): FormModel {
  const model: FormModel = {};
  for (const [key, value] of Object.entries({ ...row, ...row.endereco })) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      model[key] = value;
  }
  model["id"] = row.id;
  if (row.dataNascimento)
    model["dataNascimento"] = row.dataNascimento.slice(0, 10);
  if (row.dataAdmissao) model["dataAdmissao"] = row.dataAdmissao.slice(0, 10);
  if (tab === "itens") model["preco"] = row.precoCusto;
  return model;
}
export function adminInput(
  resource: AdminResource,
  model: FormModel,
): AdminWrite {
  const text = (key: string) => String(model[key] ?? "");
  const number = (key: string) => Number(model[key]);
  switch (resource) {
    case "pessoas":
      return personInput(model);
    case "funcionarios":
      return {
        ...personInput(model),
        cargo: text("cargo"),
        dataAdmissao: text("dataAdmissao"),
      };
    case "categorias":
      return { nome: text("nome") };
    case "entradaprodutos":
      return {
        produtoId: number("produtoId"),
        quantidade: number("quantidade"),
        data: text("data"),
        valorUnitario: number("valorUnitario"),
      };
    case "itens":
      return {
        nome: text("nome"),
        descricao: text("descricao"),
        categoriaId: number("categoriaId"),
        tipo: model["tipo"] === "S" ? "S" : "P",
        preco: number("preco"),
        ativo: model["ativo"] === true,
        codigoPreco: Number(model["codigoPreco"] ?? 1),
        unidade: String(model["unidade"] ?? "UN"),
      };
    default:
      throw new Error("Este recurso não possui formulário de gravação.");
  }
}
export function adminFields(
  tab: AdminTab,
  model: FormModel,
  categories: Category[],
  items: AdminRow[],
): FormField[] {
  if (tab === "pessoas") return PERSON_FIELDS;
  if (tab === "funcionarios")
    return [
      ...PERSON_FIELDS,
      { key: "cargo", label: "Cargo", required: true, max: 50 },
      { key: "dataAdmissao", label: "Admissão", type: "date", required: true },
    ];
  if (tab === "categorias")
    return [
      { key: "nome", label: "Nome da categoria", required: true, max: 35 },
    ];
  if (tab === "entradaprodutos")
    return [
      {
        key: "produtoId",
        label: "Produto",
        required: true,
        options: items
          .filter((i) => i.tipo === "P" && i.ativo)
          .map((i) => ({ value: i.id, label: i.nome ?? "Produto #" + i.id })),
      },
      {
        key: "quantidade",
        label: "Quantidade recebida",
        type: "number",
        required: true,
        min: 1,
        max: 1000000,
      },
      { key: "data", label: "Data de entrada", type: "date", required: true },
      {
        key: "valorUnitario",
        label: "Custo unitário (R$)",
        type: "number",
        required: true,
        min: 0.01,
        max: 99999999.99,
      },
    ];
  if (tab !== "itens") return [];
  const productFields: FormField[] =
    model["tipo"] === "S"
      ? []
      : [
          {
            key: "codigoPreco",
            label: "Margem de venda",
            required: true,
            options: [
              { value: 1, label: "4%" },
              { value: 2, label: "8%" },
              { value: 3, label: "10%" },
            ],
          },
          {
            key: "unidade",
            label: "Unidade (UN, CX...)",
            required: true,
            max: 10,
          },
        ];
  return [
    { key: "nome", label: "Nome", required: true, max: 40 },
    { key: "descricao", label: "Descrição", required: true, max: 200 },
    {
      key: "categoriaId",
      label: "Categoria",
      required: true,
      options: categories.map((c) => ({ value: c.id, label: c.nome })),
    },
    {
      key: "tipo",
      label: "Tipo",
      required: true,
      options: [
        { value: "P", label: "Produto" },
        { value: "S", label: "Serviço" },
      ],
    },
    {
      key: "preco",
      label:
        model["tipo"] === "S" ? "Preço do serviço (R$)" : "Preço de custo (R$)",
      type: "number",
      required: true,
      min: 0.01,
      max: 99999999.99,
    },
    ...productFields,
    {
      key: "ativo",
      label: "Situação",
      options: [
        { value: true, label: "Ativo" },
        { value: false, label: "Inativo" },
      ],
    },
  ];
}
