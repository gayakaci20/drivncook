import puppeteer from 'puppeteer'

interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
}

interface ReportData {
  title: string
  subtitle?: string
  period: string
  generatedAt: string
  data: any
  company: {
    name: string
    address: string
    logo?: string
  }
}

export class PDFGenerator {
  private static getDefaultOptions(): PDFOptions {
    return {
      format: 'A4',
      orientation: 'portrait',
      margins: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span class="title"></span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; display: flex; justify-content: space-between; padding: 0 1cm;">
          <span>Driv'n Cook - Rapport généré le <span class="date"></span></span>
          <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
        </div>
      `
    }
  }

  static async generateSalesReport(data: ReportData, options?: PDFOptions): Promise<Buffer> {
    const mergedOptions = { ...this.getDefaultOptions(), ...options }
    
    const html = this.generateSalesReportHTML(data)
    return this.generatePDF(html, mergedOptions)
  }

  static async generateFinancialReport(data: ReportData, options?: PDFOptions): Promise<Buffer> {
    const mergedOptions = { ...this.getDefaultOptions(), ...options }
    
    const html = this.generateFinancialReportHTML(data)
    return this.generatePDF(html, mergedOptions)
  }

  static async generateOperationalReport(data: ReportData, options?: PDFOptions): Promise<Buffer> {
    const mergedOptions = { ...this.getDefaultOptions(), ...options }
    
    const html = this.generateOperationalReportHTML(data)
    return this.generatePDF(html, mergedOptions)
  }

  static async generateCustomReport(html: string, options?: PDFOptions): Promise<Buffer> {
    const mergedOptions = { ...this.getDefaultOptions(), ...options }
    return this.generatePDF(html, mergedOptions)
  }

  private static async generatePDF(html: string, options: PDFOptions): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdf = await page.pdf({
        format: options.format,
        landscape: options.orientation === 'landscape',
        margin: options.margins,
        displayHeaderFooter: options.displayHeaderFooter,
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate,
        printBackground: true
      })

      return pdf as Buffer
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error)
      throw new Error('Impossible de générer le PDF')
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private static generateSalesReportHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          ${this.getBaseCSS()}
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .metric-label {
            font-size: 14px;
            color: #64748b;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th, .table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
          }
          .table th {
            background-color: #f8fafc;
            font-weight: bold;
          }
          .table tr:nth-child(even) {
            background-color: #f8fafc;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            ${data.company.logo ? `<img src="${data.company.logo}" alt="Logo" class="logo">` : ''}
            <div>
              <h1>${data.title}</h1>
              ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
              <p class="period">Période: ${data.period}</p>
              <p class="generated">Généré le: ${new Date(data.generatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </header>

          <section class="section">
            <h3>Résumé exécutif</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${this.formatCurrency(data.data.totalSales || 0)}</div>
                <div class="metric-label">Chiffre d'affaires total</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${(data.data.totalTransactions || 0).toLocaleString()}</div>
                <div class="metric-label">Nombre de transactions</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${this.formatCurrency(data.data.averageTicket || 0)}</div>
                <div class="metric-label">Ticket moyen</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.data.growthRate >= 0 ? '+' : ''}${(data.data.growthRate || 0).toFixed(1)}%</div>
                <div class="metric-label">Croissance</div>
              </div>
            </div>
          </section>

          ${data.data.topFranchises && data.data.topFranchises.length > 0 ? `
          <section class="section">
            <h3>Top 10 des franchisés</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Franchisé</th>
                  <th>Chiffre d'affaires</th>
                  <th>Croissance</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.topFranchises.slice(0, 10).map((franchise: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${franchise.name}</td>
                    <td>${this.formatCurrency(franchise.sales)}</td>
                    <td style="color: ${franchise.growth >= 0 ? '#10b981' : '#ef4444'}">
                      ${franchise.growth >= 0 ? '+' : ''}${franchise.growth.toFixed(1)}%
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
          ` : ''}

          ${data.data.topProducts && data.data.topProducts.length > 0 ? `
          <section class="section">
            <h3>Produits les plus vendus</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité vendue</th>
                  <th>Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.topProducts.slice(0, 10).map((product: any) => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity.toLocaleString()}</td>
                    <td>${this.formatCurrency(product.revenue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
          ` : ''}

          ${data.data.regionalData && data.data.regionalData.length > 0 ? `
          <section class="section">
            <h3>Répartition géographique</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Région</th>
                  <th>Chiffre d'affaires</th>
                  <th>Nombre de franchisés</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.regionalData.map((region: any) => `
                  <tr>
                    <td>${region.region}</td>
                    <td>${this.formatCurrency(region.sales)}</td>
                    <td>${region.franchises}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
          ` : ''}

          <footer class="footer">
            <p>Ce rapport a été généré automatiquement par le système Driv'n Cook.</p>
            <p>Toutes les données sont confidentielles et ne doivent pas être diffusées sans autorisation.</p>
          </footer>
        </div>
      </body>
      </html>
    `
  }

  private static generateFinancialReportHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          ${this.getBaseCSS()}
          .financial-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin: 20px 0;
          }
          .amount-positive { color: #10b981; }
          .amount-negative { color: #ef4444; }
          .amount-neutral { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            ${data.company.logo ? `<img src="${data.company.logo}" alt="Logo" class="logo">` : ''}
            <div>
              <h1>${data.title}</h1>
              ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
              <p class="period">Période: ${data.period}</p>
              <p class="generated">Généré le: ${new Date(data.generatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </header>

          <section class="section">
            <h3>Synthèse financière</h3>
            <div class="financial-grid">
              <div>
                <h4>Revenus</h4>
                <p>Chiffre d'affaires total: <span class="amount-positive">${this.formatCurrency(data.data.totalRevenue || 0)}</span></p>
                <p>Redevances perçues: <span class="amount-positive">${this.formatCurrency(data.data.totalRoyalties || 0)}</span></p>
                <p>Autres revenus: <span class="amount-neutral">${this.formatCurrency(data.data.otherRevenue || 0)}</span></p>
              </div>
              <div>
                <h4>En attente</h4>
                <p>Factures impayées: <span class="amount-negative">${this.formatCurrency(data.data.unpaidInvoices || 0)}</span></p>
                <p>Redevances dues: <span class="amount-negative">${this.formatCurrency(data.data.pendingRoyalties || 0)}</span></p>
                <p>Retards de paiement: <span class="amount-negative">${data.data.overdueCount || 0} factures</span></p>
              </div>
            </div>
          </section>

          <footer class="footer">
            <p>Rapport financier confidentiel - Driv'n Cook</p>
          </footer>
        </div>
      </body>
      </html>
    `
  }

  private static generateOperationalReportHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          ${this.getBaseCSS()}
          .operations-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            ${data.company.logo ? `<img src="${data.company.logo}" alt="Logo" class="logo">` : ''}
            <div>
              <h1>${data.title}</h1>
              ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
              <p class="period">Période: ${data.period}</p>
              <p class="generated">Généré le: ${new Date(data.generatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </header>

          <section class="section">
            <h3>Vue d'ensemble opérationnelle</h3>
            <div class="operations-grid">
              <div class="metric-card">
                <div class="metric-value">${data.data.totalVehicles || 0}</div>
                <div class="metric-label">Véhicules total</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.data.activeVehicles || 0}</div>
                <div class="metric-label">Véhicules actifs</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.data.maintenanceCount || 0}</div>
                <div class="metric-label">Maintenances en cours</div>
              </div>
            </div>
          </section>

          <footer class="footer">
            <p>Rapport opérationnel - Driv'n Cook</p>
          </footer>
        </div>
      </body>
      </html>
    `
  }

  private static getBaseCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a202c;
        font-size: 14px;
      }
      
      .container {
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
      }
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2563eb;
      }
      
      .logo {
        width: 80px;
        height: 80px;
        margin-right: 20px;
      }
      
      h1 {
        font-size: 28px;
        color: #2563eb;
        margin-bottom: 5px;
      }
      
      h2 {
        font-size: 18px;
        color: #64748b;
        margin-bottom: 10px;
      }
      
      h3 {
        font-size: 20px;
        color: #1e293b;
        margin-bottom: 15px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 5px;
      }
      
      h4 {
        font-size: 16px;
        color: #374151;
        margin-bottom: 10px;
      }
      
      .period, .generated {
        font-size: 12px;
        color: #64748b;
      }
      
      .section {
        margin: 30px 0;
        page-break-inside: avoid;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #64748b;
        text-align: center;
      }
      
      @media print {
        .container {
          max-width: none;
          margin: 0;
          padding: 0;
        }
        
        .section {
          page-break-inside: avoid;
        }
      }
    `
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
}

export default PDFGenerator