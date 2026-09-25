// src/auth/dto/update-profile.dto.ts
import { IsIn, IsOptional } from 'class-validator';

const SUPPORTED_CURRENCIES = ['NPR', 'USD', 'EUR', 'GBP', 'INR'];

export class UpdateProfileDto {
  @IsOptional()
  @IsIn(SUPPORTED_CURRENCIES)
  currency?: string;
}
