import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Info, CheckCircle, XCircle } from 'lucide-react';
import { RetentionConcept, Supplier, Company, AutomaticRetentionCalculation, AccountingAccount } from '@/types/retention';

interface AutomaticRetentionCalculatorProps {
  baseAmount: number;
  supplier: Supplier;
  company: Company;
  transactionType: 'bienes' | 'servicios';
  onRetentionsCalculated: (retentions: AutomaticRetentionCalculation[]) => void;
}

const AutomaticRetentionCalculator: React.FC<AutomaticRetentionCalculatorProps> = ({
  baseAmount,
  supplier,
  company,
  transactionType,
  onRetentionsCalculated
}) => {
  const [calculations, setCalculations] = useState<AutomaticRetentionCalculation[]>([]);
  const [concepts, setConcepts] = useState<RetentionConcept[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Cargar conceptos de retención
    const savedConcepts = localStorage.getItem('retentionConcepts');
    if (savedConcepts) {
      setConcepts(JSON.parse(savedConcepts));
    }

    // Cargar cuentas contables
    const savedAccounts = localStorage.getItem('accountingAccounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);

  useEffect(() => {
    if (baseAmount > 0 && supplier && company && concepts.length > 0) {
      calculateAutomaticRetentions();
    }
  }, [baseAmount, supplier, company, transactionType, concepts, accounts]);

  const calculateAutomaticRetentions = async () => {
    setIsCalculating(true);
    
    try {
      const applicableConceptIds = transactionType === 'bienes' 
        ? supplier.retencionesBienes 
        : supplier.retencionesServicios;

      const newCalculations: AutomaticRetentionCalculation[] = [];

      for (const conceptId of applicableConceptIds) {
        const concept = concepts.find(c => c.id === conceptId && c.activo);
        if (!concept) continue;

        const account = accounts.find(a => a.id === concept.cuentaContable);
        if (!account) continue;

        // Determinar si aplica la retención
        const aplicable = baseAmount >= concept.baseMinima;
        const valorRetencion = aplicable ? (baseAmount * concept.tasaImpuesto) / 100 : 0;

        const calculation: AutomaticRetentionCalculation = {
          conceptoRetencion: concept,
          baseCalculo: baseAmount,
          valorRetencion,
          aplicable,
          razon: aplicable ? undefined : `Base menor a $${concept.baseMinima.toLocaleString()}`,
          cuentaContable: account
        };

        newCalculations.push(calculation);
      }

      setCalculations(newCalculations);
      onRetentionsCalculated(newCalculations);
    } catch (error) {
      console.error('Error calculando retenciones automáticas:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const totalRetenciones = calculations
    .filter(calc => calc.aplicable)
    .reduce((sum, calc) => sum + calc.valorRetencion, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cálculo Automático de Retenciones
          {isCalculating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de la transacción */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Proveedor:</span> {supplier.nombre}
            </div>
            <div>
              <span className="font-medium">Empresa:</span> {company.nombre}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {transactionType === 'bienes' ? 'Compra de Bienes' : 'Adquisición de Servicios'}
            </div>
            <div>
              <span className="font-medium">Base de cálculo:</span> ${baseAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Resultados de cálculos */}
        {calculations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Retenciones Aplicables
            </h4>
            
            {calculations.map((calc, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                calc.aplicable ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {calc.aplicable ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium">
                      {calc.conceptoRetencion.codigo} - {calc.conceptoRetencion.nombre}
                    </span>
                  </div>
                  <span className={`font-bold ${calc.aplicable ? 'text-green-700' : 'text-gray-500'}`}>
                    ${calc.valorRetencion.toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Base mínima:</span> ${calc.conceptoRetencion.baseMinima.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Tasa:</span> {calc.conceptoRetencion.tasaImpuesto}%
                  </div>
                  <div>
                    <span className="font-medium">Cuenta:</span> {calc.cuentaContable.codigo}
                  </div>
                </div>
                
                {!calc.aplicable && calc.razon && (
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {calc.razon}
                  </div>
                )}
              </div>
            ))}

            {/* Resumen total */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-900">Total Retenciones Aplicables:</span>
                <span className="font-bold text-xl text-blue-700">${totalRetenciones.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-sm text-blue-600">
                Valor neto a pagar: ${(baseAmount - totalRetenciones).toLocaleString()}
              </div>
            </div>

            {/* Detalle contable */}
            {calculations.filter(calc => calc.aplicable).length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Asientos Contables Sugeridos:</h5>
                <div className="space-y-2 text-sm">
                  {calculations
                    .filter(calc => calc.aplicable)
                    .map((calc, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{calc.cuentaContable.codigo} - {calc.cuentaContable.nombre}</span>
                        <span className="font-mono">${calc.valorRetencion.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {calculations.length === 0 && !isCalculating && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se han configurado retenciones para este proveedor y tipo de transacción</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomaticRetentionCalculator;