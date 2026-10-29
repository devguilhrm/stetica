import { AdminDetail, AdminRow } from "../../application/contracts";
const LABELS: Partial<Record<keyof AdminRow, string>> = {
  id: "ID",
  nome: "Nome",
  categoria: "Categoria",
  tipo: "Tipo",
  preco: "Preço",
  precoVenda: "Venda",
  estoque: "Estoque",
  ativo: "Situação",
  email: "E-mail",
  telefone: "Telefone",
  cargo: "Cargo",
  produtoId: "Produto ID",
  data: "Data",
  quantidade: "Quantidade",
  valorUnitario: "Valor unitário",
  cliente: "Cliente",
  total: "Total",
  status: "Situação",
  descricao: "Descrição",
  unidade: "Unidade",
};
export function columnLabel(key: keyof AdminRow): string {
  return LABELS[key] ?? key;
}
export function displayValue(
  row: Partial<AdminRow>,
  key: keyof AdminRow,
): string {
  const value = row[key];
  if (key === "ativo") return value ? "Ativo" : "Inativo";
  if (key === "data" && typeof value === "string")
    return new Date(value).toLocaleDateString("pt-BR");
  if (
    ["preco", "precoVenda", "total", "valorUnitario"].includes(key) &&
    typeof value === "number"
  ) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  return value === undefined || value === null ? "" : String(value);
}
export function detailFields(
  detail: AdminDetail | null,
): Array<{ label: string; value: string }> {
  if (!detail) return [];
  const data: Partial<AdminRow> = detail.pessoa ?? detail;
  const labels: Partial<Record<keyof AdminRow, string>> = {
    ...LABELS,
    cpf: "CPF",
    dataNascimento: "Nascimento",
    sexo: "Sexo",
    dataAdmissao: "Admissão",
    categoriaId: "Categoria ID",
    precoCusto: "Preço de custo",
    codigoPreco: "Código de preço",
  };
  const rows = (Object.keys(labels) as Array<keyof AdminRow>)
    .filter((key) => data[key] !== undefined)
    .map((key) => ({ label: labels[key]!, value: displayValue(data, key) }));
  const address = data.endereco;
  if (address)
    rows.push({
      label: "Endereço",
      value: [
        address.logradouro,
        address.numero,
        address.complemento,
        address.bairro,
        address.cidade,
        address.uf,
        address.cep,
      ]
        .filter(Boolean)
        .join(", "),
    });
  if (detail.pessoa)
    rows.push(
      { label: "Cargo", value: detail.cargo ?? "" },
      { label: "Admissão", value: detail.dataAdmissao?.slice(0, 10) ?? "" },
    );
  return rows;
}
