import { Injectable } from '@nestjs/common';
import { CreateAssessorDto } from './dto/create-assessor.dto';
import { UpdateAssessorDto } from './dto/update-assessor.dto';

@Injectable()
export class AssessorService {
  create(createAssessorDto: CreateAssessorDto) {
    return 'This action adds a new asessor';
  }

  findAll() {
    return `This action returns all asessor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} asessor`;
  }

  update(id: number, updateAssessorDto: UpdateAssessorDto) {
    return `This action updates a #${id} asessor`;
  }

  remove(id: number) {
    return `This action removes a #${id} asessor`;
  }
}
