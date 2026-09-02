import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { StockBadge } from '../components/StockBadge'
import { ColorDot } from '../components/ColorDot'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { VariantFormModal } from '../components/VariantFormModal'
import { MoneyInput } from '../components/MoneyInput'
import { CostCompositionSection } from '../components/CostCompositionSection'
import { useAuth } from '../hooks/useAuth'
import {
  createProduct,
  createVariant,
  getProduct,
  listVariantsByProduct,
  setProductActive,
  setVariantActive,
  updateProduct,
  updateVariant,
} from '../services/productService'
import { listComponents } from '../services/componentService'
import { getBusiness } from '../services/businessService'
import type { Business, Component, Product, ProductVariant } from '../types'
import { PRODUCT_CATEGORY_SUGGESTIONS } from '../utils/constants'
import { formatMoney } from '../utils/money'

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId, user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [sellingPrice, setSellingPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (isNew || !businessId || !id) return
    setLoading(true)
    Promise.all([
      getProduct(businessId, id),
      listVariantsByProduct(businessId, id),
      listComponents(businessId),
      getBusiness(businessId),
    ]).then(([p, v, c, b]) => {
      if (p) {
        setProduct(p)
        setName(p.name)
        setCategory(p.category ?? '')
        setDescription(p.description ?? '')
        setSellingPrice(p.sellingPrice ?? 0)
      }
      setVariants(v)
      setComponents(c.filter((x) => x.active))
      setBusiness(b)
      setLoading(false)
    })
  }, [businessId, id, isNew])

  async function reloadVariants() {
    if (!businessId || !product) return
    setVariants(await listVariantsByProduct(businessId, product.id))
  }

  if (loading) return <LoadingScreen />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setSaving(true)
    try {
      const input = { name, category: category.trim() || null, description, sellingPrice: sellingPrice || null }
      if (isNew) {
        const newId = await createProduct(businessId, input)
        navigate(`/products/${newId}`, { replace: true })
      } else if (product) {
        await updateProduct(businessId, product.id, input)
        setProduct({ ...product, ...input })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Novo produto' : product?.name ?? 'Produto'} back />

      <form onSubmit={handleSubmit} className="bl-card p-4 d-flex flex-column gap-3 mb-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="form-label small fw-semibold">Nome do produto</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="Camiseta Básica"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">Categoria</label>
          <input
            type="text"
            className="form-control"
            list="product-category-suggestions"
            placeholder="Camisetas"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="product-category-suggestions">
            {PRODUCT_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="form-label small fw-semibold">Preço de venda (opcional)</label>
          <MoneyInput value={sellingPrice} onChange={setSellingPrice} />
          <p className="small text-muted-bl mb-0 mt-1">Usado para sugerir o valor na hora de registrar uma venda.</p>
        </div>

        <div>
          <label className="form-label small fw-semibold">Descrição (opcional)</label>
          <textarea className="form-control" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : isNew ? 'Criar produto' : 'Salvar alterações'}
        </button>
      </form>

      {!isNew && product && businessId && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-2 px-1">
            <h2 className="h6 fw-bold mb-0">Variantes</h2>
            <button
              type="button"
              className="btn btn-sm fw-semibold"
              style={{ color: 'var(--bl-primary)' }}
              onClick={() => {
                setEditingVariant(null)
                setVariantModalOpen(true)
              }}
            >
              <i className="bi bi-plus-lg me-1" />
              Adicionar
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="bl-card p-4 text-center small text-muted-bl mb-3">
              Nenhuma variante cadastrada. Adicione cor e tamanho para começar a controlar o estoque.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2 mb-3">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="bl-card p-3 d-flex align-items-center gap-3 text-start border-0"
                  onClick={() => {
                    setEditingVariant(v)
                    setVariantModalOpen(true)
                  }}
                >
                  <span className="flex-fill min-width-0">
                    <span className="d-flex align-items-center gap-2 fw-semibold">
                      <ColorDot color={v.color} />
                      {v.color} / {v.size}
                    </span>
                    <span className="d-block small text-muted-bl">Custo base {formatMoney(v.baseCost)}</span>
                  </span>
                  <StockBadge stock={v.stock} minStock={v.minStock} />
                </button>
              ))}
            </div>
          )}

          {business && (
            <CostCompositionSection
              businessId={businessId}
              product={product}
              variants={variants}
              components={components}
              business={business}
              onCompositionChange={(composition) => setProduct({ ...product, composition })}
              onLaborMinutesChange={(laborMinutes) => setProduct({ ...product, laborMinutes })}
              onSellingPriceChange={(price) => {
                setProduct({ ...product, sellingPrice: price })
                setSellingPrice(price)
              }}
            />
          )}

          <button
            type="button"
            className="btn w-100 fw-semibold"
            style={{ color: 'var(--bl-danger)' }}
            onClick={() => setConfirmDeactivate(true)}
          >
            Desativar produto
          </button>
        </>
      )}

      <VariantFormModal
        open={variantModalOpen}
        variant={editingVariant}
        onClose={() => setVariantModalOpen(false)}
        onSubmit={async (input) => {
          if (!businessId || !product || !user) return
          if (editingVariant) {
            await updateVariant(businessId, editingVariant.id, input)
          } else {
            await createVariant(businessId, product.id, product.name, user.uid, input)
          }
          await reloadVariants()
        }}
      />

      <ConfirmDialog
        open={confirmDeactivate}
        title="Desativar produto?"
        description="O produto e suas variantes deixarão de aparecer nas listas, mas o histórico é preservado."
        confirmLabel="Desativar"
        danger
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={async () => {
          if (!businessId || !product) return
          await setProductActive(businessId, product.id, false)
          await Promise.all(variants.map((v) => setVariantActive(businessId, v.id, false)))
          setConfirmDeactivate(false)
          navigate('/products', { replace: true })
        }}
      />
    </div>
  )
}
