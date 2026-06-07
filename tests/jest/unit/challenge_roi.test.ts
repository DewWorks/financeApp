import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChallengeService } from "@/services/ChallengeService";
import { ObjectId } from "mongodb";

// Mock connectionDb
vi.mock("@/db/connectionDb", () => {
    const mockDb = {
        collection: vi.fn(),
    };
    const mockClient = {
        db: vi.fn().mockReturnValue(mockDb),
    };
    return {
        getMongoClient: vi.fn().mockResolvedValue(mockClient),
    };
});

describe("ChallengeService - Active Savings Challenges and ROI", () => {
    let mockDb: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { getMongoClient } = await import("@/db/connectionDb");
        const client = await getMongoClient();
        mockDb = client.db();
    });

    it("should accept a pending recommendation and set challenge active dates", async () => {
        const userId = new ObjectId().toString();
        const recommendationId = new ObjectId().toString();

        const mockRecommendation = {
            _id: new ObjectId(recommendationId),
            userId: new ObjectId(userId),
            status: "PENDING",
            category: "Lazer",
            impactEstimate: 100,
        };

        const mockFindOne = vi.fn().mockResolvedValue(mockRecommendation);
        const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });

        mockDb.collection.mockImplementation((name: string) => {
            if (name === "recommendations") {
                return {
                    findOne: mockFindOne,
                    updateOne: mockUpdateOne,
                };
            }
            return {};
        });

        const result = await ChallengeService.acceptChallenge(userId, recommendationId);

        expect(mockFindOne).toHaveBeenCalledWith({
            _id: new ObjectId(recommendationId),
            userId: new ObjectId(userId),
        });

        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: new ObjectId(recommendationId), userId: new ObjectId(userId) },
            expect.objectContaining({
                $set: expect.objectContaining({
                    status: "ACTIVE",
                    targetLimit: 200, // 100 * 2
                }),
            })
        );

        expect(result.success).toBe(true);
        expect(result.targetLimit).toBe(200);
        expect(result.challengeEndDate).toBeInstanceOf(Date);
    });

    it("should reconcile active challenges marking success if spend is under target limit", async () => {
        const userId = new ObjectId().toString();
        const recommendationId = new ObjectId().toString();

        const activeChallenge = {
            _id: new ObjectId(recommendationId),
            userId: new ObjectId(userId),
            status: "ACTIVE",
            category: "Alimentação",
            impactEstimate: 80,
            targetLimit: 300,
            challengeStartDate: new Date(Date.now() - 8 * 24 * 3600 * 1000), // 8 days ago
            challengeEndDate: new Date(Date.now() - 1 * 24 * 3600 * 1000), // 1 day ago
        };

        // Mock find returns the active challenge
        const mockFind = vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([activeChallenge]),
        });

        // Mock transaction aggregation returns total spent R$ 250 (under limit R$ 300)
        const mockAggregate = vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([{ _id: null, total: 250 }]),
        });

        const mockUpdateOneRec = vi.fn().mockResolvedValue({ modifiedCount: 1 });
        const mockUpdateOneUser = vi.fn().mockResolvedValue({ modifiedCount: 1 });

        mockDb.collection.mockImplementation((name: string) => {
            if (name === "recommendations") {
                return {
                    find: mockFind,
                    updateOne: mockUpdateOneRec,
                };
            }
            if (name === "transactions") {
                return {
                    aggregate: mockAggregate,
                };
            }
            if (name === "users") {
                return {
                    updateOne: mockUpdateOneUser,
                };
            }
            return {};
        });

        const result = await ChallengeService.reconcileUserChallenges(userId);

        expect(result.reconciledCount).toBe(1);
        // Should mark challenge as COMPLETED
        expect(mockUpdateOneRec).toHaveBeenCalledWith(
            { _id: activeChallenge._id },
            { $set: { status: "COMPLETED" } }
        );
        // Should increment user's totalSavedWithFin by impactEstimate (80)
        expect(mockUpdateOneUser).toHaveBeenCalledWith(
            { _id: new ObjectId(userId) },
            { $inc: { totalSavedWithFin: 80 } }
        );
    });

    it("should reconcile active challenges marking failure if spend exceeds target limit", async () => {
        const userId = new ObjectId().toString();
        const recommendationId = new ObjectId().toString();

        const activeChallenge = {
            _id: new ObjectId(recommendationId),
            userId: new ObjectId(userId),
            status: "ACTIVE",
            category: "Transporte",
            impactEstimate: 50,
            targetLimit: 100,
            challengeStartDate: new Date(Date.now() - 8 * 24 * 3600 * 1000),
            challengeEndDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        };

        const mockFind = vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([activeChallenge]),
        });

        // Mock aggregate returns total spent R$ 150 (exceeds limit R$ 100)
        const mockAggregate = vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([{ _id: null, total: 150 }]),
        });

        const mockUpdateOneRec = vi.fn().mockResolvedValue({ modifiedCount: 1 });
        const mockUpdateOneUser = vi.fn(); // Should not be called for failure

        mockDb.collection.mockImplementation((name: string) => {
            if (name === "recommendations") {
                return {
                    find: mockFind,
                    updateOne: mockUpdateOneRec,
                };
            }
            if (name === "transactions") {
                return {
                    aggregate: mockAggregate,
                };
            }
            if (name === "users") {
                return {
                    updateOne: mockUpdateOneUser,
                };
            }
            return {};
        });

        const result = await ChallengeService.reconcileUserChallenges(userId);

        expect(result.reconciledCount).toBe(1);
        // Should mark challenge as FAILED
        expect(mockUpdateOneRec).toHaveBeenCalledWith(
            { _id: activeChallenge._id },
            { $set: { status: "FAILED" } }
        );
        // Should NOT increment user totalSaved
        expect(mockUpdateOneUser).not.toHaveBeenCalled();
    });
});
