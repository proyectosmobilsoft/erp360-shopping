import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  ChevronLeft,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  FileText,
  RotateCcw,
  BarChart3,
  Truck,
  Calculator,
  User,
  BookOpen,
  Database
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const menuSections = [
  {
    title: 'Sistema de Compras',
    subtitle: 'Gestión completa de compras y proveedores',
    color: 'text-blue-600',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/'
      },
      {
        title: 'Proveedores',
        icon: Truck,
        href: '/suppliers'
      },
      {
        title: 'Órdenes de Compra',
        icon: ShoppingCart,
        href: '/purchase-orders'
      },
      {
        title: 'Entradas de Almacén',
        icon: Warehouse,
        href: '/warehouse-entries'
      },
      {
        title: 'Registro de Facturas Proveedor',
        icon: FileText,
        href: '/invoice-entry'
      },
      {
        title: 'Compra Directa',
        icon: ShoppingCart,
        href: '/direct-purchase'
      },
      {
        title: 'Devolución a Proveedores',
        icon: RotateCcw,
        href: '/returns'
      },
      {
        title: 'Gestión de Impuestos',
        icon: Calculator,
        href: '/tax-management'
      },
      {
        title: 'Contabilización',
        icon: BookOpen,
        href: '/accounting'
      },
      {
        title: 'Reportes',
        icon: BarChart3,
        href: '/reports'
      },
      {
        title: '🔧 Prueba BD PostgreSQL',
        icon: Database,
        href: '/test-database'
      }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "relative flex flex-col h-full bg-white shadow-sm transition-all duration-300",
      collapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">ERP SAAS</h1>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100"
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>
        
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Menú Principal
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-8">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!collapsed && (
                <div className="mb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Package className={cn("w-5 h-5", section.color)} />
                    <div>
                      <h3 className={cn("font-semibold", section.color)}>
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 mt-4 mb-6"></div>
                </div>
              )}
              
              <nav className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link key={item.href} to={item.href}>
                      <div className={cn(
                        "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer group",
                        isActive 
                          ? "bg-gray-900 text-white shadow-sm" 
                          : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        )} />
                        {!collapsed && (
                          <span className="font-medium">
                            {item.title}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};