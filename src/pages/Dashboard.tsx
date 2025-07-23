import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePurchasing } from '@/contexts/PurchasingContext';
import {
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { dashboardKPI, purchaseOrders, suppliers, invoices } = usePurchasing();

  const stats = [
    {
      title: 'Total Órdenes',
      value: dashboardKPI.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Órdenes Pendientes',
      value: dashboardKPI.pendingOrders.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Gasto Total',
      value: `$${dashboardKPI.totalSpent.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Proveedores Activos',
      value: dashboardKPI.activeSuppliers.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const recentOrders = purchaseOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pendingInvoices = invoices
    .filter(invoice => invoice.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const },
      sent: { label: 'Enviada', variant: 'default' as const },
      confirmed: { label: 'Confirmada', variant: 'default' as const },
      received: { label: 'Recibida', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      approved: { label: 'Aprobada', variant: 'default' as const },
      paid: { label: 'Pagada', variant: 'default' as const },
      overdue: { label: 'Vencida', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Sistema de Compras</h1>
        <p className="text-blue-100">
          Gestiona proveedores, órdenes de compra, inventarios y más desde un solo lugar.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Órdenes Recientes
            </CardTitle>
            <CardDescription>
              Últimas órdenes de compra registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const supplier = suppliers.find(s => s.id === order.supplierId);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{supplier?.name || 'Proveedor desconocido'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${order.total.toLocaleString()}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No hay órdenes registradas</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Facturas Pendientes
            </CardTitle>
            <CardDescription>
              Facturas que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvoices.length > 0 ? (
                pendingInvoices.map((invoice) => {
                  const supplier = suppliers.find(s => s.id === invoice.supplierId);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{supplier?.name || 'Proveedor desconocido'}</p>
                        <p className="text-xs text-gray-500">
                          Vence: {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${invoice.total.toLocaleString()}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No hay facturas pendientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Gastos Mensuales
          </CardTitle>
          <CardDescription>
            Evolución de gastos en los últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardKPI.monthlySpending.map((month, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium text-gray-600">
                  {month.month}
                </div>
                <div className="flex-1">
                  <Progress 
                    value={(month.amount / Math.max(...dashboardKPI.monthlySpending.map(m => m.amount))) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="w-24 text-right text-sm font-medium text-gray-900">
                  ${month.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Top Proveedores
          </CardTitle>
          <CardDescription>
            Proveedores con mayor volumen de compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardKPI.topSuppliers.length > 0 ? (
              dashboardKPI.topSuppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{supplier.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    ${supplier.amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de proveedores</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}