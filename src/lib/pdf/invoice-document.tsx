import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer'

export interface InvoiceForPdf {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  description?: string | null
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  franchise: {
    businessName: string
    user: { firstName: string; lastName: string; email: string }
  }
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, color: '#111' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontSize: 18, fontWeight: 700 },
  metaBox: { border: '1px solid #e5e7eb', padding: 10, borderRadius: 6, width: 260 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaLabel: { color: '#6b7280' },
  metaValue: { fontWeight: 600 },
  section: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#6b7280' },
  value: { fontWeight: 500 },
  box: { border: '1px solid #e5e7eb', padding: 12, borderRadius: 6, backgroundColor: '#fafafa' },
  totalBox: { padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' },
  total: { fontSize: 16, fontWeight: 700 }
})

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceForPdf }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Svg width={48} height={36} viewBox="0 0 143 107">
              <Path d="M39 40.6404C41 30.002 49.5 12.5 67.5 12.1404C57.5 16 48 23.5 39 40.6404Z" fill="#F24236" />
              <Path d="M115 93.5C103.5 92.0621 78.5 90 56.9998 91.0001C67.3996 86.6002 96.9998 87.5001 110.5 88.5V66.0001C109.3 62.0002 77.6667 60.3334 62 60C84.4 58.8 95 50 98.5 44.5C99 48 93.1667 54.8333 90 58H100C103.6 58.4 112 49.5 115 44.5C114.5 50 109.333 57.1667 106.5 60C150.5 66.0001 151 -3 97.5 10L103.5 21C80.5 -8.5 38.5 7.50013 37 40.5C34.6002 33.3 36.0001 24.5 37 21C-13 21 4.5 81 34 69.5V64.5C28 63.9167 23 56.5 21.5 53C26.3 60.2 43.5 61 52 60C49.5 62.5 43.9998 63.8333 39.9998 64.5V78.5C52.5 75.5 65.1666 77.1667 75 78.5C69.5 78.5 49.6667 81 38.5 84L35.5 94L34.4998 74C-18.0001 81 -5 4 39.9998 18.5C57.5998 -7.49999 84.3331 0.333419 95.4998 7.50012C144 -14 162.5 57.5 115 66.0001C115.5 76.3335 115.687 93.5859 115 93.5Z" fill="#000000" />
              <Path d="M46.5 90.5C50.366 90.5 53.5 93.634 53.5 97.5C53.5 101.366 50.366 104.5 46.5 104.5C42.634 104.5 39.5 101.366 39.5 97.5C39.5 93.634 42.634 90.5 46.5 90.5Z" stroke="#000000" strokeWidth={5} />
              <Path d="M112.5 97C112.5 101.142 109.254 104.5 105.25 104.5C101.246 104.5 98 101.142 98 97" stroke="#F24236" strokeWidth={5} />
            </Svg>
            <Text style={styles.brandText}>Facture {invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Émise le</Text>
              <Text style={styles.metaValue}>{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Échéance</Text>
              <Text style={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Statut</Text>
              <Text style={styles.metaValue}>{invoice.paymentStatus}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.box]}>
          <View style={styles.row}>
            <Text style={styles.label}>Franchise</Text>
            <Text style={styles.value}>{invoice.franchise.businessName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>
              {invoice.franchise.user.firstName} {invoice.franchise.user.lastName} ({invoice.franchise.user.email})
            </Text>
          </View>
        </View>

        

        {invoice.description ? (
          <View style={[styles.section, styles.box]}>
            <Text style={styles.label}>Description</Text>
            <Text>{invoice.description}</Text>
          </View>
        ) : null}

        <View style={[styles.section, styles.totalBox]}>
          <View style={styles.row}>
            <Text style={styles.total}>Total</Text>
            <Text style={styles.total}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(invoice.amount) || 0)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}


