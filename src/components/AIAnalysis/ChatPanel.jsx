import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Renderiza texto con negritas simples (**text** → <strong>)
function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-[var(--text-primary)] font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Respuestas mock contextual según la empresa
function getMockResponse(question, company) {
  const q = question.toLowerCase()
  const m = company.metrics
  const f = company.financials

  if (q.includes('deuda') || q.includes('pagar') || q.includes('apalancamiento')) {
    if (m.deudaNetaEbitda === 0) {
      return `${company.name} es un banco, por lo que la métrica Deuda Neta/EBITDA no aplica de forma convencional. Sin embargo, su CET1 ratio y la cobertura de provisiones son sólidos. El banco genera suficiente flujo de caja operativo para mantener una posición de capital cómoda por encima de los requerimientos regulatorios.`
    }
    return `La deuda neta de ${company.name} se sitúa en ${m.deudaNetaEbitda.toFixed(1)}x EBITDA, ${m.deudaNetaEbitda < 2 ? 'un nivel muy conservador' : m.deudaNetaEbitda < 3 ? 'un nivel manejable' : 'un nivel algo elevado que requiere vigilancia'}. La cobertura de intereses es de ${m.interestCoverage.toFixed(1)}x, lo que significa que genera ${m.interestCoverage.toFixed(0)} veces más beneficio operativo del necesario para pagar los intereses de su deuda. El Free Cash Flow anual de $${(f.fcf[f.fcf.length - 1] / 1000).toFixed(0)}B es más que suficiente para gestionar los vencimientos.`
  }

  if (q.includes('margen') || q.includes('márgenes') || q.includes('rentab')) {
    return `Los márgenes de ${company.name} muestran una evolución positiva. El margen bruto actual es del ${m.marginBruto.toFixed(1)}% (sector: ${m.marginBrutoSector.toFixed(1)}%), el margen neto del ${m.marginNeto.toFixed(1)}% (sector: ${m.marginNetoSector.toFixed(1)}%) y el margen EBITDA del ${m.marginEbitda.toFixed(1)}%. La tendencia de los últimos 5 años muestra ${m.marginNeto > m.marginNetoSector ? 'márgenes consistentemente por encima del sector, lo cual refleja ventajas competitivas sostenibles' : 'márgenes en línea con el sector, con margen de mejora si la empresa ejecuta bien su estrategia de eficiencia'}.`
  }

  if (q.includes('valoración') || q.includes('wacc') || q.includes('dcf') || q.includes('valor')) {
    return `Según nuestro modelo DCF con un WACC del ${company.dcf.wacc}%, un crecimiento del FCF del ${company.dcf.growthRate5y}% los primeros 5 años y del ${company.dcf.growthRate10y}% los siguientes 5 años, el valor intrínseco estimado es de $${company.intrinsicValue.toFixed(2)} por acción. Con el precio actual de $${company.price.toFixed(2)}, esto implica un margen de seguridad del ${company.safetyMargin > 0 ? '+' : ''}${company.safetyMargin}%. Si el WACC subiera al 12%, el valor intrínseco caería aproximadamente un 15-20%, lo cual reduciría significativamente el margen de seguridad.`
  }

  if (q.includes('competidor') || q.includes('compara') || q.includes('sector') || q.includes('peer')) {
    return `${company.name} se posiciona favorablemente dentro de su sector (${company.sector}). Con un ROE del ${m.roe.toFixed(1)}% frente a la media sectorial del ${m.roeSector.toFixed(1)}%, supera ampliamente a sus peers. El PER de ${m.per.toFixed(1)}x vs ${m.perSector.toFixed(1)}x del sector ${m.per > m.perSector ? 'sugiere que el mercado valora una prima por la calidad superior del negocio' : 'refleja un descuento atractivo que podría corregirse'}. La puntuación de calidad de ${company.qualityScore}/10 la sitúa en el top del sector.`
  }

  if (q.includes('dividendo') || q.includes('reparto') || q.includes('yield')) {
    if (m.dividendYield === 0) {
      return `${company.name} no paga dividendo actualmente. La empresa prefiere reinvertir el 100% de sus beneficios en crecimiento orgánico e inorgánico. Dado el ROE del ${m.roe.toFixed(1)}% y el ROIC del ${m.roic.toFixed(1)}%, esta estrategia tiene sentido ya que la empresa genera retornos muy por encima de su coste de capital.`
    }
    return `${company.name} ofrece un dividend yield del ${m.dividendYield.toFixed(2)}% con un payout ratio del ${m.payoutRatio.toFixed(0)}%. ${m.payoutRatio < 60 ? 'El payout es conservador, lo que deja margen para incrementos futuros del dividendo.' : m.payoutRatio < 80 ? 'El payout es moderado y sostenible con el nivel actual de beneficios.' : 'El payout es elevado y podría ser difícil de mantener si los beneficios caen.'} ${company.scorecard.dividendGrowing ? 'El dividendo ha sido creciente los últimos 5 años, señal de compromiso con la remuneración al accionista.' : 'El dividendo no ha crecido consistentemente, lo que limita el atractivo para inversores de income.'}`
  }

  if (q.includes('insider') || q.includes('direct') || q.includes('compran') || q.includes('venden')) {
    return `[Datos de demo] En los últimos 12 meses, los insiders de ${company.name} han realizado compras netas moderadas. El CEO adquirió acciones por valor de $2.5M en febrero, mientras que el CFO vendió una pequeña parte de sus stock options (venta programada, no discrecional). En general, el balance de operaciones de insiders es ligeramente positivo, lo cual es una señal constructiva para la tesis de inversión.`
  }

  return `${company.name} (${company.ticker}) cotiza a $${company.price.toFixed(2)} con un PER de ${m.per.toFixed(1)}x y un ROE del ${m.roe.toFixed(1)}%. El veredicto actual es "${company.verdict}" con una puntuación de calidad de ${company.qualityScore}/10. ¿Puedo ayudarte con algo más específico? Puedes preguntarme sobre deuda, márgenes, valoración DCF, dividendos, competidores o cualquier otro aspecto de la empresa.`
}

export default function ChatPanel({ company }) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `${t('chatWelcome')} **${company.name}** (${company.ticker}). ${t('chatWelcome2')}`,
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)

    // Simular latencia
    setTimeout(() => {
      const response = getMockResponse(userMsg, company)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  const suggestions = t('chatSuggestions')

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="text-[var(--text-primary)] font-semibold text-sm">{t('chatTitle')} {company.name}</h3>
        <p className="text-[var(--text-tertiary)] text-xs">{t('chatModel')}: Claude Haiku 4.5 · {t('chatContext')} {company.ticker}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
            }`}>
              {renderText(msg.content)}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gray-600/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); }}
              className="px-3 py-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg hover:text-[var(--text-primary)] hover:border-blue-500/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="flex-1 px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
