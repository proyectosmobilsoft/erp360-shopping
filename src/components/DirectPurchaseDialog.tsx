import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Upload, Calculator, Plus } from 'lucide-react';

interface DirectPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function DirectPurchaseDialog({ isOpen, onClose, onSave }: DirectPurchaseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <div className="bg-white">
          {/* Header Section */}
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Compra Directa - 3 en 1</h2>
            <p className="text-sm text-gray-600">Orden de Compra + Entrada de Almacén + Radicación de Factura</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Información del Proveedor */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Proveedor</h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <Label className="text-sm font-medium text-gray-700">NIT del Proveedor</Label>
                  <Input className="mt-1 bg-cyan-50 border-cyan-200" placeholder="123456789-0" />
                </div>
                <div className="col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Nombre del Proveedor o Contratista</Label>
                  <Input className="mt-1" placeholder="Nombre del proveedor" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Sede Recibo</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sede1">Sede Principal</SelectItem>
                      <SelectItem value="sede2">Sede Sucursal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Bodegas</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bodega1">Bodega 1</SelectItem>
                      <SelectItem value="bodega2">Bodega 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="entrada" className="rounded bg-cyan-100" />
                      <Label htmlFor="entrada" className="text-sm font-medium text-cyan-700">Entrada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="contabiliza" className="rounded bg-cyan-100" />
                      <Label htmlFor="contabiliza" className="text-sm font-medium text-cyan-700">Contabiliza Factura</Label>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
                  <Input className="mt-1" placeholder="Bogotá" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Dirección</Label>
                  <Input className="mt-1" placeholder="Calle 123 #45-67" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Plazo</Label>
                  <Input className="mt-1" placeholder="30 días" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">N° Compra</Label>
                  <Input className="mt-1 bg-gray-100" placeholder="AUTO" readOnly />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Régimen Tributario</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="responsable">Responsable IVA</SelectItem>
                      <SelectItem value="simple">Régimen Simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                  <Input className="mt-1" placeholder="(+57) 123 456 7890" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Celular</Label>
                  <Input className="mt-1" placeholder="(+57) 300 123 4567" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input className="mt-1" placeholder="proveedor@email.com" />
                </div>
                <div className="col-span-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="retefuente" />
                      <Label htmlFor="retefuente" className="text-sm">Rete. Fuente</Label>
                      <Input className="w-16 h-8 text-xs" placeholder="3.5%" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="reteica" />
                      <Label htmlFor="reteica" className="text-sm">Rete. ICA</Label>
                      <Input className="w-16 h-8 text-xs" placeholder="0.414%" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="reteiva" />
                      <Label htmlFor="reteiva" className="text-sm">Rete. IVA</Label>
                      <Input className="w-16 h-8 text-xs" placeholder="15%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selecciona los Productos */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Selecciona los Productos</h3>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {/* Fila para agregar productos */}
              <div className="grid grid-cols-12 gap-2 mb-4 p-3 bg-gray-50 rounded">
                <div className="col-span-3">
                  <Input placeholder="Buscar producto..." className="h-8 text-sm" />
                </div>
                <div className="col-span-1">
                  <Input placeholder="Und" className="h-8 text-sm" />
                </div>
                <div className="col-span-1">
                  <Input placeholder="Cant" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                  <Input placeholder="Precio Unit." className="h-8 text-sm" />
                </div>
                <div className="col-span-1">
                  <Input placeholder="% IVA" className="h-8 text-sm" />
                </div>
                <div className="col-span-1">
                  <Input placeholder="% Desc" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                  <Input placeholder="Total" className="h-8 text-sm bg-gray-100" readOnly />
                </div>
                <div className="col-span-1">
                  <Button size="sm" className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tabla de productos */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-cyan-500 text-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Producto</th>
                      <th className="px-2 py-2 text-center text-sm font-medium">Und</th>
                      <th className="px-2 py-2 text-center text-sm font-medium">Cant</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">Precio Unit.</th>
                      <th className="px-2 py-2 text-center text-sm font-medium">% IVA</th>
                      <th className="px-2 py-2 text-center text-sm font-medium">% Desc</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">Total</th>
                      <th className="px-2 py-2 text-center text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-cyan-200">
                      <td className="px-4 py-2 text-sm">ARROZ BLANCO x 500g</td>
                      <td className="px-2 py-2 text-center text-sm">UND</td>
                      <td className="px-2 py-2 text-center text-sm">100</td>
                      <td className="px-4 py-2 text-center text-sm">$2,500</td>
                      <td className="px-2 py-2 text-center text-sm">19%</td>
                      <td className="px-2 py-2 text-center text-sm">0%</td>
                      <td className="px-4 py-2 text-center text-sm font-medium">$297,500</td>
                      <td className="px-2 py-2 text-center">
                        <Button size="sm" variant="destructive" className="h-6 w-6 p-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b border-cyan-200">
                      <td className="px-4 py-2 text-sm">AGUACATE HASS x Kg</td>
                      <td className="px-2 py-2 text-center text-sm">KG</td>
                      <td className="px-2 py-2 text-center text-sm">50</td>
                      <td className="px-4 py-2 text-center text-sm">$4,800</td>
                      <td className="px-2 py-2 text-center text-sm">19%</td>
                      <td className="px-2 py-2 text-center text-sm">5%</td>
                      <td className="px-4 py-2 text-center text-sm font-medium">$271,400</td>
                      <td className="px-2 py-2 text-center">
                        <Button size="sm" variant="destructive" className="h-6 w-6 p-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Layout con dos columnas */}
            <div className="grid grid-cols-12 gap-6">
              {/* Columna izquierda - Datos adicionales */}
              <div className="col-span-8 space-y-6">
                {/* Datos de Fletes */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Datos de Fletes</h4>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="terceria" />
                      <Label htmlFor="terceria" className="text-sm">Tercería Fletes</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Vr. Fletes a aplicar en el costo del producto</Label>
                      <Input placeholder="$0.00" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">A prorratear peso</Label>
                      <Input placeholder="0" className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Ajustes Adicionales */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Ajustes Adicionales</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Descuentos Otorgados</Label>
                      <Input placeholder="$0.00" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Fletes de Mercancía</Label>
                      <Input placeholder="0" className="mt-1" />
                    </div>
                    <div></div>
                  </div>
                </div> 

                {/* Archivos */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Archivos</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">0 Drag files to attach, or browse</p>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Totales */}
              <div className="col-span-4">
                <div className="bg-cyan-500 text-white p-4 rounded-t-lg">
                  <h4 className="font-semibold text-lg">Totales de la Compra</h4>
                  <p className="text-sm text-cyan-100">Los valores se ajustarán al idioma más adelante</p>
                </div>
                <div className="bg-white border border-cyan-500 border-t-0 rounded-b-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base de Compra</span>
                    <span className="font-medium">$ 14,200,000.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ajustes al peso</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Fletes</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total IVA</span>
                    <span className="font-medium">$ 0.00</span>
                  </div>
                  <div className="bg-cyan-500 text-white p-2 rounded flex justify-between font-semibold">
                    <span>Total Orden</span>
                    <span>$ 14,200,000.00</span>
                  </div>

                  {/* Retenciones en rojo */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Retefuente</span>
                      <span className="font-medium">$ 357,500.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Rete. I.C.A</span>
                      <span className="font-medium">$ 71,500.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Rete. IVA</span>
                      <span className="font-medium">$ 0.00</span>
                    </div>
                  </div>

                  {/* Total final */}
                  <div className="bg-green-100 border border-green-300 p-3 rounded mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total Factura</span>
                      <span className="font-bold text-xl text-green-700">$ 13,871,000.00</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="retenciones" className="text-xs" />
                        <Label htmlFor="retenciones" className="text-xs">Retenciones de acuerdo por tasa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="decimales" className="text-xs" />
                        <Label htmlFor="decimales" className="text-xs">Redondear decimales</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={onSave}>
              Guardar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}