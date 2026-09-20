import { useTranslation } from 'react-i18next'

export interface TranslationKeys {
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    search: string
    loading: string
    error: string
    success: string
    noResults: string
    confirm: string
    back: string
    next: string
    close: string
    add: string
    remove: string
    total: string
    subtotal: string
    tax: string
    discount: string
    quantity: string
    price: string
    actions: string
    date: string
    status: string
    offline: string
    online: string
    syncing: string
  }
  auth: {
    login: string
    register: string
    logout: string
    email: string
    password: string
    forgotPassword: string
    noAccount: string
    hasAccount: string
    role: string
    admin: string
    supervisor: string
    cashier: string
  }
  pos: {
    title: string
    newSale: string
    scanProduct: string
    manualEntry: string
    paymentMethod: string
    cash: string
    card: string
    transfer: string
    mobile: string
    mixed: string
    receiptNumber: string
    customerEmail: string
    customerPhone: string
    applyIgtf: string
    completeSale: string
    saleCompleted: string
    noProducts: string
    searchProduct: string
    category: string
    allCategories: string
    stockAlert: string
    lowStock: string
    outOfStock: string
  }
  inventory: {
    title: string
    addProduct: string
    editProduct: string
    name: string
    barcode: string
    category: string
    priceUSD: string
    costUSD: string
    stock: string
    minStock: string
    unit: string
    supplier: string
    image: string
    scanToCreate: string
    stockIn: string
    stockOut: string
    adjustment: string
    return: string
    waste: string
    lowStockAlerts: string
    criticalStock: string
  }
  dashboard: {
    title: string
    salesToday: string
    salesWeek: string
    salesMonth: string
    totalRevenue: string
    avgTicket: string
    transactions: string
    topProducts: string
    paymentBreakdown: string
    inventoryValue: string
    lowStockProducts: string
    profitMargin: string
  }
  crm: {
    title: string
    customers: string
    suppliers: string
    addCustomer: string
    addSupplier: string
    name: string
    email: string
    phone: string
    rif: string
    address: string
    notes: string
    totalPurchases: string
    visitCount: string
    lastVisit: string
  }
  reports: {
    title: string
    daily: string
    weekly: string
    monthly: string
    custom: string
    generateReport: string
    sendEmail: string
    downloadPDF: string
    startDate: string
    endDate: string
    salesSummary: string
    inventorySummary: string
    financialSummary: string
  }
  settings: {
    title: string
    storeSettings: string
    storeName: string
    rif: string
    address: string
    phone: string
    igtfEnabled: string
    igtfRate: string
    currency: string
    language: string
    darkMode: string
    updateRate: string
    manualRate: string
    currentRate: string
    rateHistory: string
    lastUpdate: string
  }
}

export const useTranslations = () => {
  const { t } = useTranslation()
  return {
    t: (key: string) => t(key),
  }
}
