import { z } from 'zod'
import { FranchiseStatus, VehicleStatus, OrderStatus, PaymentStatus, MaintenanceType, MaintenanceStatus } from '@/types/auth'

 
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'FRANCHISEE']).default('FRANCHISEE')
})

 
export const franchiseSchema = z.object({
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siretNumber: z.string().regex(/^\d{14}$/, 'Le numéro SIRET doit contenir 14 chiffres'),
  vatNumber: z.string().optional(),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  region: z.string().min(2, 'La région est requise'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(10, 'Le numéro de téléphone est requis'),
  status: z.nativeEnum(FranchiseStatus).default(FranchiseStatus.PENDING),
  entryFee: z.coerce.number().min(0, 'Le droit d\'entrée doit être positif').default(50000),
  entryFeePaid: z.boolean().default(false),
  entryFeeDate: z.string().optional(),
  royaltyRate: z.coerce.number().min(0).max(100).default(4),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional()
})

 
export const vehicleSchema = z.object({
  licensePlate: z.string().min(2, 'La plaque d\'immatriculation est requise'),
  brand: z.string().min(2, 'La marque est requise'),
  model: z.string().min(2, 'Le modèle est requis'),
  year: z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  vin: z.string().min(17, 'Le numéro VIN doit contenir 17 caractères'),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  purchaseDate: z.string(),
  purchasePrice: z.coerce.number().min(0, 'Le prix d\'achat doit être positif'),
  currentMileage: z.coerce.number().min(0).optional(),
  lastInspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  franchiseId: z.string().optional()
})

 
export const maintenanceSchema = z.object({
  type: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.SCHEDULED),
  title: z.string().min(2, 'Le titre est requis'),
  description: z.string().optional(),
  scheduledDate: z.string(),
  completedDate: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  mileage: z.coerce.number().min(0).optional(),
  parts: z.string().optional(),
  laborHours: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  vehicleId: z.string().min(1, 'Le véhicule est requis')
})

 
export const productSchema = z.object({
  name: z.string().min(2, 'Le nom du produit est requis'),
  description: z.string().optional(),
  sku: z.string().min(1, 'Le SKU est requis'),
  barcode: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Le prix doit être positif'),
  unit: z.string().min(1, 'L\'unité est requise'),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().min(1, 'La catégorie est requise')
})

 
export const productCategorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie est requis'),
  description: z.string().optional()
})

 
export const warehouseSchema = z.object({
  name: z.string().min(2, 'Le nom de l\'entrepôt est requis'),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  region: z.string().min(2, 'La région est requise'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  capacity: z.coerce.number().min(1, 'La capacité doit être positive')
})

 
export const orderSchema = z.object({
  franchiseId: z.string().min(1, 'Le franchisé est requis'),
  requestedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  isFromDrivnCook: z.boolean().default(true)
})

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Le produit est requis'),
  warehouseId: z.string().min(1, 'L\'entrepôt est requis'),
  quantity: z.coerce.number().min(1, 'La quantité doit être positive'),
  unitPrice: z.coerce.number().min(0, 'Le prix doit être positif'),
  notes: z.string().optional()
})

 
export const salesReportSchema = z.object({
  reportDate: z.string(),
  dailySales: z.coerce.number().min(0, 'Les ventes doivent être positives'),
  transactionCount: z.coerce.number().min(0).optional().default(0),
  averageTicket: z.coerce.number().min(0).optional().default(0),
  location: z.string().optional(),
  notes: z.string().optional(),
  franchiseId: z.string().min(1, 'Le franchisé est requis')
})

 
export const invoiceSchema = z.object({
  dueDate: z.string(),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  description: z.string().min(2, 'La description est requise'),
  franchiseId: z.string().min(1, 'Le franchisé est requis')
})

 
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type FranchiseFormData = z.infer<typeof franchiseSchema>
export type VehicleFormData = z.infer<typeof vehicleSchema>
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type ProductCategoryFormData = z.infer<typeof productCategorySchema>
export type WarehouseFormData = z.infer<typeof warehouseSchema>
export type OrderFormData = z.infer<typeof orderSchema>
export type OrderItemFormData = z.infer<typeof orderItemSchema>
export type SalesReportFormData = z.infer<typeof salesReportSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>