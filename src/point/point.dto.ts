import { IsInt, IsNotEmpty } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class PointBody {
  @IsNotEmpty()
  @ApiProperty()
  @IsInt()
  amount: number
}
