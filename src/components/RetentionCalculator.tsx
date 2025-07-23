import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Info } from 'lucide-react';

interface RetentionRates {
  reteFuente: number;
  reteICA: number;
  reteIVA: number;
  reteCREE: number;
}

interface RetentionCalculatorProps {
  baseAmount: number;
  onRetentionsCalculated: (retentions: RetentionRates) => void;
}

const RetentionCalculator: React.FC<RetentionCalculatorProps> = ({ 
  baseAmount, 
  onRetentionsCalculated 
}) => {
  const [supplierRegime, setSupplierRegime] = useState<string>('');
  const [buyerRegime, setBuyerRegime] = useState<string>('');
  const [activityType, setActivityType] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('bogota');
  const [retentions, setRetentions] = useState<RetentionRates>({
    reteFuente: 0,
    reteICA: 0,
    reteIVA: 0,
    reteCREE: 0
  });
  const [calculationDetails, setCalculationDetails] = useState<Array<{
    tipo: string;
    concepto: string;
    descripcion: string;
    baseMinima: number;
    tarifa: number;
    aplicaRetencion: boolean;
    valor: number;
    razon?: string;
  }>>([]);

  // Configuración oficial DIAN 2025 - Decreto 0572 de mayo 28 de 2025
  // UVT 2025: $49.799 - Vigente desde junio 1 de 2025
  const UVT_2025 = 49799;
  
  const retentionRules = {
    // Retención en la Fuente - Tabla oficial DIAN 2025
    reteFuente: {
      conceptos: {
        'compras_declarantes': { 
          tarifa: 2.5, 
          baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
          concepto: 'Compras generales (declarantes renta)',
          descripcion: 'Compra de bienes para declarantes de renta',
          codigo: '01'
        },
        'compras_no_declarantes': { 
          tarifa: 3.5, 
          baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
          concepto: 'Compras generales (no declarantes renta)',
          descripcion: 'Compra de bienes para no declarantes de renta',
          codigo: '02'
        },
        'servicios_declarantes': { 
          tarifa: 4, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios generales (declarantes renta)',
          descripcion: 'Servicios técnicos, administrativos para declarantes',
          codigo: '03'
        },
        'servicios_no_declarantes': { 
          tarifa: 6, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios generales (no declarantes renta)',
          descripcion: 'Servicios técnicos, administrativos para no declarantes',
          codigo: '04'
        },
        'honorarios_personas_juridicas': { 
          tarifa: 11, 
          baseMinima: 0, // 100% - Sin base mínima
          concepto: 'Honorarios y comisiones (personas jurídicas)',
          descripcion: 'Honorarios pagados a personas jurídicas',
          codigo: '05'
        },
        'honorarios_no_declarantes': { 
          tarifa: 10, 
          baseMinima: 0, // 100% - Sin base mínima
          concepto: 'Honorarios y comisiones (no declarantes renta)',
          descripcion: 'Honorarios pagados a personas naturales no declarantes',
          codigo: '06'
        },
        'honorarios_contratos_mayores': { 
          tarifa: 11, 
          baseMinima: 0, // 100% - Sin base mínima
          concepto: 'Honorarios contratos > 3.300 UVT',
          descripcion: 'Honorarios en contratos superiores a $164.2 millones',
          codigo: '07'
        },
        'arrendamiento_muebles': { 
          tarifa: 4, 
          baseMinima: 0, // 100% - Sin base mínima
          concepto: 'Arrendamiento de bienes muebles',
          descripcion: 'Arrendamiento de maquinaria, vehículos, etc.',
          codigo: '08'
        },
        'arrendamiento_inmuebles': { 
          tarifa: 3.5, 
          baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
          concepto: 'Arrendamiento de bienes inmuebles',
          descripcion: 'Arrendamiento de locales, oficinas, bodegas',
          codigo: '09'
        },
        'transporte_carga': { 
          tarifa: 1, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios de transporte nacional de carga',
          descripcion: 'Transporte terrestre de mercancías',
          codigo: '10'
        },
        'transporte_pasajeros': { 
          tarifa: 3.5, 
          baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
          concepto: 'Servicios de transporte nacional de pasajeros',
          descripcion: 'Transporte terrestre de personas',
          codigo: '11'
        },
        'construccion': { 
          tarifa: 2, 
          baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
          concepto: 'Contratos de construcción y urbanización',
          descripcion: 'Obras civiles, construcción de inmuebles',
          codigo: '12'
        },
        'hoteles_restaurantes': { 
          tarifa: 3.5, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios de hoteles y restaurantes',
          descripcion: 'Servicios de alojamiento y alimentación',
          codigo: '13'
        },
        'vigilancia_aseo': { 
          tarifa: 2, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios de vigilancia y aseo (sobre AIU)',
          descripcion: 'Servicios de seguridad y limpieza',
          codigo: '14'
        },
        'servicios_salud': { 
          tarifa: 2, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios integrales de salud prestados por IPS',
          descripcion: 'Servicios médicos y hospitalarios',
          codigo: '15'
        },
        'servicios_temporales': { 
          tarifa: 1, 
          baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
          concepto: 'Servicios de empresas temporales (sobre AIU)',
          descripcion: 'Suministro de personal temporal',
          codigo: '16'
        }
      }
    },
    // Retención ICA - Tarifas por municipio
    reteICA: {
      bogota: { 
        tarifa: 4.14, // por mil
        baseMinima: 2 * UVT_2025, // Ejemplo, ajustar según normativa local
        concepto: 'Retención ICA Bogotá D.C.',
        descripcion: 'Industria y Comercio Bogotá'
      },
      medellin: { 
        tarifa: 10, // por mil - ejemplo
        baseMinima: 2 * UVT_2025,
        concepto: 'Retención ICA Medellín',
        descripcion: 'Industria y Comercio Medellín'
      },
      cali: { 
        tarifa: 10, // por mil - ejemplo
        baseMinima: 2 * UVT_2025,
        concepto: 'Retención ICA Santiago de Cali',
        descripcion: 'Industria y Comercio Cali'
      }
    },
    // Retención IVA - Tabla oficial DIAN 2025
    reteIVA: {
      compras: { 
        tarifa: 15, // 15% sobre el IVA
        baseMinima: 10 * UVT_2025, // 10 UVT = $497,990
        concepto: 'Rete IVA por compras',
        descripcion: 'Retención del 15% sobre el IVA en compras'
      },
      servicios: { 
        tarifa: 15, // 15% sobre el IVA
        baseMinima: 2 * UVT_2025, // 2 UVT = $99,598
        concepto: 'Rete IVA por servicios',
        descripcion: 'Retención del 15% sobre el IVA en servicios'
      }
    }
  };

  const calculateRetentions = () => {
    const newRetentions: RetentionRates = {
      reteFuente: 0,
      reteICA: 0,
      reteIVA: 0,
      reteCREE: 0
    };

    const calculations = [];

    // Calcular Retención en la Fuente según tipo de actividad seleccionado
    const conceptoKey = getConceptoByActivityAndRegime();
    if (conceptoKey) {
      const config = retentionRules.reteFuente.conceptos[conceptoKey];
      if (config) {
        const aplicaRetencion = baseAmount >= config.baseMinima;
        
        calculations.push({
          tipo: 'Retención en la Fuente',
          concepto: config.concepto,
          descripcion: config.descripcion,
          baseMinima: config.baseMinima,
          tarifa: config.tarifa,
          aplicaRetencion,
          valor: aplicaRetencion ? (baseAmount * config.tarifa) / 100 : 0,
          razon: aplicaRetencion ? undefined : `Base menor a $${config.baseMinima.toLocaleString()}`
        });

        if (aplicaRetencion) {
          newRetentions.reteFuente = (baseAmount * config.tarifa) / 100;
        }
      }
    }

    // Calcular Retención ICA
    if (retentionRules.reteICA[municipality]) {
      const icaConfig = retentionRules.reteICA[municipality];
      const aplicaRetencion = baseAmount >= icaConfig.baseMinima;
      
      calculations.push({
        tipo: 'Retención ICA',
        concepto: icaConfig.concepto,
        descripcion: icaConfig.descripcion,
        baseMinima: icaConfig.baseMinima,
        tarifa: icaConfig.tarifa,
        aplicaRetencion,
        valor: aplicaRetencion ? (baseAmount * icaConfig.tarifa) / 1000 : 0,
        razon: aplicaRetencion ? undefined : `Base menor a $${icaConfig.baseMinima.toLocaleString()}`
      });

      if (aplicaRetencion) {
        newRetentions.reteICA = (baseAmount * icaConfig.tarifa) / 1000;
      }
    }

    // Calcular Retención IVA según tipo de actividad
    const tipoIVA = activityType === 'servicios' ? 'servicios' : 'compras';
    const ivaConfig = retentionRules.reteIVA[tipoIVA];
    
    if (ivaConfig) {
      const aplicaRetencion = baseAmount >= ivaConfig.baseMinima;
      
      if (aplicaRetencion) {
        const ivaOnBase = baseAmount * 0.19; // IVA del 19%
        newRetentions.reteIVA = (ivaOnBase * ivaConfig.tarifa) / 100;
      }
      
      calculations.push({
        tipo: 'Retención IVA',
        concepto: ivaConfig.concepto,
        descripcion: ivaConfig.descripcion,
        baseMinima: ivaConfig.baseMinima,
        tarifa: ivaConfig.tarifa,
        aplicaRetencion,
        valor: newRetentions.reteIVA,
        razon: aplicaRetencion ? undefined : `Base menor a $${ivaConfig.baseMinima.toLocaleString()}`
      });
    }

    setRetentions(newRetentions);
    setCalculationDetails(calculations);
    onRetentionsCalculated(newRetentions);
  };

  // Determinar el concepto de retención según actividad y régimen
  const getConceptoByActivityAndRegime = () => {
    const isDeclarante = supplierRegime === 'responsable' || supplierRegime === 'gran_contribuyente';
    
    switch (activityType) {
      case 'compras':
        return isDeclarante ? 'compras_declarantes' : 'compras_no_declarantes';
      case 'servicios':
        return isDeclarante ? 'servicios_declarantes' : 'servicios_no_declarantes';
      case 'honorarios':
        if (supplierRegime === 'persona_juridica') return 'honorarios_personas_juridicas';
        return isDeclarante ? 'honorarios_personas_juridicas' : 'honorarios_no_declarantes';
      case 'arrendamiento':
        return 'arrendamiento_inmuebles';
      case 'transporte':
        return 'transporte_carga';
      case 'construccion':
        return 'construccion';
      default:
        return isDeclarante ? 'servicios_declarantes' : 'servicios_no_declarantes';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Retenciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración de Régimen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Régimen del Proveedor</Label>
            <Select value={supplierRegime} onValueChange={setSupplierRegime}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar régimen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comun">Régimen Común</SelectItem>
                <SelectItem value="simplificado">Régimen Simplificado</SelectItem>
                <SelectItem value="gran_contribuyente">Gran Contribuyente</SelectItem>
                <SelectItem value="regimen_especial">Régimen Especial</SelectItem>
                <SelectItem value="no_responsable">No Responsable de IVA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Régimen del Comprador</Label>
            <Select value={buyerRegime} onValueChange={setBuyerRegime}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar régimen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comun">Régimen Común</SelectItem>
                <SelectItem value="simplificado">Régimen Simplificado</SelectItem>
                <SelectItem value="gran_contribuyente">Gran Contribuyente</SelectItem>
                <SelectItem value="regimen_especial">Régimen Especial</SelectItem>
                <SelectItem value="responsable">Responsable de IVA</SelectItem>
                <SelectItem value="no_responsable">No Responsable de IVA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tipo de Actividad y Municipio */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Actividad</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicios">Servicios</SelectItem>
                <SelectItem value="compras">Compras</SelectItem>
                <SelectItem value="industrial">Actividad Industrial</SelectItem>
                <SelectItem value="comercial">Actividad Comercial</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Municipio</Label>
            <Select value={municipality} onValueChange={setMunicipality}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar municipio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bogota">Bogotá</SelectItem>
                <SelectItem value="medellin">Medellín</SelectItem>
                <SelectItem value="cali">Cali</SelectItem>
                <SelectItem value="barranquilla">Barranquilla</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón de Cálculo */}
        <Button 
          onClick={calculateRetentions}
          className="w-full"
          disabled={!supplierRegime || !buyerRegime || !activityType}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Retenciones
        </Button>

        {/* Resultados */}
        {(retentions.reteFuente > 0 || retentions.reteICA > 0 || retentions.reteIVA > 0 || retentions.reteCREE > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Retenciones Calculadas
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Base de cálculo:</span> ${baseAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Ret. en la Fuente:</span> ${retentions.reteFuente.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Ret. ICA:</span> ${retentions.reteICA.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Ret. IVA:</span> ${retentions.reteIVA.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Ret. CREE:</span> ${retentions.reteCREE.toLocaleString()}
              </div>
              <div className="font-bold text-blue-700">
                <span>Total Retenciones:</span> ${(retentions.reteFuente + retentions.reteICA + retentions.reteIVA + retentions.reteCREE).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RetentionCalculator;