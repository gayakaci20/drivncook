import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface OrderItemForPdf {
  productName: string
  sku?: string | null
  unit?: string | null
  warehouseName?: string | null
  warehouseCity?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderForPdf {
  orderNumber: string
  orderDate: string
  requestedDeliveryDate?: string | null
  franchise: {
    businessName: string
    address: string
    postalCode: string
    city: string
    region: string
    user: { firstName: string; lastName: string; email: string }
  }
  items: OrderItemForPdf[]
  totalAmount: number
  notes?: string | null
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, color: '#111' },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaLabel: { color: '#6b7280' },
  metaValue: { fontWeight: 600 },
  section: { marginTop: 12 },
  box: { border: '1px solid #e5e7eb', padding: 12, borderRadius: 6, backgroundColor: '#fafafa' },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb', paddingBottom: 6, marginBottom: 6 },
  th: { fontWeight: 700 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottom: '1px solid #f1f5f9' },
  colName: { width: '34%' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '10%', textAlign: 'right' },
  colPrice: { width: '16%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right' },
  colWh: { width: '14%' },
  totalBox: { marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 },
  totalText: { fontSize: 16, fontWeight: 700, textAlign: 'right' }
})

export function OrderPdfDocument({ order }: { order: OrderForPdf }) {
  const money = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Bon de commande {order.orderNumber}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{new Date(order.orderDate).toLocaleDateString('fr-FR')}</Text>
          </View>
          {order.requestedDeliveryDate ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date de récupération souhaitée</Text>
              <Text style={styles.metaValue}>{new Date(order.requestedDeliveryDate).toLocaleDateString('fr-FR')}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, styles.box]}>
          <Text style={{ fontWeight: 700, marginBottom: 6 }}>Franchise</Text>
          <Text>{order.franchise.businessName}</Text>
          <Text>
            {order.franchise.address}, {order.franchise.postalCode} {order.franchise.city}, {order.franchise.region}
          </Text>
          <Text>
            Contact: {order.franchise.user.firstName} {order.franchise.user.lastName} ({order.franchise.user.email})
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colName]}>Article</Text>
            <Text style={[styles.th, styles.colWh]}>Entrepôt</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colUnit]}>Unité</Text>
            <Text style={[styles.th, styles.colPrice]}>Prix</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {order.items.map((it, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.colName}>{it.productName}{it.sku ? ` (${it.sku})` : ''}</Text>
              <Text style={styles.colWh}>{it.warehouseName}{it.warehouseCity ? ` (${it.warehouseCity})` : ''}</Text>
              <Text style={styles.colQty}>{it.quantity}</Text>
              <Text style={styles.colUnit}>{it.unit || ''}</Text>
              <Text style={styles.colPrice}>{money(it.unitPrice)}</Text>
              <Text style={styles.colTotal}>{money(it.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {order.notes ? (
          <View style={[styles.section, styles.box]}>
            <Text>Notes: {order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>Total: {money(order.totalAmount)}</Text>
        </View>
      </Page>
    </Document>
  )
}