import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common"
import { UserPointTable } from "../database/userpoint.table"
import { PointHistoryTable } from "../database/pointhistory.table"
import { PointBody as PointDto } from "./point.dto"
import { PointHistory, TransactionType, UserPoint } from "./point.model"
import { Mutex } from "async-mutex"

@Injectable()
export class PointService {
  private userLocks = new Map<string, Mutex>()
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  private getUserMutex(userId: number): Mutex {
    const userIdToString = userId.toString()
    let mutex = this.userLocks.get(userIdToString)
    if (!mutex) {
      mutex = new Mutex()
      this.userLocks.set(userIdToString, mutex)
    }
    return mutex
  }

  async point(id: string): Promise<UserPoint> {
    const userId = Number.parseInt(id)
    const mutex = this.getUserMutex(userId)
    const release = await mutex.acquire()
    try {
      return this.userDb.selectById(userId)
    } catch (e) {
      throw new ServiceUnavailableException("포인트 조회 중 오류가 발생했습니다.")
    } finally {
      release()
    }
  }

  async history(id: string): Promise<PointHistory[]> {
    const userId = Number.parseInt(id)
    return this.historyDb.selectAllByUserId(userId)
  }

  async charge(id: string, dto: PointDto): Promise<UserPoint> {
    const userId = Number.parseInt(id)
    const mutex = this.getUserMutex(userId)
    const release = await mutex.acquire()
    try {
      const amount = dto.amount
      if (amount <= 0 || !Number.isInteger(amount)) {
        throw new BadRequestException("충전 포인트는 양의 정수여야 합니다.")
      }
      const beforeUserPoint = await this.userDb.selectById(userId)
      const beforePoint = beforeUserPoint.point
      await this.historyDb.insert(userId, amount, TransactionType.CHARGE, Date.now())
      return await this.userDb.insertOrUpdate(userId, beforePoint + amount)
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e
      }
      throw new ServiceUnavailableException("포인트 충전 중 오류가 발생했습니다.")
    } finally {
      release()
    }
  }

  async use(id: string, dto: PointDto): Promise<UserPoint> {
    const userId = Number.parseInt(id)
    const mutex = this.getUserMutex(userId)
    const release = await mutex.acquire()
    try {
      const amount = dto.amount
      if (amount <= 0 || !Number.isInteger(amount)) {
        throw new BadRequestException("사용 포인트는 양의 정수여야 합니다.")
      }
      const beforeUserPoint = await this.userDb.selectById(userId)
      const beforePoint = beforeUserPoint.point
      if (beforePoint < amount) {
        throw new BadRequestException("포인트가 부족합니다.")
      }
      await this.historyDb.insert(userId, amount, TransactionType.USE, Date.now())
      return await this.userDb.insertOrUpdate(userId, beforePoint - amount)
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e
      }
      throw new ServiceUnavailableException("포인트 사용 중 오류가 발생했습니다.")
    } finally {
      release()
    }
  }
}
