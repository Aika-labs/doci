import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';
import { Prisma } from '@doci/database';

interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: string;
}

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantContext, params?: { consultationId?: string }) {
    const where: Prisma.PrescriptionWhereInput = {};

    if (params?.consultationId) {
      where.consultationId = params.consultationId;
    }

    // Filter by tenant through consultation
    where.consultation = {
      tenantId: ctx.tenantId,
    };

    return this.prisma.prescription.findMany({
      where,
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthDate: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: true,
                licenseNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ctx: TenantContext, id: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id,
        consultation: {
          tenantId: ctx.tenantId,
        },
      },
      include: {
        consultation: {
          include: {
            patient: true,
            user: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Receta no encontrada');
    }

    return prescription;
  }

  async create(
    ctx: TenantContext,
    data: {
      consultationId: string;
      medications: MedicationItem[];
      diagnosis?: string;
      instructions?: string;
      expiresAt?: string;
    },
  ) {
    // Verify consultation belongs to tenant
    const consultation = await this.prisma.consultation.findFirst({
      where: {
        id: data.consultationId,
        tenantId: ctx.tenantId,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.prisma.prescription.create({
      data: {
        consultationId: data.consultationId,
        medications: data.medications as unknown as Prisma.InputJsonValue,
        diagnosis: data.diagnosis,
        instructions: data.instructions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async generatePDF(ctx: TenantContext, id: string): Promise<Buffer> {
    const prescription = await this.findOne(ctx, id);
    const { consultation } = prescription;
    const { patient, user: doctor } = consultation;

    // Get tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(tenant?.name || 'Consultorio Médico', { align: 'center' });
      
      // Get address from tenant settings if available
      const settings = tenant?.settings as Record<string, unknown> | null;
      if (settings?.address) {
        doc.fontSize(10).font('Helvetica').text(String(settings.address), { align: 'center' });
      }
      if (settings?.phone) {
        doc.text(`Tel: ${String(settings.phone)}`, { align: 'center' });
      }
      doc.moveDown();

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text('RECETA MÉDICA', { align: 'center' });
      doc.moveDown();

      // Security code
      doc.fontSize(8).font('Helvetica').text(`Código de verificación: ${prescription.securityCode}`, { align: 'right' });
      
      // Date
      doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`, { align: 'right' });
      doc.moveDown();

      // Patient info
      doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PACIENTE');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${patient.firstName} ${patient.lastName}`);
      
      if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        doc.text(`Edad: ${age} años`);
      }
      doc.moveDown();

      // Diagnosis
      if (prescription.diagnosis) {
        doc.fontSize(12).font('Helvetica-Bold').text('DIAGNÓSTICO');
        doc.fontSize(10).font('Helvetica').text(prescription.diagnosis);
        doc.moveDown();
      }

      // Medications
      doc.fontSize(12).font('Helvetica-Bold').text('MEDICAMENTOS');
      doc.moveDown(0.5);

      const medications = prescription.medications as unknown as MedicationItem[];
      medications.forEach((med, index) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${med.name}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`   Dosis: ${med.dose}`);
        doc.text(`   Frecuencia: ${med.frequency}`);
        doc.text(`   Duración: ${med.duration}`);
        if (med.quantity) {
          doc.text(`   Cantidad: ${med.quantity}`);
        }
        if (med.instructions) {
          doc.text(`   Indicaciones: ${med.instructions}`);
        }
        doc.moveDown(0.5);
      });

      // General instructions
      if (prescription.instructions) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('INDICACIONES GENERALES');
        doc.fontSize(10).font('Helvetica').text(prescription.instructions);
      }

      // Validity
      if (prescription.expiresAt) {
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Oblique').text(
          `Esta receta es válida hasta: ${new Date(prescription.expiresAt).toLocaleDateString('es-MX')}`,
          { align: 'center' }
        );
      }

      // Footer - Doctor signature
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica');
      
      // Signature line
      const signatureY = doc.y;
      doc.moveTo(200, signatureY).lineTo(400, signatureY).stroke();
      
      doc.moveDown(0.5);
      doc.text(`Dr(a). ${doctor.firstName} ${doctor.lastName}`, { align: 'center' });
      if (doctor.specialty) {
        doc.text(doctor.specialty, { align: 'center' });
      }
      if (doctor.licenseNumber) {
        doc.text(`Cédula Profesional: ${doctor.licenseNumber}`, { align: 'center' });
      }

      doc.end();
    });
  }

  async invalidate(ctx: TenantContext, id: string) {
    await this.findOne(ctx, id);
    return this.prisma.prescription.update({
      where: { id },
      data: { isValid: false },
    });
  }

  async verifyByCode(securityCode: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { securityCode },
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                licenseNumber: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return { valid: false, message: 'Receta no encontrada' };
    }

    if (!prescription.isValid) {
      return { valid: false, message: 'Esta receta ha sido invalidada' };
    }

    if (prescription.expiresAt && new Date(prescription.expiresAt) < new Date()) {
      return { valid: false, message: 'Esta receta ha expirado' };
    }

    return {
      valid: true,
      prescription: {
        id: prescription.id,
        createdAt: prescription.createdAt,
        patient: `${prescription.consultation.patient.firstName} ${prescription.consultation.patient.lastName}`,
        doctor: `${prescription.consultation.user.firstName} ${prescription.consultation.user.lastName}`,
        licenseNumber: prescription.consultation.user.licenseNumber,
      },
    };
  }
}
