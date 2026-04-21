import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateAssessorDto } from './dto/create-assessor.dto';
import { UpdateAssessorDto } from './dto/update-assessor.dto';
import { AssessorService } from './assessor.service';

@Controller('asessor')
export class AsessorController {
  constructor(private readonly asessorService: AssessorService) {}

  @Post()
  create(@Body() createAssessorDto: CreateAssessorDto) {
    return this.asessorService.create(createAssessorDto);
  }

  @Get()
  findAll() {
    return this.asessorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asessorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessorDto: UpdateAssessorDto) {
    return this.asessorService.update(+id, updateAssessorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.asessorService.remove(+id);
  }
}
