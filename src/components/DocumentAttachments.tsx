import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Paperclip, 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Eye,
  FileText,
  Image,
  FileSpreadsheet
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  description?: string;
}

interface DocumentAttachmentsProps {
  documentId: string;
  documentType: 'purchase_order' | 'warehouse_entry' | 'invoice' | 'return';
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({
  documentId,
  documentType,
  attachments = [],
  onAttachmentsChange
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>(attachments);

  const currentUser = {
    name: 'Juan Carlos Pérez',
    email: 'jperez@empresa.com'
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      purchase_order: 'Orden de Compra',
      warehouse_entry: 'Entrada de Almacén',
      invoice: 'Radicación de Proveedor',
      return: 'Devolución'
    };
    return labels[type] || type;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newAttachments: Attachment[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const attachment: Attachment = {
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        uploadedBy: currentUser.name,
        description: uploadDescription
      };
      newAttachments.push(attachment);
    }

    const updatedAttachments = [...currentAttachments, ...newAttachments];
    setCurrentAttachments(updatedAttachments);
    onAttachmentsChange?.(updatedAttachments);

    // Reset form
    setSelectedFiles(null);
    setUploadDescription('');
    setIsUploadDialogOpen(false);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);
    setCurrentAttachments(updatedAttachments);
    onAttachmentsChange?.(updatedAttachments);
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // En una implementación real, aquí se descargaría el archivo
    console.log('Downloading attachment:', attachment.name);
  };

  const handleViewAttachment = (attachment: Attachment) => {
    // En una implementación real, aquí se abriría el archivo para visualización
    console.log('Viewing attachment:', attachment.name);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Documentos Adjuntos - {getDocumentTypeLabel(documentType)}
          </div>
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Adjuntar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentAttachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay documentos adjuntos</p>
            <p className="text-sm">Haz clic en "Adjuntar" para subir archivos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentAttachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.name)}
                  <div>
                    <div className="font-medium text-sm">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • 
                      Subido por {attachment.uploadedBy} • 
                      {new Date(attachment.uploadDate).toLocaleDateString('es-ES')}
                    </div>
                    {attachment.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {attachment.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAttachment(attachment)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjuntar Documentos</DialogTitle>
            <DialogDescription>
              Sube archivos relacionados con este {getDocumentTypeLabel(documentType).toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Seleccionar Archivos</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el contenido de los archivos..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
              />
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos Seleccionados:</Label>
                <div className="space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {getFileIcon(file.name)}
                      <span>{file.name}</span>
                      <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!selectedFiles || selectedFiles.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DocumentAttachments;