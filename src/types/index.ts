/**
 * Tipos centrais do domínio Belook.
 *
 * Convenções importantes:
 * - Todo valor monetário é armazenado em CENTAVOS (inteiro) para evitar
 *   problemas de ponto flutuante. Ex.: R$ 59,90 => 5990. Use os
 *   utilitários de src/utils/money.ts para formatar/converter.
 * - Datas são armazenadas como Firestore Timestamp, mas expostas no app
 *   como `number` (epoch millis) depois de convertidas pelos services,
 *   para simplificar o uso em componentes.
 * - `businessId` identifica o "dono" dos dados (hoje sempre igual ao uid
 *   do usuário autenticado). Isso prepara o modelo para o futuro suporte
 *   a múltiplos usuários por empresa sem precisar migrar dados: basta
 *   introduzir uma coleção `memberships` que mapeia uid -> businessId.
 */

export type ID = string

/** Centavos (inteiro). R$ 59,90 = 5990. */
export type Cents = number

/** Documento base de qualquer entidade pertencente a um negócio. */
export interface OwnedEntity {
  id: ID
  businessId: ID
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Negócio / configurações
// ---------------------------------------------------------------------------

export interface Business extends Omit<OwnedEntity, 'businessId'> {
  name: string
  currency: 'BRL'
  allowNegativeStock: boolean
  defaultMinStock: number
  theme: 'light' | 'dark' | 'system'
  /** quanto vale sua hora de trabalho — usado para custear a mão de obra de cada produto */
  laborRatePerHour: Cents
  /** custo fixo mensal (energia, aluguel, depreciação de equipamento etc.) */
  monthlyOverhead: Cents
  /** produção mensal estimada, usada para ratear o custo fixo por unidade */
  estimatedMonthlyProduction: number
  /** taxa de cartão/marketplace sobre o preço de venda, como fração (0.05 = 5%) */
  paymentFeePercent: number
  /** margem de lucro padrão usada para sugerir preço de venda, como fração (0.4 = 40%) */
  defaultTargetMargin: number
}

// ---------------------------------------------------------------------------
// Produtos e variantes
//
// Categoria é apenas um texto livre (com sugestões fixas na UI) em vez de
// uma entidade própria — evita telas de cadastro de categoria para um caso
// de uso que não precisa disso ainda. Pode virar uma coleção no futuro sem
// quebrar nada, já que hoje já é uma string solta no documento.
// ---------------------------------------------------------------------------

/** Um componente usado na composição (ficha de custo) de um produto. */
export interface CostComponentLine {
  /** id do Component (insumo) OU de uma ProductVariant usada como insumo. */
  refId: ID
  refType: 'component' | 'variant'
  /** snapshot do nome no momento em que foi adicionado, para exibição rápida */
  name: string
  quantity: number
  /** custo unitário vigente no momento do cálculo (centavos) */
  unitCost: Cents
}

export interface Product extends OwnedEntity {
  name: string
  category: string | null
  description?: string
  /** composição usada para calcular o custo do produto (ficha de custo) */
  composition: CostComponentLine[]
  /** tempo de produção em minutos, usado para custear a mão de obra (tempo × valor/hora do negócio) */
  laborMinutes: number
  sellingPrice: Cents | null
  active: boolean
}

export interface ProductVariant extends OwnedEntity {
  productId: ID
  sku?: string
  color: string
  size: string
  /** estoque atual (denormalizado, atualizado via transação a cada movimentação) */
  stock: number
  minStock: number
  /** custo base da variante (ex.: custo da camiseta lisa naquele tamanho) */
  baseCost: Cents
  active: boolean
}

// ---------------------------------------------------------------------------
// Insumos / componentes (DTF, embalagem, etiqueta, etc.)
// ---------------------------------------------------------------------------

export interface Component extends OwnedEntity {
  name: string
  category: string | null
  /** opcional — usado quando o insumo em si varia por cor/tamanho (ex.: camiseta lisa) */
  color: string | null
  size: string | null
  unit: string
  unitCost: Cents
  stock: number
  minStock: number
  active: boolean
}

// ---------------------------------------------------------------------------
// Estoque — movimentações (fonte da verdade para histórico/auditoria)
// ---------------------------------------------------------------------------

export type MovementType =
  | 'entrada'
  | 'saida'
  | 'ajuste'
  | 'perda'
  | 'brinde'
  | 'uso_proprio'
  | 'venda'
  | 'producao'

export type MovementTargetType = 'variant' | 'component'

export interface InventoryMovement extends OwnedEntity {
  targetType: MovementTargetType
  targetId: ID
  /** snapshot para exibição no histórico sem precisar de join */
  targetName: string
  type: MovementType
  /** positivo para entradas, negativo para saídas (facilita somatórios) */
  quantity: number
  unitCost: Cents | null
  totalCost: Cents | null
  reason?: string
  /** snapshot do nome do fornecedor (texto livre até a entidade Supplier ganhar tela própria) */
  supplierName?: string
  note?: string
  userId: ID
  /** saldo resultante após a movimentação (auditoria/depuração) */
  resultingStock: number
}

// ---------------------------------------------------------------------------
// Clientes / fornecedores
// ---------------------------------------------------------------------------

export interface Customer extends OwnedEntity {
  name: string
  phone?: string
  email?: string
  note?: string
  active: boolean
}

export interface Supplier extends OwnedEntity {
  name: string
  contact?: string
  note?: string
  active: boolean
}

// ---------------------------------------------------------------------------
// Vendas
// ---------------------------------------------------------------------------

export interface SaleItem {
  variantId: ID
  /** snapshot para exibição sem precisar de join */
  productName: string
  color: string
  size: string
  quantity: number
  /** preço praticado nesta venda (histórico, nunca recalculado) */
  unitPrice: Cents
  /** custo do produto no momento da venda (histórico, nunca recalculado) */
  unitCost: Cents
}

export interface Sale extends OwnedEntity {
  customerId: ID | null
  customerName?: string
  items: SaleItem[]
  totalRevenue: Cents
  totalCost: Cents
  profit: Cents
  note?: string
  soldAt: number
  userId: ID
}

// ---------------------------------------------------------------------------
// Pedidos personalizados / produção
// ---------------------------------------------------------------------------

export type OrderStatus = 'recebido' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado'

export interface OrderItem {
  description: string
  quantity: number
  unitPrice: Cents
  unitCostEstimate: Cents
}

export interface Order extends OwnedEntity {
  customerId: ID | null
  customerName?: string
  status: OrderStatus
  items: OrderItem[]
  totalValue: Cents
  totalCostEstimate: Cents
  note?: string
  dueDate?: number | null
}

// ---------------------------------------------------------------------------
// Despesas
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | 'frete'
  | 'marketing'
  | 'embalagem'
  | 'ferramentas'
  | 'equipamentos'
  | 'taxas'
  | 'outros'

export interface Expense extends OwnedEntity {
  description: string
  category: ExpenseCategory
  amount: Cents
  date: number
  note?: string
}
