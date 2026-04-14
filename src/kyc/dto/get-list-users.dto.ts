import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";


export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(['Approved', 'Declined', 'In Review', 'Pending'])
  status?: 'Approved' | 'Declined' | 'In Review' | 'Pending';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}