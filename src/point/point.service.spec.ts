import { Test, TestingModule } from "@nestjs/testing"
import { PointService } from "./point.service"
import { UserPointTable } from "../database/userpoint.table"
import { PointHistoryTable } from "../database/pointhistory.table"

describe("PointService", () => {
  let service: PointService
  // 모의 객체 선언
  let mockUserDb: { selectById: jest.Mock; insertOrUpdate: jest.Mock }
  let mockHistoryDb: { insert: jest.Mock; selectAllByUserId: jest.Mock }

  beforeEach(async () => {
    // 모의 객체 초기화
    mockUserDb = {
      selectById: jest.fn(),
      insertOrUpdate: jest.fn(),
    }
    mockHistoryDb = {
      insert: jest.fn(),
      selectAllByUserId: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        { provide: UserPointTable, useValue: mockUserDb },
        { provide: PointHistoryTable, useValue: mockHistoryDb },
      ],
    }).compile()

    service = module.get<PointService>(PointService)
  })

  describe("find pont", () => {
    it("유저의 충전된 포인트를 올바르게 반환합니다", async () => {
      mockUserDb.selectById.mockResolvedValue({
        id: 1,
        point: 100,
        updateMillis: Date.now(),
      })
      const result = await service.point("1")
      expect(result).toEqual({ id: 1, point: 100, updateMillis: expect.any(Number) })
    })
  })

  describe("charge point", () => {
    it("충전한 포인트에 맞게 UserPoint 객체를 return 받습니다", async () => {
      const beforePoint = 100
      const chargePoint = 50
      mockUserDb.selectById.mockResolvedValueOnce({
        id: 1,
        point: beforePoint,
        updateMillis: Date.now(),
      })
      mockHistoryDb.insert.mockResolvedValue({
        id: 1,
        userId: 1,
        amount: chargePoint,
        type: "CHARGE",
        timeMillis: Date.now(),
      })
      mockUserDb.insertOrUpdate.mockResolvedValue({
        id: 1,
        point: beforePoint + chargePoint,
        updateMillis: Date.now(),
      })
      const result = await service.charge("1", { amount: chargePoint })
      expect(mockHistoryDb.insert).toHaveBeenCalledWith(
        1,
        chargePoint,
        "CHARGE",
        expect.any(Number),
      )
      expect(mockUserDb.insertOrUpdate).toHaveBeenCalledWith(1, beforePoint + chargePoint)
      expect(result).toEqual({
        id: 1,
        point: beforePoint + chargePoint,
        updateMillis: expect.any(Number),
      })
    })
  })

  describe("find history", () => {
    it("유저의 point history를 올바르게 반환합니다", async () => {
      mockHistoryDb.selectAllByUserId.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          amount: 100,
          type: "CHARGE",
          timeMillis: Date.now(),
        },
      ])
      const result = await service.history("1")
      expect(mockHistoryDb.selectAllByUserId).toHaveBeenCalledWith(1)
      expect(result).toEqual([
        {
          id: 1,
          userId: 1,
          amount: 100,
          type: "CHARGE",
          timeMillis: expect.any(Number),
        },
      ])
    })
  })

  describe("use point", () => {
    it("가지고 있는 포인트보다 많은 포인트를 사용할 경우 에러를 반환", async () => {
      mockUserDb.selectById.mockResolvedValueOnce({
        id: 1,
        point: 100,
        updateMillis: Date.now(),
      })
      try {
        await service.use("1", { amount: 150 })
      } catch (e) {
        expect(e.message).toEqual("포인트가 부족합니다.")
      }
    })

    it("포인트를 사용한 후 UserPoint 객체를 return 받습니다", async () => {
      const beforePoint = 100
      const usePoint = 50
      mockUserDb.selectById.mockResolvedValueOnce({
        id: 1,
        point: beforePoint,
        updateMillis: Date.now(),
      })
      mockHistoryDb.insert.mockResolvedValue({
        id: 1,
        userId: 1,
        amount: usePoint,
        type: "USE",
        timeMillis: Date.now(),
      })
      mockUserDb.insertOrUpdate.mockResolvedValue({
        id: 1,
        point: beforePoint - usePoint,
        updateMillis: Date.now(),
      })
      const result = await service.use("1", { amount: usePoint })
      expect(mockHistoryDb.insert).toHaveBeenCalledWith(
        1,
        usePoint,
        "USE",
        expect.any(Number),
      )
      expect(mockUserDb.insertOrUpdate).toHaveBeenCalledWith(1, beforePoint - usePoint)
      expect(result).toEqual({
        id: 1,
        point: beforePoint - usePoint,
        updateMillis: expect.any(Number),
      })
    })
  })
})
