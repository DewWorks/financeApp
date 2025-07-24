import { NextResponse } from "next/server"
import { getMongoClient } from "../../../../../db/connectionDb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value
    if (!token) {
        throw new Error("No token provided")
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
}

export async function GET(request: Request, { params }: { params: { profileId: string } }) {
    try {
        const userId = await getUserIdFromToken()
        const profileId = new ObjectId(params.profileId)

        const client = await getMongoClient()
        const db = client.db("financeApp")

        // Buscar o profile com detalhes dos membros
        const profile = await db
            .collection("profiles")
            .aggregate([
                {
                    $match: {
                        _id: profileId,
                        "members.userId": userId,
                        isActive: true,
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "members.userId",
                        foreignField: "_id",
                        as: "memberDetails",
                    },
                },
                {
                    $project: {
                        name: 1,
                        description: 1,
                        createdBy: 1,
                        createdAt: 1,
                        members: {
                            $map: {
                                input: "$members",
                                as: "member",
                                in: {
                                    $let: {
                                        vars: {
                                            userDetail: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$memberDetails",
                                                            cond: { $eq: ["$$this._id", "$$member.userId"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            userId: "$$member.userId",
                                            userName: "$$userDetail.name",
                                            userEmail: "$$userDetail.email",
                                            userPhone: { $arrayElemAt: ["$$userDetail.cel", 0] },
                                            permission: "$$member.permission",
                                            joinedAt: "$$member.joinedAt",
                                            status: "$$member.status",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ])
            .toArray()

        if (profile.length === 0) {
            return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 })
        }

        const profileData = profile[0]

        // Verificar se o usuário é admin
        const userMember = profileData.members.find((m: any) => m.userId.toString() === userId.toString())
        const isUserAdmin = userMember?.permission === "ADMIN" || profileData.createdBy.toString() === userId.toString()

        return NextResponse.json({
            ...profileData,
            isUserAdmin,
        })
    } catch (error) {
        console.error("Get profile details error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
