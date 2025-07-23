import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Settings, Users, FileText } from 'lucide-react';
import MatrizRetencionCRUD from '@/components/MatrizRetencionCRUD';
import TaxConceptsCRUD from '@/components/TaxConceptsCRUD';
import MassiveTaxAssignmentComponent from '@/components/MassiveTaxAssignment';

const TaxManagement: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Impuestos y Retenciones
        </h1>
        <p className="text-gray-600">
          Sistema completo para la parametrización y asignación de conceptos tributarios DIAN 2025
        </p>
      </div>

      <Tabs defaultValue="matriz" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matriz" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Matriz Retenciones
          </TabsTrigger>
          <TabsTrigger value="concepts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Conceptos Tributarios
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Asignación a Proveedores
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matriz" className="space-y-6">
          <MatrizRetencionCRUD />
        </TabsContent>

        <TabsContent value="concepts" className="space-y-6">
          <TaxConceptsCRUD 
            key={`concepts-${refreshKey}`}
            onConceptsUpdated={handleDataUpdate} 
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <MassiveTaxAssignmentComponent 
            key={`assignments-${refreshKey}`}
            onAssignmentsUpdated={handleDataUpdate} 
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reportes de Impuestos y Retenciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Reportes Próximamente</h3>
                  <p className="text-blue-700 mb-4">
                    Esta sección incluirá reportes detallados de:
                  </p>
                  <ul className="text-left text-blue-700 space-y-2 max-w-md mx-auto">
                    <li>• Resumen de retenciones por proveedor</li>
                    <li>• Certificados de retención automáticos</li>
                    <li>• Reportes de cumplimiento DIAN</li>
                    <li>• Análisis de impuestos por período</li>
                    <li>• Exportación a formatos oficiales</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxManagement;