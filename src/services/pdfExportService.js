/**
 * PDF Export Service
 * Generates professional PDF reports from company data using jsPDF.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmt(val, decimals = 2) {
  if (val == null || !isFinite(val)) return 'N/A'
  return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPrice(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  return `$${fmt(val)}`
}

function fmtPct(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  return `${fmt(val)}%`
}

function fmtMktCap(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  return `$${val.toLocaleString()}`
}

/**
 * Generate a full PDF report for a company
 */
export function generateCompanyPDF(company, lang = 'es') {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    const isEs = lang === 'es'

    // ====== HEADER ======
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text('STOCK', margin, y)
    const stockWidth = doc.getTextWidth('STOCK')
    doc.setTextColor(52, 152, 219)
    doc.text('IQ', margin + stockWidth, y)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(isEs ? 'Informe de Analisis Financiero' : 'Financial Analysis Report', pageWidth - margin, y, { align: 'right' })
    y += 5
    doc.text(new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, y, { align: 'right' })

    // Divider
    y += 5
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)

    // ====== COMPANY INFO ======
    y += 12
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text(company.name || company.ticker, margin, y)

    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`${company.ticker} - ${company.exchange || ''} - ${company.sector || ''} - ${company.industry || ''}`, margin, y)

    // ====== PRICE AND VERDICT ======
    y += 12
    doc.setFontSize(30)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    const priceStr = fmtPrice(company.price)
    doc.text(priceStr, margin, y)

    const isUp = (company.changePct || 0) >= 0
    doc.setFontSize(12)
    doc.setTextColor(isUp ? 39 : 231, isUp ? 174 : 76, isUp ? 96 : 60)
    const changeVal = company.change || 0
    const changePctVal = company.changePct || 0
    const changeStr = `${isUp ? '+' : ''}${changeVal.toFixed(2)} (${isUp ? '+' : ''}${changePctVal.toFixed(2)}%)`
    doc.text(changeStr, margin + 75, y - 4)

    // Verdict box
    const verdictText = isEs
      ? company.verdict
      : { 'INFRAVALORADA': 'UNDERVALUED', 'PRECIO JUSTO': 'FAIR PRICE', 'SOBREVALORADA': 'OVERVALUED' }[company.verdict] || company.verdict
    const verdictColors = {
      'INFRAVALORADA': [39, 174, 96],
      'PRECIO JUSTO': [234, 179, 8],
      'SOBREVALORADA': [231, 76, 60],
    }
    const vc = verdictColors[company.verdict] || [100, 100, 100]

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    const verdictWidth = doc.getTextWidth(verdictText) + 16
    const verdictX = pageWidth - margin - verdictWidth
    doc.setFillColor(vc[0], vc[1], vc[2])
    doc.roundedRect(verdictX, y - 12, verdictWidth, 16, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(verdictText, verdictX + 8, y - 3)

    // ====== KEY STATS ROW ======
    y += 14
    const stats = [
      { label: 'Market Cap', value: fmtMktCap(company.marketCap) },
      { label: isEs ? 'Valor intrinseco' : 'Intrinsic value', value: fmtPrice(company.intrinsicValue) },
      { label: isEs ? 'Margen seguridad' : 'Safety margin', value: `${company.safetyMargin > 0 ? '+' : ''}${company.safetyMargin}%` },
      { label: isEs ? 'Calidad' : 'Quality', value: `${company.qualityScore}/${company.scorecardTotal}` },
      { label: 'WACC', value: fmtPct(company.metrics?.wacc) },
    ]

    const colWidth = (pageWidth - 2 * margin) / stats.length
    stats.forEach((stat, i) => {
      const x = margin + i * colWidth
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(130, 130, 130)
      doc.text(stat.label, x, y)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(String(stat.value), x, y + 6)
    })

    // ====== METRICS TABLE ======
    y += 18
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text(isEs ? 'Metricas Fundamentales' : 'Fundamental Metrics', margin, y)
    y += 4

    const m = company.metrics || {}
    const YES = 'OK'
    const NO = 'X'

    const metricsData = [
      [isEs ? 'VALORACION' : 'VALUATION', '', ''],
      ['PER', fmt(m.per, 1) + 'x', m.per > 0 && m.per < 20 ? YES : NO],
      ['P/B', fmt(m.pb, 1) + 'x', ''],
      ['EV/EBITDA', fmt(m.evEbitda, 1) + 'x', ''],
      [isEs ? 'RENTABILIDAD' : 'PROFITABILITY', '', ''],
      ['ROE', fmtPct(m.roe), m.roe > 15 ? YES : NO],
      ['ROA', fmtPct(m.roa), ''],
      ['ROIC', fmtPct(m.roic), m.roic > (m.wacc || 0) ? YES : NO],
      [isEs ? 'MARGENES' : 'MARGINS', '', ''],
      [isEs ? 'Margen bruto' : 'Gross margin', fmtPct(m.marginBruto), ''],
      [isEs ? 'Margen neto' : 'Net margin', fmtPct(m.marginNeto), ''],
      [isEs ? 'Margen EBITDA' : 'EBITDA margin', fmtPct(m.marginEbitda), ''],
      ['FCF Yield', fmtPct(m.fcfYield), ''],
      [isEs ? 'DEUDA Y SOLVENCIA' : 'DEBT & SOLVENCY', '', ''],
      [isEs ? 'Deuda neta / EBITDA' : 'Net debt / EBITDA', fmt(m.deudaNetaEbitda, 1) + 'x', m.deudaNetaEbitda < 3 ? YES : NO],
      [isEs ? 'Cobertura de intereses' : 'Interest coverage', fmt(m.interestCoverage, 1) + 'x', m.interestCoverage > 5 ? YES : NO],
      ['Piotroski F-Score', `${Math.round(m.piotroski || 0)}/9`, (m.piotroski || 0) > 6 ? YES : NO],
      ['Altman Z-Score', fmt(m.altmanZ, 1), (m.altmanZ || 0) > 3 ? YES : NO],
      ['Graham Number', fmtPrice(m.grahamNumber), ''],
      [isEs ? 'DIVIDENDO' : 'DIVIDEND', '', ''],
      [isEs ? 'Rendimiento' : 'Yield', fmtPct(m.dividendYield), ''],
      ['Payout Ratio', fmtPct(m.payoutRatio), ''],
    ]

    const sectionHeaders = [
      isEs ? 'VALORACION' : 'VALUATION',
      isEs ? 'RENTABILIDAD' : 'PROFITABILITY',
      isEs ? 'MARGENES' : 'MARGINS',
      isEs ? 'DEUDA Y SOLVENCIA' : 'DEBT & SOLVENCY',
      isEs ? 'DIVIDENDO' : 'DIVIDEND',
    ]

    autoTable(doc, {
      startY: y,
      head: [[isEs ? 'Metrica' : 'Metric', isEs ? 'Valor' : 'Value', '']],
      body: metricsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        2: { cellWidth: 15, halign: 'center' },
      },
      willDrawCell: function (data) {
        if (data.section === 'body') {
          const cellText = data.cell.text && data.cell.text[0]
          // Section header rows
          if (data.column.index === 0 && sectionHeaders.includes(cellText)) {
            data.cell.styles.fillColor = [240, 245, 250]
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.textColor = [41, 128, 185]
          }
          // OK/X column
          if (data.column.index === 2) {
            if (cellText === YES) data.cell.styles.textColor = [39, 174, 96]
            else if (cellText === NO) data.cell.styles.textColor = [231, 76, 60]
          }
        }
      },
    })

    // ====== FINANCIAL EVOLUTION ======
    doc.addPage()
    y = 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text(isEs ? 'Evolucion Financiera (ultimos 5 anos)' : 'Financial Evolution (last 5 years)', margin, y)
    y += 4

    const fin = company.financials || { years: [], revenue: [], netIncome: [], fcf: [] }
    const finData = fin.years.map((year, i) => [
      String(year),
      fin.revenue[i] ? `$${fin.revenue[i].toLocaleString()}M` : 'N/A',
      fin.netIncome[i] ? `$${fin.netIncome[i].toLocaleString()}M` : 'N/A',
      fin.fcf[i] ? `$${fin.fcf[i].toLocaleString()}M` : 'N/A',
    ])

    autoTable(doc, {
      startY: y,
      head: [[isEs ? 'Ano' : 'Year', isEs ? 'Ingresos' : 'Revenue', isEs ? 'Beneficio Neto' : 'Net Income', 'FCF']],
      body: finData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    })

    y = doc.lastAutoTable.finalY + 16

    // ====== DCF SUMMARY ======
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text(isEs ? 'Resumen DCF' : 'DCF Summary', margin, y)
    y += 4

    const dcf = company.dcf || {}
    const dcfBase = dcf.fcfBase || 0
    const sharesOut = dcf.sharesOutstanding || 1e9
    const dcfData = [
      ['FCF Base', `$${(dcfBase / 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`],
      [isEs ? 'Acciones en circulacion' : 'Shares outstanding', `${(sharesOut / 1e9).toFixed(2)}B`],
      [isEs ? 'Crecimiento FCF (1-5 anos)' : 'FCF Growth (1-5y)', fmtPct(dcf.growthRate5y)],
      [isEs ? 'Crecimiento FCF (6-10 anos)' : 'FCF Growth (6-10y)', fmtPct(dcf.growthRate10y)],
      [isEs ? 'Crecimiento terminal' : 'Terminal growth', fmtPct(dcf.terminalGrowth)],
      ['WACC', fmtPct(dcf.wacc)],
      [isEs ? 'Valor intrinseco' : 'Intrinsic value', fmtPrice(company.intrinsicValue)],
      [isEs ? 'Precio actual' : 'Current price', fmtPrice(company.price)],
      [isEs ? 'Margen de seguridad' : 'Safety margin', `${company.safetyMargin > 0 ? '+' : ''}${company.safetyMargin}%`],
    ]

    autoTable(doc, {
      startY: y,
      body: dcfData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    })

    y = doc.lastAutoTable.finalY + 16

    // ====== QUALITY SCORECARD ======
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text(isEs ? 'Scorecard de Calidad' : 'Quality Scorecard', margin, y)
    y += 4

    const scorecardLabels = {
      roeAbove15: 'ROE > 15%',
      marginStable: isEs ? 'Margen estable' : 'Stable margin',
      roicAboveWacc: 'ROIC > WACC',
      revenueGrowth: isEs ? 'Ingresos crecientes' : 'Revenue growing',
      fcfPositive: isEs ? 'FCF positivo 3 anos' : 'FCF positive 3y',
      debtBelow3: isEs ? 'Deuda neta/EBITDA < 3' : 'Net debt/EBITDA < 3',
      interestAbove5: isEs ? 'Cobertura intereses > 5' : 'Interest coverage > 5',
      piotAbove6: 'Piotroski > 6',
      altmanAbove3: 'Altman Z > 3',
      perBelowSector: 'PER < 20',
      paysDividend: isEs ? 'Paga dividendo' : 'Pays dividend',
      dividendGrowing: isEs ? 'Dividendo sostenible' : 'Sustainable dividend',
    }

    const sc = company.scorecard || {}
    const scorecardData = Object.entries(sc).map(([key, val]) => [
      scorecardLabels[key] || key,
      val === true ? 'SI' : val === false ? 'NO' : '-- N/A',
    ])

    autoTable(doc, {
      startY: y,
      head: [[isEs ? 'Criterio' : 'Criteria', isEs ? 'Resultado' : 'Result']],
      body: scorecardData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      willDrawCell: function (data) {
        if (data.section === 'body' && data.column.index === 1) {
          const text = data.cell.text && data.cell.text[0]
          if (text === 'SI') data.cell.styles.textColor = [39, 174, 96]
          else if (text === 'NO') data.cell.styles.textColor = [231, 76, 60]
          else data.cell.styles.textColor = [180, 180, 180]
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text(`${isEs ? 'Puntuacion total' : 'Total score'}: ${company.qualityScore}/${company.scorecardTotal}`, margin, y)

    // ====== FOOTER ======
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 180, 180)
      doc.text(`STOCKIQ - ${isEs ? 'No es asesoramiento financiero' : 'Not financial advice'}`, margin, pageHeight - 10)
      doc.text(`${i}/${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
    }

    // ====== SAVE ======
    const filename = `StockIQ_${company.ticker}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    return filename
  } catch (err) {
    console.error('StockIQ PDF generation error:', err)
    alert(lang === 'es' ? 'Error al generar el PDF. Revisa la consola.' : 'Error generating PDF. Check the console.')
    return null
  }
}
