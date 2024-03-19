import { BadRequestException, Injectable } from "@nestjs/common"
import { UserPointTable } from "../database/userpoint.table"
import { PointHistoryTable } from "../database/pointhistory.table"
import { PointBody as PointDto } from "./point.dto"
import { TransactionType, UserPoint } from "./point.model"

@Injectable()
export class PointService {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  async point(id: string) {
    const userId = Number.parseInt(id)
    return this.userDb.selectById(userId)
  }

  async history(id: string) {
    const userId = Number.parseInt(id)
    return this.historyDb.selectAllByUserId(userId)
  }

  async charge(id: string, dto: PointDto) {
    const userId = Number.parseInt(id)
    const amount = dto.amount
    await this.historyDb.insert(userId, amount, TransactionType.CHARGE, Date.now())
    const beforeUserPoint = await this.userDb.selectById(userId)
    const beforePoint = beforeUserPoint.point
    return this.userDb.insertOrUpdate(userId, beforePoint + amount)
  }

  async use(id: string, dto: PointDto) {
    const userId = Number.parseInt(id)
    const amount = dto.amount
    await this.historyDb.insert(userId, amount, TransactionType.USE, Date.now())
    const beforePoint = await this.userDb.selectById(userId)
    if (beforePoint.point < amount) {
      throw new BadRequestException("포인트가 부족합니다.")
    }
    return this.userDb.insertOrUpdate(userId, beforePoint.point - amount)
  }
}
