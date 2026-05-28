import { z } from 'zod';

export const envioSchema = z
  .object({
    // trackingCtg: z
    //   .string()
    //   .min(1, 'El CTG es requerido')
    //   .regex(/^\d+$/, 'El CTG debe contener solo numeros'),
    cpe: z
      .string()
      .min(1, 'El CPE es requerido'),
    clienteCuit: z
      .string()
      .min(1, 'Seleccione un cliente'),
    idOrigen: z
      .number({ invalid_type_error: 'Seleccione un origen' })
      .positive('Seleccione un origen'),
    idDestino: z
      .number({ invalid_type_error: 'Seleccione un destino' })
      .positive('Seleccione un destino'),
    tipoGrano: z
      .string()
      .min(1, 'Seleccione un tipo de grano'),
    kgOrigen: z
      .number({ invalid_type_error: 'Ingrese el peso' })
      .positive('El peso debe ser mayor a 0'),
    // NUEVO CAMPO: Validación estricta para el término legal
    aceptaTerminos: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar el tratamiento de datos para continuar',
    }),
  })
  .refine((data) => data.idOrigen !== data.idDestino, {
    message: 'El origen y destino deben ser diferentes',
    path: ['idDestino'],
  });

export type EnvioFormData = z.infer<typeof envioSchema>;

// Ajusta los roles según tu constante exacta en el sistema
const ROLES_PERMITIDOS = ['ROLE_OPERADOR', 'ROLE_SUPERVISOR', 'ROLE_CHOFER', 'ROLE_ADMINISTRADOR'] as const;

export const usuarioFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  // Validación básica para un CUIL argentino (11 dígitos sin guiones)
  cuil: z.string().regex(/^\d{11}$/, 'El CUIL debe contener exactamente 11 números sin guiones'),
  telefono: z.string().min(8, 'El número de teléfono es muy corto'),
  username: z.string().email('Debe ingresar un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(ROLES_PERMITIDOS, {
    required_error: 'Debe seleccionar un rol válido',
  }),
});

// Inferimos el tipo directamente del esquema de Zod
export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

// ── Cliente (US-38) ──────────────────────────────────────────


export const clienteSchema = z.object({
  cuit: z
    .string()
    .min(1, 'El CUIT es obligatorio'),

  razonSocial: z
    .string()
    .min(1, 'La razón social es obligatoria')
    .max(150, 'Máximo 150 caracteres'),

  tipoEmpresa: z
    .string()
    .min(1, 'Seleccioná un tipo de empresa'),

  email: z
  .string()
  .min(1, 'El email es obligatorio')
  .email('El formato del email no es válido'),

  rucaNro: z.string().optional(),
  vtoRuca: z.string().optional(),

  // Sede opcional — se valida solo si latitud/longitud tienen valor
  sede: z.object({
    nombreLugar: z.string().optional(),
    direccion: z.string().optional(),
    latitud: z.string()
      .refine((v) => !v || !isNaN(parseFloat(v)), { message: 'Debe ser un número. Ej: -34.5547' })
      .optional(),
    longitud: z.string()
      .refine((v) => !v || !isNaN(parseFloat(v)), { message: 'Debe ser un número. Ej: -58.7080' })
      .optional(),
  }).optional(),

  aceptaTerminos: z
    .boolean()
    .refine((v) => v === true, {
      message: 'Debés aceptar el tratamiento de datos para continuar',
    }),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;