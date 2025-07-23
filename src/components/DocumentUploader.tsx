import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseOrderDocument } from '@/types';
import { Upload, FileText, Image, File, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploaderProps {
  documents: PurchaseOrderDocument[];
  onDocumentsChange: (documents: PurchaseOrderDocument[]) => void;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
}

export default function DocumentUploader({
  documents,
  onDocumentsChange,
  maxFileSize = 10,
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}: DocumentUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    // Validar tamaño
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo debe ser menor a ${maxFileSize}MB`,
        variant: "destructive"
      });
      return false;
    }

    // Validar tipo
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "Tipo de archivo no permitido",
        description: "Solo se permiten archivos PDF, Word e imágenes",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newDocuments: PurchaseOrderDocument[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        // Simular subida de archivo (en producción aquí iría la lógica real de upload)
        const document: PurchaseOrderDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: URL.createObjectURL(file), // En producción sería la URL real del servidor
          uploadedAt: new Date()
        };
        newDocuments.push(document);
      }
    });

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments]);
      toast({
        title: "Archivos subidos",
        description: `Se subieron ${newDocuments.length} archivo(s) correctamente`,
      });
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange(updatedDocuments);
    toast({
      title: "Documento eliminado",
      description: "El documento se eliminó correctamente",
    });
  };

  const downloadDocument = (document: PurchaseOrderDocument) => {
    // Crear link temporal para descarga
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Documentos de Soporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Arrastra archivos aquí o 
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto ml-1"
              onClick={() => fileInputRef.current?.click()}
            >
              selecciona archivos
            </Button>
          </p>
          <p className="text-xs text-gray-500">
            PDF, Word, Imágenes hasta {maxFileSize}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Archivos adjuntos ({documents.length})</h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.fileName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)} • Subido el{' '}
                        {doc.uploadedAt.toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}