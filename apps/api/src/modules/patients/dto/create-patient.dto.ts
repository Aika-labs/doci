import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class EmergencyContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationship?: string;
}

export class AllergyDto {
  @ApiProperty()
  @IsString()
  allergen!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reaction?: string;
}

export class ChronicConditionDto {
  @ApiProperty()
  @IsString()
  condition!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MedicationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Nombre del paciente' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'Apellido del paciente' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Género' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Identificación nacional (CURP, DNI, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Número de seguro médico' })
  @IsOptional()
  @IsString()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Compañía de seguros' })
  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @ApiPropertyOptional({ description: 'Tipo de sangre' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @ApiPropertyOptional({ type: AddressDto, description: 'Dirección' })
  @IsOptional()
  @IsObject()
  address?: AddressDto;

  @ApiPropertyOptional({ type: EmergencyContactDto, description: 'Contacto de emergencia' })
  @IsOptional()
  @IsObject()
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: [AllergyDto], description: 'Alergias' })
  @IsOptional()
  @IsArray()
  allergies?: AllergyDto[];

  @ApiPropertyOptional({ type: [ChronicConditionDto], description: 'Condiciones crónicas' })
  @IsOptional()
  @IsArray()
  chronicConditions?: ChronicConditionDto[];

  @ApiPropertyOptional({ type: [MedicationDto], description: 'Medicamentos actuales' })
  @IsOptional()
  @IsArray()
  currentMedications?: MedicationDto[];

  @ApiPropertyOptional({ description: 'Notas generales' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
