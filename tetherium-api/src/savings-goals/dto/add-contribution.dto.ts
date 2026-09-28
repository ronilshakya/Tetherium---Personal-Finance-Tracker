// add-contribution.dto.ts
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddContributionDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
