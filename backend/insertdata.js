import db from "./db.js";

export async function adduser(userid, username, user_email, password) {
    try {
        const query = `
            INSERT INTO users(userid, username, user_email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [userid, username, user_email, password];
        const res = await db.query(query, values);
        console.log("User data inserted:", res.rows[0]);
    } catch (err) {
        console.error("Error while inserting user - INVALID DATA:", err);
    }
}
export default adduser;