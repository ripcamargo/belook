import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateComposition, updateLaborMinutes, updateSellingPrice } from '../services/productService'
import {
  calculateCompositionCost,
  calculateFullUnitCost,
  calculateLaborCost,
  calculateMargin,
  calculateOverheadPerUnit,
  suggestSellingPrice,
} from '../utils/calculations'
import { formatMoney } from '../utils/money'
import { formatPercent } from '../utils/format'
import { ColorDot } from './ColorDot'
import type { Business, Component, CostComponentLine, Product, ProductVariant } from '../types'

interface CostCompositionSectionProps {
  businessId: string
  product: Product
  variants: ProductVariant[]
  components: Component[]
  business: Business
  onCompositionChange: (composition: CostComponentLine[]) => void
  onLaborMinutesChange: (laborMinutes: number) => void
  onSellingPriceChange: (sellingPrice: number) => void
}

export function CostCompositionSection({
  businessId,
  product,
  variants,
  components,
  business,
  onCompositionChange,
  onLaborMinutesChange,
  onSellingPriceChange,
}: CostCompositionSectionProps) {
  const [componentId, setComponentId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [laborMinutesText, setLaborMinutesText] = useState(String(product.laborMinutes ?? 0))
  useEffect(() => setLaborMinutesText(String(product.laborMinutes ?? 0)), [product.laborMinutes])

  const [referenceVariantId, setReferenceVariantId] = useState(variants[0]?.id ?? '')
  const [targetMarginText, setTargetMarginText] = useState(String(Math.round((business.defaultTargetMargin ?? 0.4) * 100)))
  const [priceApplied, setPriceApplied] = useState(false)

  const composition = product.composition
  const compositionCost = calculateCompositionCost(composition)
  const laborCost = calculateLaborCost(product.laborMinutes ?? 0, business.laborRatePerHour ?? 0)
  const overheadCost = calculateOverheadPerUnit(business)

  const selectedComponent = components.find((c) => c.id === componentId) ?? null
  const selectedUnit = selectedComponent?.unit.trim().toLowerCase() ?? ''
  const isSquareMeterUnit = selectedUnit === 'm²' || selectedUnit === 'm2'
  const isSquareCmUnit = selectedUnit === 'cm²' || selectedUnit === 'cm2'
  const isAreaUnit = isSquareMeterUnit || isSquareCmUnit

  const areaQuantity = (() => {
    const width = Number(widthCm.replace(',', '.'))
    const height = Number(heightCm.replace(',', '.'))
    if (!width || !height) return null
    const areaCm2 = width * height
    return isSquareMeterUnit ? areaCm2 / 10000 : areaCm2
  })()

  function selectComponent(id: string) {
    setComponentId(id)
    setWidthCm('')
    setHeightCm('')
    setQuantity(1)
  }

  async function addLine() {
    setError(null)
    const component = components.find((c) => c.id === componentId)
    if (!component) {
      setError('Selecione um insumo.')
      return
    }
    const finalQuantity = isAreaUnit ? areaQuantity ?? 0 : quantity
    if (finalQuantity <= 0) {
      setError(isAreaUnit ? 'Informe largura e altura.' : 'Informe uma quantidade maior que zero.')
      return
    }

    const line: CostComponentLine = {
      refId: component.id,
      refType: 'component',
      name: component.name,
      quantity: finalQuantity,
      unitCost: component.unitCost,
    }
    setSaving(true)
    try {
      const next = [...composition, line]
      await updateComposition(businessId, product.id, next)
      onCompositionChange(next)
      setComponentId('')
      setQuantity(1)
      setWidthCm('')
      setHeightCm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function removeLine(index: number) {
    const next = composition.filter((_, i) => i !== index)
    await updateComposition(businessId, product.id, next)
    onCompositionChange(next)
  }

  async function saveLaborMinutes() {
    const minutes = Number(laborMinutesText) || 0
    if (minutes === product.laborMinutes) return
    await updateLaborMinutes(businessId, product.id, minutes)
    onLaborMinutesChange(minutes)
  }

  const referenceVariant = variants.find((v) => v.id === referenceVariantId) ?? variants[0] ?? null
  const referenceCost = referenceVariant ? calculateFullUnitCost(referenceVariant, product, business).total : 0
  const targetMargin = (Number(targetMarginText) || 0) / 100
  const suggestedPrice = referenceVariant ? suggestSellingPrice(referenceCost, targetMargin, business.paymentFeePercent ?? 0) : null

  async function applySuggestedPrice() {
    if (suggestedPrice == null) return
    await updateSellingPrice(businessId, product.id, suggestedPrice)
    onSellingPriceChange(suggestedPrice)
    setPriceApplied(true)
  }

  return (
    <div className="mb-3">
      <h2 className="h6 fw-bold mb-2 px-1">Ficha de custo</h2>

      <div className="bl-card p-4 d-flex flex-column gap-3 mb-2">
        <p className="small fw-semibold text-muted-bl mb-0">Insumos</p>

        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        {composition.length === 0 ? (
          <p className="small text-muted-bl mb-0">Nenhum insumo adicionado ainda.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {composition.map((line, index) => (
              <div key={`${line.refId}-${index}`} className="d-flex align-items-center gap-3">
                <span className="flex-fill min-width-0">
                  <span className="d-block fw-semibold text-truncate">{line.name}</span>
                  <span className="d-block small text-muted-bl">
                    {line.quantity} × {formatMoney(line.unitCost)} = {formatMoney(line.quantity * line.unitCost)}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}
                  onClick={() => removeLine(index)}
                  aria-label="Remover insumo"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))}
            <div className="d-flex justify-content-between small fw-semibold pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
              <span>Total de insumos</span>
              <span>{formatMoney(compositionCost)}</span>
            </div>
          </div>
        )}

        {components.length === 0 ? (
          <p className="small text-muted-bl mb-0">
            <Link to="/components/new">Cadastre um insumo</Link> (DTF, embalagem, etiqueta…) para adicioná-lo aqui.
          </p>
        ) : (
          <div className="row g-2 align-items-end">
            <div className="col-12">
              <label className="form-label small fw-semibold">Insumo</label>
              <select className="form-select" value={componentId} onChange={(e) => selectComponent(e.target.value)}>
                <option value="" disabled>
                  Selecione
                </option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatMoney(c.unitCost)}/{c.unit})
                  </option>
                ))}
              </select>
            </div>

            {isAreaUnit ? (
              <>
                <div className="col-4">
                  <label className="form-label small fw-semibold">Largura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    className="form-control"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold">Altura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    className="form-control"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
                <div className="col-4 d-flex flex-column gap-1">
                  <span className="small text-muted-bl text-truncate">
                    = {areaQuantity != null ? areaQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'} {selectedComponent?.unit}
                  </span>
                  <button type="button" className="btn w-100" style={{ background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }} onClick={addLine} disabled={saving}>
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="col-8">
                  <label className="form-label small fw-semibold">Qtd.</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="col-4">
                  <button type="button" className="btn w-100" style={{ background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }} onClick={addLine} disabled={saving}>
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="row g-2 align-items-end pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
          <div className="col-7">
            <label className="form-label small fw-semibold">Mão de obra (minutos)</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-control"
              value={laborMinutesText}
              onChange={(e) => setLaborMinutesText(e.target.value)}
              onBlur={saveLaborMinutes}
            />
          </div>
          <div className="col-5">
            <span className="d-block small text-muted-bl">Custo</span>
            <span className="fw-semibold">{formatMoney(laborCost)}</span>
          </div>
        </div>
        {!business.laborRatePerHour && (
          <p className="small text-muted-bl mb-0">
            <Link to="/settings">Defina o valor da sua hora</Link> em Configurações para calcular esse custo.
          </p>
        )}

        <div className="d-flex align-items-center justify-content-between pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
          <span>
            <span className="d-block small fw-semibold">Custo fixo (rateio)</span>
            <span className="d-block small text-muted-bl">
              <Link to="/settings">Ajustar em Configurações</Link>
            </span>
          </span>
          <span className="fw-semibold">{formatMoney(overheadCost)}</span>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="bl-card p-4 d-flex flex-column gap-2 mb-2">
          <p className="small fw-semibold text-muted-bl mb-1">Custo total por variante</p>
          {variants.map((v) => {
            const unitCost = calculateFullUnitCost(v, product, business).total
            const margin = calculateMargin(product.sellingPrice, unitCost)
            return (
              <div key={v.id} className="d-flex align-items-center justify-content-between gap-2">
                <span className="d-flex align-items-center gap-2 small">
                  <ColorDot color={v.color} size={10} />
                  {v.color} / {v.size}
                </span>
                <span className="small text-end">
                  <span className="fw-semibold">{formatMoney(unitCost)}</span>
                  {margin != null && (
                    <span className="ms-2" style={{ color: margin >= 0 ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
                      {formatPercent(margin)}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
          {product.sellingPrice == null && (
            <p className="small text-muted-bl mb-0 mt-1">Defina um preço de venda para ver a margem de lucro.</p>
          )}
        </div>
      )}

      {variants.length > 0 && (
        <div className="bl-card p-4 d-flex flex-column gap-3">
          <p className="small fw-semibold text-muted-bl mb-0">Sugestão de preço de venda</p>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-semibold">Variante de referência</label>
              <select className="form-select" value={referenceVariantId || variants[0]?.id} onChange={(e) => setReferenceVariantId(e.target.value)}>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color} / {v.size}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Margem desejada (%)</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={99}
                className="form-control"
                value={targetMarginText}
                onChange={(e) => {
                  setTargetMarginText(e.target.value)
                  setPriceApplied(false)
                }}
              />
            </div>
          </div>

          {suggestedPrice == null ? (
            <p className="small mb-0" style={{ color: 'var(--bl-danger)' }}>
              Margem + taxa de pagamento somam 100% ou mais — reduza a margem desejada.
            </p>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted-bl">Preço sugerido</span>
                <span className="h5 fw-bold mb-0">{formatMoney(suggestedPrice)}</span>
              </div>
              <button type="button" className="btn btn-primary fw-semibold" onClick={applySuggestedPrice} disabled={priceApplied}>
                {priceApplied ? 'Aplicado ao preço de venda' : 'Usar este preço'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
