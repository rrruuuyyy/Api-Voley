import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class AsignarCapitanesDto {
  @IsArray()
  // @ArrayMinSize(2, { message: 'Se requieren al menos 2 capitanes para formar una liga' })
  @IsNumber({}, { each: true, message: 'Cada ID de capitán debe ser un número' })
  capitanesIds: number[];
}
