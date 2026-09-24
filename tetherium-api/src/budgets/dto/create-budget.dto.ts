import { IsInt, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  limit: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  year: number;
}
