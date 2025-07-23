import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building, Users, Calculator } from 'lucide-react';
import RetentionConceptsManager from '@/components/RetentionConceptsManager';
import SupplierRetentionConfig from '@/components/SupplierRetentionConfig';
import AutomaticRetentionCalculator from '@/components/AutomaticRetentionCalculator';

const RetentionConfiguration: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Datos de ejemplo para la calculadora automática
  const exampleSupplier = {
    id: '1',
    nit: '900123456-1',
    nombre: 'Proveedor de Ejemplo S.A.S.',
    regimenTributario: '1',
    retencionesBienes: ['concept-1', 'concept-2'],
    retencionesServicios: ['concept-3', 'concept-4'],
    activo: true
  };

  const exampleCompany = {
    id: '1',
    nit: '900987654-1',
    nombre: 'Mi Empresa S.A.S.',
    regimenTributario: '3',
    esAgenteRetenedor: true,
    municipio: 'bogota',
    activo: true
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configuración de Retenciones
        </h1>
        <p className="text-gray-600">
          Gestión completa del sistema de retenciones tributarias DIAN 2025
        </p>
      </div>

      <Tabs defaultValue="concepts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="concepts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Conceptos
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concepts" className="space-y-6">
          <RetentionConceptsManager 
            key={`concepts-${refreshKey}`}
            onConceptsUpdated={handleDataUpdate} 
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierRetentionConfig 
            key={`suppliers-${refreshKey}`}
            onSuppliersUpdated={handleDataUpdate} 
          />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Configuración de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Próximamente:</strong> Configuración del régimen tributario de la empresa, 
                  configuración como agente retenedor y parámetros municipales para ICA.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo - Calculadora Automática</CardTitle>
              </CardHeader>
              <CardContent>
                <AutomaticRetentionCalculator
                  baseAmount={1000000}
                  supplier={exampleSupplier}
                  company={exampleCompany}
                  transactionType="servicios"
                  onRetentionsCalculated={(retentions) => {
                    console.log('Retenciones calculadas:', retentions);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RetentionConfiguration;