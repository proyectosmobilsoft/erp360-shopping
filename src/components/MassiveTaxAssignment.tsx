import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, Search, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { TaxConcept, SupplierTaxAssignment, MassiveTaxAssignment } from '@/types/tax-configuration';
import { Supplier } from '@/types/retention';

interface MassiveTaxAssignmentProps {
  onAssignmentsUpdated?: () => void;
}

const MassiveTaxAssignmentComponent: React.FC<MassiveTaxAssignmentProps> = ({ onAssignmentsUpdated }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [taxConcepts, setTaxConcepts] = useState<TaxConcept[]>([]);
  const [assignments, setAssignments] = useState<SupplierTaxAssignment[]>([]);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Estados para asignación masiva
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedTaxConcepts, setSelectedTaxConcepts] = useState<string[]>([]);
  const [selectAllSuppliers, setSelectAllSuppliers] = useState(false);
  const [selectAllTaxes, setSelectAllTaxes] = useState(false);

  useEffect(() => {
    // Cargar datos
    const savedSuppliers = localStorage.getItem('suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    }

    const savedTaxConcepts = localStorage.getItem('taxConcepts');
    if (savedTaxConcepts) {
      setTaxConcepts(JSON.parse(savedTaxConcepts));
    }

    const savedAssignments = localStorage.getItem('supplierTaxAssignments');
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }
  }, []);

  const handleMassiveAssignment = () => {
    if (selectedSuppliers.length === 0 || selectedTaxConcepts.length === 0) {
      alert('Debe seleccionar al menos un proveedor y un concepto tributario');
      return;
    }

    const newAssignments: SupplierTaxAssignment[] = [];
    const now = new Date();

    selectedSuppliers.forEach(supplierId => {
      // Buscar asignación existente o crear nueva
      const existingAssignment = assignments.find(a => a.supplierId === supplierId);
      
      if (existingAssignment) {
        // Agregar nuevos conceptos a los existentes (evitar duplicados)
        const updatedTaxConcepts = [...new Set([...existingAssignment.taxConceptIds, ...selectedTaxConcepts])];
        newAssignments.push({
          ...existingAssignment,
          taxConceptIds: updatedTaxConcepts,
          fechaAsignacion: now,
          usuario: 'Usuario Actual'
        });
      } else {
        // Crear nueva asignación
        newAssignments.push({
          supplierId,
          taxConceptIds: selectedTaxConcepts,
          fechaAsignacion: now,
          usuario: 'Usuario Actual'
        });
      }
    });

    // Actualizar asignaciones
    const updatedAssignments = assignments.filter(a => !selectedSuppliers.includes(a.supplierId)).concat(newAssignments);
    setAssignments(updatedAssignments);
    localStorage.setItem('supplierTaxAssignments', JSON.stringify(updatedAssignments));

    // Limpiar selecciones
    setSelectedSuppliers([]);
    setSelectedTaxConcepts([]);
    setSelectAllSuppliers(false);
    setSelectAllTaxes(false);
    setIsAssignmentDialogOpen(false);

    onAssignmentsUpdated?.();
    
    alert(`Impuestos asignados exitosamente a ${selectedSuppliers.length} proveedor(es)`);
  };

  const handleRemoveTaxFromSupplier = (supplierId: string, taxConceptId: string) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.supplierId === supplierId) {
        return {
          ...assignment,
          taxConceptIds: assignment.taxConceptIds.filter(id => id !== taxConceptId),
          fechaAsignacion: new Date(),
          usuario: 'Usuario Actual'
        };
      }
      return assignment;
    }).filter(assignment => assignment.taxConceptIds.length > 0);

    setAssignments(updatedAssignments);
    localStorage.setItem('supplierTaxAssignments', JSON.stringify(updatedAssignments));
    onAssignmentsUpdated?.();
  };

  const handleSelectAllSuppliers = (checked: boolean) => {
    setSelectAllSuppliers(checked);
    if (checked) {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectAllTaxes = (checked: boolean) => {
    setSelectAllTaxes(checked);
    if (checked) {
      setSelectedTaxConcepts(activeTaxConcepts.map(t => t.id));
    } else {
      setSelectedTaxConcepts([]);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
    supplier.nit.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeTaxConcepts = taxConcepts.filter(concept => concept.activo);

  const getSupplierTaxes = (supplierId: string) => {
    const assignment = assignments.find(a => a.supplierId === supplierId);
    return assignment ? assignment.taxConceptIds : [];
  };

  const getTaxConceptName = (taxId: string) => {
    const concept = taxConcepts.find(t => t.id === taxId);
    return concept ? `${concept.codigo} - ${concept.nombre}` : 'Concepto no encontrado';
  };

  const getTaxConceptType = (taxId: string) => {
    const concept = taxConcepts.find(t => t.id === taxId);
    return concept ? concept.tipoImpuesto : '';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RETEFUENTE': return 'bg-blue-100 text-blue-800';
      case 'RETEICA': return 'bg-green-100 text-green-800';
      case 'RETEIVA': return 'bg-purple-100 text-purple-800';
      case 'RETECREE': return 'bg-orange-100 text-orange-800';
      case 'IVA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Asignación Masiva */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Asignación Masiva de Impuestos a Proveedores
            </div>
            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Asignación Masiva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Asignación Masiva de Conceptos Tributarios</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Selección de Proveedores */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Seleccionar Proveedores</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectAllSuppliers}
                          onCheckedChange={handleSelectAllSuppliers}
                        />
                        <Label>Seleccionar todos</Label>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg max-h-80 overflow-y-auto">
                      {filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="flex items-center space-x-2 p-3 border-b hover:bg-gray-50">
                          <Checkbox
                            checked={selectedSuppliers.includes(supplier.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                              } else {
                                setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                              }
                            }}
                          />
                          <div>
                            <div className="font-medium">{supplier.nombre}</div>
                            <div className="text-sm text-gray-500">{supplier.nit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {selectedSuppliers.length} proveedor(es) seleccionado(s)
                    </div>
                  </div>

                  {/* Selección de Conceptos Tributarios */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Seleccionar Conceptos Tributarios</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectAllTaxes}
                          onCheckedChange={handleSelectAllTaxes}
                        />
                        <Label>Seleccionar todos</Label>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg max-h-80 overflow-y-auto">
                      {activeTaxConcepts.map(concept => (
                        <div key={concept.id} className="flex items-center space-x-2 p-3 border-b hover:bg-gray-50">
                          <Checkbox
                            checked={selectedTaxConcepts.includes(concept.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTaxConcepts([...selectedTaxConcepts, concept.id]);
                              } else {
                                setSelectedTaxConcepts(selectedTaxConcepts.filter(id => id !== concept.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{concept.codigo}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(concept.tipoImpuesto)}`}>
                                {concept.tipoImpuesto}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{concept.nombre}</div>
                            <div className="text-xs text-gray-500">Tarifa: {concept.tarifa}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {selectedTaxConcepts.length} concepto(s) seleccionado(s)
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleMassiveAssignment}>
                    Asignar Conceptos
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Lista de Proveedores con sus Impuestos Asignados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Proveedores y sus Conceptos Tributarios Asignados
          </CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedor por nombre o NIT..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Conceptos Tributarios Asignados</TableHead>
                <TableHead>Total Conceptos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => {
                const supplierTaxes = getSupplierTaxes(supplier.id);
                return (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.nombre}</TableCell>
                    <TableCell className="font-mono">{supplier.nit}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {supplierTaxes.length > 0 ? (
                          supplierTaxes.map(taxId => {
                            const concept = taxConcepts.find(t => t.id === taxId);
                            if (!concept) return null;
                            
                            return (
                              <Badge
                                key={taxId}
                                variant="secondary"
                                className={`${getTypeColor(concept.tipoImpuesto)} text-xs cursor-pointer hover:opacity-80`}
                                onClick={() => handleRemoveTaxFromSupplier(supplier.id, taxId)}
                                title={`${concept.nombre} - Click para remover`}
                              >
                                {concept.codigo}
                                <XCircle className="h-3 w-3 ml-1" />
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-gray-500 text-sm">Sin conceptos asignados</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplierTaxes.length > 0 ? "default" : "secondary"}>
                        {supplierTaxes.length}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron proveedores</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MassiveTaxAssignmentComponent;