export const formatNit = (documentNumber: string, verificationDigit?: string): string => {
  if (!documentNumber) return '';
  
  // Remover caracteres no numéricos
  const cleanNumber = documentNumber.replace(/\D/g, '');
  
  // Formatear con puntos como separadores de miles
  const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Agregar dígito de verificación si existe
  if (verificationDigit) {
    return `${formatted}-${verificationDigit}`;
  }
  
  return formatted;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('es-CO').format(number);
};

export const documentTypes = [
  { value: 'NIT', label: 'NIT - Número de Identificación Tributaria' },
  { value: 'CC', label: 'CC - Cédula de Ciudadanía' },
  { value: 'CE', label: 'CE - Cédula de Extranjería' },
  { value: 'PAS', label: 'PAS - Pasaporte' },
  { value: 'TI', label: 'TI - Tarjeta de Identidad' },
  { value: 'RC', label: 'RC - Registro Civil' }
];

export const colombianDepartments = [
  { code: '05', name: 'Antioquia' },
  { code: '08', name: 'Atlántico' },
  { code: '11', name: 'Bogotá D.C.' },
  { code: '13', name: 'Bolívar' },
  { code: '15', name: 'Boyacá' },
  { code: '17', name: 'Caldas' },
  { code: '18', name: 'Caquetá' },
  { code: '19', name: 'Cauca' },
  { code: '20', name: 'Cesar' },
  { code: '23', name: 'Córdoba' },
  { code: '25', name: 'Cundinamarca' },
  { code: '27', name: 'Chocó' },
  { code: '41', name: 'Huila' },
  { code: '44', name: 'La Guajira' },
  { code: '47', name: 'Magdalena' },
  { code: '50', name: 'Meta' },
  { code: '52', name: 'Nariño' },
  { code: '54', name: 'Norte de Santander' },
  { code: '63', name: 'Quindío' },
  { code: '66', name: 'Risaralda' },
  { code: '68', name: 'Santander' },
  { code: '70', name: 'Sucre' },
  { code: '73', name: 'Tolima' },
  { code: '76', name: 'Valle del Cauca' },
  { code: '81', name: 'Arauca' },
  { code: '85', name: 'Casanare' },
  { code: '86', name: 'Putumayo' },
  { code: '88', name: 'Archipiélago de San Andrés' },
  { code: '91', name: 'Amazonas' },
  { code: '94', name: 'Guainía' },
  { code: '95', name: 'Guaviare' },
  { code: '97', name: 'Vaupés' },
  { code: '99', name: 'Vichada' }
];

export const calculateNitVerificationDigit = (nit: string): string => {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const cleanNit = nit.replace(/\D/g, '');
  
  let sum = 0;
  for (let i = 0; i < cleanNit.length; i++) {
    const digit = parseInt(cleanNit[cleanNit.length - 1 - i]);
    const weight = weights[i] || 0;
    sum += digit * weight;
  }
  
  const remainder = sum % 11;
  if (remainder < 2) {
    return remainder.toString();
  } else {
    return (11 - remainder).toString();
  }
};

export const getAllCities = () => {
  return [
    { code: '11001', name: 'Bogotá D.C.', departmentCode: '11', departmentName: 'Bogotá D.C.' },
    { code: '76001', name: 'Cali', departmentCode: '76', departmentName: 'Valle del Cauca' },
    { code: '05001', name: 'Medellín', departmentCode: '05', departmentName: 'Antioquia' },
    { code: '08001', name: 'Barranquilla', departmentCode: '08', departmentName: 'Atlántico' },
    { code: '13001', name: 'Cartagena', departmentCode: '13', departmentName: 'Bolívar' },
    { code: '54001', name: 'Cúcuta', departmentCode: '54', departmentName: 'Norte de Santander' },
    { code: '68001', name: 'Bucaramanga', departmentCode: '68', departmentName: 'Santander' },
    { code: '66001', name: 'Pereira', departmentCode: '66', departmentName: 'Risaralda' },
    { code: '73001', name: 'Ibagué', departmentCode: '73', departmentName: 'Tolima' },
    { code: '17001', name: 'Manizales', departmentCode: '17', departmentName: 'Caldas' },
    { code: '52001', name: 'Pasto', departmentCode: '52', departmentName: 'Nariño' },
    { code: '85001', name: 'Yopal', departmentCode: '85', departmentName: 'Casanare' },
    { code: '20001', name: 'Valledupar', departmentCode: '20', departmentName: 'Cesar' },
    { code: '41001', name: 'Neiva', departmentCode: '41', departmentName: 'Huila' },
    { code: '15001', name: 'Tunja', departmentCode: '15', departmentName: 'Boyacá' },
    { code: '63001', name: 'Armenia', departmentCode: '63', departmentName: 'Quindío' },
    { code: '50001', name: 'Villavicencio', departmentCode: '50', departmentName: 'Meta' },
    { code: '44001', name: 'Riohacha', departmentCode: '44', departmentName: 'La Guajira' },
    { code: '70001', name: 'Sincelejo', departmentCode: '70', departmentName: 'Sucre' },
    { code: '23001', name: 'Montería', departmentCode: '23', departmentName: 'Córdoba' }
  ];
};