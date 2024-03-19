import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from "@nestjs/common"
import { PointHistory, TransactionType, UserPoint } from "./point.model"
import { UserPointTable } from "src/database/userpoint.table"
import { PointHistoryTable } from "src/database/pointhistory.table"
import { PointBody as PointDto } from "./point.dto"
import { PointService } from "./point.service"

@Controller("/point")
export class PointController {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
    private readonly service: PointService,
  ) {}

  /**
   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
   */
  @Get(":id")
  async point(@Param("id") id: string): Promise<UserPoint> {
    return this.service.point(id)
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(":id/histories")
  async history(@Param("id") id: string): Promise<PointHistory[]> {
    return this.service.history(id)
  }

  /**
   * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
   */
  @Patch(":id/charge")
  async charge(
    @Param("id") id: string,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    return this.service.charge(id, pointDto)
  }

  /**
   * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
   */
  @Patch(":id/use")
  async use(
    @Param("id") id: string,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    return this.service.use(id, pointDto)
  }
}
