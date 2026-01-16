export async function validateApiToken(req: Request): Promise<boolean> {
    const authHeader = req.headers.get('authorization')
    const apiToken = process.env.API_TOKEN_N8N

    if (!authHeader || !authHeader.startsWith('Bearer ') || !apiToken) {
        return false
    }

    const token = authHeader.split(' ')[1]
    return token === apiToken
}
