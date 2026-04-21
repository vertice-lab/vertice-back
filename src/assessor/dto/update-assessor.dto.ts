import { PartialType } from '@nestjs/swagger';
import { CreateAssessorDto } from './create-assessor.dto';

export class UpdateAssessorDto extends PartialType(CreateAssessorDto) {}
