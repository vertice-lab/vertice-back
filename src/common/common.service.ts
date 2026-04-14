import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  create() {
    return 'This action adds a new common';
  }

  findAll() {
    return `This action returns all common`;
  }

  findOne() {
    return `This action returns a  common`;
  }

  update() {
    return `This action updates a common`;
  }

  remove() {
    return `This action removes a common`;
  }
}
