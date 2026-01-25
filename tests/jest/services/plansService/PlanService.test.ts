import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from "mongodb";

// Mock dependencies with Factories - Hoisted
vi.mock("../../../src/app/models/User", () => {
    return {
        User: {
            findById: vi.fn()
        }
    };
});

vi.mock("../../../src/db/connectionDb", () => {
    return {
        getMongoClient: vi.fn()
    };
});

// Import AFTER mocks (though Vitest hoists mocks, factories are safer)
import { PlanService, PlanRestrictionError } from "../../../../src/services/PlanService";
import { User } from "../../../../src/app/models/User";
import { getMongoClient } from "../../../../src/db/connectionDb";
import { PlanType } from "../../../../src/interfaces/IUser";


describe("PlanService", () => {
    const mockUserId = new ObjectId().toString();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("validateCreateTransaction", () => {
        it("should allow FREE user under limit", async () => {
            // Mock User
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({
                        subscription: { plan: PlanType.FREE }
                    })
                })
            });

            // Mock Mongo (Limit Check) - hasMore = false (Under limit)
            const mockHasNext = vi.fn().mockResolvedValue(false);
            const mockCursor = {
                project: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                hasNext: mockHasNext
            };
            const mockCollection = {
                find: vi.fn().mockReturnValue(mockCursor)
            };
            const mockDb = {
                collection: vi.fn().mockReturnValue(mockCollection)
            };
            (getMongoClient as any).mockResolvedValue({
                db: vi.fn().mockReturnValue(mockDb)
            });

            await expect(PlanService.validate(mockUserId, 'CREATE_TRANSACTION')).resolves.not.toThrow();
        });

        it("should throw error for FREE user over limit", async () => {
            // Mock User
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({
                        subscription: { plan: PlanType.FREE }
                    })
                })
            });

            // Mock Mongo - hasMore = true (Over limit)
            const mockHasNext = vi.fn().mockResolvedValue(true);
            const mockCursor = {
                project: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                hasNext: mockHasNext
            };
            const mockCollection = {
                find: vi.fn().mockReturnValue(mockCursor)
            };
            const mockDb = {
                collection: vi.fn().mockReturnValue(mockCollection)
            };
            (getMongoClient as any).mockResolvedValue({
                db: vi.fn().mockReturnValue(mockDb)
            });

            await expect(PlanService.validate(mockUserId, 'CREATE_TRANSACTION'))
                .rejects.toThrow(PlanRestrictionError);
        });

        it("should allow PRO user regardless of limit", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({
                        subscription: { plan: PlanType.PRO }
                    })
                })
            });

            // Mongo shouldn't even be called
            await expect(PlanService.validate(mockUserId, 'CREATE_TRANSACTION')).resolves.not.toThrow();
            expect(getMongoClient).not.toHaveBeenCalled();
        });
    });

    describe("validateConnectBank (Open Finance)", () => {
        it("should throw for FREE user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.FREE } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'CONNECT_BANK'))
                .rejects.toThrow(PlanRestrictionError);
        });

        it("should throw for PRO user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.PRO } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'CONNECT_BANK'))
                .rejects.toThrow(PlanRestrictionError);
        });

        it("should allow MAX user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.MAX } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'CONNECT_BANK')).resolves.not.toThrow();
        });
    });

    describe("validateUseWhatsapp", () => {
        it("should throw for FREE user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.FREE } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'USE_WHATSAPP'))
                .rejects.toThrow(PlanRestrictionError);
        });

        it("should allow PRO user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.PRO } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'USE_WHATSAPP')).resolves.not.toThrow();
        });
    });

    describe("validateUseDeepInsights", () => {
        it("should throw for PRO user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.PRO } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'USE_DEEP_INSIGHTS'))
                .rejects.toThrow(PlanRestrictionError);
        });

        it("should allow MAX user", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({ subscription: { plan: PlanType.MAX } })
                })
            });
            await expect(PlanService.validate(mockUserId, 'USE_DEEP_INSIGHTS')).resolves.not.toThrow();
        });
    });

    describe("Corner Cases", () => {
        it("should throw if user not found", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue(null)
                })
            });
            await expect(PlanService.validate(mockUserId, 'CREATE_TRANSACTION'))
                .rejects.toThrow("User not found");
        });

        it("should default to FREE if subscription is missing", async () => {
            (User.findById as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue({}) // No subscription
                })
            });

            // FREE limit check logic validation
            const mockHasNext = vi.fn().mockResolvedValue(true); // Over limit
            const mockCursor = {
                project: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                hasNext: mockHasNext
            };
            const mockCollection = {
                find: vi.fn().mockReturnValue(mockCursor)
            };
            const mockDb = {
                collection: vi.fn().mockReturnValue(mockCollection)
            };
            (getMongoClient as any).mockResolvedValue({
                db: vi.fn().mockReturnValue(mockDb)
            });

            await expect(PlanService.validate(mockUserId, 'CREATE_TRANSACTION'))
                .rejects.toThrow(PlanRestrictionError);
        });
    });
});
