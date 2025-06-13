import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, "gomonkey", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}