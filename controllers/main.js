const filterByDateTime = (req, res, db) => {
    const { inputTime, inputDay } = req.body
    console.log("time: " + inputTime)
    console.log("day: " + inputDay)
    db.query(
        `SELECT DISTINCT (sname) FROM Stores JOIN OpeningHours USING (sid) \
    WHERE day = ${inputDay}::integer \
    AND '${inputTime}'::time >= openingtime AND '${inputTime}'::time <= closingtime`,
        (error, results) => {
            if (error) {
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            if (results) {
                res.status(200).json(results.rows)
            } else {
                res.status(200).json({ dataExists: 'false' })
            }
        })
}

const getStores = (req, res, db) => {
    db.query(
        'SELECT (sname) FROM Stores',
        (error, results) => {
            if (error) {
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            if (results) {
                res.status(200).json(results.rows)
            } else {
                res.status(200).json({ dataExists: 'false' })
            }
        })
}

const getStoreInfo = (req, res, db) => {
    const { sid } = req.body
    db.query(
        `SELECT (sname, day, openingtime, closingtime) FROM Stores JOIN OpeningHours USING (sid) \
    WHERE sid = ${sid}::integer`,
        (error, results) => {
            if (error) {
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            if (results) {
                res.status(200).json(results.rows)
            } else {
                res.status(200).json({ dataExists: 'false' })
            }
        })
}

const addUser = (req, res, db) => {
    const { email, password } = req.body
    db.query(
        `INSERT INTO Users(email, password) VALUES ('${email}', '${password}')`,
        (error, results) => {
            if (error) {
                console.log(error)
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            res.status(200).json({ email: email, password: password })
        })
}

const validateEmail = (req, res, db) => {
    console.log(req)
    const { email } = req.body
    db.query(
        `SELECT count(*) FROM Users WHERE email = '${email}'`,
        (error, results) => {
            if (error) {
                console.log(error)
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            if (results.rows[0]['count'] === '1')
                res.status(200).json()
            else
                res.status(400).json({ dbError: 'User Not Found' })
        })
}

const validatePassword = (req, res, db) => {
    const { email, password } = req.body
    db.query(
        `SELECT count(*) FROM Users WHERE email = '${email}' AND password = '${password}'`,
        (error, results) => {
            if (error) {
                console.log(error)
                res.status(400).json({ dbError: `DB error: ${error}` })
                return
            }
            if (results.rows[0]['count'] === '1')
                res.status(200).json()
            else
                res.status(400).json({ dbError: `Wrong password` })
        })
}

module.exports = {
    filterByDateTime,
    getStores,
    getStoreInfo,
    addUser,
    validateEmail,
    validatePassword,
}
