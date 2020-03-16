const filterByDateTime = (req, res, db) => {
  const { inputTime, inputDay } = req.body
  db.query(
    `SELECT DISTINCT (sid, sname) FROM Stores JOIN OpeningHours USING (sid) \
    WHERE day = ${inputDay}::integer \
    AND '${inputTime}'::time >= openingtime AND '${inputTime}'::time <= closingtime`,
    (error, results) => {
      if (error) {
        res.status(400).json({dbError: 'db error'})
        return
      }
      if(results){
        res.status(200).json(results.rows)
      } else {
        res.status(200).json({dataExists: 'false'})
      }
    })
}

const getStores = (req, res, db) => {
  db.query(
    'SELECT (sid, sname) FROM Stores',
    (error, results) => {
      if (error) {
        res.status(400).json({dbError: 'db error'})
        return
      }
      if(results){
        res.status(200).json(results.rows)
      } else {
        res.status(200).json({dataExists: 'false'})
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
        res.status(400).json({dbError: 'db error'})
        return
      }
      if(results){
        res.status(200).json(results.rows)
      } else {
        res.status(200).json({dataExists: 'false'})
      }
    })
}

const addUser = (req, res, db) => {
  const { email } = req.body
  db.query(
    `INSERT INTO Users(email) VALUES ('${email}')`,
    (error, results) => {
      if (error) {
        res.status(400).json({dbError: 'db error'})
        return
      }
      if(results){
        res.status(200).json(results.rows)
      } else {
        res.status(200).json({dataExists: 'false'})
      }
    })
}

module.exports = {
  filterByDateTime,
  getStores,
  getStoreInfo,
  addUser,
}